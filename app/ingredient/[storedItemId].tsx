import React from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    Image, FlatList, ActivityIndicator, ScrollView, Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useQuery, InfiniteData } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';

// 관련 타입 및 컴포넌트 임포트
import { StoredIngredient, StoredIngredientResponse } from '@/src/features/home/types';
import { ApiSuccessResponse, SuggestedRecipeListResponse } from '@/src/features/ingredient/types';
import { RecipeCardSmall } from '@/src/features/ingredient/components/RecipeCardSmall';
import { IngredientGridItem } from '@/src/features/home/components/IngredientGridItem';

type StorageType = "REFRIGERATOR" | "FREEZER" | "ROOM_TEMPERATURE";

// ✅ home.tsx에서 params로 넘어오는 모든 StoredIngredient의 필드는 string입니다.
type StoredIngredientParams = {
    [K in keyof StoredIngredient]: string;
};

// API: 추천 레시피 (무한 스크롤)
const fetchSuggestedRecipes = async ({ pageParam, storedItemId, storageType }: {
    pageParam: number | null,
    storedItemId: number,
    storageType: StorageType
}) => {
    const response = await axiosInstance.get<ApiSuccessResponse<SuggestedRecipeListResponse>>(
        '/api/recipes/suggest',
        {
            params: {
                storageType: storageType,
                storedItemId: storedItemId,
                cursorId: pageParam,
            }
        }
    );
    if (!response.data.isSuccess) {
        throw new Error(response.data.message || '추천 레시피 로드 실패');
    }
    return response.data.result;
};

// API: 나의 다른 재료들
const fetchOtherIngredients = async (storageType: StorageType, currentItemId: number) => {
    const response = await axiosInstance.get<StoredIngredientResponse>(
        '/api/refrigerators/stored-items',
        { params: { storageType } }
    );
    if (response.data.isSuccess) {
        // 현재 재료를 제외한 나머지 재료들만 필터링
        return response.data.result.storedIngredients.filter(
            (item) => item.id !== currentItemId
        );
    }
    throw new Error(response.data.message || '다른 재료 로드 실패');
};

