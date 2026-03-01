import { render, screen, waitFor } from '@testing-library/react';
import {
  clearStoredToken,
  consumeAuthFlashMessage,
  getStoredToken,
  setAuthFlashMessage,
  setStoredToken,
  useAuthGuard,
} from '@/lib/auth-client';

const { replaceMock, apiRequestMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  apiRequestMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('@/lib/api', () => ({
  apiRequest: (...args) => apiRequestMock(...args),
  getApiErrorMessage: (response, fallback) => response?.data?.error || response?.error || fallback,
}));

function Harness() {
  const auth = useAuthGuard();

  return (
    <div>
      <span data-testid="ready">{String(auth.ready)}</span>
      <span data-testid="plan">{auth.plan}</span>
      <span data-testid="email">{auth.user?.email || ''}</span>
    </div>
  );
}

describe('auth-client', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    replaceMock.mockReset();
    apiRequestMock.mockReset();
  });

  it('stores and clears tokens safely', () => {
    setStoredToken('token-123');
    expect(getStoredToken()).toBe('token-123');

    clearStoredToken();
    expect(getStoredToken()).toBe('');
  });

  it('stores and consumes auth flash messages', () => {
    setAuthFlashMessage('Please sign in.');
    expect(consumeAuthFlashMessage()).toBe('Please sign in.');
    expect(consumeAuthFlashMessage()).toBe('');
  });

  it('redirects to login when there is no stored token', async () => {
    render(<Harness />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
      expect(consumeAuthFlashMessage()).toBe('Please sign in to continue.');
    });
  });

  it('hydrates auth state when the session is valid', async () => {
    setStoredToken('token-123');
    apiRequestMock.mockResolvedValue({
      ok: true,
      data: {
        user: { email: 'parent@example.com' },
        plan: 'STANDARD',
      },
    });

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true');
      expect(screen.getByTestId('plan')).toHaveTextContent('STANDARD');
      expect(screen.getByTestId('email')).toHaveTextContent('parent@example.com');
    });
  });
});
