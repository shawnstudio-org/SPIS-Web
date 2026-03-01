export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://spis-api.shawnzhao0518.workers.dev';

export async function apiRequest(path, options = {}) {
  const { method = 'GET', token, body, isForm = false, headers: extraHeaders = {} } = options;
  const headers = { ...extraHeaders };

  if (!isForm) {
    headers['content-type'] = 'application/json';
  }

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
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
  };
}
