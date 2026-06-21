import { Image, ImageStyle, StyleProp } from "react-native";
import React from "react";

import { UsdtNetwork } from "../constants/usdtNetworks";

const NETWORK_LOGOS: Record<UsdtNetwork, number> = {
    TRC20: require("../assets/networks/tron.png"),
    ERC20: require("../assets/networks/ethereum.png"),
    BEP20: require("../assets/networks/bnb.png"),
    SOL: require("../assets/networks/solana.png"),
    POLYGON: require("../assets/networks/polygon.png"),
};

type Props = {
    network: UsdtNetwork;
    size?: number;
    style?: StyleProp<ImageStyle>;
};

const NetworkLogo: React.FC<Props> = ({ network, size = 18, style }) => (
    <Image
        source={NETWORK_LOGOS[network]}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        resizeMode="cover"
    />
);

export default NetworkLogo;
