export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://spis-api.shawnzhao0518.workers.dev';

const DEFAULT_TIMEOUT_MS = 15000;

function getNetworkErrorMessage(error) {
  if (error?.name === 'AbortError') {
    return 'The request timed out. Please try again.';
  }

  return 'Unable to reach the server right now. Please try again.';
}

export function getApiErrorMessage(response, fallback = 'Something went wrong.') {
  return response?.data?.error || response?.error || fallback;
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    token,
    body,
    isForm = false,
    headers: extraHeaders = {},
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;
  const headers = { ...extraHeaders };
  const controller = signal ? null : new AbortController();
  const timeoutHandle = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  if (!isForm) {
    headers['content-type'] = 'application/json';
  }

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      signal: signal || controller?.signal,
      body: body
        ? isForm
          ? body
          : JSON.stringify(body)
        : undefined,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? '' : getApiErrorMessage({ data }, `Request failed with status ${response.status}`),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { error: getNetworkErrorMessage(error) },
      error: getNetworkErrorMessage(error),
    };
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

/* ── Convenience methods with auto-token ────────────── */

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('spis_token') || '';
}

async function authedRequest(path, options = {}) {
  const token = getToken();
  const res = await apiRequest(path, { ...options, token });
  if (!res.ok) throw new Error(res.error || 'request failed');
  return res.data;
}

const api = {
  get: (path, opts) => authedRequest(path, { method: 'GET', ...opts }),
  post: (path, body, opts) => authedRequest(path, { method: 'POST', body, ...opts }),
  patch: (path, body, opts) => authedRequest(path, { method: 'PATCH', body, ...opts }),
  del: (path, opts) => authedRequest(path, { method: 'DELETE', ...opts }),
};

export default api;
