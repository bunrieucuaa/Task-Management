import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithStore, makeTestStore } from '@/test/render';
import { ACCESS_TOKEN_NAME } from '@/app/core/constants';

// Capture router redirects/outlet rendering without a real router context.
vi.mock('@tanstack/react-router', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  Outlet: () => <div data-testid="outlet">outlet</div>,
}));

// AuthGuard may dispatch getMe(); keep it from touching the network.
const authRepo = vi.hoisted(() => ({ getMeAsync: vi.fn().mockResolvedValue({ success: false }) }));
vi.mock('@/app/repositories/AuthRepository', () => ({
  AuthRepository: vi.fn(() => authRepo),
}));

import AuthGuard from './AuthGuard';
import GuestGuard from './GuestGuard';
import MustChangePasswordGuard from './MustChangePasswordGuard';

/** Full auth slice state with overridable fields. */
const authState = (over: Record<string, unknown> = {}) => ({
  auth: {
    loading: false,
    token: '',
    isAuthenticated: false,
    mustChangePassword: false,
    user: null,
    initialized: true,
    initializing: false,
    userLoading: false,
    ...over,
  },
});

const renderWith = (ui: React.ReactElement, over?: Record<string, unknown>) =>
  renderWithStore(ui, makeTestStore(authState(over)));

beforeEach(() => vi.clearAllMocks());

describe('AuthGuard', () => {
  it('renders the protected outlet when authenticated on a private route', () => {
    renderWith(<AuthGuard isPrivate />, {
      isAuthenticated: true,
      user: { id: 1, name: 'A' },
    });
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderWith(<AuthGuard isPrivate />, { isAuthenticated: false });
    expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
  });

  it('shows the full-page loader while the session is still initializing', () => {
    localStorage.setItem(ACCESS_TOKEN_NAME, 'some-token');
    renderWith(<AuthGuard isPrivate />, { initialized: false });
    // The loader label is specific to AuthGuard.
    expect(screen.getByText(/khởi tạo phiên đăng nhập/i)).toBeInTheDocument();
  });
});

describe('GuestGuard', () => {
  it('renders children for an anonymous visitor', () => {
    renderWith(<GuestGuard>{<span>public</span>}</GuestGuard>, { isAuthenticated: false });
    expect(screen.getByText('public')).toBeInTheDocument();
  });

  it('redirects an authenticated user home', () => {
    renderWith(<GuestGuard>{<span>public</span>}</GuestGuard>, { isAuthenticated: true });
    expect(screen.getByTestId('navigate')).toHaveTextContent('/');
  });

  it('redirects to /change-password when the user must change their password', () => {
    renderWith(<GuestGuard>{<span>public</span>}</GuestGuard>, {
      isAuthenticated: true,
      mustChangePassword: true,
    });
    expect(screen.getByTestId('navigate')).toHaveTextContent('/change-password');
  });
});

describe('MustChangePasswordGuard', () => {
  it('redirects to /login when not authenticated', () => {
    renderWith(<MustChangePasswordGuard>{<span>form</span>}</MustChangePasswordGuard>, {
      isAuthenticated: false,
    });
    expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
  });

  it('redirects home when the user does not need to change their password', () => {
    renderWith(<MustChangePasswordGuard>{<span>form</span>}</MustChangePasswordGuard>, {
      isAuthenticated: true,
      mustChangePassword: false,
    });
    expect(screen.getByTestId('navigate')).toHaveTextContent('/');
  });

  it('renders children when a password change is required', () => {
    renderWith(<MustChangePasswordGuard>{<span>form</span>}</MustChangePasswordGuard>, {
      isAuthenticated: true,
      mustChangePassword: true,
    });
    expect(screen.getByText('form')).toBeInTheDocument();
  });
});
