// 홈 화면 - 냉장고 재료 관리 (피그마 디자인 반영)
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import PlusIcon from '../../assets/icons/plus.svg';
import ActiveTabBg from '../../assets/icons/active_tab_bg.svg';
import HomeLogo from '../../assets/icons/home_logo.svg';
import SummaryBg from '../../assets/icons/summary_bg.svg';
import { SvgImageBackground } from '@/components/SvgImageBackground';
import { useRefrigeratorSocket } from '@/hooks/useRefrigeratorSocket'; // 훅 import

// 타입 및 상수
import { TabName } from '@/src/features/home/types';
import { TAB_ACTIVE_COLORS } from '@/src/features/home/constants';

// 스타일
import { styles } from '@/src/features/home/styles';

// 컴포넌트
import { IngredientListView } from '@/src/features/home/components/IngredientListView';

// 커스텀 훅
import { useIngredientData } from '@/src/features/home/hooks/useIngredientData';
import { useTabAnimation } from '@/src/features/home/hooks/useTabAnimation';
import { useEquippedSkin } from '@/src/features/home/hooks/useEquippedSkin';

import { StoredIngredient } from '@/src/features/home/types'; // ✅ 2. StoredIngredient 타입 임포트

export default function HomeScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabName | null>(null);

    // 커스텀 훅 사용
    const {
        ingredientCount,
        isLoading, // 💡 [수정] 이 isLoading은 '요약' 로딩 상태입니다.
        error,
        storedIngredients,
        isListLoading,
        isListError,
        fetchIngredientCount,
    } = useIngredientData(activeTab);

    // 웹소켓 콜백: 재료 변경 시 데이터 업데이트
    const handleSocketUpdate = useCallback(() => {
        console.log('📡 WebSocket: Ingredient update received, refreshing data...');

        // React Query 캐시 무효화 (변경된 부분만 다시 가져옴)
        queryClient.invalidateQueries({ queryKey: ['ingredientCount'] });
        if (activeTab) {
            queryClient.invalidateQueries({ queryKey: ['storedIngredients', activeTab] });
        }
    }, [queryClient, activeTab]);

    // 웹소켓 연결
    useRefrigeratorSocket(
        ingredientCount.refrigeratorId > 0 ? ingredientCount.refrigeratorId : null,
        handleSocketUpdate
    );

    const {
        summaryAnimatedStyle,
        fridgeDetailStyle,
        freezerDetailStyle,
        roomDetailStyle,
        fabAnimatedStyle,
    } = useTabAnimation(activeTab);

    // 장착된 스킨 조회
    const {
        backgroundImage,
        summaryBackgroundImage,
        headerBackgroundImage,
        fridgeBackgroundImage,
        freezerBackgroundImage,
        roomBackgroundImage,
    } = useEquippedSkin();

    // 탭 핸들러 - prefetch 추가
    const handleTabPress = (tabName: TabName) => {
        const newTab = activeTab === tabName ? null : tabName;
        setActiveTab(newTab);

        // 탭이 열릴 때 해당 탭의 데이터를 prefetch
        if (newTab) {
            const STORAGE_TYPE_MAP: Record<TabName, string> = {
                fridge: 'REFRIGERATOR',
                freezer: 'FREEZER',
                room: 'ROOM_TEMPERATURE',
            };
            const storageType = STORAGE_TYPE_MAP[newTab];

            queryClient.prefetchQuery({
                queryKey: ['storedIngredients', newTab],
                queryFn: async () => {
                    const response = await axiosInstance.get('/api/refrigerators/stored-items', {
                        params: { storageType },
                    });
                    if (response.data.isSuccess) {
                        return response.data.result.storedIngredients;
                    }
                    throw new Error(response.data.message || '재료를 불러오는데 실패했습니다.');
                },
            });
        }
    };

    // 재료 추가 페이지로 이동
    const goToAddIngredient = () => {
        // activeTab에 따라 storageType 파라미터 전달
        const storageType = activeTab === 'fridge' ? 'REFRIGERATOR'
            : activeTab === 'freezer' ? 'FREEZER'
            : activeTab === 'room' ? 'ROOM_TEMPERATURE'
            : 'REFRIGERATOR';

        router.push(`/ingredient-search?storageType=${storageType}`);
    };

    // ✅ 4. 재료 아이템 클릭 시 호출될 핸들러
    const handleIngredientPress = (item: StoredIngredient) => {
        // StoredIngredient 객체 전체를 params로 전달합니다.
        // [storedItemId].tsx 파일이 item.id를 자동으로 받습니다.
        router.push({
            pathname: `/ingredient/${item.id}`,
            params: {
                // StoredIngredient의 모든 필드가 문자열로 변환되어 전달됩니다.
                ...item,
                // id는 pathname에서 이미 사용되었지만, 명확성을 위해 포함
                storedItemId: item.id.toString(),
            }
        });
    };

    const hasNoCountData = ingredientCount.fridge === 0 && ingredientCount.freezer === 0 && ingredientCount.room === 0;

    return (
        <View style={styles.container}>
            {/* 상단 헤더 영역 */}
            <SvgImageBackground
                source={headerBackgroundImage}
                style={styles.headerGradient}
                resizeMode="cover"
            >
                <View style={styles.logoContainer}>
                    {activeTab === null ? (
                        <HomeLogo style={styles.logoImage} />
                    ) : (
                        <Text style={styles.headerTitle}>나의 냉장고</Text>
                    )}
                </View>

                {/* 스킨 설정 버튼 (요약뷰일 때만 표시) */}
                {activeTab === null && (
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => router.push('/skin?tab=OWNED')}
                    >
                        <Ionicons name="settings-outline" size={24} color="#333" />
                    </TouchableOpacity>
                )}

                {/* 탭 버튼들 */}
                <View style={styles.tabContainer}>
                    {/* 냉장고 탭 */}
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => handleTabPress('fridge')}
                    >
                        {activeTab === 'fridge' ? (
                            <View style={styles.activeTabBackground}>
                                <ActiveTabBg
                                    width="100%"
                                    height="100%"
                                    style={{ position: 'absolute' }}
                                    preserveAspectRatio="none"
                                />
                                <Text style={[
                                    styles.tabText,
                                    styles.activeTabText,
                                    { color: TAB_ACTIVE_COLORS.fridge }
                                ]}>
                                    냉장고
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.tabText}>
                                냉장고
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* 냉동고 탭 */}
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => handleTabPress('freezer')}
                    >
                        {activeTab === 'freezer' ? (
                            <View style={styles.activeTabBackground}>
                                <ActiveTabBg
                                    width="100%"
                                    height="100%"
                                    style={{ position: 'absolute' }}
                                    preserveAspectRatio="none"
                                />
                                <Text style={[
                                    styles.tabText,
                                    styles.activeTabText,
                                    { color: TAB_ACTIVE_COLORS.freezer }
                                ]}>
                                    냉동고
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.tabText}>
                                냉동고
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* 실온 탭 */}
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => handleTabPress('room')}
                    >
                        {activeTab === 'room' ? (
                            <View style={styles.activeTabBackground}>
                                <ActiveTabBg
                                    width="100%"
                                    height="100%"
                                    style={{ position: 'absolute' }}
                                    preserveAspectRatio="none"
                                />
                                <Text style={[
                                    styles.tabText,
                                    styles.activeTabText,
                                    { color: TAB_ACTIVE_COLORS.room }
                                ]}>
                                    실온
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.tabText}>
                                실온
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SvgImageBackground>

            {/* 메인 콘텐츠 영역 */}
            <View style={styles.contentArea}>
                {/* Layer 2: 상세 뷰들 */}
                <Animated.View style={[styles.animatedContainer, fridgeDetailStyle]}>
                    <SvgImageBackground
                        source={fridgeBackgroundImage}
                        style={styles.detailBackground}
                        resizeMode="stretch"
                    >
                        <IngredientListView
                            isLoading={isListLoading}
                            error={isListError}
                            ingredients={storedIngredients}
                            tabName="fridge"
                            color={TAB_ACTIVE_COLORS.fridge}
                            onAddIngredient={goToAddIngredient}
                            onItemPress={handleIngredientPress}
                        />
                    </SvgImageBackground>
                </Animated.View>

                <Animated.View style={[styles.animatedContainer, freezerDetailStyle]}>
                    <SvgImageBackground
                        source={freezerBackgroundImage}
                        style={styles.detailBackground}
                        resizeMode="stretch"
                    >
                        <IngredientListView
                            isLoading={isListLoading}
                            error={isListError}
                            ingredients={storedIngredients}
                            tabName="freezer"
                            color={TAB_ACTIVE_COLORS.freezer}
                            onAddIngredient={goToAddIngredient}
                            onItemPress={handleIngredientPress}
                        />
                    </SvgImageBackground>
                </Animated.View>

                <Animated.View style={[styles.animatedContainer, roomDetailStyle]}>
                    <SvgImageBackground
                        source={roomBackgroundImage}
                        style={styles.detailBackground}
                        resizeMode="stretch"
                    >
                        <IngredientListView
                            isLoading={isListLoading}
                            error={isListError}
                            ingredients={storedIngredients}
                            tabName="room"
                            color={TAB_ACTIVE_COLORS.room}
                            onAddIngredient={goToAddIngredient}
                            onItemPress={handleIngredientPress}
                        />
                    </SvgImageBackground>
                </Animated.View>

                {/* Layer 1: 요약 뷰 */}
                <Animated.View style={[styles.animatedContainer, summaryAnimatedStyle]}>
                    <SvgImageBackground
                        source={summaryBackgroundImage}
                        style={styles.contentGradient}
                        resizeMode="cover"
                    >
                        {/* 💡 [수정] isLoading이 true이면서 동시에 기존 카운트가 0일 때만 로딩 표시 */}
                        {isLoading && hasNoCountData ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#89FFF1" />
                                <Text style={styles.loadingText}>재료 개수를 불러오는 중...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={fetchIngredientCount}>
                                    <Text style={styles.retryButtonText}>다시 시도</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.countBoxWrapper}>
                                {/* SVG 배경 사용 */}
                                <View style={styles.countBox}>
                                    <SummaryBg
                                        width="100%"
                                        height="100%"
                                        style={{ position: 'absolute' }}
                                        preserveAspectRatio="none"
                                    />
                                    <View style={styles.countBoxContent}>
                                        <Text style={styles.countLabel}>
                                            냉장고 잔여 재료 : <Text style={styles.countNumber}>{ingredientCount.fridge}</Text>
                                        </Text>
                                        <Text style={styles.countLabel}>
                                            냉동고 잔여 재료 : <Text style={styles.countNumber}>{ingredientCount.freezer}</Text>
                                        </Text>
                                        <Text style={styles.countLabel}>
                                            실온 잔여 재료 : <Text style={styles.countNumber}>{ingredientCount.room}</Text>
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </SvgImageBackground>
                </Animated.View>

                {/* 재료 추가 FAB */}
                {activeTab && !isListLoading && storedIngredients.length > 0 && (
                    <Animated.View style={[styles.fab, fabAnimatedStyle]}>
                        <TouchableOpacity
                            style={styles.fabButton}
                            onPress={goToAddIngredient}
                        >
                            <PlusIcon width={22} height={22} />
                            <Text style={styles.fabText}>재료 추가</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}