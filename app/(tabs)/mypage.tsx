// app/(tabs)/mypage.tsx

import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ActivityIndicator,
    // ✅ 1. Alert (임시 기능 알림용)
    Alert,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';

// --- 타입 정의 ---
interface SimpleRecipe {
    recipeId: number;
    title: string;
    mainImageUrl: string | null;
    authorInfo: { nickname: string };
    likeCount: number;
    servings: number;
    cookingTimeMinutes: number;
    difficulty: string;
}

interface SimplePost {
    postId: number;
    title: string;
}

type TabKey = 'liked' | 'my-recipes' | 'my-posts';

/**
 * 마이페이지 미리보기용 레시피 카드 컴포넌트 (React.memo 제거)
 */
const RecipePreviewCard = ({ item }: { item: SimpleRecipe }) => {
    // (이하 생략 - 기존 코드와 동일)
    return (
        <Link href={`/recipe/${item.recipeId}`} asChild>
            <TouchableOpacity style={styles.previewCard}>
                <Image
                    source={item.mainImageUrl ? { uri: item.mainImageUrl } : require('../../assets/images/logo.png')}
                    style={styles.previewImage}
                />
                <Text style={styles.previewCardTitle} numberOfLines={1}>{item.title}</Text>

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
        </Link>
    );
};

