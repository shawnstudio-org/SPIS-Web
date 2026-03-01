import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppShell from '@/components/AppShell';

const { replaceMock, clearStoredTokenMock, setAuthFlashMessageMock, apiRequestMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  clearStoredTokenMock: vi.fn(),
  setAuthFlashMessageMock: vi.fn(),
  apiRequestMock: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('@/lib/auth-client', () => ({
  clearStoredToken: (...args) => clearStoredTokenMock(...args),
  setAuthFlashMessage: (...args) => setAuthFlashMessageMock(...args),
}));

vi.mock('@/lib/api', () => ({
  apiRequest: (...args) => apiRequestMock(...args),
  getApiErrorMessage: (response, fallback) => response?.data?.error || response?.error || fallback,
}));

describe('AppShell', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    clearStoredTokenMock.mockReset();
    setAuthFlashMessageMock.mockReset();
    apiRequestMock.mockReset();
  });

  it('renders the shell and logs out cleanly', async () => {
    apiRequestMock.mockResolvedValue({ ok: true, status: 200, data: { ok: true } });

    render(
      <AppShell title="Learning Overview" user={{ email: 'parent@example.com' }} plan="STANDARD" token="token-123">
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByText('Learning Overview')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith('/auth/logout', { method: 'POST', token: 'token-123' });
      expect(setAuthFlashMessageMock).toHaveBeenCalledWith('You have been signed out.');
      expect(clearStoredTokenMock).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });
});
