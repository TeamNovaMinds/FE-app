// 홈 화면 - 냉장고 재료 관리 (피그마 디자인 반영)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // 그라데이션 라이브러리
import { Ionicons } from '@expo/vector-icons'; // 임시 아이콘 (나중에 SVG로 교체)
import axiosInstance from '@/api/axiosInstance';
import Constants from 'expo-constants';
// ✅ 1. Reanimated 관련 모듈 임포트
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

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

// ✅ 3. "냉장고가 비었어요" 뷰를 위한 컴포넌트 추가
// --- 3.1. Prop 타입 정의 ---
type FridgeDetailViewProps = {
    tabName: 'fridge' | 'freezer' | 'room';
};

// --- 3.2. 컴포넌트 정의 (React.FC와 Prop 타입 사용) ---
const FridgeDetailView: React.FC<FridgeDetailViewProps> = ({ tabName }) => {
    const tabDisplayName = {
        fridge: '냉장고',
        freezer: '냉동고',
        room: '실온',
    }[tabName];

    //
    //    나중에 이 부분에 실제 재료 목록 API를 연동하고,
    //    재료가 0개일 때 이 'empty' 뷰를 보여주면 됩니다.
    //
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
    // 상단 탭 상태 (냉장고, 냉동고, 실온)
    const [activeTab, setActiveTab] = useState<'fridge' | 'freezer' | 'room' | null>(null);

    // 각 저장 공간의 잔여 재료 개수 상태
    const [ingredientCount, setIngredientCount] = useState({
        fridge: 0,
        freezer: 0,
        room: 0,
    });

    // 로딩 상태
    const [isLoading, setIsLoading] = useState(true);

    // 에러 상태
    const [error, setError] = useState<string | null>(null);

    // ✅ 4. 애니메이션 값 설정 (0: 요약 뷰, 1: 상세 뷰)
    const contentAnimation = useSharedValue(0);

    // activeTab 상태가 변경될 때 애니메이션 값 업데이트
    useEffect(() => {
        contentAnimation.value = withTiming(activeTab ? 1 : 0, {
            duration: 400,
            easing: Easing.out(Easing.exp),
        });
    }, [activeTab]);

    // 컴포넌트 마운트 시 재료 개수 가져오기
    useEffect(() => {
        fetchIngredientCount();
    }, []);

    // API 호출 함수
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

    // ✅ 2. 탭 토글 핸들러
    const handleTabPress = (tabName: 'fridge' | 'freezer' | 'room') => {
        setActiveTab(prev => (prev === tabName ? null : tabName));
    };

    // --- 애니메이션 스타일 정의 ---
    // '요약 뷰' (재료 개수) 애니메이션
    const summaryAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: 1 - contentAnimation.value,
            transform: [{
                translateY: contentAnimation.value * -100 // 위로 사라짐
            }],
            // 탭이 선택되면(애니메이션 진행중) 뒤로 숨김
            zIndex: contentAnimation.value > 0.5 ? -1 : 1,
        };
    });

    // '상세 뷰' (재료 추가하기) 애니메이션
    const detailAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: contentAnimation.value,
            transform: [{
                translateY: (1 - contentAnimation.value) * 100 // 아래에서 나타남
            }],
            // 탭이 선택되면(애니메이션 진행중) 앞으로 보임
            zIndex: contentAnimation.value > 0.5 ? 1 : -1,
        };
    });


    return (
        // 전체 배경: 어두운 회색 (#2D303A)
        <View style={styles.container}>
            {/* 상단 헤더 영역 (그라데이션) */}
            <LinearGradient
                colors={['#8387A5', '#DAE4F4', '#96A3C6']}
                locations={[0, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                {/* ✅ 5. 로고 또는 헤더 텍스트 (조건부 렌더링) */}
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

                {/* 탭 버튼들 (냉장고, 냉동고, 실온) */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'fridge' && styles.activeTabButton]}
                        onPress={() => handleTabPress('fridge')} // ✅ 2. 핸들러 교체
                    >
                        <Text style={[styles.tabText, activeTab === 'fridge' && styles.activeTabText]}>
                            냉장고
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'freezer' && styles.activeTabButton]}
                        onPress={() => handleTabPress('freezer')} // ✅ 2. 핸들러 교체
                    >
                        <Text style={[styles.tabText, activeTab === 'freezer' && styles.activeTabText]}>
                            냉동고
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'room' && styles.activeTabButton]}
                        onPress={() => handleTabPress('room')} // ✅ 2. 핸들러 교체
                    >
                        <Text style={[styles.tabText, activeTab === 'room' && styles.activeTabText]}>
                            실온
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* 메인 콘텐츠 영역 (그라데이션) */}
            <LinearGradient
                colors={['#8387A5', '#DAE4F4', '#96A3C6']}
                locations={[0, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.contentGradient}
            >
                {/* ✅ 5. 애니메이션 래퍼 추가 */}
                <View style={styles.contentInnerContainer}>
                    {/* 1. 재료 개수 요약 뷰 (Summary) */}
                    <Animated.View style={[styles.contentAnimatedWrapper, summaryAnimatedStyle]}>
                        {isLoading ? (
                            // 로딩 중
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#89FFF1" />
                                <Text style={styles.loadingText}>재료 개수를 불러오는 중...</Text>
                            </View>
                        ) : error ? (
                            // 에러 발생
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={fetchIngredientCount}>
                                    <Text style={styles.retryButtonText}>다시 시도</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // 정상 데이터 표시
                            <View style={styles.countBoxWrapper}>
                                {/* 재료 개수 박스 */}
                                <View style={styles.countBox}>
                                    {/* 반투명 그라데이션 오버레이 */}
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
                    </Animated.View>

                    {/* 2. 재료 추가하기 뷰 (Detail) */}
                    <Animated.View style={[styles.contentAnimatedWrapper, detailAnimatedStyle]}>
                        {activeTab && <FridgeDetailView tabName={activeTab} />}
                    </Animated.View>
                </View>
            </LinearGradient>
        </View>
    );
}

// ✅ 6. 스타일시트 수정 및 추가
const styles = StyleSheet.create({
    // 전체 컨테이너
    container: {
        flex: 1,
        backgroundColor: '#2D303A', // 피그마의 전체 배경색
    },
    // 상단 헤더 그라데이션
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
    },
    // JUSTFRIDGE 로고 (및 "나의 냉장고" 텍스트 컨테이너)
    logoContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15 + Constants.statusBarHeight,
        height: 30, // ⭐️ 고정 높이 추가 (애니메이션 시 레이아웃 깨짐 방지)
    },
    logoImage: {
        width: 150,
        height: 30,
    },
    headerTitle: { // ⭐️ "나의 냉장고" 텍스트 스타일
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: 1,
    },
    // 탭 컨테이너
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 15,
    },
    // 탭 버튼
    tabButton: {
        width: 100,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    activeTabButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)', // 활성화된 탭 배경
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
    // 메인 콘텐츠 그라데이션
    contentGradient: {
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: '#A2AECE',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        paddingBottom: 86,
    },
    // ⭐️ 애니메이션을 위한 내부 래퍼
    contentInnerContainer: {
        flex: 1,
        position: 'relative',
    },
    // ⭐️ 두 컨텐츠 뷰를 겹치기 위한 공통 스타일
    contentAnimatedWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center', // 자식 요소(countBox, emptyView)를 중앙 정렬
    },
    // 재료 개수 박스 래퍼 (⭐️ 스타일 수정)
    countBoxWrapper: {
        marginTop: 58,
        width: '100%', // 래퍼가 꽉 차도록
        alignItems: 'center', // 내부 박스 중앙 정렬
    },
    // 재료 개수 박스
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
    // 반투명 그라데이션 오버레이
    countBoxOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    // 재료 개수 박스 내용
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
        color: '#89FFF1', // 청록색 숫자
    },
    // 로딩 컨테이너
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
    // 에러 컨테이너
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

    // ⭐️ --- FridgeDetailView (empty state) 스타일 ---
    fridgeContentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 86, // 탭바 높이만큼 패딩
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF', // 흰색 텍스트
        textAlign: 'center',
        lineHeight: 28,
        textShadowColor: 'rgba(0, 0, 0, 0.25)', // 은은한 그림자
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