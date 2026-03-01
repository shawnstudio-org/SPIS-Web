import { apiRequest, getApiErrorMessage } from '@/lib/api';

describe('api helpers', () => {
  it('normalizes a network failure into an error response', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('boom'));

    const response = await apiRequest('/test');

    expect(response.ok).toBe(false);
    expect(response.status).toBe(0);
    expect(getApiErrorMessage(response, 'fallback')).toBe('Unable to reach the server right now. Please try again.');

    global.fetch = originalFetch;
  });
});
