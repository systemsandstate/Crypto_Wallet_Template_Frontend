import { View, Text } from "react-native";
import React from "react";

import { theme } from "../constants";

type Props = {
    title: string;
    containerStyle?: object;
};

const SmallHeader: React.FC<Props> = ({ title, containerStyle }) => {
    return (
        <View style={{ ...containerStyle }}>
            <Text
                style={{
                    ...theme.FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: theme.COLORS.bodyTextColor,
                    lineHeight: 12 * 1.6,
                }}
            >
                {title}
            </Text>
        </View>
    );
};

export default SmallHeader;
