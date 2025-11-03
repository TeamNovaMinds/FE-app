// 홈 화면 - 냉장고 재료 관리 (피그마 디자인 반영)
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
    ImageBackground,
    FlatList, // FlatList 사용
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import Constants from 'expo-constants';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router'; // 재료 추가를 위해 useRouter 추가

// 화면 높이/너비 가져오기
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// --- API 응답 타입 정의 (기존과 동일) ---
interface IngredientCountResponse {
    isSuccess: boolean;
    code: string;
    message: string;
    result: {
        refrigeratorCount: number;
        freezerCount: number;
        roomTempCount: number;
    };
}
interface StoredIngredient {
    id: number;
    ingredientId: number;
    ingredientName: string;
    imageUrl: string | null;
    quantity: number;
    storageType: string;
    expirationDate: string;
    version: number;
    dday: string;
}
interface StoredIngredientResponse {
    isSuccess: boolean;
    code: string;
    message: string;
    result: {
        addedCount: number;
        storedIngredients: StoredIngredient[];
    };
}
// --- (타입 정의 끝) ---

// (상수 정의 - 기존과 동일)
const TAB_BACKGROUNDS = {
    fridge: require('../../assets/images/fridge.png'),
    freezer: require('../../assets/images/freezer.png'),
    room: require('../../assets/images/room.png'),
};
const TAB_ACTIVE_COLORS = {
    fridge: '#5FE5FF',
    freezer: '#5FE5FF',
    room: '#FFAC5F',
};
const STORAGE_TYPE_MAP = {
    fridge: 'REFRIGERATOR',
    freezer: 'FREEZER',
    room: 'ROOM_TEMPERATURE',
};
type TabName = 'fridge' | 'freezer' | 'room';

// --- (EmptyFridgeView - 기존과 동일) ---
type EmptyFridgeViewProps = {
    tabName: TabName;
    color: string;
};
const EmptyFridgeView: React.FC<EmptyFridgeViewProps> = ({ tabName, color }) => {
    const tabDisplayMessage = {
        fridge: '냉장고가',
        freezer: '냉동고가',
        room: '실온이',
    }[tabName];

    return (
        <View style={styles.fridgeContentContainer}>
            <Text style={[styles.emptyText, { color: color }]}>{tabDisplayMessage} 비었어요</Text>
            <Text style={[styles.emptyText, { color: color }]}>재료를 추가해주세요!</Text>
        </View>
    );
};

// --- (재료 그리드 아이템 - 기존과 동일) ---
const IngredientGridItem: React.FC<{ item: StoredIngredient }> = ({ item }) => (
    <TouchableOpacity style={styles.gridItem}>
        <Image
            source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/logo.png')} // Fallback image
            style={styles.gridItemImage}
        />
        <Text style={styles.gridItemText} numberOfLines={1}>{item.ingredientName}</Text>
    </TouchableOpacity>
);

// --- (재료 목록 뷰) ---
type IngredientListViewProps = {
    isLoading: boolean;
    error: string | null;
    ingredients: StoredIngredient[];
    tabName: TabName;
    color: string;
};

const IngredientListView: React.FC<IngredientListViewProps> = ({ isLoading, error, ingredients, tabName, color }) => {
    if (isLoading) {
        return (
            <View style={styles.detailLoadingContainer}>
                <ActivityIndicator size="large" color={color} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.detailErrorContainer}>
                <Text style={[styles.emptyText, { color: 'red' }]}>{error}</Text>
            </View>
        );
    }

    if (ingredients.length === 0) {
        return <EmptyFridgeView tabName={tabName} color={color} />;
    }

    // FlatList 수정 (key, numColumns)
    return (
        <FlatList
            data={ingredients}
            renderItem={({ item }) => <IngredientGridItem item={item} />}
            keyExtractor={(item) => item.id.toString()}
            key={tabName} // 1. 에러 해결을 위해 key 추가!
            numColumns={4} // 2. 4열로 변경
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow} // 열 간격 조절
            style={{ flex: 1 }}
        />
    );
};

