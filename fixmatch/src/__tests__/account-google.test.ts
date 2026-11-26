/**
 * Log ind med Google against a fake Supabase: the browser sheet comes back with a one-time
 * code, which is exchanged for a session (PKCE).
 */
import { canContact, isGoogleSignInAvailable, signInWithGoogle } from '@/state/account';

// jest.mock is hoisted above the import, so the mocks below are in place when it loads.
const mockAuth = {
  onAuthStateChange: jest.fn(),
  getSession: jest.fn(async () => ({ data: { session: null } })),
  signInWithOAuth: jest.fn(),
  exchangeCodeForSession: jest.fn(),
};
let mockProviders: Record<string, boolean> | null = { apple: true, google: true };
const mockProfile = { data: null as { name: string; phone: string } | null, error: null };

jest.mock('@/lib/supabase', () => ({
  SERVER_ENABLED: true,
  EMAIL_LOGIN_ENABLED: false,
  serverProviders: () => Promise.resolve(mockProviders),
  // A getter: jest.mock is hoisted above the constants it uses.
  supabase: {
    get auth() {
      return mockAuth;
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => mockProfile }) }) }),
  },
}));

const mockOpenAuthSession = jest.fn();
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSession(...args),
}));
jest.mock('expo-linking', () => ({
  createURL: (path: string) => `fixmatch://${path}`,
  parse: (url: string) => ({ queryParams: Object.fromEntries(new URL(url).searchParams) }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Log ind med Google', () => {
  beforeEach(async () => {
    await flush();
    mockProviders = { apple: true, google: true };
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://example.supabase.co/auth/v1/authorize?provider=google', flowId: 'flow-1' },
      error: null,
    });
    mockAuth.exchangeCodeForSession.mockReset();
    mockOpenAuthSession.mockReset();
  });

  it('is only offered when Google is switched on in Supabase and the server answers', async () => {
    await expect(isGoogleSignInAvailable()).resolves.toBe(true);
    mockProviders = { apple: true, google: false };
    await expect(isGoogleSignInAvailable()).resolves.toBe(false);
    mockProviders = null;
    await expect(isGoogleSignInAvailable()).resolves.toBe(false);
  });

  it('exchanges the code from the redirect and signs in with the name Google shares', async () => {
    mockOpenAuthSession.mockResolvedValue({ type: 'success', url: 'fixmatch://auth/callback?code=abc123' });
    mockAuth.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'marley@example.dk', user_metadata: { full_name: ' Marley Romby ' } } },
      error: null,
    });

    // An account that already has a name and number on the server.
    mockProfile.data = { name: 'Marley Romby', phone: '+45 12 34 56 78' };

    await expect(signInWithGoogle()).resolves.toEqual({ name: 'Marley Romby' });
    expect(canContact()).toBe(true);

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'fixmatch://auth/callback', skipBrowserRedirect: true },
    });
    expect(mockOpenAuthSession).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/authorize?provider=google',
      'fixmatch://auth/callback',
    );
    expect(mockAuth.exchangeCodeForSession).toHaveBeenCalledWith('abc123', { flowId: 'flow-1' });
  });

  it('returns null when the user closes the sheet', async () => {
    mockOpenAuthSession.mockResolvedValue({ type: 'cancel' });
    await expect(signInWithGoogle()).resolves.toBeNull();
    expect(mockAuth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('passes on the reason when Google or Supabase refuses', async () => {
    mockOpenAuthSession.mockResolvedValue({
      type: 'success',
      url: 'fixmatch://auth/callback?error=access_denied&error_description=Unsupported+provider',
    });
    await expect(signInWithGoogle()).rejects.toThrow('Unsupported provider');
  });
});
