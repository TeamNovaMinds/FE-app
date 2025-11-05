import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ScrollView,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
    ActivityIndicator,
    ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

// --- 타입 정의 (API 응답과 일치) ---
interface AuthorInfo {
    nickname: string;
    profileImageUrl: string | null;
}

interface Recipe {
    recipeId: number;
    title: string;
    mainImageUrl: string | null;
    authorInfo: AuthorInfo;
    cookingTimeMinutes: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
    servings: number;
    likeCount: number;
    commentCount: number;
    likedByMe: boolean;
    // writtenByMe: boolean;
    // createdAt: string;
}

type RecipeListItem = Recipe | { isEmpty: true; recipeId: string };

// --- 상수 정의 ---
const BANNERS: string[] = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=2881&auto.format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2960&auto.format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=2880&auto.format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D',
];

const FILTERS: string[] = ['최신순', '좋아요순', '한식', '중식', '일식', '양식', '아시안', '디저트', '베이커리', '간식', '음료/술'];
const SORT_MAP: { [key: string]: string } = { '최신순': 'LATEST', '좋아요순': 'LIKES' };
const CATEGORY_MAP: { [key: string]: string } = { '한식': 'KOREAN', '중식': 'CHINESE', '일식': 'JAPANESE', '양식': 'WESTERN', '아시안': 'ASIAN', '디저트': 'DESSERT', '베이커리': 'BAKERY', '간식': 'SNACK', '음료/술': 'DRINK' };

const { width: screenWidth } = Dimensions.get('window');

// --- 헬퍼 함수 ---
// 난이도 텍스트 변환
const formatDifficulty = (difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string) => {
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

// --- ⬇️ [수정] 레시피 카드 컴포넌트 (새 레이아웃) ---
const RecipeCard: React.FC<{ item: RecipeListItem }> = ({ item }) => {
    if ('isEmpty' in item) {
        return <View style={[styles.cardContainer, styles.emptyCard]} />;
    }

    return (
        <Link href={`/recipe/${item.recipeId}`} asChild>
            <TouchableOpacity style={styles.cardContainer}>
                {/* 1. 이미지 및 오버레이 */}
                <ImageBackground
                    source={item.mainImageUrl ? { uri: item.mainImageUrl } : require('../../assets/images/JustFridge_logo.png')}
                    style={styles.cardImage}
                    resizeMode="cover"
                >
                    <View style={styles.cardOverlay}>
                        {/* 1-1. 좋아요 */}
                        <View style={styles.overlayIconContainer}>
                            <Ionicons
                                name={item.likedByMe ? "heart" : "heart-outline"}
                                size={16}
                                color={item.likedByMe ? "#FF6347" : "#FFFFFF"}
                            />
                            <Text style={styles.overlayText}>{item.likeCount.toLocaleString()}</Text>
                        </View>
                        {/* 1-2. 댓글 수 */}
                        <View style={styles.overlayIconContainer}>
                            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.overlayText}>{item.commentCount.toLocaleString()}</Text>
                        </View>
                    </View>
                </ImageBackground>

                {/* 2. 하단 정보 (제목 + 작성자 + 추가 정보) */}
                <View style={styles.cardInfoContainer}>
                    {/* 2-1. 제목 */}
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>

                    {/* 2-2. 작성자 정보 */}
                    <View style={styles.authorContainer}>
                        <Image
                            source={item.authorInfo.profileImageUrl ? { uri: item.authorInfo.profileImageUrl } : require('../../assets/images/JustFridge_logo.png')}
                            style={styles.authorImage}
                        />
                        <Text style={styles.authorName} numberOfLines={1}>{item.authorInfo.nickname}</Text>
                    </View>

                    {/* 2-3. ⬇️ [수정] 인분/시간/난이도 (별도 라인) */}
                    <Text style={styles.cardDetailText}>{item.servings}인분 기준</Text>
                    <Text style={styles.cardDetailText}>평균 조리시간 {item.cookingTimeMinutes}분</Text>
                    <Text style={styles.cardDetailText}>조리 난이도 {formatDifficulty(item.difficulty)}</Text>
                </View>
            </TouchableOpacity>
        </Link>
    );
};
// --- ⬆️ 레시피 카드 컴포넌트 끝 ---


