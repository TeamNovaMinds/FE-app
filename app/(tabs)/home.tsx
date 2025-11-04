// 홈 화면 - 냉장고 재료 관리 (피그마 디자인 반영)
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';

// 타입 및 상수
import { TabName } from '@/src/features/home/types';
import { TAB_BACKGROUNDS, TAB_ACTIVE_COLORS } from '@/src/features/home/constants';

// 스타일
import { styles } from '@/src/features/home/styles';

// 컴포넌트
import { IngredientListView } from '@/src/features/home/components/IngredientListView';

// 커스텀 훅
import { useIngredientData } from '@/src/features/home/hooks/useIngredientData';
import { useTabAnimation } from '@/src/features/home/hooks/useTabAnimation';

export default function HomeScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabName | null>(null);

    // 커스텀 훅 사용
    const {
        ingredientCount,
        isLoading,
        error,
        storedIngredients,
        isListLoading,
        isListError,
        fetchIngredientCount,
    } = useIngredientData(activeTab);

    const {
        summaryAnimatedStyle,
        fridgeDetailStyle,
        freezerDetailStyle,
        roomDetailStyle,
        fabAnimatedStyle,
    } = useTabAnimation(activeTab);

    // 탭 핸들러
    const handleTabPress = (tabName: TabName) => {
        setActiveTab(prev => (prev === tabName ? null : tabName));
    };

    // 재료 추가 페이지로 이동
    const goToAddIngredient = () => {
        router.push('/ingredient/add');
    };

    return (
        <View style={styles.container}>
            {/* 상단 헤더 영역 */}
            <LinearGradient
                colors={['#8387A5', '#DAE4F4', '#96A3C6']}
                locations={[0, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <View style={styles.logoContainer}>
                    {activeTab === null ? (
                        <Image
                            source={require('../../assets/icons/home_logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={styles.headerTitle}>나의 냉장고</Text>
                    )}
                </View>

                {/* 탭 버튼들 */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'fridge' && styles.activeTabButton]}
                        onPress={() => handleTabPress('fridge')}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === 'fridge' && [styles.activeTabText, { color: TAB_ACTIVE_COLORS.fridge }]
                        ]}>
                            냉장고
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'freezer' && styles.activeTabButton]}
                        onPress={() => handleTabPress('freezer')}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === 'freezer' && [styles.activeTabText, { color: TAB_ACTIVE_COLORS.freezer }]
                        ]}>
                            냉동고
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'room' && styles.activeTabButton]}
                        onPress={() => handleTabPress('room')}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === 'room' && [styles.activeTabText, { color: TAB_ACTIVE_COLORS.room }]
                        ]}>
                            실온
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* 메인 콘텐츠 영역 */}
            <View style={styles.contentArea}>
                {/* Layer 2: 상세 뷰들 */}
                <Animated.View style={[styles.animatedContainer, fridgeDetailStyle]}>
                    <ImageBackground
                        source={TAB_BACKGROUNDS.fridge}
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
                        />
                    </ImageBackground>
                </Animated.View>

                <Animated.View style={[styles.animatedContainer, freezerDetailStyle]}>
                    <ImageBackground
                        source={TAB_BACKGROUNDS.freezer}
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
                        />
                    </ImageBackground>
                </Animated.View>

                <Animated.View style={[styles.animatedContainer, roomDetailStyle]}>
                    <ImageBackground
                        source={TAB_BACKGROUNDS.room}
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
                        />
                    </ImageBackground>
                </Animated.View>

                {/* Layer 1: 요약 뷰 */}
                <Animated.View style={[styles.animatedContainer, summaryAnimatedStyle]}>
                    <LinearGradient
                        colors={['#8387A5', '#DAE4F4', '#96A3C6']}
                        locations={[0, 0.75, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.contentGradient}
                    >
                        {isLoading ? (
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
                                <View style={styles.countBox}>
                                    <LinearGradient
                                        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.countBoxOverlay}
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
                    </LinearGradient>
                </Animated.View>

                {/* 재료 추가 FAB */}
                {activeTab && !isListLoading && storedIngredients.length > 0 && (
                    <Animated.View style={[styles.fab, fabAnimatedStyle]}>
                        <TouchableOpacity
                            style={styles.fabButton}
                            onPress={goToAddIngredient}
                        >
                            <Image
                                source={require('../../assets/icons/plus.png')}
                                style={styles.fabIcon}
                            />
                            <Text style={styles.fabText}>재료 추가</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}