import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { REQUEST } from '../../tokens.server';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    let subdomain = '';

    if (isPlatformBrowser(platformId)) {
        // Client-side
        const hostname = window.location.hostname;
        const parts = hostname.split('.');

        if (hostname.endsWith('localhost')) {
            if (parts.length >= 2) {
                subdomain = parts[0];
            }
        } else {
            // Production logic (e.g. app.com)
            if (parts.length >= 3) {
                subdomain = parts[0];
            }
        }
    } else {
        // Server-side: Get from REQUEST
        try {
            const request = inject(REQUEST as any, { optional: true }) as any;
            if (request?.headers?.host) {
                const host = request.headers.host;
                const parts = host.split('.');
                // Check for localhost (e.g., tenant.localhost:4000)
                if (host.includes('localhost') && parts.length >= 2) {
                    subdomain = parts[0];
                } else if (parts.length >= 3) {
                    // e.g. tenant.domain.com
                    subdomain = parts[0];
                }
            }
        } catch (e) {
            console.error('[TENANT INTERCEPTOR] Error getting REQUEST:', e);
        }
    }

    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        req = req.clone({
            setHeaders: {
                'X-Tenant-Subdomain': subdomain
            }
        });
    }

    return next(req);
};
