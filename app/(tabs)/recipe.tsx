import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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
import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';

// --- 타입 정의 (API 응답과 일치) ---
interface AuthorInfo {
    nickname: string;
    profileImageUrl: string | null;
    following?: boolean;
    myself?: boolean;
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

// 백엔드 DTO와 일치하는 응답 래퍼 타입 정의
interface RecipeListResponse {
    recipes: Recipe[];
    hasNext: boolean;
    nextCursor: number | null; // DTO에서 Long 타입이므로 number | null로 매핑
}

// FlatList의 data 타입 (짝수/홀수 처리를 위해)
type RecipeListItem = Recipe | { isEmpty: true; recipeId: string };

// --- 상수 정의 ---
const BANNERS: string[] = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=2881&auto.format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2960&auto.format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=2880&auto.format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D',
];

const SORT_FILTERS: string[] = ['최신순', '좋아요순'];
const CATEGORY_FILTERS: string[] = ['전체', '한식', '중식', '일식', '양식', '아시안', '디저트', '베이커리', '간식', '음료/술'];
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

// --- 레시피 카드 컴포넌트 ---
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

                    {/* 2-3. 인분/시간/난이도 */}
                    <Text style={styles.cardDetailText}>{item.servings}인분 기준</Text>
                    <Text style={styles.cardDetailText}>평균 조리시간 {item.cookingTimeMinutes}분</Text>
                    <Text style={styles.cardDetailText}>조리 난이도 {formatDifficulty(item.difficulty)}</Text>
                </View>
            </TouchableOpacity>
        </Link>
    );
};

// --- 헤더 컴포넌트 ---
interface ListHeaderProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
    onSearchSubmit: () => void;
    activeSortFilter: string;
    onSortFilterChange: (filter: string) => void;
    activeCategoryFilter: string;
    onCategoryFilterChange: (filter: string) => void;
    activeBannerIndex: number;
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const ListHeader = React.memo<ListHeaderProps>((props) => {
    const {
        searchQuery,
        onSearchChange,
        onSearchSubmit,
        activeSortFilter,
        onSortFilterChange,
        activeCategoryFilter,
        onCategoryFilterChange,
        activeBannerIndex,
        onScroll,
    } = props;

    return (
    <View>
        <ImageBackground
            source={require('../../assets/images/banner_recipe.png')}
            style={styles.topBanner}
            resizeMode="cover"
        >
            <Text style={styles.topBannerText}>유통기한 잘 확인하셨나요?</Text>
        </ImageBackground>
        <View style={styles.carouselContainer}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
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
            <TextInput
                style={styles.searchInput}
                placeholder="요리 이름을 검색해보세요"
                value={searchQuery}
                onChangeText={onSearchChange}
                onSubmitEditing={onSearchSubmit}
                returnKeyType="search"
            />
            <TouchableOpacity onPress={onSearchSubmit}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            </TouchableOpacity>
        </View>

        {/* 정렬 필터 */}
        <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>정렬</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContainer}>
                {SORT_FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterButton, activeSortFilter === filter && styles.activeFilterButton]}
                        onPress={() => onSortFilterChange(filter)}
                    >
                        <Text style={[styles.filterText, activeSortFilter === filter && styles.activeFilterText]}>{filter}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* 카테고리 필터 */}
        <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>카테고리</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContainer}>
                {CATEGORY_FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterButton, activeCategoryFilter === filter && styles.activeFilterButton]}
                        onPress={() => onCategoryFilterChange(filter)}
                    >
                        <Text style={[styles.filterText, activeCategoryFilter === filter && styles.activeFilterText]}>{filter}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    </View>
    );
});

ListHeader.displayName = 'ListHeader';
// --- 헤더 컴포넌트 끝 ---

// --- API 호출 함수를 밖으로 분리 ---
const fetchRecipes = async ({
                                pageParam, // cursorId
                                queryParams, // keyword, sortBy, category 등
                            }: {
    pageParam: number | null;
    queryParams: any;
}) => {
    const params = {
        ...queryParams,
        cursorId: pageParam, // pageParam을 cursorId로 사용
        size: 20, // (기존 size와 동일하게)
    };

    // 💡 디버깅: API 요청 파라미터 확인
    console.log('Fetching recipes with params:', params);

    const response = await axiosInstance.get('/api/recipes', { params });
    if (response.data.isSuccess) {
        // 💡 중요: `result` 객체 전체 (recipes, hasNext, nextCursor 포함)를 반환
        return response.data.result as RecipeListResponse;
    }
    throw new Error(response.data.message || '레시피를 불러오는 데 실패했습니다.');
};

export default function RecipeScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [activeSortFilter, setActiveSortFilter] = useState('최신순');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('전체');
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);

    const flatListRef = useRef<FlatList<RecipeListItem>>(null);

// queryParams: 정렬 기준과 카테고리를 독립적으로 전달
    const queryParams = useMemo(() => {
        const params: any = { keyword: submittedQuery || undefined };

        // 정렬 기준 설정
        params.sortBy = SORT_MAP[activeSortFilter] || 'LATEST';

        // 카테고리 설정 ('전체'가 아닐 때만)
        if (activeCategoryFilter !== '전체' && CATEGORY_MAP[activeCategoryFilter]) {
            params.category = CATEGORY_MAP[activeCategoryFilter];
        }

        return params;
    }, [activeSortFilter, activeCategoryFilter, submittedQuery]);

