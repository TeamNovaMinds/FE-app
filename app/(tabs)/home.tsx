// 홈 화면 - 냉장고 재료 관리 (피그마 디자인 반영)
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
    ImageBackground // ImageBackground 임포트
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import Constants from 'expo-constants';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

// 화면 높이 가져오기
const { height: screenHeight } = Dimensions.get('window');

// API 응답 타입 정의
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

// "냉장고가 비었어요" 뷰를 위한 컴포넌트
type FridgeDetailViewProps = {
    tabName: 'fridge' | 'freezer' | 'room';
};

const FridgeDetailView: React.FC<FridgeDetailViewProps> = ({ tabName }) => {
    const tabDisplayName = {
        fridge: '냉장고',
        freezer: '냉동고',
        room: '실온',
    }[tabName];

    return (
        <View style={styles.fridgeContentContainer}>
            <Text style={styles.emptyText}>{tabDisplayName}가 비었어요</Text>
            <Text style={styles.emptyText}>재료를 추가해주세요!</Text>
            <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={44} color="#FFFFFF" style={{ marginBottom: -5 }} />
                <Text style={styles.addButtonText}>재료 추가하기</Text>
            </TouchableOpacity>
        </View>
    );
};


export default function HomeScreen() {
    const [activeTab, setActiveTab] = useState<'fridge' | 'freezer' | 'room' | null>(null);
    const [ingredientCount, setIngredientCount] = useState({
        fridge: 0,
        freezer: 0,
        room: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 애니메이션 값 (0: 요약 뷰, 1: 상세 뷰)
    const contentAnimation = useSharedValue(0);

    // activeTab 상태가 변경될 때 애니메이션 값 업데이트
    useEffect(() => {
        if (activeTab) {
            // 탭이 선택되면 (열림)
            contentAnimation.value = withTiming(1, {
                duration: 500, // 열리는 속도
                easing: Easing.out(Easing.exp),
            });
        } else {
            // 탭이 해제되면 (닫힘)
            contentAnimation.value = withTiming(0, {
                duration: 500, // 닫히는 속도
                easing: Easing.out(Easing.exp),
            });
        }
    }, [activeTab]);


    useEffect(() => {
        fetchIngredientCount();
    }, []);

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

    const handleTabPress = (tabName: 'fridge' | 'freezer' | 'room') => {
        setActiveTab(prev => (prev === tabName ? null : tabName));
    };

    // --- 애니메이션 스타일 ---

    // 상세 뷰 (Layer 2, 뒤) : 어두운 fridge_empty.png 배경
    const detailAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: contentAnimation.value, // 0 -> 1 (서서히 나타남)
            zIndex: 1, // 뒤에 위치
        };
    });

    // 요약 뷰 (Layer 1, 앞) : 하늘색 그라데이션 배경
    const summaryAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                // 0 -> screenHeight * 0.8 (아래로 내려감)
                { translateY: contentAnimation.value * screenHeight * 0.8 }
            ],
            zIndex: 2, // 앞에 위치
            // 탭이 열리면(애니메이션 진행중) 투명하게 만들어서 상세 뷰가 비치도록
            opacity: 1 - contentAnimation.value,
        };
    });


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

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'fridge' && styles.activeTabButton]}
                        onPress={() => handleTabPress('fridge')}
                    >
                        <Text style={[styles.tabText, activeTab === 'fridge' && styles.activeTabText]}>
                            냉장고
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'freezer' && styles.activeTabButton]}
                        onPress={() => handleTabPress('freezer')}
                    >
                        <Text style={[styles.tabText, activeTab === 'freezer' && styles.activeTabText]}>
                            냉동고
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'room' && styles.activeTabButton]}
                        onPress={() => handleTabPress('room')}
                    >
                        <Text style={[styles.tabText, activeTab === 'room' && styles.activeTabText]}>
                            실온
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* 메인 콘텐츠 영역 (애니메이션 컨테이너) */}
            <View style={styles.contentArea}>

                {/* Layer 2: 상세 뷰 (어두운 배경) - 뒤에 위치 */}
                <Animated.View style={[styles.animatedContainer, detailAnimatedStyle]}>
                    <ImageBackground
                        source={require('../../assets/images/fridge_empty.png')} // 🚨 fridge_empty.png 경로
                        style={styles.detailBackground}
                        resizeMode="stretch"
                    >
                        {activeTab && <FridgeDetailView tabName={activeTab} />}
                    </ImageBackground>
                </Animated.View>

                {/* Layer 1: 요약 뷰 (하늘색 배경) - 앞에 위치, 아래로 슬라이드됨 */}
                <Animated.View style={[styles.animatedContainer, summaryAnimatedStyle]}>
                    <LinearGradient
                        colors={['#8387A5', '#DAE4F4', '#96A3C6']}
                        locations={[0, 0.75, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.contentGradient} // 그라데이션 자체
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

            </View>
        </View>
    );
}

// 5. 스타일시트 수정 및 추가
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
        zIndex: 10, // 헤더가 항상 위에 있도록
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
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#161616',
    },
    activeTabText: {
        color: '#161616',
        fontWeight: '700',
    },

    // 겹치는 애니메이션을 위한 부모 컨테이너
    contentArea: {
        flex: 1,
        position: 'relative',
        paddingBottom: 86, // 탭바 높이만큼 공간 확보
        overflow: 'hidden', // 뷰가 영역 밖으로 나가면 자르기
    },

    // 요약 뷰와 상세 뷰에 공통으로 적용될 absolute 스타일
    animatedContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },

    // Layer 1 (앞): 요약 뷰의 하늘색 그라데이션
    contentGradient: {
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: '#A2AECE',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        // 자식(countBoxWrapper)을 정렬하기 위해
        alignItems: 'center',
    },

    // Layer 2 (뒤): 상세 뷰의 어두운 이미지 배경
    detailBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1, // 그라데이션과 동일한 테두리
        borderTopColor: '#A2AECE',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        overflow: 'hidden', // 이미지 배경이 둥근 모서리를 넘지 않도록
        paddingBottom: 300,
    },

    // --- 요약 뷰 내부 컴포넌트 ---
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
        borderTopColor: '#E4ECF1',
        borderLeftColor: '#E4ECF1',
        borderRightColor: '#E4ECF1',
        borderBottomColor: '#E4ECF1',
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

    // --- 상세 뷰 내부 컴포넌트 ---
    fridgeContentContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 28,
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    addButton: {
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});