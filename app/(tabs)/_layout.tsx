// ✅ 하단 네비게이션 탭 레이아웃 (피그마 디자인 반영)
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#89FFF1', // ✅ 활성화된 탭: 청록색 (피그마 디자인)
                tabBarInactiveTintColor: '#2D303A', // ✅ 비활성화된 탭: 어두운 회색
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',
                        backgroundColor: '#FFFFFF', // ✅ 피그마 디자인: 흰색 배경
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        height: 76,
                        paddingHorizontal: 40,
                    },
                    default: {
                        backgroundColor: '#FFFFFF',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        height: 76,
                        paddingHorizontal: 40,
                        elevation: 0,
                        borderTopWidth: 0,
                    },
                }),
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    fontFamily: 'Pretendard', // ✅ 피그마 폰트 (없으면 시스템 폰트 사용)
                },
            }}>
            {/* ✅ 냉장고 탭 */}
            <Tabs.Screen
                name="home"
                options={{
                    title: '냉장고',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused
                                ? require('../../assets/icons/fridge_on.png')
                                : require('../../assets/icons/fridge_off.png')}
                            style={{ width: 20, height: 20 }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />

            {/* ✅ 레시피 탭 */}
            <Tabs.Screen
                name="recipe"
                options={{
                    title: '레시피',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused
                                ? require('../../assets/icons/recipe_on.png')
                                : require('../../assets/icons/recipe_off.png')}
                            style={{ width: 24, height: 24 }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />

            {/* ✅ 커뮤니티 탭 */}
            <Tabs.Screen
                name="community"
                options={{
                    title: '커뮤니티',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused
                                ? require('../../assets/icons/community_on.png')
                                : require('../../assets/icons/community_off.png')}
                            style={{ width: 32, height: 32 }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />

            {/* ✅ 마이페이지 탭 */}
            <Tabs.Screen
                name="mypage"
                options={{
                    title: '마이페이지',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused
                                ? require('../../assets/icons/mypage_on.png')
                                : require('../../assets/icons/mypage_off.png')}
                            style={{ width: 32, height: 32 }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
