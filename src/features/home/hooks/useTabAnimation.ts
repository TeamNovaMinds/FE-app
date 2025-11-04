import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { TabName } from '../types';
import { screenHeight } from '../constants';

export const useTabAnimation = (activeTab: TabName | null) => {
    // 애니메이션 값
    const summaryAnimation = useSharedValue(0);
    const fridgeOpacity = useSharedValue(0);
    const freezerOpacity = useSharedValue(0);
    const roomOpacity = useSharedValue(0);

    // 탭 변경 시 애니메이션
    useEffect(() => {
        const animationConfig = {
            duration: 500,
            easing: Easing.out(Easing.exp),
        };

        if (activeTab) {
            summaryAnimation.value = withTiming(1, animationConfig);
            fridgeOpacity.value = withTiming(activeTab === 'fridge' ? 1 : 0, animationConfig);
            freezerOpacity.value = withTiming(activeTab === 'freezer' ? 1 : 0, animationConfig);
            roomOpacity.value = withTiming(activeTab === 'room' ? 1 : 0, animationConfig);
        } else {
            summaryAnimation.value = withTiming(0, animationConfig);
            fridgeOpacity.value = withTiming(0, animationConfig);
            freezerOpacity.value = withTiming(0, animationConfig);
            roomOpacity.value = withTiming(0, animationConfig);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // 애니메이션 스타일
    const summaryAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: summaryAnimation.value * screenHeight * 0.8 }],
        zIndex: 2,
        opacity: 1 - summaryAnimation.value,
    }));

    const fridgeDetailStyle = useAnimatedStyle(() => ({
        opacity: fridgeOpacity.value,
        zIndex: 1,
    }));

    const freezerDetailStyle = useAnimatedStyle(() => ({
        opacity: freezerOpacity.value,
        zIndex: 1,
    }));

    const roomDetailStyle = useAnimatedStyle(() => ({
        opacity: roomOpacity.value,
        zIndex: 1,
    }));

    const fabAnimatedStyle = useAnimatedStyle(() => ({
        opacity: summaryAnimation.value,
        transform: [{ scale: summaryAnimation.value }],
        pointerEvents: activeTab ? 'auto' : 'none',
    }));

    return {
        summaryAnimatedStyle,
        fridgeDetailStyle,
        freezerDetailStyle,
        roomDetailStyle,
        fabAnimatedStyle,
    };
};