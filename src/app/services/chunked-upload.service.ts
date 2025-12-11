import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { environment as env } from '../../environments/environment.development';

interface ChunkUploadProgress {
    file: File;
    loaded: number;
    total: number;
    percent: number;
}

interface ChunkInitResponse {
    uploadId: string;
}

interface ChunkUploadResponse {
    received: boolean;
    chunkIndex: number;
}

interface ChunkCompleteResponse {
    message: string;
    path: string;
    filename: string;
    size: number;
}

@Injectable({
    providedIn: 'root'
})
export class ChunkedUploadService {
    private readonly apiUrl = `${(env as any).api_url}/upload`;
    private readonly CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk (under Cloudflare's 100MB limit)
    private readonly CHUNKED_THRESHOLD = 50 * 1024 * 1024; // Use chunked upload for files >= 50MB

    constructor(private http: HttpClient) { }

    /**
     * Upload multiple files with progress tracking
     * Automatically uses chunked upload for large files
     */
    async uploadFiles(
        files: File[],
        onProgress?: (percent: number) => void
    ): Promise<string[]> {
        const urls: string[] = [];
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        let uploadedSize = 0;

        for (const file of files) {
            const url = await this.uploadFile(file, (fileProgress) => {
                if (onProgress) {
                    const currentProgress = uploadedSize + (fileProgress / 100) * file.size;
                    onProgress(Math.round((currentProgress / totalSize) * 100));
                }
            });
            urls.push(url);
            uploadedSize += file.size;
        }

        if (onProgress) {
            onProgress(100);
        }

        return urls;
    }

    /**
     * Upload a single file with progress callback
     * Decides between chunked or regular upload based on file size
     */
    async uploadFile(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<string> {
        if (this.shouldUseChunkedUpload(file)) {
            return this.uploadFileChunked(file, onProgress);
        } else {
            return this.uploadFileRegular(file, onProgress);
        }
    }

    /**
     * Check if file should use chunked upload
     */
    private shouldUseChunkedUpload(file: File): boolean {
        return file.size >= this.CHUNKED_THRESHOLD;
    }

    /**
     * Regular single-request upload for small files
     */
    private async uploadFileRegular(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        return new Promise((resolve, reject) => {
            this.http.post<any>(`${this.apiUrl}/single`, formData, {
                reportProgress: true,
                observe: 'events'
            }).subscribe({
                next: (event) => {
                    if (event.type === HttpEventType.UploadProgress && event.total) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        if (onProgress) onProgress(percent);
                    } else if (event.type === HttpEventType.Response) {
                        resolve(event.body.path);
                    }
                },
                error: (err) => reject(err)
            });
        });
    }

    /**
     * Chunked upload for large files
     */
    private async uploadFileChunked(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<string> {
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

        console.log(`[ChunkedUpload] Starting chunked upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, ${totalChunks} chunks)`);

        // Step 1: Initialize upload session
        const initResponse = await firstValueFrom(
            this.http.post<ChunkInitResponse>(`${this.apiUrl}/chunk/init`, {
                filename: file.name,
                totalSize: file.size,
                totalChunks: totalChunks,
                mimeType: file.type
            })
        );

        const uploadId = initResponse.uploadId;
        console.log(`[ChunkedUpload] Session initialized: ${uploadId}`);

        // Step 2: Upload each chunk
        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.CHUNK_SIZE;
            const end = Math.min(start + this.CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append('chunk', chunk, `chunk-${i}`);
            formData.append('uploadId', uploadId);
            formData.append('chunkIndex', i.toString());

            await firstValueFrom(
                this.http.post<ChunkUploadResponse>(`${this.apiUrl}/chunk`, formData)
            );

            // Update progress
            const percent = Math.round(((i + 1) / totalChunks) * 100);
            if (onProgress) onProgress(percent);
            console.log(`[ChunkedUpload] Chunk ${i + 1}/${totalChunks} uploaded (${percent}%)`);
        }

        // Step 3: Complete upload and get final URL
        const completeResponse = await firstValueFrom(
            this.http.post<ChunkCompleteResponse>(`${this.apiUrl}/chunk/complete`, {
                uploadId: uploadId
            })
        );

        console.log(`[ChunkedUpload] Complete: ${completeResponse.path}`);
        return completeResponse.path;
    }
}
