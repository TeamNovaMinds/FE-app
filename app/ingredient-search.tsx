// app/ingredient-search.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Pressable,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView,
    Alert, // 1. Alert 임포트
    Dimensions, // 화면 크기 가져오기
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import debounce from 'lodash.debounce';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';

// 2. 스토어 임포트
import { usePendingIngredientsStore } from '@/store/pendingIngredientsStore';

// (기존 타입 정의)
interface IngredientDTO {
    id: number;
    name: string;
    category: string;
    imageUrl: string | null;
}

// 스토어 아이템 타입 정의
interface PendingIngredient {
    ingredientId: number;
    storageType: string;
    expirationDate?: string;
    quantity: number;
}
// (기존 카테고리 정의)
const CATEGORIES = [
    { key: 'ALL', name: '전체' },
    { key: 'MEAT', name: '육류' },
    { key: 'VEGETABLE', name: '채소' },
    { key: 'FRUIT', name: '과일' },
    { key: 'DAIRY', name: '유제품' },
    { key: 'SEASONING', name: '조미료' },
    { key: 'PROCESSED', name: '가공식품' },
];

// 💡 2. API 호출 함수를 컴포넌트 밖으로 분리
const fetchIngredients = async (keyword: string, category: string) => {
    try {
        const params: any = {
            keyword: keyword || undefined,
            category: category !== 'ALL' ? category : undefined,
        };
        const response = await axiosInstance.get('/api/ingredients', { params });
        if (response.data.isSuccess) {
            return response.data.result.ingredients as IngredientDTO[]; // 💡 데이터 반환
        }
        throw new Error(response.data.message || "재료 검색 에러");
    } catch (error) {
        console.error("재료 검색 에러:", error);
        throw error; // 💡 React Query가 에러를 인지하도록 throw
    }
};

