// app/(tabs)/mypage.tsx

import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View, // ✅ 1. 'View'를 import 합니다.
    Text,
    // SafeAreaView, // ⬅️ 'SafeAreaView'는 import에서 제거합니다.
    Image,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, validateFileSize, validateFileType } from '@/utils/imageUpload';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// --- (타입 정의, RecipePreviewCard 등은 기존과 동일) ---
// ... (생략) ...
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

const RecipePreviewCard = ({ item }: { item: SimpleRecipe }) => {
    return (
        <Link href={`/recipe/${item.recipeId}`} asChild>
            <TouchableOpacity style={styles.previewCard}>
                <Image
                    source={item.mainImageUrl ? { uri: item.mainImageUrl } : require('../../assets/images/JustFridge_logo.png')}
                    style={styles.previewImage}
                />
                <Text style={styles.previewCardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardInfoContainer}>
                    <View style={styles.cardLikes}>
                        <Ionicons name="heart" size={14} color="#FF6347" />
                        <Text style={styles.cardLikesText}>{item.likeCount.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.cardInfoText}>
                        {item.servings ? `${item.servings}인분 기준\n` : `정보 없음\n`}
                        조리시간 {item.cookingTimeMinutes}분
                    </Text>
                    <Text style={styles.cardInfoText}>난이도 {item.difficulty}</Text>
                </View>
            </TouchableOpacity>
        </Link>
    );
};


export default function MyPageScreen() {
    const [activeTab, setActiveTab] = useState<TabKey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const updateUser = useAuthStore((state) => state.updateUser);
    const [likedRecipes, setLikedRecipes] = useState<SimpleRecipe[]>([]);
    const [myRecipes, setMyRecipes] = useState<SimpleRecipe[]>([]);
    const [myPosts, setMyPosts] = useState<SimplePost[]>([]);
    const queryClient = useQueryClient();

    // React Query로 프로필 정보 캐싱
    const { data: profileData, refetch: refetchProfile } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            console.log('🔄 마이페이지: 프로필 데이터 요청 중...');
            const response = await axiosInstance.get('/api/auth/me');
            if (response.data.isSuccess) {
                console.log('✅ 마이페이지: 프로필 데이터 받음', {
                    followerCount: response.data.result.followerCount,
                    followingCount: response.data.result.followingCount,
                });
                return response.data.result;
            }
            throw new Error(response.data.message || '프로필 조회 실패');
        },
        staleTime: 0, // 항상 새로 가져옴
        gcTime: 1000 * 60 * 5, // 5분간 캐시 유지
        refetchOnMount: true, // 마운트 시 새로고침
    });

    // 화면 포커스 시 프로필 데이터 새로고침
    useFocusEffect(
        useCallback(() => {
            console.log('📱 마이페이지: 화면 포커스 - 프로필 새로고침 시작');
            // ✅ 캐시 무효화 후 새로 가져오기
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            refetchProfile();
        }, [refetchProfile, queryClient])
    );

    // profileData가 변경되면 zustand store 업데이트
    React.useEffect(() => {
        if (profileData) {
            updateUser(profileData);
        }
    }, [profileData, updateUser]);

    // ✅ React Query 데이터를 우선 사용
    const profile = profileData;

    // 디버깅: 프로필 데이터 변경 시 로그
    React.useEffect(() => {
        if (profile) {
            console.log('📊 마이페이지: 현재 표시 중인 프로필 데이터', {
                followerCount: profile.followerCount,
                followingCount: profile.followingCount,
            });
        }
    }, [profile]);

    const fetchLikedRecipes = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/recipes/liked');
            if (response.data.isSuccess) {
                setLikedRecipes(response.data.result.recipes || []);
            }
        } catch (error) {
            console.error('Failed to fetch liked recipes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMyRecipes = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/recipes/my');
            if (response.data.isSuccess) {
                setMyRecipes(response.data.result.recipes || []);
            }
        } catch (error) {
            console.error('Failed to fetch my recipes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabPress = (tabKey: TabKey) => {
        if (activeTab === tabKey) {
            setActiveTab(null);
        } else {
            setActiveTab(tabKey);
            if (tabKey === 'liked') {
                fetchLikedRecipes();
            } else if (tabKey === 'my-recipes') {
                fetchMyRecipes();
            }
        }
    };

    const handleChangeProfileImage = async () => {
        try {
            // 갤러리 권한 요청
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
                return;
            }

            // 이미지 선택
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled) {
                return;
            }

            const selectedImage = result.assets[0];
            const imageUri = selectedImage.uri;
            const fileName = imageUri.split('/').pop() || 'profile.jpg';

            // 파일 타입 검증
            if (!validateFileType(fileName)) {
                Alert.alert('파일 형식 오류', 'jpg, jpeg, png, gif, webp 파일만 업로드 가능합니다.');
                return;
            }

            // 파일 크기 검증 (fileSize가 있는 경우)
            if (selectedImage.fileSize && !validateFileSize(selectedImage.fileSize)) {
                Alert.alert('파일 크기 오류', '10MB 이하의 이미지만 업로드 가능합니다.');
                return;
            }

            // 로딩 시작
            setIsImageUploading(true);

            // 이미지 업로드
            const { imageUrl } = await uploadImage(imageUri, fileName);

            // 백엔드에 프로필 이미지 URL 업데이트 요청
            const response = await axiosInstance.patch('/api/auth/profile-image', {
                profileImgUrl: imageUrl,
            });

            if (response.data.isSuccess) {
                // 프로필 캐시 무효화하여 최신 정보 다시 가져오기
                await queryClient.invalidateQueries({ queryKey: ['profile'] });
                Alert.alert('성공', '프로필 이미지가 변경되었습니다.');
            } else {
                throw new Error(response.data.message || '프로필 업데이트에 실패했습니다.');
            }
        } catch (error: any) {
            console.error('프로필 이미지 변경 오류:', error);
            const message = error.response?.data?.message || '프로필 이미지 변경 중 오류가 발생했습니다.';
            Alert.alert('업로드 실패', message);
        } finally {
            setIsImageUploading(false);
        }
    };

    // ... (render 함수들은 이전 수정과 동일) ...
    const renderProfile = () => (
        <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
                {isImageUploading ? (
                    <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center' }]}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                ) : (
                    <Image
                        source={profile?.profileImgUrl ? { uri: profile.profileImgUrl } : require('../../assets/images/JustFridge_logo.png')}
                        style={styles.profileImage}
                    />
                )}
                <TouchableOpacity
                    style={styles.profileEditButton}
                    onPress={handleChangeProfileImage}
                    disabled={isImageUploading}
                >
                    <Image
                        source={require('../../assets/icons/photoChange.png')}
                        style={styles.profileEditIcon}
                    />
                </TouchableOpacity>
            </View>
            <Link href="/mypage/follow" asChild>
                <TouchableOpacity style={styles.followSection}>
                    <View style={styles.followBox}>
                        <Text style={styles.followCount}>{profile?.followerCount ?? 0}</Text>
                        <Text style={styles.followLabel}>팔로워</Text>
                    </View>
                    <View style={styles.followBox}>
                        <Text style={styles.followCount}>{profile?.followingCount ?? 0}</Text>
                        <Text style={styles.followLabel}>팔로잉</Text>
                    </View>
                </TouchableOpacity>
            </Link>
        </View>
    );
    const renderPoints = () => (
        <View style={styles.pointSection}>
            <View style={styles.pointLabelContainer}>
                <Image
                    source={require('../../assets/icons/point.png')}
                    style={styles.pointIcon}
                />
                <Text style={styles.pointLabel}>보유 포인트</Text>
            </View>
            <Text style={styles.pointValue}>{profile?.point ?? 0} P</Text>
        </View>
    );
    const renderPreviewList = (data: (SimpleRecipe | SimplePost)[], viewAllLink: string) => (
        <View style={styles.previewContainer}>
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
        // ✅ 2. 최상단 'SafeAreaView'를 'View'로 변경합니다.
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.divider} />
                {renderProfile()}
                <Text style={styles.nicknameText}>
                    {profile?.nickname ? (
                        <>
                            {profile.nickname}<Text style={styles.nimText}> 님</Text>
                        </>
                    ) : '로그인하세요'}
                </Text>
                {renderPoints()}

                {/* (탭 리스트) */}
                <View style={styles.tabListContainer}>
                    {/* ... (생략) ... */}
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

                    <Link href="/mypage/invitations" asChild>
                        <TouchableOpacity style={styles.tabButton}>
                            <Text style={styles.tabText}>냉장고 초대 관리</Text>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>
                    </Link>

                    <Link href="/settings" asChild>
                        <TouchableOpacity style={styles.tabButton}>
                            <Text style={styles.tabText}>설정</Text>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </View>
    );
}

