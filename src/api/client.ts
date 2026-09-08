// Base URL of the deployed website — its Cloudflare Pages Functions
// (functions/api/*.js in uw-study-spots-map) serve this app's backend too.
// Fill this in once the site has a Pages URL or custom domain.
export const API_BASE_URL = "https://REPLACE_WITH_DEPLOYED_DOMAIN";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  return res.json() as Promise<T>;
}

export { apiFetch };
