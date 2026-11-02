import { API_URL, REQUEST_TIMEOUT_MS } from '../config';

export class ApiError extends Error {
  constructor(message, status = 0, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let authToken = null;
let onUnauthorized = null;

export const setAuthToken = (token) => { authToken = token; };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

/** fetch wrapper: JSON in/out, bearer auth, timeout and friendly errors. */
export async function request(path, { method = 'GET', body, query } = {}) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_URL}${path}${qs}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const timedOut = e?.name === 'AbortError';
    throw new ApiError(
      timedOut
        ? 'The request took too long. Please try again.'
        : `Can't reach the server at ${API_URL}. Is the PHP backend running?`,
      0
    );
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();
    const message = data?.error || `Request failed (${res.status}).`;
    throw new ApiError(data?.detail ? `${message}\n${data.detail}` : message, res.status, data?.errors || {});
  }
  return data;
}