// --- (스타일 코드는 이전과 동일) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    profileSection: {
        paddingTop: 28,
        paddingLeft: 28,
        paddingBottom: 24,
        paddingRight: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // ⬅️ '양쪽 정렬' 추가
    },
    profileImageContainer: {
        position: 'relative',
        marginRight: 12,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 44,
        backgroundColor: '#eee'
    },
    profileEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    profileEditIcon: {
        width: 24,
        height: 24,
    },
    nicknameText: {
        fontSize: 20,
        fontWeight: '500',
        paddingHorizontal: 28,
        marginTop: 2,
        marginBottom: 8,
        marginLeft: 4,
    },
    nimText: {
        fontSize: 16,
        fontWeight: 'normal',
    },
    followSection: {
        flexDirection: 'row',
        gap: 34,
        marginRight: 44,
    },
    followBox: {
        alignItems: 'center'
    },
    followCount: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    followLabel: {
        fontSize: 20,
        color: '#888'
    },
    pointSection: { marginHorizontal: 24, padding: 16, backgroundColor: '#f8f8f8', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pointLabelContainer: { flexDirection: 'row', alignItems: 'center', },
    pointIcon: { width: 20, height: 20, marginRight: 8, },
    pointLabel: { fontSize: 16, fontWeight: '500' },
    pointValue: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
    tabListContainer: { marginHorizontal: 24, marginTop: 16, },
    tabButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
    activeTabButton: {},
    tabText: { fontSize: 16, fontWeight: '500', color: '#333', },
    activeTabText: { fontSize: 16, fontWeight: 'bold', color: '#4891FF', },
    previewContainer: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
    viewAllButton: { paddingTop: 16, },
    viewAllText: { fontSize: 14, color: '#888', textAlign: 'right', },
    previewCard: { width: 140, marginRight: 12, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
    previewImage: { width: '100%', height: 100, backgroundColor: '#eee' },
    previewCardTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 8, marginHorizontal: 8, },
    emptyContainer: { width: 200, height: 160, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#aaa', fontSize: 14 },
    cardInfoContainer: { paddingHorizontal: 8, paddingBottom: 8, marginTop: 4, },
    cardLikes: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
    cardLikesText: { marginLeft: 4, fontSize: 12, color: '#555', },
    cardInfoText: { fontSize: 11, color: '#888', marginTop: 2, },
});