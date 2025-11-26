import { Environment } from "./environment";

// Dynamically determine API URL based on current subdomain
function getApiUrl(): string {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // In production, API is always on the same domain as frontend
    return `${protocol}//${hostname}/api`;
}

export const environment: Environment = {
    environment: 'production',
    production: true,
    api_url: getApiUrl(),
    port: 4200,
};
