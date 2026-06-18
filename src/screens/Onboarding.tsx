import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    ImageBackground,
    TouchableOpacity,
} from "react-native";
import React, { useState } from "react";

import { theme } from "../constants";
import { svg } from "../svg";
import { components } from "../components";

const onboarding = [
    {
        id: "1",
        title: `Welcome to Teofin \nbank app!`,
        image: "https://dl.dropbox.com/s/jllrbqfmt2pzo9m/02.png?dl=0",
        description: `Labore sunt culpa excepteur culpa \nipsum. Labore occaecat ex nisi mollit.`,
    },
    {
        id: "2",
        title: "Get a new card in a \nfew clicks!",
        image: "https://dl.dropbox.com/s/8px99xy2vfxldwc/03.png?dl=0",
        description: `Labore sunt culpa excepteur culpa \nipsum. Labore occaecat ex nisi mollit.`,
    },
    {
        id: "3",
        title: "Easy payments all \nover the world!",
        image: "https://dl.dropbox.com/s/zx9urfi46ty5sjt/04.png?dl=0",
        description: `Labore sunt culpa excepteur culpa \nipsum. Labore occaecat ex nisi mollit.`,
    },
];

const Onboarding: React.FC = ({ navigation }: any) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    function updateCurrentSlideIndex(e: any) {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / theme.SIZES.width);
        setCurrentSlideIndex(currentIndex);
    }

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={onboarding}
                keyExtractor={(item) => item.id}
                horizontal={true}
                pagingEnabled={true}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={updateCurrentSlideIndex}
                renderItem={({ item, index }) => {
                    return (
                        <ImageBackground
                            style={{
                                width: theme.SIZES.width,
                                height: theme.SIZES.height,
                                justifyContent: "flex-end",
                            }}
                            source={{ uri: item.image }}
                        >
                            <View
                                style={{
                                    backgroundColor: "white",
                                    paddingTop: theme.SIZES.height * 0.08,
                                    paddingBottom: theme.SIZES.height * 0.07,
                                    paddingHorizontal: 20,
                                    borderTopLeftRadius: 20,
                                    borderTopRightRadius: 20,
                                }}
                            >
                                <View
                                    style={{
                                        alignSelf: "center",
                                        marginBottom: 20,
                                    }}
                                >
                                    <svg.LogoSvg />
                                </View>
                                <Text
                                    style={{
                                        textAlign: "center",
                                        ...theme.FONTS.H3,
                                        color: theme.COLORS.mainDark,
                                        marginBottom: 18,
                                    }}
                                >
                                    {item.title}
                                </Text>
                                <Text
                                    style={{
                                        textAlign: "center",
                                        ...theme.FONTS.Mulish_400Regular,
                                        fontSize: 16,
                                        color: theme.COLORS.bodyTextColor,
                                        lineHeight: 16 * 1.6,
                                        marginBottom: 24,
                                    }}
                                >
                                    {item.description}
                                </Text>
                                <View
                                    style={{
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexDirection: "row",
                                        marginBottom: 45,
                                    }}
                                >
                                    {onboarding.map((_, index) => {
                                        return (
                                            <View
                                                key={index}
                                                style={[
                                                    {
                                                        width: 8,
                                                        height: 8,
                                                        marginHorizontal: 5,
                                                        borderRadius: 50,
                                                        borderWidth: 3,
                                                        borderColor: "#D1D2DB",
                                                    },
                                                    currentSlideIndex ==
                                                        index && {
                                                        borderColor:
                                                            theme.COLORS
                                                                .mainDark,
                                                    },
                                                ]}
                                            />
                                        );
                                    })}
                                </View>
                                <components.Button
                                    title="Get Started"
                                    onPress={() =>
                                        navigation.navigate("SignIn")
                                    }
                                />
                            </View>
                        </ImageBackground>
                    );
                }}
            />
        </View>
    );
};

export default Onboarding;