export default function MyPageScreen() {
    const [activeTab, setActiveTab] = useState<TabKey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const profile = useAuthStore((state) => state.user);

    const [likedRecipes, setLikedRecipes] = useState<SimpleRecipe[]>([]);
    const [myRecipes, setMyRecipes] = useState<SimpleRecipe[]>([]);
    const [myPosts, setMyPosts] = useState<SimplePost[]>([]);

    // --- 데이터 로드 함수 ---
    const fetchLikedRecipes = async () => {
        // (이하 생략 - 기존 코드와 동일)
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/api/recipes', {
                params: { size: 5, isLiked: true }
            });
            if (response.data.isSuccess) {
                setLikedRecipes(response.data.result.recipes || []);
            }
        } catch (error) {
            console.error("좋아요 레시피 로드 실패:", error);
            setLikedRecipes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMyRecipes = async (nickname: string | null | undefined) => {
        // (이하 생략 - 기존 코드와 동일)
        if (!nickname) {
            setMyRecipes([]);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/api/recipes', {
                params: { size: 5, keyword: nickname }
            });
            if (response.data.isSuccess) {
                setMyRecipes(response.data.result.recipes || []);
            }
        } catch (error) {
            console.error("내 레시피 로드 실패:", error);
            setMyRecipes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabPress = (tabKey: TabKey) => {
        // (이하 생략 - 기존 코드와 동일)
        const newActiveTab = activeTab === tabKey ? null : tabKey;
        setActiveTab(newActiveTab);

        if (newActiveTab === 'liked') {
            fetchLikedRecipes();
        } else if (newActiveTab === 'my-recipes') {
            fetchMyRecipes(profile?.nickname);
        } else if (newActiveTab === 'my-posts') {
            setIsLoading(false);
            setMyPosts([]);
        }
    };

    // ✅ 1. 프로필 사진 변경 핸들러 (임시)
    const handleChangeProfileImage = () => {
        // TODO: 이미지 픽커(Image Picker) 라이브러리 연동
        // 예: ImagePicker.launchImageLibraryAsync(...)
        Alert.alert(
            "기능 구현 필요",
            "프로필 사진 변경 기능을 여기에 연결해야 합니다."
        );
        // 선택된 이미지를 서버로 업로드하고, 성공 시 authStore의 user 상태를 업데이트
    };

    // --- 렌더링 함수 ---
    const renderProfile = () => (
        <View style={styles.profileSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* ✅ 1. 프로필 이미지 + 변경 버튼 래퍼 */}
                <View style={styles.profileImageContainer}>
                    <Image
                        source={profile?.profileImageUrl ? { uri: profile.profileImageUrl } : require('../../assets/images/logo.png')}
                        style={styles.profileImage}
                    />
                    {/* ✅ 1. 프로필 사진 변경 버튼 */}
                    <TouchableOpacity
                        style={styles.profileEditButton}
                        onPress={handleChangeProfileImage}
                    >
                        {/* ⚠️ 아이콘 파일명을 확인하세요! (예: camera_icon.png) */}
                        <Image
                            source={require('../../assets/icons/photoChange.png')}
                            style={styles.profileEditIcon}
                        />
                    </TouchableOpacity>
                </View>
                <Text style={styles.nickname}>{profile?.nickname || '로그인하세요'}</Text>
            </View>
            <View style={styles.followSection}>
                <View style={styles.followBox}>
                    <Text style={styles.followCount}>0</Text>
                    <Text style={styles.followLabel}>팔로워</Text>
                </View>
                <View style={styles.followBox}>
                    <Text style={styles.followCount}>0</Text>
                    <Text style={styles.followLabel}>팔로잉</Text>
                </View>
            </View>
        </View>
    );

    const renderPoints = () => (
        <View style={styles.pointSection}>
            {/* ✅ 2. 포인트 아이콘 + 라벨 */}
            <View style={styles.pointLabelContainer}>
                {/* ⚠️ 아이콘 파일명을 확인하세요! (예: point_icon.png) */}
                <Image
                    source={require('../../assets/icons/point.png')}
                    style={styles.pointIcon}
                />
                <Text style={styles.pointLabel}>보유 포인트</Text>
            </View>
            <Text style={styles.pointValue}>0 P</Text>
        </View>
    );

    // ✅ 3. 미리보기 리스트 렌더링 함수 (콜랩서블 내부용)
    const renderPreviewList = (data: (SimpleRecipe | SimplePost)[], viewAllLink: string) => (
        <View style={styles.previewContainer}>
            {/* '전체보기' 버튼을 미리보기 리스트 *아래*로 이동 (디자인 참조) */}
            {isLoading ? (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={data}
                    keyExtractor={(item) => (item as SimpleRecipe).recipeId?.toString() || (item as SimplePost).postId.toString()}
                    renderItem={({ item }) => <RecipePreviewCard item={item as SimpleRecipe} />}
                    ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>항목이 없습니다.</Text></View>}

                    contentContainerStyle={{ paddingHorizontal: 0 }}
                />
            )}
            <Link href={viewAllLink} asChild>
                <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>전체보기 &gt;</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {renderProfile()}
                {renderPoints()}

                {/* 세로형 탭 리스트 (아코디언) */}
                <View style={styles.tabListContainer}>
                    {/* (이하 생략 - 기존 코드와 동일) */}
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'liked' && styles.activeTabButton]}
                        onPress={() => handleTabPress('liked')}>
                        <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>좋아요 누른 레시피</Text>
                        <Ionicons name={activeTab === 'liked' ? "chevron-up" : "chevron-down"} size={20} color={activeTab === 'liked' ? '#007AFF' : '#888'} />
                    </TouchableOpacity>
                    {activeTab === 'liked' && renderPreviewList(likedRecipes, '/mypage/liked-recipes')}

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'my-recipes' && styles.activeTabButton]}
                        onPress={() => handleTabPress('my-recipes')}>
                        <Text style={[styles.tabText, activeTab === 'my-recipes' && styles.activeTabText]}>내가 등록한 레시피</Text>
                        <Ionicons name={activeTab === 'my-recipes' ? "chevron-up" : "chevron-down"} size={20} color={activeTab === 'my-recipes' ? '#007AFF' : '#888'} />
                    </TouchableOpacity>
                    {activeTab === 'my-recipes' && renderPreviewList(myRecipes, '/mypage/my-recipes')}

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'my-posts' && styles.activeTabButton]}
                        onPress={() => handleTabPress('my-posts')}>
                        <Text style={[styles.tabText, activeTab === 'my-posts' && styles.activeTabText]}>내 게시물</Text>
                        <Ionicons name={activeTab === 'my-posts' ? "chevron-up" : "chevron-down"} size={20} color={activeTab === 'my-posts' ? '#007AFF' : '#888'} />
                    </TouchableOpacity>
                    {activeTab === 'my-posts' && renderPreviewList(myPosts, '/mypage/my-posts')}

                    <Link href="/settings" asChild>
                        <TouchableOpacity style={styles.tabButton}>
                            <Text style={styles.tabText}>설정</Text>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    // 프로필
    profileSection: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    // ✅ 1. 프로필 이미지 관련 스타일
    profileImageContainer: {
        position: 'relative', // 자식 요소의 absolute 포지셔닝 기준
        marginRight: 12,
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#eee'
    },
    profileEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff', // 아이콘 배경
        borderRadius: 12, // 원형 버튼
        padding: 4, // 아이콘 주변 여백
        // 그림자 (선택 사항)
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    profileEditIcon: {
        width: 16, // 아이콘 크기
        height: 16, // 아이콘 크기
    },

    nickname: { fontSize: 20, fontWeight: 'bold' },
    followSection: { flexDirection: 'row', gap: 16 },
    followBox: { alignItems: 'center' },
    followCount: { fontSize: 18, fontWeight: 'bold' },
    followLabel: { fontSize: 14, color: '#888' },

    // 포인트
    pointSection: { marginHorizontal: 24, padding: 16, backgroundColor: '#f8f8f8', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    // ✅ 2. 포인트 아이콘 관련 스타일
    pointLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pointIcon: {
        width: 20, // 아이콘 크기 (조정 필요)
        height: 20, // 아이콘 크기 (조정 필요)
        marginRight: 8,
    },

    pointLabel: { fontSize: 16, fontWeight: '500' },
    pointValue: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },

    // 세로 탭 리스트 스타일
    tabListContainer: {
        marginHorizontal: 24,
        marginTop: 16,
    },
    tabButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activeTabButton: {},
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    activeTabText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4891FF',
    },

    // 미리보기
    previewContainer: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    viewAllButton: {
        paddingTop: 16,
    },
    viewAllText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'right',
    },
    previewCard: {
        width: 140,
        marginRight: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    previewImage: {
        width: '100%',
        height: 100,
        backgroundColor: '#eee'
    },
    previewCardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
        marginHorizontal: 8,
    },
    emptyContainer: { width: 200, height: 160, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#aaa', fontSize: 14 },

    // 카드 정보 스타일
    cardInfoContainer: {
        paddingHorizontal: 8,
        paddingBottom: 8,
        marginTop: 4,
    },
    cardLikes: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardLikesText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#555',
    },
    cardInfoText: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
});