export default function IngredientDetailScreen() {
    const router = useRouter();

    // 1. home.tsx에서 전달받은 파라미터 (string 타입으로 받음)
    const params = useLocalSearchParams<StoredIngredientParams>();

    // 2. 파라미터를 StoredIngredient 타입에 맞게 수동으로 변환합니다.
    const item: StoredIngredient = {
        id: Number(params.id),
        ingredientId: Number(params.ingredientId),
        ingredientName: params.ingredientName,
        imageUrl: params.imageUrl === 'null' ? null : params.imageUrl,
        quantity: Number(params.quantity),
        storageType: params.storageType,
        expirationDate: params.expirationDate,
        version: Number(params.version),
        dday: params.dday,
    };

    const storedItemId = item.id;
    const storageType = item.storageType as StorageType;

    // Gesture 애니메이션 설정
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    // 3. 데이터 페칭 (React Query)
    const {
        data: suggestedData,
        fetchNextPage,
        hasNextPage,
        isLoading: isRecipeLoading,
        isFetchingNextPage,
        error: recipeError,
    } = useInfiniteQuery<
        SuggestedRecipeListResponse,
        Error,
        InfiniteData<SuggestedRecipeListResponse>,
        (string | number)[],
        number | null
    >({
        queryKey: ['suggestedRecipes', storedItemId],
        queryFn: ({ pageParam }) => fetchSuggestedRecipes({
            pageParam: pageParam,
            storedItemId: storedItemId,
            storageType: storageType
        }),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const {
        data: otherIngredients,
        isLoading: isOtherIngredientsLoading,
        error: otherIngredientsError,
    } = useQuery<StoredIngredient[], Error>({
        queryKey: ['otherIngredients', storageType, storedItemId],
        queryFn: () => fetchOtherIngredients(storageType, storedItemId),
    });

    // 4. 렌더링을 위한 데이터 가공
    const allRecipes = suggestedData?.pages.flatMap((page: SuggestedRecipeListResponse) =>
        page.recipes.flatMap(group => group.recipes)
    ) ?? [];

    // 5. 모달 닫기
    const closeModal = () => {
        router.back();
    };

    const handleClose = () => {
        'worklet';
        runOnJS(closeModal)();
    };

    // 6. 제스처 설정 (ingredient-search와 동일)
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

    const animatedSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    // 7. 메인 UI 렌더링
    return (
        <Pressable style={styles.backdrop} onPress={handleClose}>
            <Animated.View style={[styles.sheetContainer, animatedSheetStyle]}>
                <Pressable style={{ flex: 1 }}>
                    <SafeAreaView style={styles.safeArea}>
                        {/* Grabber (drag handle) */}
                        <GestureDetector gesture={panGesture}>
                            <View style={styles.grabberContainer}>
                                <View style={styles.grabber} />
                            </View>
                        </GestureDetector>

                        {/* 헤더 */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                <Ionicons name="close" size={28} color="#000" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>재료 상세</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <ScrollView style={styles.container}>
                            {/* 재료 상세 정보 */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>재료 정보</Text>
                                <View style={styles.detailCard}>
                                    <Image
                                        source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/logo.png')}
                                        style={styles.detailImage}
                                    />
                                    <View style={styles.detailTextContainer}>
                                        <Text style={styles.detailName}>{item.ingredientName}</Text>
                                        <Text style={styles.detailExpiry}>유통기한: {item.expirationDate || 'N/A'}</Text>
                                        <Text style={styles.detailDday}>D-day: {item.dday}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* 추천 레시피 */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>이 재료로 만들 수 있는 레시피</Text>
                                {isRecipeLoading && allRecipes.length === 0 ? (
                                    <ActivityIndicator style={styles.listLoader} />
                                ) : recipeError ? (
                                    <Text style={styles.errorText}>레시피 로드 실패: {recipeError.message}</Text>
                                ) : (
                                    <FlatList
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        data={allRecipes}
                                        renderItem={({ item }) => <RecipeCardSmall item={item} />}
                                        keyExtractor={(item) => item.recipeId.toString()}
                                        onEndReached={() => {
                                            if (hasNextPage) fetchNextPage();
                                        }}
                                        onEndReachedThreshold={0.5}
                                        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginHorizontal: 20 }} /> : null}
                                        contentContainerStyle={{ paddingHorizontal: 16 }}
                                    />
                                )}
                            </View>

                            {/* 나의 다른 재료들 */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>나의 다른 재료들</Text>
                                {isOtherIngredientsLoading ? (
                                    <ActivityIndicator style={styles.listLoader} />
                                ) : otherIngredientsError ? (
                                    <Text style={styles.errorText}>다른 재료 로드 실패</Text>
                                ) : (
                                    <FlatList
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        data={otherIngredients}
                                        renderItem={({ item }) => (
                                            <IngredientGridItem
                                                item={item}
                                                onPress={(selectedItem) => router.replace({
                                                    pathname: `/ingredient/${selectedItem.id}`,
                                                    params: { ...selectedItem, storedItemId: selectedItem.id.toString() }
                                                })}
                                            />
                                        )}
                                        keyExtractor={(item) => item.id.toString()}
                                        ListEmptyComponent={<Text style={styles.emptyText}>다른 재료가 없습니다.</Text>}
                                        contentContainerStyle={{ paddingHorizontal: 16 }}
                                    />
                                )}
                            </View>

                        </ScrollView>
                    </SafeAreaView>
                </Pressable>
            </Animated.View>
        </Pressable>
    );
}

// 스타일 (ingredient-search와 유사하게)
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    sheetContainer: {
        height: '85%', // 화면의 85% 높이
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    container: {
        flex: 1,
        backgroundColor: '#F4F6F8',
    },
    sectionContainer: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        marginHorizontal: 16,
    },
    detailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    detailImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    detailTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    detailName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    detailExpiry: {
        fontSize: 14,
        color: '#555',
        marginBottom: 2,
    },
    detailDday: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    listLoader: {
        height: 150,
        justifyContent: 'center',
    },
    errorText: {
        color: 'red',
        padding: 16,
        textAlign: 'center',
    },
    emptyText: {
        color: '#888',
        paddingVertical: 50,
        paddingHorizontal: 16,
        textAlign: 'center'
    }
});