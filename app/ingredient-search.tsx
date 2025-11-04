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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import debounce from 'lodash.debounce';

// ✅ 2. 제스처 핸들러와 리애니메이티드 임포트
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';

// API 응답 타입 (제공해주신 정보 기반)
interface IngredientDTO {
    id: number;
    name: string;
    category: string;
    imageUrl: string | null;
}

export default function IngredientSearchScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<IngredientDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ 3. 애니메이션과 제스처를 위한 값 추가
    const translateY = useSharedValue(0); // 시트의 Y축 위치
    const context = useSharedValue({ y: 0 }); // 제스처 시작 위치

    // 재료 검색 API 호출
    const fetchIngredients = async (keyword: string) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/api/ingredients', {
                params: { keyword: keyword || undefined },
            });
            if (response.data.isSuccess) {
                setResults(response.data.result.ingredients);
            }
        } catch (error) {
            console.error("재료 검색 에러:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 디바운스 적용된 검색 함수
    const debouncedSearch = useCallback(debounce(fetchIngredients, 300), []);

    // 검색어가 변경될 때마다 디바운스 검색 호출
    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    // 마운트 시 전체 목록 로드
    useEffect(() => {
        fetchIngredients('');
    }, []);

    // ✅ 4. 모달 닫기 함수 (키보드도 함께 내리기)
    const closeModal = () => {
        Keyboard.dismiss();
        router.back();
    };

    const handleClose = () => {
        'worklet';
        runOnJS(closeModal)();
    };

    // ✅ 5. 아래로 스와이프하는 제스처 정의
    const panGesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            // 위로 스크롤(음수)하는 것은 막고, 아래로(양수)만 드래그되도록 함
            translateY.value = Math.max(0, context.value.y + event.translationY);
        })
        .onEnd(() => {
            // 100픽셀 이상 끌어내렸으면 닫기
            if (translateY.value > 100) {
                handleClose(); // ✅ 닫기 함수 호출
            } else {
                // 100픽셀 미만이면 제자리로 부드럽게 복귀
                translateY.value = withSpring(0, { damping: 15 });
            }
        });

    // ✅ 6. 시트에 적용할 애니메이션 스타일
    const animatedSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    // 아이템 선택 시 다음 폼 화면으로 이동
    const handleSelectIngredient = (item: IngredientDTO) => {
        // [ingredientId].tsx 파일로 id와 name을 파라미터로 넘겨주며 이동
        router.push(`/add-ingredient-form/${item.id}?name=${encodeURIComponent(item.name)}`);
    };

    return (
        // 배경 (클릭 시 닫힘)
        <Pressable style={styles.backdrop} onPress={handleClose}>
            {/* 시트 컨테이너 (애니메이션 적용) */}
            <Animated.View style={[styles.sheetContainer, animatedSheetStyle]}>
                {/* 배경 터치 이벤트 전파 방지 */}
                <Pressable style={{ flex: 1 }}>
                    <SafeAreaView style={styles.safeArea}>
                        {/* 손잡이 영역에만 제스처 적용 */}
                        <GestureDetector gesture={panGesture}>
                            <View style={styles.grabberContainer}>
                                <View style={styles.grabber} />
                            </View>
                        </GestureDetector>

                        {/* 검색창 */}
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

                        {/* 결과 목록 */}
                        {isLoading && results.length === 0 ? (
                            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={results}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectIngredient(item)}>
                                        <Image
                                            source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/images/logo.png')}
                                            style={styles.itemImage}
                                        />
                                        <Text style={styles.itemName}>{item.name}</Text>
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

// 6. 스타일 전체 수정
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
        margin: 16,
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
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 16,
        backgroundColor: '#EEE',
    },
    itemName: {
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
});