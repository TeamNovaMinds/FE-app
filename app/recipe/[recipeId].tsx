import React, { useState, useEffect, useCallback } from 'react';
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
    Alert, // 👈 [추가] '더보기' 및 '삭제' 확인에 사용
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance'; // axios 인스턴스 경로
import { RecipeData } from '../../src/features/recipe/types'; // 타입
import { formatRelativeTime } from '../../utils/date'; // 👈 [추가] 날짜 포맷팅 함수

const { width } = Dimensions.get('window');

export default function RecipeDetailScreen() {
    const { recipeId } = useLocalSearchParams();
    const router = useRouter();
    const navigation = useNavigation();
    const [recipe, setRecipe] = useState<RecipeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // --- 헬퍼 함수 ---

    // 👈 [추가] 2. '더보기' 옵션 관련 함수들
    const handleEdit = useCallback(() => {
        // '레시피 수정' 페이지로 이동 (경로는 예시입니다)
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
                            // API 명세에 따른 DELETE /recipes/{recipeId} 호출
                            await axiosInstance.delete(`api/recipes/${recipeId}`);
                            Alert.alert('삭제 완료', '레시피가 삭제되었습니다.');
                            // 삭제 후 이전 페이지로 이동
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
                    style: 'destructive', // iOS에서 빨간색으로 표시
                },
                {
                    text: '취소',
                    style: 'cancel',
                },
            ],
            { cancelable: true }, // 안드로이드에서 바깥쪽 터치로 닫기
        );
    }, [handleEdit, handleDelete]);

    // --- 데이터 로드 ---
    useEffect(() => {
        if (!recipeId) return;

        const fetchRecipe = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axiosInstance.get(`api/recipes/${recipeId}`);
                if (response.data.isSuccess) {
                    const data = response.data.result;
                    setRecipe(data);
                    setIsLiked(data.likedByMe);
                    setLikeCount(data.likeCount);
                } else {
                    setError(response.data.message);
                }
            } catch (e) {
                console.error(e);
                setError('레시피를 불러오는 데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecipe();
    }, [recipeId]);

    // --- 👈 [추가] 동적 헤더 설정 ---
    // recipe 데이터가 로드된 후, 내가 쓴 글(writtenByMe)인지 확인하여 '...' 버튼 표시
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
            // 내 글이 아니면 '더보기' 버튼 숨김
            navigation.setOptions({ headerRight: () => null });
        }
    }, [recipe, navigation, handleMoreOptions]); // recipe 상태가 변경될 때마다 실행

    // 👈 [수정] 1. 좋아요 API 연동
    const handleLike = async () => {
        if (!recipeId) return;

        // UI 즉시 업데이트 (Optimistic Update)
        const newLikedState = !isLiked;
        const newLikeCount = newLikedState ? likeCount + 1 : likeCount - 1;
        setIsLiked(newLikedState);
        setLikeCount(newLikeCount);

        try {
            // API 명세를 기반으로 POST 또는 DELETE 호출 (여기서는 POST로 가정)
            await axiosInstance.post(`api/recipes/${recipeId}/like`);
            // API 응답이 성공적이면 현재 상태 유지
        } catch (e) {
            // 실패 시 UI 롤백
            setIsLiked(!newLikedState);
            setLikeCount(newLikedState ? newLikeCount - 1 : newLikeCount + 1);
            Alert.alert('좋아요 처리에 실패했습니다.');
            console.error(e);
        }
    };

    // 👈 [추가] 3. 댓글 페이지 이동
    const navigateToComments = () => {
        // 댓글 페이지 경로는 예시입니다.
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
            {recipe?.recipeIngredientDTOs.map((item) => (
                <View key={item.ingredientId} style={styles.ingredientItem}>
                    <Text style={styles.ingredientName}>{item.description}</Text>
                    <Text style={styles.ingredientAmount}>{item.amount}</Text>
                </View>
            ))}
        </View>
    );

    const renderSteps = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>요리 순서</Text>
            {recipe?.recipeOrderDTOs
                .sort((a, b) => a.order - b.order)
                .map((step, index) => (
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
            {recipe?.commentPreview.previewComments.map((comment) => (
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
                <Text style={styles.errorText}>{error}</Text>
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
            {/* 1. 스크린 헤더 설정 (더보기 버튼은 useEffect에서 동적으로 설정됨) */}
            <Stack.Screen
                options={{
                    title: '레시피',
                    headerTintColor: '#000',
                    // 👈 [수정] headerRight는 useEffect에서 동적으로 설정하므로 여기서 제거
                }}
            />

            {/* 2. 메인 컨텐츠 (스크롤) */}
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

            {/* 3. 하단 고정 푸터 (좋아요/댓글) */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
                    <Ionicons
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={30}
                        color={isLiked ? '#FF6347' : '#555'}
                    />
                    <Text style={styles.likeCount}>{likeCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.commentInputContainer}
                    onPress={navigateToComments} // 👈 [수정] 3. 댓글 페이지 이동
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
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    ingredientName: {
        fontSize: 16,
        color: '#333',
    },
    ingredientAmount: {
        fontSize: 16,
        color: '#777',
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