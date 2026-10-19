import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment as env } from '../../environments/environment.development';

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/** Checks an image in the browser before the upload. Gives the error text, or null when it is valid. */
export function imageFileError(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Use a PNG, JPEG or WebP image.';
  if (file.size > IMAGE_MAX_BYTES) return 'The image must be 2 MB or smaller.';
  return null;
}

/** The signed-in user's profile image. The sidebar reads avatarUrl. */
@Injectable({ providedIn: 'root' })
export class ProfileImageService {
  private http = inject(HttpClient);
  private url = (env as any).api_url + '/users/me/avatar';

  avatarUrl = signal<string | null>(null);

  async upload(file: File): Promise<string> {
    const body = new FormData();
    body.append('image', file);
    const result = await firstValueFrom(this.http.post<{ avatarUrl: string }>(this.url, body));
    this.avatarUrl.set(result.avatarUrl);
    return result.avatarUrl;
  }

  async remove(): Promise<void> {
    await firstValueFrom(this.http.delete(this.url));
    this.avatarUrl.set(null);
  }
}