// --- (메인 홈 스크린 - 로직은 기존과 동일) ---
export default function HomeScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabName | null>(null);
    const [ingredientCount, setIngredientCount] = useState({
        fridge: 0,
        freezer: 0,
        room: 0,
    });
    const [isLoading, setIsLoading] = useState(true); // 요약(count) 로딩
    const [error, setError] = useState<string | null>(null); // 요약(count) 에러

    const [storedIngredients, setStoredIngredients] = useState<StoredIngredient[]>([]);
    const [isListLoading, setIsListLoading] = useState(false); // 목록 로딩
    const [isListError, setIsListError] = useState<string | null>(null); // 목록 에러

    // 애니메이션 값
    const summaryAnimation = useSharedValue(0);
    const fridgeOpacity = useSharedValue(0);
    const freezerOpacity = useSharedValue(0);
    const roomOpacity = useSharedValue(0);

    // 탭 변경 시 애니메이션 (기존과 동일)
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
    }, [activeTab]);

    // 마운트 시 요약(count) 정보 가져오기 (기존과 동일)
    useEffect(() => {
        fetchIngredientCount();
    }, []);

    // activeTab 변경 시 재료 "목록" 가져오기 (기존과 동일)
    useEffect(() => {
        if (activeTab) {
            fetchStoredIngredients(activeTab);
        } else {
            setStoredIngredients([]);
            setIsListError(null);
        }
    }, [activeTab]);

    // 요약(count) API (기존과 동일)
    const fetchIngredientCount = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await axiosInstance.get<IngredientCountResponse>(
                '/api/refrigerators/stored-items/count'
            );
            if (response.data.isSuccess) {
                setIngredientCount({
                    fridge: response.data.result.refrigeratorCount,
                    freezer: response.data.result.freezerCount,
                    room: response.data.result.roomTempCount,
                });
            } else {
                setError('재료 개수를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('재료 개수 조회 에러:', err);
            setError('재료 개수를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 재료 "목록" API 호출 함수 (기존과 동일)
    const fetchStoredIngredients = async (tabName: TabName) => {
        setIsListLoading(true);
        setIsListError(null);
        setStoredIngredients([]);
        try {
            const storageType = STORAGE_TYPE_MAP[tabName];
            const response = await axiosInstance.get<StoredIngredientResponse>(
                '/api/refrigerators/stored-items',
                { params: { storageType } }
            );

            if (response.data.isSuccess) {
                setStoredIngredients(response.data.result.storedIngredients);
            } else {
                setIsListError(response.data.message || '재료를 불러오는데 실패했습니다.');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || '재료 목록을 불러오는 중 오류가 발생했습니다.';
            console.error('재료 목록 조회 에러:', err);
            setIsListError(message);
        } finally {
            setIsListLoading(false);
        }
    };

    // 탭 핸들러 (기존과 동일)
    const handleTabPress = (tabName: TabName) => {
        setActiveTab(prev => (prev === tabName ? null : tabName));
    };

    // --- 애니메이션 스타일 (기존과 동일) ---
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


    // --- 렌더링 (기존과 동일) ---
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
                <Animated.View style={[styles.fab, fabAnimatedStyle]}>
                    <TouchableOpacity
                        style={styles.fabButton}
                        onPress={() => router.push('/ingredient/add')}
                    >
                        <Ionicons name="add" size={24} color="#007AFF" />
                        <Text style={styles.fabText}>재료 추가</Text>
                    </TouchableOpacity>
                </Animated.View>

            </View>
        </View>
    );
}

// --- 스타일시트 수정 ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2D303A',
    },
    headerGradient: {
        height: 126 + Constants.statusBarHeight,
        borderBottomWidth: 2,
        borderBottomColor: '#2D303A',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        shadowColor: '#070251',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10,
    },
    logoContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15 + Constants.statusBarHeight,
        height: 30,
    },
    logoImage: {
        width: 150,
        height: 30,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 15,
    },
    tabButton: {
        width: 100,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    activeTabButton: {
        backgroundColor: '#2D303A',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#161616',
    },
    activeTabText: {
        fontWeight: '700',
    },
    contentArea: {
        flex: 1,
        position: 'relative',
        paddingBottom: 86, // 하단 탭바 높이
        overflow: 'hidden',
    },
    animatedContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    contentGradient: { // 요약 뷰 (하늘색)
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: '#A2AECE',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        alignItems: 'center',
    },
    detailBackground: { // 상세 뷰 (이미지)
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: '#A2AECE',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        overflow: 'hidden',
    },
    // (요약 뷰 스타일 - 기존과 동일)
    countBoxWrapper: {
        marginTop: 58,
        width: '100%',
        alignItems: 'center',
    },
    countBox: {
        width: 299,
        height: 169,
        backgroundColor: '#2D303A',
        borderRadius: 12,
        position: 'relative',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#E4ECF1',
    },
    countBoxOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    countBoxContent: {
        flex: 1,
        justifyContent: 'space-around',
        paddingVertical: 34,
        paddingHorizontal: 24,
    },
    countLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FCFCFC',
        textAlign: 'left',
    },
    countNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#89FFF1',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#2D303A',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF5C5C',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '500',
    },
    retryButton: {
        backgroundColor: '#89FFF1',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#2D303A',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // --- ✅ 상세 뷰 (재료 목록) 스타일 수정 ---
    fridgeContentContainer: { // '비었어요' 뷰
        paddingTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 28,
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    detailLoadingContainer: { // 목록 로딩
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailErrorContainer: { // 목록 에러
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    gridContainer: { // FlatList의 contentContainer
        paddingTop: 24,
        paddingHorizontal: 20, // 4. 좌우 여백 수정
        paddingBottom: 120,
    },
    gridRow: { // FlatList의 columnWrapperStyle
        justifyContent: 'flex-start', // 2. 왼쪽 정렬
        paddingHorizontal: 4, // 4. 행 좌우에 약간의 패딩
    },
    gridItem: { // 재료 아이템 (둥근 사각형)
        width: 90, //  3. 너비 90
        height: 90, //  3. 높이 90
        borderRadius: 16,
        backgroundColor: '#656873',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        marginBottom: 12, // 3. 상하 간격
        marginHorizontal: 4, // 4. 좌우 간격 (아이템 사이 8)
    },
    gridItemImage: {
        width: 48,
        height: 48,
        resizeMode: 'contain',
    },
    gridItemText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
        marginTop: 4,
        textAlign: 'center',
    },
    // --- (FAB 스타일 - 기존과 동일) ---
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 5,
    },
    fabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    fabText: {
        color: '#007AFF',
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 16,
    },
});