// useQuery를 useInfiniteQuery로 변경
    const {
        data, // data 객체에는 이제 pages와 pageParams가 포함됨
        isLoading,
        error,
        refetch,
        fetchNextPage, // 다음 페이지를 불러오는 함수
        hasNextPage, // 다음 페이지 존재 여부 (DTO의 hasNext와 연결됨)
        isFetchingNextPage, // 다음 페이지 로딩 중 상태
    } = useInfiniteQuery<
        RecipeListResponse,
        Error,
        InfiniteData<RecipeListResponse>, // data 타입
        (string | { [key: string]: string | undefined })[], // queryKey 타입
        number | null // pageParam(커서) 타입
    >({
        queryKey: ['recipes', queryParams], // 필터가 바뀌면 쿼리 키가 변경되어 자동 새로고침
        queryFn: ({ pageParam = null }) => fetchRecipes({ pageParam, queryParams }),
        initialPageParam: null, // 첫 페이지는 커서 null
        getNextPageParam: (lastPage) => {
            // 💡 마지막 페이지의 nextCursor 값을 다음 pageParam으로 반환
            // 💡 hasNext가 false이면 undefined를 반환하여 `hasNextPage`를 false로 설정
            return lastPage.hasNext ? lastPage.nextCursor : undefined;
        },
        staleTime: 1000 * 60 * 5,
        placeholderData: (previousData) => previousData,
    });

// data.pages를 flatMap으로 펼쳐서 하나의 배열로 만듦
    const fetchedRecipes = useMemo(() =>
            data?.pages.flatMap((page) => page.recipes) ?? [],
        [data]
    );

    // (기존 2열 레이아웃 맞추기용 로직 - 동일)
    const recipes = useMemo(() => {
        if (fetchedRecipes.length % 2 === 1) {
            return [...fetchedRecipes, { isEmpty: true, recipeId: 'empty' }] as RecipeListItem[];
        }
        return fetchedRecipes as RecipeListItem[];
    }, [fetchedRecipes]);

    const onRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const handleSearch = useCallback(() => {
        setSubmittedQuery(searchQuery);
    }, [searchQuery]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / screenWidth);
        setActiveBannerIndex(index);
    }, []);

    // 검색어가 변경되면 500ms 후 자동으로 검색
    useEffect(() => {
        const timer = setTimeout(() => {
            setSubmittedQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

// ListEmptyComponent 로직 (recipes.length === 0)
    const renderListEmptyComponent = () => {
        // 💡 첫 로딩 (데이터가 아예 없을 때)
        if (isLoading && recipes.length === 0) {
            return <ActivityIndicator size="large" color="#89FFF1" style={{ marginTop: 50 }} />;
        }
        // 💡 에러 발생 (데이터가 아예 없을 때)
        if (error && recipes.length === 0) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error.message || '레시피를 불러오는 중 오류가 발생했습니다.'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}><Text style={styles.retryButtonText}>다시 시도</Text></TouchableOpacity>
                </View>
            );
        }
        // 💡 로딩/에러도 아니고 데이터도 없을 때
        if (recipes.length === 0) {
            return <View style={styles.emptyContainer}><Text>표시할 레시피가 없어요.</Text></View>;
        }
        return null;
    };

    // ListFooterComponent 추가 (다음 페이지 로딩)
    const renderListFooterComponent = () => {
        if (isFetchingNextPage) {
            return <ActivityIndicator size="small" color="#888" style={{ marginVertical: 20 }} />;
        }
        return null;
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ref={flatListRef}
                ListHeaderComponent={
                    <ListHeader
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSearchSubmit={handleSearch}
                        activeSortFilter={activeSortFilter}
                        onSortFilterChange={setActiveSortFilter}
                        activeCategoryFilter={activeCategoryFilter}
                        onCategoryFilterChange={setActiveCategoryFilter}
                        activeBannerIndex={activeBannerIndex}
                        onScroll={handleScroll}
                    />
                }
                data={recipes}
                renderItem={({ item }) => <RecipeCard item={item} />}
                keyExtractor={(item) => item.recipeId.toString()}
                numColumns={2}
                contentContainerStyle={[
                    styles.listContentContainer, // 기본 스타일
                    recipes.length === 0 && styles.listContentContainerEmpty // 비어있을 때만 flexGrow: 1 적용
                ]}
                columnWrapperStyle={styles.row}
                ListEmptyComponent={renderListEmptyComponent}
                onRefresh={onRefresh}
                refreshing={isLoading} // 💡 refreshing은 useInfiniteQuery의 isLoading을 사용

                // --- 무한 스크롤을 위한 props 추가 ---
                onEndReachedThreshold={0.8} // 목록의 80% 지점에 도달했을 때
                onEndReached={() => {
                    // 💡 다음 페이지가 있고, 현재 로딩 중이 아닐 때
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }}
                ListFooterComponent={renderListFooterComponent} // 💡 다음 페이지 로딩 인디케이터
                // ----------------------------------------
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

// --- 스타일시트 (카드 디자인 변경) ---
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
    filterSection: { marginBottom: 12 },
    filterLabel: { fontSize: 15, fontWeight: 'bold', color: '#333', marginLeft: 16, marginBottom: 8 },
    filterScrollContainer: { paddingHorizontal: 16 },
    filterContainer: { paddingHorizontal: 16, marginBottom: 16 },
    filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
    activeFilterButton: { backgroundColor: '#1298FF' },
    filterText: { fontSize: 14, color: '#555' },
    activeFilterText: { color: '#fff', fontWeight: 'bold' },
    listContentContainer: {
        paddingBottom: 120,
    },
    listContentContainerEmpty: {
        flexGrow: 1,
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
        marginBottom: 8, // 제목-작성자 간격
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12, // 작성자-상세정보 간격
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

    // 인분/시간/난이도 (개별 라인)
    cardDetailText: {
        fontSize: 13, // 디자인 시안에 맞게 폰트 크기 조정
        color: '#555', // 디자인 시안에 맞게 색상 조정
        marginTop: 4, // 각 라인 사이의 간격
    },

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
