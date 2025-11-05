import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    FlatList,
    Dimensions,
    ActivityIndicator,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance';
import { RecipeIngredient, RecipeOrder, Comment } from '../../src/features/recipe/types';
import { formatRelativeTime } from '../../utils/date';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { width } = Dimensions.get('window');

export default function RecipeDetailScreen() {
    const params = useLocalSearchParams();
    const recipeId = Array.isArray(params.recipeId) ? params.recipeId[0] : params.recipeId;
    const router = useRouter();
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    // React Query로 레시피 데이터 캐싱
    const {
        data: recipe,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: async () => {
            const response = await axiosInstance.get(`/api/recipes/${recipeId}`);
            if (response.data.isSuccess) {
                // 디버깅: API 응답 확인
                console.log('=== Recipe Detail API Response ===');
                console.log('Recipe Ingredients:', JSON.stringify(response.data.result.recipeIngredientDTOs, null, 2));
                return response.data.result;
            }
            throw new Error(response.data.message || '레시피를 불러오는 데 실패했습니다.');
        },
        enabled: !!recipeId,
        staleTime: 1000 * 60 * 10, // 10분간 fresh
        placeholderData: (previousData) => previousData, // 이전 데이터를 먼저 표시
    });

    // useMutation으로 좋아요 기능 구현
    const likeMutation = useMutation({
        mutationFn: async () => {
            await axiosInstance.post(`/api/recipes/${recipeId}/like`);
        },
        onMutate: async () => {
            // Optimistic Update: 서버 응답 전에 UI 즉시 업데이트
            await queryClient.cancelQueries({ queryKey: ['recipe', recipeId] });

            const previousRecipe = queryClient.getQueryData(['recipe', recipeId]);

            queryClient.setQueryData(['recipe', recipeId], (old: any) => {
                if (!old) return old;
                const newLikedState = !old.likedByMe;
                return {
                    ...old,
                    likedByMe: newLikedState,
                    likeCount: newLikedState ? old.likeCount + 1 : old.likeCount - 1,
                };
            });

            return { previousRecipe };
        },
        onError: (err: any, variables, context) => {
            // 실패 시 이전 상태로 롤백
            if (context?.previousRecipe) {
                queryClient.setQueryData(['recipe', recipeId], context.previousRecipe);
            }
            const errorMessage = err?.response?.data?.message || err?.message || '좋아요 처리에 실패했습니다.';
            Alert.alert('오류', errorMessage);
            console.error('Like error:', err?.response?.data || err);
        },
        onSettled: () => {
            // 성공/실패와 관계없이 쿼리 무효화하여 최신 데이터 가져오기
            queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
            // 목록 화면도 업데이트되도록 레시피 목록 쿼리 무효화
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
        },
    });

    const handleLike = () => {
        if (!recipeId) return;
        likeMutation.mutate();
    };

    // --- 헬퍼 함수 ---

    const handleEdit = useCallback(() => {
        router.push(`api/recipe/${recipeId}`);
    }, [router, recipeId]);

    const handleDelete = useCallback(() => {
        Alert.alert(
            '삭제 확인',
            '정말로 이 레시피를 삭제하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axiosInstance.delete(`/api/recipes/${recipeId}`);
                            Alert.alert('삭제 완료', '레시피가 삭제되었습니다.');
                            router.back();
                        } catch (e) {
                            Alert.alert('삭제 실패', '레시피 삭제에 실패했습니다.');
                            console.error(e);
                        }
                    },
                },
            ],
            { cancelable: true },
        );
    }, [router, recipeId]);

    const handleMoreOptions = useCallback(() => {
        Alert.alert(
            '레시피 옵션',
            '원하는 작업을 선택하세요.',
            [
                {
                    text: '수정하기',
                    onPress: handleEdit,
                },
                {
                    text: '삭제하기',
                    onPress: handleDelete,
                    style: 'destructive',
                },
                {
                    text: '취소',
                    style: 'cancel',
                },
            ],
            { cancelable: true },
        );
    }, [handleEdit, handleDelete]);

    // 동적 헤더 설정
    useEffect(() => {
        if (recipe?.writtenByMe) {
            navigation.setOptions({
                headerRight: () => (
                    <TouchableOpacity onPress={handleMoreOptions}>
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={24}
                            color="black"
                            style={{ marginRight: 15 }}
                        />
                    </TouchableOpacity>
                ),
            });
        } else {
            navigation.setOptions({ headerRight: () => null });
        }
    }, [recipe, navigation, handleMoreOptions]);

    const navigateToComments = () => {
        router.push(`api/recipe/comments/${recipeId}`);
    };

    // (기존) 난이도/카테고리 텍스트 변환
    const formatDifficulty = (difficulty: 'EASY' | 'MEDIUM' | 'HARD') => {
        switch (difficulty) {
            case 'EASY':
                return '쉬움';
            case 'MEDIUM':
                return '중간';
            case 'HARD':
                return '어려움';
            default:
                return difficulty;
        }
    };
    const formatCategory = (
        category: 'KOREAN' | 'WESTERN' | 'CHINESE' | 'JAPANESE' | 'OTHER',
    ) => {
        switch (category) {
            case 'KOREAN':
                return '한식';
            case 'WESTERN':
                return '양식';
            case 'CHINESE':
                return '중식';
            case 'JAPANESE':
                return '일식';
            case 'OTHER':
                return '기타';
            default:
                return category;
        }
    };

    // --- 렌더링 함수 (디자인 시안 기반) ---

    const renderImageCarousel = () => (
        <FlatList
            data={recipe?.recipeImageDTOs}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.imageUrl}-${index}`}
            renderItem={({ item }) => (
                <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                />
            )}
            style={styles.carouselContainer}
            ListEmptyComponent={
                <View style={styles.carouselImage} /> // 이미지가 없을 때 빈 영역
            }
        />
    );

    const renderAuthor = () => (
        <View style={styles.authorSection}>
            <Image
                source={{
                    uri:
                        recipe?.authorInfo.profileImageUrl ||
                        'https://via.placeholder.com/40',
                }}
                style={styles.authorImage}
            />
            <Text style={styles.authorName}>{recipe?.authorInfo.nickname}</Text>
        </View>
    );

    const renderRecipeInfo = () => (
        <View style={styles.infoContainer}>
            <Text style={styles.title}>{recipe?.title}</Text>
            <Text style={styles.description}>{recipe?.description}</Text>
            <View style={styles.infoBar}>
                <View style={styles.infoItem}>
                    <Ionicons name="fast-food-outline" size={20} color="#555" />
                    <Text style={styles.infoText}>
                        {formatCategory(recipe?.recipeCategory!)}
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={20} color="#555" />
                    <Text style={styles.infoText}>{recipe?.cookingTimeMinutes}분</Text>
                </View>
                <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="chef-hat" size={20} color="#555" />
                    <Text style={styles.infoText}>
                        {formatDifficulty(recipe?.difficulty!)}
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="person-outline" size={20} color="#555" />
                    <Text style={styles.infoText}>{recipe?.servings}인분</Text>
                </View>
            </View>
        </View>
    );

    const renderIngredients = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>재료</Text>
            {recipe?.recipeIngredientDTOs.map((item: RecipeIngredient, index: number) => (
                <View key={`ingredient-${item.ingredientId}-${index}`} style={styles.ingredientItem}>
                    {/* 재료 이미지 */}
                    {item.imageUrl && (
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.ingredientImage}
                        />
                    )}
                    <View style={styles.ingredientTextContainer}>
                        {/* 재료 이름 (있으면 이름 표시, 없으면 description 사용) */}
                        <Text style={styles.ingredientName}>
                            {item.name || item.description}
                        </Text>
                        {/* description이 name과 다르면 보조 설명으로 표시 */}
                        {item.name && item.description && item.name !== item.description && (
                            <Text style={styles.ingredientDescription}>{item.description}</Text>
                        )}
                    </View>
                    <Text style={styles.ingredientAmount}>{item.amount}</Text>
                </View>
            ))}
        </View>
    );

    const renderSteps = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>요리 순서</Text>
            {recipe?.recipeOrderDTOs
                .sort((a: RecipeOrder, b: RecipeOrder) => a.order - b.order)
                .map((step: RecipeOrder, index: number) => (
                    <View key={step.order} style={styles.stepItem}>
                        <Text style={styles.stepOrder}>Step {index + 1}</Text>
                        {step.imageUrl && (
                            <Image source={{ uri: step.imageUrl }} style={styles.stepImage} />
                        )}
                        <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                ))}
        </View>
    );

    const renderCommentsPreview = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
                댓글 ({recipe?.commentPreview.totalCommentCount})
            </Text>
            {recipe?.commentPreview.previewComments.map((comment: Comment) => (
                <View key={comment.commentId} style={styles.commentItem}>
                    <Image
                        source={{
                            uri:
                                comment.authorInfo.profileImageUrl ||
                                'https://via.placeholder.com/36',
                        }}
                        style={styles.commentAuthorImage}
                    />
                    <View style={styles.commentContent}>
                        <Text style={styles.commentAuthorName}>
                            {comment.authorInfo.nickname}
                        </Text>
                        <Text style={styles.commentText}>{comment.content}</Text>

                        {/* 👈 [수정] 4. 날짜 포맷팅 적용 */}
                        <Text style={styles.commentDate}>
                            {formatRelativeTime(comment.createdAt)}
                        </Text>
                    </View>
                </View>
            ))}
            <TouchableOpacity onPress={navigateToComments}>
                {/* 👈 [수정] 3. 댓글 페이지 이동 */}
                <Text style={styles.viewMoreComments}>댓글 전체보기</Text>
            </TouchableOpacity>
        </View>
    );

    // --- 로딩/에러/메인 UI ---

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF6347" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error.message || '레시피를 불러오는 중 오류가 발생했습니다.'}</Text>
            </View>
        );
    }

    if (!recipe) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>레시피를 찾을 수 없습니다.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen
                options={{
                    title: '레시피',
                    headerTintColor: '#000',
                }}
            />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                {renderImageCarousel()}
                <View style={styles.recipeContent}>
                    {renderAuthor()}
                    {renderRecipeInfo()}
                    <View style={styles.divider} />
                    {renderIngredients()}
                    <View style={styles.divider} />
                    {renderSteps()}
                    <View style={styles.divider} />
                    {renderCommentsPreview()}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
                    <Ionicons
                        name={recipe?.likedByMe ? 'heart' : 'heart-outline'}
                        size={30}
                        color={recipe?.likedByMe ? '#FF6347' : '#555'}
                    />
                    <Text style={styles.likeCount}>{recipe?.likeCount || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.commentInputContainer}
                    onPress={navigateToComments}
                >
                    <Text style={styles.commentInputText}>댓글을 남겨주세요...</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// --- 스타일시트 (변경 없음) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 100, // 하단 고정 푸터 공간 확보
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
    },
    carouselContainer: {
        height: width * 0.8,
        backgroundColor: '#eee',
    },
    carouselImage: {
        width: width,
        height: width * 0.8,
    },
    recipeContent: {
        padding: 16,
    },
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#eee',
    },
    authorName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#555',
        marginBottom: 16,
    },
    infoBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        paddingVertical: 12,
    },
    infoItem: {
        alignItems: 'center',
        width: 60,
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        marginTop: 4,
    },
    divider: {
        height: 8,
        backgroundColor: '#F0F0F0',
        marginHorizontal: -16,
        marginVertical: 16,
    },
    sectionContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    ingredientImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#f0f0f0',
    },
    ingredientTextContainer: {
        flex: 1,
        marginRight: 8,
    },
    ingredientName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    ingredientDescription: {
        fontSize: 14,
        color: '#777',
        marginTop: 2,
    },
    ingredientAmount: {
        fontSize: 16,
        color: '#777',
        fontWeight: '500',
    },
    stepItem: {
        marginBottom: 24,
    },
    stepOrder: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF6347',
        marginBottom: 8,
    },
    stepImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        resizeMode: 'cover',
        marginBottom: 8,
        backgroundColor: '#eee',
    },
    stepDescription: {
        fontSize: 16,
        lineHeight: 24,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    commentAuthorImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        backgroundColor: '#eee',
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        padding: 12,
    },
    commentAuthorName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    commentText: {
        fontSize: 14,
        color: '#333',
    },
    commentDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    viewMoreComments: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#777',
        textAlign: 'center',
        marginTop: 10,
        paddingVertical: 8,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingBottom: 24,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    likeCount: {
        fontSize: 16,
        marginLeft: 6,
        color: '#555',
        fontWeight: '600',
    },
    commentInputContainer: {
        flex: 1,
        height: 44,
        backgroundColor: '#F0F0F0',
        borderRadius: 22,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    commentInputText: {
        fontSize: 16,
        color: '#999',
    },
});