// --- 레시피 페이지 메인 컴포넌트 (변경 없음) ---
export default function RecipeScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('최신순');
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);

    const flatListRef = useRef<FlatList<RecipeListItem>>(null);

    const queryParams = useMemo(() => {
        const params: any = { keyword: submittedQuery || undefined, size: 20 };
        if (CATEGORY_MAP[activeFilter]) {
            params.category = CATEGORY_MAP[activeFilter];
            params.sortBy = 'LATEST';
        } else {
            params.sortBy = SORT_MAP[activeFilter] || 'LATEST';
        }
        return params;
    }, [activeFilter, submittedQuery]);

    const {
        data: fetchedRecipes = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['recipes', queryParams],
        queryFn: async () => {
            const response = await axiosInstance.get('/api/recipes', { params: queryParams });
            if (response.data.isSuccess) {
                return response.data.result.recipes || [];
            }
            throw new Error(response.data.message || '레시피를 불러오는데 실패했습니다.');
        },
        staleTime: 1000 * 60 * 5,
        placeholderData: (previousData) => previousData,
    });

    const recipes = useMemo(() => {
        if (fetchedRecipes.length % 2 === 1) {
            return [...fetchedRecipes, { isEmpty: true, recipeId: 'empty' }] as RecipeListItem[];
        }
        return fetchedRecipes as RecipeListItem[];
    }, [fetchedRecipes]);

    const onRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const handleSearch = () => setSubmittedQuery(searchQuery);
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / screenWidth);
        setActiveBannerIndex(index);
    };

    const renderHeader = () => (
        <View>
            <ImageBackground
                source={require('../../assets/images/banner_recipe.png')}
                style={styles.topBanner}
                resizeMode="cover"
            >
                <Text style={styles.topBannerText}>유통기한 잘 확인하셨나요?</Text>
            </ImageBackground>
            <View style={styles.carouselContainer}>
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16}>
                    {BANNERS.map((uri, index) => (
                        <View key={index} style={styles.bannerWrapper}>
                            <Image source={{ uri }} style={styles.bannerImage} />
                            <View style={styles.bannerTextContainer}>
                                <Text style={styles.bannerTitle}>저당 디저트 레시피</Text>
                                <Text style={styles.bannerSubtitle}>오늘의 인기메뉴!</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
                <View style={styles.pagination}>
                    {BANNERS.map((_, index) => <View key={index} style={[styles.paginationDot, index === activeBannerIndex && styles.paginationDotActive]} />)}
                </View>
            </View>
            <View style={styles.searchContainer}>
                <TextInput style={styles.searchInput} placeholder="요리 이름을 검색해보세요" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} returnKeyType="search" />
                <TouchableOpacity onPress={handleSearch}><Ionicons name="search" size={20} color="#888" style={styles.searchIcon} /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                {FILTERS.map((filter) => (
                    <TouchableOpacity key={filter} style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]} onPress={() => setActiveFilter(filter)}>
                        <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderListEmptyComponent = () => {
        if (isLoading) return <ActivityIndicator size="large" color="#89FFF1" style={{ marginTop: 50 }} />;
        if (error) return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error.message || '레시피를 불러오는 중 오류가 발생했습니다.'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}><Text style={styles.retryButtonText}>다시 시도</Text></TouchableOpacity>
            </View>
        );
        return <View style={styles.emptyContainer}><Text>표시할 레시피가 없어요.</Text></View>;
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ref={flatListRef}
                ListHeaderComponent={renderHeader}
                data={recipes}
                renderItem={({ item }) => <RecipeCard item={item} />}
                keyExtractor={(item) => item.recipeId.toString()}
                numColumns={2}
                contentContainerStyle={styles.listContentContainer}
                columnWrapperStyle={styles.row}
                ListEmptyComponent={renderListEmptyComponent}
                onRefresh={onRefresh}
                refreshing={isLoading}
            />
            <Link href="/recipe/create" asChild>
                <TouchableOpacity style={styles.fab}>
                    <Image
                        source={require('../../assets/icons/plus.png')}
                        style={styles.fabIcon}
                    />
                    <Text style={styles.fabText}>레시피 등록</Text>
                </TouchableOpacity>
            </Link>
        </SafeAreaView>
    );
}

