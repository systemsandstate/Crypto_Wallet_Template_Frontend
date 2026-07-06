import { isWalletSetupLocally } from './walletStorage';

/** True when this device/browser has no wallet — show create/restore prompt. */
export const needsWalletSetup = async (): Promise<boolean> => {
  return !(await isWalletSetupLocally());
};
