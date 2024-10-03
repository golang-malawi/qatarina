export function getApiEndpoint(): string {
    return import.meta.env.PROD ? "" : import.meta.env.VITE_API_ENDPOINT;
}