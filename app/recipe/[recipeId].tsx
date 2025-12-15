import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Dimensions,
    ActivityIndicator,
    SafeAreaView,
    Alert,
    RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance';
import { RecipeIngredient, RecipeOrder, Comment } from '../../src/features/recipe/types';
import { formatRelativeTime } from '../../utils/date';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UnknownIcon from '@/assets/icons/unknown.svg';

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
        refetch,
    } = useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: async () => {
            const response = await axiosInstance.get(`/api/recipes/${recipeId}`);
            if (response.data.isSuccess) {
                // 디버깅: API 응답 확인
                console.log('=== Recipe Detail API Response ===');
                console.log('Author Info:', JSON.stringify(response.data.result.authorInfo, null, 2));
                return response.data.result;
            }
            throw new Error(response.data.message || '레시피를 불러오는 데 실패했습니다.');
        },
        enabled: !!recipeId,
        staleTime: 1000 * 60 * 10, // 10분간 fresh
        placeholderData: (previousData) => previousData, // 이전 데이터를 먼저 표시
        refetchOnMount: 'always', // 팔로잉 상태 최신화 위해 항상 재요청
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

    const followMutation = useMutation({
        mutationFn: async () => {
            const currentlyFollowing = !!recipe?.authorInfo?.following;
            const nickname = recipe?.authorInfo?.nickname;
            if (!nickname) {
                throw new Error('작성자 정보를 찾을 수 없습니다.');
            }
            const endpoint = `/api/members/${encodeURIComponent(nickname)}/following`;
            if (currentlyFollowing) {
                await axiosInstance.delete(endpoint);
            } else {
                await axiosInstance.post(endpoint);
            }
            return { nickname };
        },
        onMutate: async () => {
            // 1. 진행 중인 쿼리 취소 (레시피 상세, 내 프로필)
            await queryClient.cancelQueries({ queryKey: ['recipe', recipeId] });
            await queryClient.cancelQueries({ queryKey: ['profile'] });

            // 2. 이전 데이터 스냅샷 저장
            const previousRecipe = queryClient.getQueryData(['recipe', recipeId]);
            const previousProfile = queryClient.getQueryData(['profile']); // ✅ 내 프로필 데이터 스냅샷

            // 현재 팔로잉 상태 확인
            const isFollowing =
                (previousRecipe as any)?.authorInfo?.following ?? recipe?.authorInfo?.following ?? false;

            // 3. 레시피 데이터 Optimistic Update (팔로우 버튼 UI)
            queryClient.setQueryData(['recipe', recipeId], (old: any) => {
                const base = old || recipe;
                if (!base) return old;
                const nextFollowing = !base.authorInfo?.following;
                return {
                    ...base,
                    authorInfo: {
                        ...base.authorInfo,
                        following: nextFollowing,
                    },
                };
            });

            // 4. ✅ [핵심] 내 프로필 데이터 Optimistic Update (팔로잉 숫자 즉시 변경)
            if (previousProfile) {
                queryClient.setQueryData(['profile'], (oldProfile: any) => {
                    if (!oldProfile) return oldProfile;
                    // 팔로잉 중이었으면 -> 언팔로우(감소), 아니면 -> 팔로우(증가)
                    const newCount = isFollowing
                        ? (oldProfile.followingCount > 0 ? oldProfile.followingCount - 1 : 0)
                        : oldProfile.followingCount + 1;

                    return {
                        ...oldProfile,
                        followingCount: newCount,
                    };
                });
            }

            return { previousRecipe, previousProfile };
        },
        onError: (err: any, variables, context) => {
            // 에러 발생 시 롤백
            if (context?.previousRecipe) {
                queryClient.setQueryData(['recipe', recipeId], context.previousRecipe);
            }
            if (context?.previousProfile) {
                queryClient.setQueryData(['profile'], context.previousProfile); // ✅ 프로필 데이터 롤백
            }

            const errorMessage = err?.response?.data?.message || err?.message || '팔로우 처리에 실패했습니다.';
            Alert.alert('오류', errorMessage);
            console.error('Follow error:', err?.response?.data || err);
        },
        onSettled: () => {
            // 데이터 동기화를 위해 무효화
            queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
            queryClient.invalidateQueries({ queryKey: ['profile'] }); // ✅ 최신 데이터 다시 받아오기

            const nickname = recipe?.authorInfo?.nickname;
            if (nickname) {
                queryClient.invalidateQueries({ queryKey: ['memberRefrigeratorSummary', nickname] });
            }
            queryClient.invalidateQueries({ queryKey: ['followers'] });
            queryClient.invalidateQueries({ queryKey: ['followings'] });
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
        router.push(`recipe/comments/${recipeId}`);
    };

    // Pull-to-refresh 핸들러
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

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

    const navigateToAuthorRefrigerator = () => {
        const nickname = recipe?.authorInfo?.nickname;
        if (!nickname || recipe?.authorInfo?.myself || recipe?.writtenByMe) return;
        router.push(`/member/${encodeURIComponent(nickname)}/refrigerator`);
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
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                />
            )}
            style={styles.carouselContainer}
            ListEmptyComponent={
                <View style={styles.carouselImage} /> // 이미지가 없을 때 빈 영역
            }
        />
    );

    const handleFollowToggle = () => {
        if (!recipe?.authorInfo?.nickname || recipe?.authorInfo?.myself || recipe?.writtenByMe) {
            return;
        }
        followMutation.mutate();
    };

    const following = !!recipe?.authorInfo?.following;

    const renderAuthor = () => (
        <View style={styles.authorSection}>
            <TouchableOpacity style={styles.authorInfo} onPress={navigateToAuthorRefrigerator} activeOpacity={0.8}>
                {recipe?.authorInfo.profileImageUrl ? (
                    <Image
                        source={{ uri: recipe.authorInfo.profileImageUrl }}
                        style={styles.authorImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <View style={styles.authorImage}>
                        <UnknownIcon width={40} height={40} />
                    </View>
                )}
                <Text style={styles.authorName}>{recipe?.authorInfo.nickname}</Text>
            </TouchableOpacity>

            {!recipe?.authorInfo.myself && !recipe?.writtenByMe && (
                <TouchableOpacity
                    onPress={handleFollowToggle}
                    style={[
                        styles.followButton,
                        following && styles.followingButton,
                        followMutation.isPending && styles.followButtonDisabled,
                    ]}
                    disabled={followMutation.isPending}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[
                            styles.followButtonText,
                            following && styles.followingButtonText,
                        ]}
                    >
                        {following ? '언팔로잉' : '팔로잉'}
                    </Text>
                </TouchableOpacity>
            )}
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
                            contentFit="contain"
                            transition={200}
                            cachePolicy="memory-disk"
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
                            <Image
                                source={{ uri: step.imageUrl }}
                                style={styles.stepImage}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                        )}
                        <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                ))}
        </View>
    );

    const renderCommentsPreview = () => (
        <View style={styles.sectionContainer}>
            {/* 2-1. 헤더 View로 감싸기 */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    댓글 ({recipe?.commentPreview.totalCommentCount})
                </Text>
                {/* 2-2. 버튼을 헤더 View 안으로 이동 */}
                <TouchableOpacity onPress={navigateToComments}>
                    <Text style={styles.viewMoreComments}>전체보기</Text>
                </TouchableOpacity>
            </View>
            {recipe?.commentPreview.previewComments.map((comment: Comment, index: number) => (
                <View
                    key={comment.commentId}
                    // 2. 마지막 아이템인지 확인하고 스타일을 동적으로 적용합니다.
                    style={[
                        styles.commentItem,
                        index === recipe.commentPreview.previewComments.length - 1 && { marginBottom: 0 }
                    ]}
                >
                    {comment.authorInfo.profileImageUrl ? (
                        <Image
                            source={{ uri: comment.authorInfo.profileImageUrl }}
                            style={styles.commentAuthorImage}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View style={styles.commentAuthorImage}>
                            <UnknownIcon width={36} height={36} />
                        </View>
                    )}
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
        </View>
    );

    // --- 로딩/에러/메인 UI ---

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen
                options={{
                    title: '레시피',
                    headerTintColor: '#000',
                    headerBackTitle: '레시피 목록',
                }}
            />

            {isLoading && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FF6347" />
                </View>
            )}

            {error && (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error.message || '레시피를 불러오는 중 오류가 발생했습니다.'}</Text>
                </View>
            )}

            {!isLoading && !error && !recipe && (
                <View style={styles.center}>
                    <Text style={styles.errorText}>레시피를 찾을 수 없습니다.</Text>
                </View>
            )}

            {!isLoading && !error && recipe && (
                <>
                    <ScrollView
                        style={styles.container}
                        contentContainerStyle={styles.contentContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#FF6347"
                            />
                        }
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
                </>
            )}
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
        // flex: 1,
    },
    contentContainer: {
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
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
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
    followButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#1298FF',
        backgroundColor: '#fff',
    },
    followingButton: {
        backgroundColor: '#1298FF',
    },
    followButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1298FF',
    },
    followingButtonText: {
        color: '#fff',
    },
    followButtonDisabled: {
        opacity: 0.7,
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
        flex: 1,
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
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
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
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
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
