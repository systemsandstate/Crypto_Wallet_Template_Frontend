import { api } from '../api';
import { isWalletSetupLocally } from './walletStorage';

/** True when the merchant must create or import a wallet before receiving payments. */
export const needsWalletSetup = async (): Promise<boolean> => {
  try {
    const [walletStatus, localWallet] = await Promise.all([
      api.getWalletStatus(),
      isWalletSetupLocally(),
    ]);
    if (localWallet) return false;
    return !walletStatus.data.hasWallet;
  } catch {
    const localWallet = await isWalletSetupLocally();
    return !localWallet;
  }
};
