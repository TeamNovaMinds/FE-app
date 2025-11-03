// 홈 화면 - 냉장고 재료 관리 (피그마 디자인 반영)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // 그라데이션 라이브러리
import { Ionicons } from '@expo/vector-icons'; // 임시 아이콘 (나중에 SVG로 교체)
import axiosInstance from '@/api/axiosInstance';
import Constants from 'expo-constants';

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
                {/* JUSTFRIDGE 로고 */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/icons/home_logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>

                {/* 탭 버튼들 (냉장고, 냉동고, 실온) */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'fridge' && styles.activeTabButton]}
                        onPress={() => setActiveTab('fridge')}
                    >
                        <Text style={[styles.tabText, activeTab === 'fridge' && styles.activeTabText]}>
                            냉장고
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'freezer' && styles.activeTabButton]}
                        onPress={() => setActiveTab('freezer')}
                    >
                        <Text style={[styles.tabText, activeTab === 'freezer' && styles.activeTabText]}>
                            냉동고
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'room' && styles.activeTabButton]}
                        onPress={() => setActiveTab('room')}
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
            </LinearGradient>
        </View>
    );
}

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
        // 피그마의 box-shadow 효과
        shadowColor: '#070251',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    // JUSTFRIDGE 로고
    logoContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15 + Constants.statusBarHeight,
        height: 30,
    },
    logoImage: {
        width: 150, // 로고 너비 (조정 필요)
        height: 30, // 로고 높이 (조정 필요)
    },
    logoJust: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: 1,
    },
    logoFridge: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1298FF',
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

    // 재료 개수 박스 래퍼
    countBoxWrapper: {
        marginTop: 58,
        paddingHorizontal: 38,
        alignItems: 'center'
    },

    // 재료 개수 박스
    countBox: {
        width: 299,
        height: 169,
        backgroundColor: '#2D303A',
        borderRadius: 12,
        position: 'relative',
        // 그림자 효과
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
});
