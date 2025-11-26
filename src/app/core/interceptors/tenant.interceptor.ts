import { HttpInterceptorFn } from '@angular/common/http';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    let subdomain = '';

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

    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        req = req.clone({
            setHeaders: {
                'X-Tenant-Subdomain': subdomain
            }
        });
    }

    return next(req);
};
