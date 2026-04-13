import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

export interface PublicConfigData {
    paymentEnabled: boolean;
}

const PUBLIC_CONFIG_QUERY = gql`
  query GetPublicConfig {
    publicConfig {
      paymentEnabled
    }
  }
`;

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private apollo = inject(Apollo);

    publicConfig = signal<PublicConfigData | null>(null);

    constructor() {
        this.fetchConfig();
    }

    fetchConfig() {
        this.apollo.query<{ publicConfig: PublicConfigData }>({
            query: PUBLIC_CONFIG_QUERY,
            fetchPolicy: 'network-only' // maybe use cache-first in production depending on how often this changes
        }).subscribe({
            next: (result) => {
                if (result?.data?.publicConfig) {
                    this.publicConfig.set(result.data.publicConfig);
                }
            },
            error: (err) => {
                console.error('Failed to fetch public config', err);
                // Default to true or false depending on preference if backend fails
            }
        });
    }

    get isPaymentEnabled(): boolean {
        const config = this.publicConfig();
        if (!config) return true; // Default to true if not yet loaded or failed
        return config.paymentEnabled;
    }
}