export default function IngredientSearchScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { storageType } = useLocalSearchParams<{ storageType?: string; }>();

    // 3. 스토어에서 상태와 함수들 가져오기
    const { pendingItems, removeItem, clearItems } = usePendingIngredientsStore();

    // React Query mutation for bulk adding ingredients
    const addIngredientsMutation = useMutation({
        mutationFn: async (items: PendingIngredient[]) => {
            const response = await axiosInstance.post('/api/refrigerators/stored-items', {
                items
            });
            if (!response.data.isSuccess) {
                throw new Error(response.data.message);
            }
            return response.data;
        },
        onSuccess: () => {
            // 캐시 무효화로 홈 화면이 자동으로 refetch되도록
            queryClient.invalidateQueries({ queryKey: ['ingredientCount'] });
            queryClient.invalidateQueries({ queryKey: ['storedIngredients'] });

            Alert.alert('추가 완료', '선택한 재료들이 냉장고에 추가되었습니다.');
            clearItems(); // 스토어 비우기
            closeModal(); // 모달 닫기
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || '재료 추가 중 오류가 발생했습니다.';
            Alert.alert('오류', message);
        }
    });

    // 💡 3. 검색어 상태 (즉시)
    const [searchQuery, setSearchQuery] = useState('');
    // 💡 4. 디바운스된(입력이 멈춘 후 반영될) 검색어 상태
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('ALL');

    // 💡 5. results, isLoading 상태 제거 (useQuery가 관리)
    // const [results, setResults] = useState<IngredientDTO[]>([]);
    // const [isLoading, setIsLoading] = useState(false);

    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    // 💡 6. searchQuery가 변경될 때마다 300ms 지연 후 debouncedQuery를 업데이트
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // 💡 7. React Query의 useQuery로 데이터 페칭
    const {
        data: results = [], // 💡 data를 results로 사용, 기본값은 빈 배열
        isLoading,          // 💡 React Query가 제공하는 isLoading 사용
        error,              // 💡 에러 상태
    } = useQuery<IngredientDTO[], Error>({
        // 💡 디바운스된 검색어(debouncedQuery)와 카테고리를 key로 사용
        queryKey: ['ingredients', debouncedQuery, activeCategory],
        queryFn: () => fetchIngredients(debouncedQuery, activeCategory),
        staleTime: 1000 * 60 * 5, // 5분 동안 캐시된 데이터를 신선하다고 간주
        placeholderData: (previousData) => previousData, // 로딩 중 이전 데이터 표시
    });

    // (모달 닫기, 제스처, 애니메이션 스타일 ... 기존과 동일)
    const closeModal = () => {
        Keyboard.dismiss();
        router.back();
    };
    const handleClose = () => {
        'worklet';
        runOnJS(closeModal)();
    };
    const panGesture = Gesture.Pan()
        .activeOffsetY(10)
        .failOffsetY(-10)
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd(() => {
            if (translateY.value > 100) {
                handleClose();
            } else {
                translateY.value = withSpring(0, {
                    damping: 50,
                    stiffness: 400,
                    mass: 0.3,
                    overshootClamping: false,
                });
            }
        });
    const animatedSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });


    // 5. 재료 선택 핸들러 수정 (스토어 확인 로직 추가)
    const handleSelectIngredient = (item: IngredientDTO) => {
        // 스토어에서 이 재료가 이미 선택되었는지 확인
        const existingItem = (pendingItems as PendingIngredient[]).find((p: PendingIngredient) => p.ingredientId === item.id);

        const params = new URLSearchParams({
            name: item.name,
            ...(storageType && { storageType })
        });
        const url = `/add-ingredient-form/${item.id}?${params.toString()}`;

        if (existingItem) {
            // 이미 있으면 수정/삭제/취소 옵션 제공
            Alert.alert(
                "이미 추가된 재료",
                "수정하거나 목록에서 삭제할 수 있습니다.",
                [
                    { text: "삭제", onPress: () => removeItem(item.id), style: "destructive" },
                    { text: "수정", onPress: () => router.push(url) },
                    { text: "취소", style: "cancel" }
                ]
            );
        } else {
            // 없으면 폼 화면으로 이동
            router.push(url);
        }
    };

    // 6. 최종 '추가하기' 버튼 핸들러 (useMutation 사용)
    const handleBulkAdd = () => {
        if (pendingItems.length === 0) return;
        addIngredientsMutation.mutate(pendingItems as PendingIngredient[]);
    };

    // (카테고리 렌더링 함수 ... 기존과 동일)
    const renderCategoryFilters = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterContainer}
        >
            {CATEGORIES.map((category) => (
                <TouchableOpacity
                    key={category.key}
                    style={[
                        styles.filterButton,
                        activeCategory === category.key && styles.filterButtonActive
                    ]}
                    onPress={() => setActiveCategory(category.key)}
                >
                    <Text style={[
                        styles.filterText,
                        activeCategory === category.key && styles.filterTextActive
                    ]}>
                        {category.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    return (
        <Pressable style={styles.backdrop} onPress={handleClose}>
            <Animated.View style={[styles.sheetContainer, animatedSheetStyle]}>
                <Pressable style={{ flex: 1 }}>
                    <SafeAreaView style={styles.safeArea}>
                        {/* ... (검색창, 카테고리 필터 UI는 동일) ... */}
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View>
                                <GestureDetector gesture={panGesture}>
                                    <View style={styles.grabberContainer}>
                                        <View style={styles.grabber} />
                                    </View>
                                </GestureDetector>
                                <View style={styles.searchContainer}>
                                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="재료 이름을 검색하세요..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery} // 💡 state를 직접 업데이트
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <Ionicons name="close-circle" size={20} color="#888" style={styles.clearIcon} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>

                        {renderCategoryFilters()}


                        {/* 💡 9. FlatList 렌더링 로직 수정 (isLoading, error 사용) */}
                        {isLoading && results.length === 0 ? ( // 💡 첫 로딩 또는 검색 중일 때
                            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={results} // 💡 useQuery에서 온 results 사용
                                keyExtractor={(item) => item.id.toString()}
                                keyboardShouldPersistTaps="handled"
                                style={{ flex: 1 }}
                                numColumns={4}
                                columnWrapperStyle={styles.gridRow}
                                contentContainerStyle={styles.gridContainer}
                                renderItem={({ item }) => {
                                    const isSelected = (pendingItems as PendingIngredient[]).some((p: PendingIngredient) => p.ingredientId === item.id);
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.itemContainer,
                                                isSelected && styles.itemContainerActive
                                            ]}
                                            onPress={() => handleSelectIngredient(item)}
                                        >
                                            <Image
                                                source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/images/JustFridge_logo.png')}
                                                style={styles.itemImage}
                                                contentFit="contain"
                                                transition={200}
                                                cachePolicy="memory-disk"
                                            />
                                            <Text
                                                style={[
                                                    styles.itemName,
                                                    isSelected && styles.itemNameActive
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                }}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        {/* 💡 에러가 있으면 에러 메시지 표시 */}
                                        <Text>
                                            {error ? `오류: ${error.message}` : "검색 결과가 없습니다."}
                                        </Text>
                                    </View>
                                }
                            />
                        )}

                        {/* 13. 최종 '추가하기' 버튼 UI 추가 */}
                        <View style={styles.addButtonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.addButton,
                                    (pendingItems.length === 0 || addIngredientsMutation.isPending) && styles.addButtonDisabled
                                ]}
                                onPress={handleBulkAdd}
                                disabled={pendingItems.length === 0 || addIngredientsMutation.isPending}
                            >
                                {addIngredientsMutation.isPending ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.addButtonText}>
                                        {pendingItems.length > 0 ? `${pendingItems.length}개 추가하기` : '추가하기'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                    </SafeAreaView>
                </Pressable>
            </Animated.View>
        </Pressable>
    );
}

// 화면 너비 가져오기
const { width: screenWidth } = Dimensions.get('window');

// 그리드 아이템 크기 계산 (4열 기준)
const horizontalPadding = 22; // 양쪽 여백
const itemsPerRow = 4;
const itemSpacing = 12; // 아이템 간 총 간격
const availableWidth = screenWidth - (horizontalPadding * 2);
const itemWidth = Math.floor((availableWidth - (itemSpacing * (itemsPerRow - 1))) / itemsPerRow);

// 14. 스타일 시트 수정 (활성 스타일, 추가하기 버튼 스타일 추가)
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    sheetContainer: {
        height: '60%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    safeArea: {
        flex: 1,
    },
    grabberContainer: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    grabber: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#C0C0C0',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        width: screenWidth - 32, // 화면 너비 - 32 (양쪽 여백 16씩)
        alignSelf: 'center', // 중앙 정렬
        marginBottom: 10,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
    },
    clearIcon: {
        marginLeft: 8,
    },
    // 2. 카테고리 스크롤뷰 자체의 스타일 추가
    filterScrollView: {
        flexGrow: 0, // <-- 이 속성으로 스크롤뷰가 불필요하게 늘어나는 것을 방지합니다.
    },
    // 카테고리 필터 스타일
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16, // 목록과의 간격
    },
    filterButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 8,
        // ✅ 1. 텍스트를 수직 중앙 정렬하기 위해 추가
        justifyContent: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#1298FF', // 활성 탭 색상 (원하는 색으로 변경)
    },
    filterText: {
        fontSize: 14,
        color: '#555',
    },
    filterTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    // 그리드 스타일
    gridContainer: {
        alignItems: 'center', // 중앙 정렬
    },
    gridRow: {
        justifyContent: 'flex-start', // 아이템들을 왼쪽부터 정렬
        width: screenWidth - 32, // 화면 너비 - 32 (양쪽 여백 16씩)
        alignSelf: 'center', // gridRow 자체를 중앙 정렬
    },
    // 그리드 아이템 스타일 (기존 itemContainer 수정)
    itemContainer: {
        width: itemWidth,  // 화면 크기에 맞게 동적 계산
        height: itemWidth, // 정사각형 유지
        borderRadius: 12, // 둥근 사각형
        backgroundColor: '#F0F0F0', // 피그마와 유사한 배경색
        alignItems: 'center',
        justifyContent: 'center', // 내용물(이미지, 텍스트) 중앙 정렬
        padding: 4,
        marginBottom: 12,
        marginHorizontal: 6, // 아이템 간 가로 간격
    },
    // --- 💡 활성 아이템 스타일 ---
    itemContainerActive: {
        backgroundColor: '#62A1FF', // 피그마의 활성 색상
        // 둥근 사각형이므로 borderWidth/borderColor는 필요 없음
    },
    itemImage: {
        width: 48,
        height: 48,
        backgroundColor: 'transparent',
        marginBottom: 4,
        resizeMode: 'contain',
    },
    itemName: {
        fontSize: 13,
        textAlign: 'center',
        color: '#333',
        width: '100%',
    },
    // --- 💡 활성 아이템 텍스트 스타일 ---
    itemNameActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    // --- 💡 추가하기 버튼 스타일 ---
    addButtonContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
        alignItems: 'center', // 버튼을 중앙 정렬
    },
    addButton: {
        backgroundColor: '#62A1FF', // 활성 (파란색)
        padding: 16,
        borderRadius: 12,
        width: screenWidth - 32, // 화면 너비 - 32 (양쪽 여백 16씩)
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#E0E0E0', // 비활성 (회색)
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});