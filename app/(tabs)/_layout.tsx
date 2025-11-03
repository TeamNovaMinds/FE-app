// 하단 네비게이션 탭 레이아웃 (피그마 디자인 반영)
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#4891FF', // 활성화된 탭: 청록색 (피그마 디자인)
                tabBarInactiveTintColor: '#2D303A', // 비활성화된 탭: 어두운 회색
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',      // ✅ 1. 화면 위에 띄우기
                        bottom: 0,                 // ✅ 2. 하단에 고정
                        left: 0,                   // ✅ 3. 좌우 꽉 채우기
                        right: 0,                  // ✅ 4.
                        backgroundColor: 'transparent', // ✅ 5. iOS는 TabBarBackground(BlurView)를 위해 투명하게
                        height: 86,
                        paddingHorizontal: 30,
                        paddingTop: 8,
                        paddingBottom: 20,         // 홈 인디케이터 고려
                        borderTopWidth: 0,         // 상단 보더 제거
                        // ✅ added: 둥근 모서리 적용
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        overflow: 'hidden',        // 둥근 모서리 적용
                        // ✅ added: 은은한 그림자
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: -2 },
                    },
                    default: {
                        position: 'absolute',      // ✅ 1. 화면 위에 띄우기
                        bottom: 0,                 // ✅ 2. 하단에 고정
                        left: 0,                   // ✅ 3. 좌우 꽉 채우기
                        right: 0,                  // ✅ 4.
                        backgroundColor: '#FFFFFF', // ✅ 5. Android는 흰색 배경
                        height: 86,
                        paddingHorizontal: 30,
                        paddingTop: 8,
                        paddingBottom: 12,
                        borderTopWidth: 0,
                        elevation: 10,             // ✅ 6. Android용 그림자
                        // ✅ added: 둥근 모서리 적용
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        overflow: 'hidden',        // 둥근 모서리 적용
                    },
                }),
                tabBarItemStyle: { paddingVertical: 6 },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    fontFamily: 'Pretendard', // 피그마 폰트 (없으면 시스템 폰트 사용)
                    marginTop: 2,
                },
                tabBarIconStyle: {
                    marginTop: -5,
                },
            }}>
            {/* 냉장고 탭 */}
            <Tabs.Screen
                name="home"
                options={{
                    title: '냉장고',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused
                                ? require('../../assets/icons/fridge_on.png')
                                : require('../../assets/icons/fridge_off.png')}
                            style={{ width: 25, height: 25 }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />

            {/* 레시피 탭 */}
            <Tabs.Screen
                name="recipe"
                options={{
                    title: '레시피',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused
                                ? require('../../assets/icons/recipe_on.png')
                                : require('../../assets/icons/recipe_off.png')}
                            style={{ width: 29, height: 29 }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />

            {/* 커뮤니티 탭 */}
            <Tabs.Screen
                name="community"
                options={{
                    title: '커뮤니티',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused
                                ? require('../../assets/icons/community_on.png')
                                : require('../../assets/icons/community_off.png')}
                            style={{ width: 37, height: 37 }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />

            {/* 마이페이지 탭 */}
            <Tabs.Screen
                name="mypage"
                options={{
                    title: '마이페이지',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={focused
                                ? require('../../assets/icons/mypage_on.png')
                                : require('../../assets/icons/mypage_off.png')}
                            style={{ width: 37, height: 37 }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
