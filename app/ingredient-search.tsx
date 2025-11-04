// app/ingredient-search.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Pressable,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView, // 1. ScrollView 임포트
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import debounce from 'lodash.debounce';

// 2. 제스처 핸들러와 리애니메이티드 임포트 (기존과 동일)
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';

// API 응답 타입 (기존과 동일)
interface IngredientDTO {
    id: number;
    name: string;
    category: string;
    imageUrl: string | null;
}

// 3. 카테고리 필터 데이터 추가 (두번째 이미지 참고)
// 💡 API 명세에 맞게 key 값을 조정해야 할 수 있습니다. (예: 'MEAT', 'VEGETABLE')
const CATEGORIES = [
    { key: 'ALL', name: '전체' },
    { key: 'VEGETABLE', name: '채소' },
    { key: 'FRUIT', name: '과일' },
    { key: 'MEAT', name: '육류' },
    { key: 'SEAFOOD', name: '수산물' },
    { key: 'DAIRY', name: '유제품' },
    { key: 'GRAIN', name: '곡물' },
    { key: 'SEASONING', name: '조미료' },
    { key: 'PROCESSED', name: '가공식품' },
    // ...필요시 API에 정의된 다른 카테고리 추가
];


export default function IngredientSearchScreen() {
    const router = useRouter();
    const { storageType } = useLocalSearchParams<{ storageType?: string; }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<IngredientDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 4. 활성 카테고리 상태 추가 (기본값 'ALL')
    const [activeCategory, setActiveCategory] = useState<string>('ALL');

    // 애니메이션/제스처 값 (기존과 동일)
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    // 5. 재료 검색 API 호출 수정 (category 파라미터 추가)
    const fetchIngredients = async (keyword: string, category: string) => {
        setIsLoading(true);
        try {
            const params: any = {
                keyword: keyword || undefined,
                // 'ALL'이 아니면 category 파라미터 추가
                category: category !== 'ALL' ? category : undefined,
            };

            const response = await axiosInstance.get('/api/ingredients', { params });
            if (response.data.isSuccess) {
                setResults(response.data.result.ingredients);
            }
        } catch (error) {
            console.error("재료 검색 에러:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 6. 디바운스 검색 함수 수정
    const debouncedSearch = useCallback(debounce(fetchIngredients, 300), []);

    // 7. 검색어/카테고리 변경 시 디바운스 검색 호출
    useEffect(() => {
        debouncedSearch(searchQuery, activeCategory);
    }, [searchQuery, activeCategory, debouncedSearch]);

    // 8. 마운트 시 '전체' 목록 로드
    useEffect(() => {
        fetchIngredients('', 'ALL');
    }, []);

    // 모달 닫기 함수 (기존과 동일)
    const closeModal = () => {
        Keyboard.dismiss();
        router.back();
    };

    const handleClose = () => {
        'worklet';
        runOnJS(closeModal)();
    };

    // 제스처 (기존과 동일)
    const panGesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            translateY.value = Math.max(0, context.value.y + event.translationY);
        })
        .onEnd(() => {
            if (translateY.value > 100) {
                handleClose();
            } else {
                translateY.value = withSpring(0, { damping: 15 });
            }
        });

    // 애니메이션 스타일 (기존과 동일)
    const animatedSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    // 재료 선택 (기존과 동일)
    const handleSelectIngredient = (item: IngredientDTO) => {
        const params = new URLSearchParams({
            name: item.name,
            ...(storageType && { storageType })
        });
        router.push(`/add-ingredient-form/${item.id}?${params.toString()}`);
    };

    // 9. 카테고리 필터 렌더링 함수
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
                    onPress={() => {
                        setActiveCategory(category.key);
                        // 카테고리 변경 시 useEffect가 알아서 API를 다시 호출
                    }}
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
                {/* 배경 터치 이벤트 전파 방지 */}
                <Pressable style={{ flex: 1 }}>
                    <SafeAreaView style={styles.safeArea}>
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
                                        onChangeText={setSearchQuery}
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <Ionicons name="close-circle" size={20} color="#888" style={styles.clearIcon} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>

                        {/* 10. 카테고리 필터 UI 렌더링 */}
                        {renderCategoryFilters()}

                        {/* 11. FlatList 수정: numColumns={4} 및 스타일 속성 추가 */}
                        {isLoading && results.length === 0 ? (
                            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={results}
                                keyExtractor={(item) => item.id.toString()}
                                keyboardShouldPersistTaps="handled"
                                style={{ flex: 1 }}
                                numColumns={4} // 4열 그리드
                                columnWrapperStyle={styles.gridRow} // 행 스타일
                                contentContainerStyle={styles.gridContainer} // 전체 컨테이너 패딩
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectIngredient(item)}>
                                        <Image
                                            source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/images/logo.png')}
                                            style={styles.itemImage}
                                        />
                                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text>검색 결과가 없습니다.</Text>
                                    </View>
                                }
                            />
                        )}
                    </SafeAreaView>
                </Pressable>
            </Animated.View>
        </Pressable>
    );
}

// 12. 스타일 시트 전체 수정
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0)', // 투명 배경
    },
    sheetContainer: {
        height: '60%', // 원하는 높이 (예: 60%)
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden', // 둥근 모서리 적용
    },
    safeArea: {
        flex: 1, // 시트 컨테이너 내부를 채움
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
        marginHorizontal: 16, // 좌우 마진
        marginBottom: 10, // 필터와의 간격
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
    },
    filterButtonActive: {
        backgroundColor: '#007AFF', // 활성 탭 색상 (원하는 색으로 변경)
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
        paddingHorizontal: 12, // 그리드 전체의 좌우 패딩
    },
    gridRow: {
        justifyContent: 'flex-start', // 아이템들을 왼쪽부터 정렬
        paddingHorizontal: 4,
    },
    // 그리드 아이템 스타일 (기존 itemContainer 수정)
    itemContainer: {
        width: 90,  // 아이템 너비
        height: 90, // 아이템 높이
        borderRadius: 12, // 둥근 사각형
        backgroundColor: '#F0F0F0', // 피그마와 유사한 배경색
        alignItems: 'center',
        justifyContent: 'center', // 내용물(이미지, 텍스트) 중앙 정렬
        padding: 4,
        marginBottom: 12,
        marginHorizontal: 6, // 아이템 간 가로 간격
    },
    // 그리드 아이템 이미지 (기존 itemImage 수정)
    itemImage: {
        width: 48, // 이미지 크기
        height: 48, // 이미지 크기
        // 2. borderRadius: 30 (원형) 제거
        backgroundColor: '#EEE', // 이미지 없을 때 배경
        marginBottom: 4, // 텍스트와의 간격
        resizeMode: 'contain', // 이미지가 잘리지 않게
    },
    // 그리드 아이템 텍스트 (기존 itemName 수정)
    itemName: {
        fontSize: 13,
        textAlign: 'center',
        color: '#333', // 텍스트 색상
        width: '100%', // 텍스트가 영역을 넘치지 않도록
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
});