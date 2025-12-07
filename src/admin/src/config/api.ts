/**
 * API Configuration
 *
 * In development: Uses Vite proxy to localhost:8787
 * In production: Uses the deployed Cloudflare Workers URL
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - The API endpoint (e.g., '/api/auth/login')
 * @returns The full URL
 */
export function getApiUrl(endpoint: string): string {
  // If API_BASE_URL is set (production), use it
  if (API_BASE_URL) {
    return `${API_BASE_URL}${endpoint}`;
  }

  // Otherwise, use relative path (development with Vite proxy)
  return endpoint;
}

/**
 * Make an authenticated API request
 * @param endpoint - The API endpoint
 * @param options - Fetch options
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
