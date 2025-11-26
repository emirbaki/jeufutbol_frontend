import { Injectable, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';

const CURRENT_TENANT_QUERY = gql`
  query CurrentTenant {
    currentTenant {
      id
      name
      subdomain
    }
  }
`;

const UPDATE_TENANT_MUTATION = gql`
  mutation UpdateTenant($name: String!) {
    updateTenant(name: $name) {
      id
      name
      subdomain
    }
  }
`;

@Injectable({
    providedIn: 'root'
})
export class TenantService {
    tenantSubdomain = signal<string | null>(null);

    constructor(private apollo: Apollo) {
        this.initializeTenant();
    }

    private initializeTenant() {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');

        let subdomain: string | null = null;

        if (hostname.endsWith('localhost')) {
            if (parts.length >= 2) {
                subdomain = parts[0];
            }
        } else {
            // Production logic
            if (parts.length >= 3) {
                subdomain = parts[0];
            }
        }

        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
            this.tenantSubdomain.set(subdomain);
            console.log('Tenant identified:', subdomain);
        }
    }

    getTenantSubdomain(): string | null {
        return this.tenantSubdomain();
    }

    async getCurrentTenant() {
        const result = await firstValueFrom(
            this.apollo.query<any>({
                query: CURRENT_TENANT_QUERY,
                fetchPolicy: 'network-only',
            })
        );
        return result.data.currentTenant;
    }

    async updateTenant(name: string) {
        const result = await firstValueFrom(
            this.apollo.mutate<any>({
                mutation: UPDATE_TENANT_MUTATION,
                variables: { name },
            })
        );
        return result.data.updateTenant;
    }
}