// --- ⬇️ [수정] 스타일시트 (카드 디자인 변경) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    // ... (헤더 스타일은 변경 없음) ...
    topBanner: { height:60, padding: 16, alignItems: 'flex-start', justifyContent: 'center', },
    topBannerText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF',textShadowColor: 'rgba(0, 0, 0, 0.5)',textShadowOffset: { width: 1, height: 1 },textShadowRadius: 2, },
    carouselContainer: { height: 200 },
    bannerWrapper: { width: screenWidth, height: '100%' },
    bannerImage: { width: '100%', height: '100%', position: 'absolute' },
    bannerTextContainer: { flex: 1, justifyContent: 'center', paddingLeft: 20, backgroundColor: 'rgba(0,0,0,0.2)' },
    bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
    bannerSubtitle: { fontSize: 18, color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
    pagination: { flexDirection: 'row', position: 'absolute', bottom: 10, alignSelf: 'center' },
    paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', opacity: 0.5, margin: 3 },
    paginationDotActive: { opacity: 1 },
    searchContainer: { margin: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 25, paddingHorizontal: 15 },
    searchInput: { flex: 1, height: 50, fontSize: 16 },
    searchIcon: { marginLeft: 10 },
    filterContainer: { paddingHorizontal: 16, marginBottom: 16 },
    filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
    activeFilterButton: { backgroundColor: '#2D303A' },
    filterText: { fontSize: 14, color: '#555' },
    activeFilterText: { color: '#fff', fontWeight: 'bold' },
    listContentContainer: {
        flexGrow: 1,
        paddingBottom: 150,
    },
    row: { justifyContent: 'space-between', paddingHorizontal: 8,},

    // --- 카드 스타일 ---
    cardContainer: {
        flex: 1,
        margin: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },
    emptyCard: {
        backgroundColor: 'transparent',
        elevation: 0,
        shadowOpacity: 0,
        borderWidth: 0,
    },
    cardImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#eee',
        borderTopLeftRadius: 11,
        borderTopRightRadius: 11,
        overflow: 'hidden',
        justifyContent: 'flex-start',
    },
    cardOverlay: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    overlayIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    overlayText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    cardInfoContainer: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8, // ⬅️ [수정] 제목-작성자 간격
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12, // ⬅️ [수정] 작성자-상세정보 간격
    },
    authorImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 6,
        backgroundColor: '#eee',
    },
    authorName: {
        fontSize: 13,
        color: '#555',
        flex: 1,
    },

    // ⬇️ [수정] 인분/시간/난이도 (개별 라인)
    cardDetailText: {
        fontSize: 13, // ⬅️ 디자인 시안에 맞게 폰트 크기 조정
        color: '#555', // ⬅️ 디자인 시안에 맞게 색상 조정
        marginTop: 4, // ⬅️ 각 라인 사이의 간격
    },

    // ⬇️ [삭제] cardExtraInfoContainer, cardExtraInfoText, cardExtraInfoDivider는 더 이상 사용되지 않음

    // --- (FAB, 에러/로딩 스타일 변경 없음) ---
    fab: { position: 'absolute', bottom: 106, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    fabIcon: { width: 22, height: 22, resizeMode: 'contain' },
    fabText: { color: '#000000', marginLeft: 8, fontWeight: 'bold', fontSize: 16 },
    emptyContainer: { flex: 1, marginTop: 50, alignItems: 'center', justifyContent: 'center' },
    errorContainer: { flex: 1, marginTop: 50, alignItems: 'center', justifyContent: 'center', padding: 20 },
    errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginBottom: 10 },
    retryButton: { backgroundColor: '#89FFF1', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
    retryButtonText: { color: '#2D303A', fontWeight: 'bold' },
});