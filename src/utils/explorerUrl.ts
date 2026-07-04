import { UsdtNetwork } from "../constants/usdtNetworks";

export const getTxExplorerUrl = (network: string, txHash: string): string | null => {
    switch (network as UsdtNetwork) {
        case "BEP20":
            return `https://bscscan.com/tx/${txHash}`;
        case "ERC20":
            return `https://etherscan.io/tx/${txHash}`;
        case "POLYGON":
            return `https://polygonscan.com/tx/${txHash}`;
        case "TRC20":
            return `https://tronscan.org/#/transaction/${txHash}`;
        default:
            return null;
    }
};
