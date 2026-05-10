const rawApiUrl = process.env.REACT_APP_API_URL?.trim();
const normalizedApiUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '';

const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const fallbackOrigin = isBrowser ? window.location.origin : '';

// In local dev, use the backend dev server when no env var is set.
// In deployed environments, prefer same-origin over hardcoded localhost.
const backendOrigin = normalizedApiUrl || (isLocalhost ? 'http://localhost:5000' : fallbackOrigin);

if (!normalizedApiUrl && isBrowser && !isLocalhost) {
  console.warn('REACT_APP_API_URL is not set; falling back to the current site origin.');
}

export const API_ORIGIN = backendOrigin;
export const API_BASE_URL = `${backendOrigin}/api`;
