import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  canContact,
  deleteAccount,
  finishContactProfileRequest,
  requireContactProfile,
  saveProfile,
  verifyEmailCode,
} from '@/state/account';

// Without EXPO_PUBLIC_SUPABASE_URL the account lives on the phone only, as in the demo.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('account without a server', () => {
  beforeEach(async () => {
    await flush();
    mockPush.mockClear();
  });

  it('asks for an account before contacting, once, and continues when it is created', async () => {
    const first = requireContactProfile();
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/konto', params: { reason: 'contact' } });
    // A second tap while the sign-up screen is open does nothing.
    await expect(requireContactProfile()).resolves.toBe(false);
    expect(mockPush).toHaveBeenCalledTimes(1);

    await verifyEmailCode('marley@example.dk', '');
    expect(canContact()).toBe(false);
    await saveProfile({ name: 'Marley Romby', phone: '+45 12 34 56 78' });
    finishContactProfileRequest();
    await expect(first).resolves.toBe(true);

    expect(canContact()).toBe(true);
    await expect(requireContactProfile()).resolves.toBe(true);
    expect(JSON.parse((await AsyncStorage.getItem('fixmatch:account')) ?? '{}')).toMatchObject({
      status: 'signedIn',
      email: 'marley@example.dk',
      profile: { name: 'Marley Romby', phone: '+45 12 34 56 78' },
    });
  });

  it('deletes the account from the phone', async () => {
    await deleteAccount();
    expect(canContact()).toBe(false);
    expect(await AsyncStorage.getItem('fixmatch:account')).toBeNull();
  });
});
