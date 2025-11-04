// app/(tabs)/recipe.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// --- 타입 정의 (실제 API 응답에 맞게 수정) ---
interface AuthorInfo {
    nickname: string;
    profileImageUrl: string | null;
}

interface Recipe {
    recipeId: number;
    title: string;
    mainImageUrl: string | null;
    likeCount: number;
    authorInfo: AuthorInfo;
    difficulty: string;
    cookingTimeMinutes: number;
    servings : number;
}

type RecipeListItem = Recipe | { isEmpty: true; recipeId: string };

// --- 상수 정의 ---
const BANNERS: string[] = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=2881&auto.format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2960&auto.format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=2880&auto.format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
];

const FILTERS: string[] = ['최신순', '좋아요순', '한식', '중식', '일식', '양식', '아시안', '디저트', '베이커리', '간식', '음료/술'];
const SORT_MAP: { [key: string]: string } = { '최신순': 'LATEST', '좋아요순': 'LIKES' };
const CATEGORY_MAP: { [key: string]: string } = { '한식': 'KOREAN', '중식': 'CHINESE', '일식': 'JAPANESE', '양식': 'WESTERN', '아시안': 'ASIAN', '디저트': 'DESSERT', '베이커리': 'BAKERY', '간식': 'SNACK', '음료/술': 'DRINK' };

const { width: screenWidth } = Dimensions.get('window');

// --- 레시피 카드 컴포넌트 ---
const RecipeCard: React.FC<{ item: RecipeListItem }> = ({ item }) => {
    if ('isEmpty' in item) {
        return <View style={[styles.cardContainer, styles.emptyCard]} />;
    }

    return (
        <TouchableOpacity style={styles.cardContainer}>
            <Image
                source={item.mainImageUrl ? { uri: item.mainImageUrl } : require('../../assets/images/logo.png')}
                style={styles.cardImage}
            />
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.cardInfoContainer}>
                <View style={styles.cardLikes}>
                    <Ionicons name="heart" size={14} color="#FF6347" />
                    <Text style={styles.cardLikesText}>{item.likeCount.toLocaleString()}</Text>
                </View>
                <Text style={styles.cardInfoText}>
                    {item.servings ? `${item.servings}인분 기준` : '정보 없음'}
                </Text>
                <Text style={styles.cardInfoText}>조리시간 {item.cookingTimeMinutes}분</Text>
                <Text style={styles.cardInfoText}>난이도 {item.difficulty}</Text>
            </View>
        </TouchableOpacity>
    );
};

// --- 레시피 페이지 메인 컴포넌트 ---
export default function RecipeScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('최신순');
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);
    const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const flatListRef = useRef<FlatList<RecipeListItem>>(null);

    const fetchRecipes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setRecipes([]);

        const params: any = { keyword: submittedQuery || undefined, size: 20 };

        if (CATEGORY_MAP[activeFilter]) {
            params.category = CATEGORY_MAP[activeFilter];
            params.sortBy = 'LATEST';
        } else {
            params.sortBy = SORT_MAP[activeFilter] || 'LATEST';
        }

        try {
            const response = await axiosInstance.get('/api/recipes', { params });
            if (response.data.isSuccess) {
                // ✅✅✅ 핵심 수정사항: result.recipes 에서 데이터를 가져옵니다.
                const fetchedRecipes = response.data.result.recipes || []; // 만약을 위해 기본값으로 빈 배열 설정

                if (fetchedRecipes.length % 2 === 1) {
                    setRecipes([...fetchedRecipes, { isEmpty: true, recipeId: 'empty' }]);
                } else {
                    setRecipes(fetchedRecipes);
                }
            } else {
                setError(response.data.message || '레시피를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('레시피 조회 에러:', err);
            setError('레시피를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [activeFilter, submittedQuery]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const handleSearch = () => setSubmittedQuery(searchQuery);
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / screenWidth);
        setActiveBannerIndex(index);
    };

    const renderHeader = () => (
        <View>
            <ImageBackground
                // ⚠️ 가지고 계신 이미지 파일 경로로 수정하세요!
                source={require('../../assets/images/banner_recipe.png')}
                style={styles.topBanner}
                resizeMode="cover" // 이미지가 영역을 덮도록 설정
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
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchRecipes}><Text style={styles.retryButtonText}>다시 시도</Text></TouchableOpacity>
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
                contentContainerStyle={{ flexGrow: 1 }}
                columnWrapperStyle={styles.row}
                ListEmptyComponent={renderListEmptyComponent}
            />
            <Link href="/recipe/create" asChild>
                <TouchableOpacity style={styles.fab}>
                    {/* Ionicons 대신 Image 컴포넌트로 변경 */}
                    <Image
                        // ⚠️ 가지고 계신 아이콘 파일 경로로 수정하세요! (예: plus_icon.png)
                        source={require('../../assets/icons/plus.png')}
                        style={styles.fabIcon}
                    />
                    <Text style={styles.fabText}>레시피 작성</Text>
                </TouchableOpacity>
            </Link>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
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
    listContainer: { paddingHorizontal: 8, flexGrow: 1 },
    row: { justifyContent: 'space-between' },
    cardContainer: { flex: 1, margin: 8, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    emptyCard: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
    cardImage: { width: '100%', height: 120, backgroundColor: '#eee' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8, marginTop: 8 },
    cardInfoContainer: { paddingHorizontal: 8, paddingBottom: 8, marginTop: 4 },
    cardLikes: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    cardLikesText: { marginLeft: 4, fontSize: 12, color: '#555' },
    cardInfoText: { fontSize: 11, color: '#888', marginTop: 2 },
    fab: { position: 'absolute', bottom: 90, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    fabIcon: { width: 24, height: 24,},
    fabText: { color: '#2D303A', marginLeft: 8, fontWeight: 'bold', fontSize: 16 },
    emptyContainer: { flex: 1, marginTop: 50, alignItems: 'center', justifyContent: 'center' },
    errorContainer: { flex: 1, marginTop: 50, alignItems: 'center', justifyContent: 'center', padding: 20 },
    errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginBottom: 10 },
    retryButton: { backgroundColor: '#89FFF1', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
    retryButtonText: { color: '#2D303A', fontWeight: 'bold' },
});