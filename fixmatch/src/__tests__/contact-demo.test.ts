import { callBusiness, sendProblem, startFaceTime } from '@/lib/contact';
import type { Business } from '@/lib/types';

const mockRequire = jest.fn(() => Promise.resolve(false));
const mockLog = jest.fn();
jest.mock('@/state/account', () => ({
  requireContactProfile: () => mockRequire(),
  logContact: (...args: unknown[]) => mockLog(...args),
}));
const mockDialog = jest.fn();
jest.mock('@/lib/dialog', () => ({ showDialog: (...args: unknown[]) => mockDialog(...args) }));
jest.mock('@/lib/haptics', () => ({ select: () => undefined }));
jest.mock('@/state/answers', () => ({ rememberCall: () => undefined }));

const business = (demo: boolean) =>
  ({ id: 'x', name: 'Hjertevarme VVS & Blik', demo, contact: { phone: '+4510219133' } }) as unknown as Business;
const problem = { text: 'Stoppet afløb', photos: [] } as never;

describe('contacting a demo business', () => {
  beforeEach(() => {
    mockRequire.mockClear();
    mockLog.mockClear();
    mockDialog.mockClear();
  });

  it('shows the demo notice without asking for an account, so the demo works offline', async () => {
    await callBusiness(business(true));
    await startFaceTime(business(true));
    await sendProblem(business(true), problem);
    expect(mockRequire).not.toHaveBeenCalled();
    expect(mockLog).not.toHaveBeenCalled();
    expect(mockDialog).toHaveBeenCalledTimes(3);
    expect(mockDialog.mock.calls[0][0]).toBe('Eksempelvirksomhed');
    expect(mockDialog.mock.calls[0][1]).toContain('+45 10 21 91 33');
  });

  it('still asks for an account before contacting a real business', async () => {
    await callBusiness(business(false));
    await startFaceTime(business(false));
    await sendProblem(business(false), problem);
    expect(mockRequire).toHaveBeenCalledTimes(3);
    expect(mockLog).not.toHaveBeenCalled();
    expect(mockDialog).not.toHaveBeenCalled();
  });
});
