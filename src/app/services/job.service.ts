import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, lastValueFrom, Observable, interval, of, throwError } from 'rxjs';
import { switchMap, takeWhile, catchError, map } from 'rxjs/operators';

export interface JobStatus {
    id: string;
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
    progress: number;
    result?: any;
    error?: string;
    createdAt: string;
    finishedAt?: string;
}

export const GET_JOB_STATUS = gql`
  query GetJobStatus($jobId: String!) {
    jobStatus(jobId: $jobId) {
      id
      status
      progress
      result
      error
      createdAt
      finishedAt
    }
  }
`;

@Injectable({
    providedIn: 'root'
})
export class JobService {
    constructor(private apollo: Apollo) { }

    async getJobStatus(jobId: string): Promise<JobStatus> {
        const result = await firstValueFrom(
            this.apollo.query<{ jobStatus: JobStatus }>({
                query: GET_JOB_STATUS,
                variables: { jobId },
                fetchPolicy: 'network-only'
            })
        );
        return result.data.jobStatus;
    }

    // Polls for job completion
    pollJob(jobId: string, intervalMs = 2000, timeoutMs = 60000): Observable<JobStatus> {
        const startTime = Date.now();

        return interval(intervalMs).pipe(
            switchMap(() => this.getJobStatus(jobId)),
            map(status => {
                console.log(`[JobService] Polling job ${jobId}: ${status.status}`, status);
                if (Date.now() - startTime > timeoutMs) {
                    console.error(`[JobService] Job ${jobId} timed out`);
                    throw new Error('Job polling timed out');
                }
                return status;
            }),
            takeWhile(status => status.status !== 'completed' && status.status !== 'failed', true)
        );
    }

    // Helper to wait for job completion as a Promise
    async waitForJobCompletion(jobId: string, intervalMs = 2000): Promise<JobStatus> {
        return lastValueFrom(
            this.pollJob(jobId, intervalMs).pipe(
                map(status => {
                    if (status.status === 'failed') {
                        throw new Error(status.error || 'Job failed');
                    }
                    return status;
                })
            )
        );
    }
}
