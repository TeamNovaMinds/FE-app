import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import { Stack } from 'expo-router';
import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { rankingService } from '@/src/features/ranking/service';
import { RankingMember, AllRankingResponse } from '@/src/features/ranking/types';
import { LinearGradient } from 'expo-linear-gradient';

export default function AllRankingScreen() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useInfiniteQuery<AllRankingResponse, Error, InfiniteData<AllRankingResponse, string | null>, string[], string | null>({
        queryKey: ['rankingAll'],
        queryFn: ({ pageParam }) => rankingService.getAllRanking(pageParam),
        initialPageParam: null,
        getNextPageParam: (lastPage) => {
            return lastPage.hasNext ? lastPage.nextCursor : undefined;
        },
    });

    const allRankings = data?.pages.flatMap((page: AllRankingResponse) => page.rankings) ?? [];

    const renderItem = ({ item }: { item: RankingMember }) => {

        const isFirst = item.rank === 1;

        return (
            <View style={styles.itemContainer}>
                {/* 순위 뱃지 */}
            <View style={styles.rankBadge}>
                <Text style={[
                    styles.rankText,
                    item.rank <= 3 && styles.topRankText
                ]}>
                    {item.rank}
                </Text>
            </View>

            {/* 프로필 이미지 영역 (왕관 + 테두리 처리를 위해 View로 감쌈) */}
            <View style={styles.profileWrapper}>
                {/* 👑 1등 왕관 (리스트용 작은 사이즈) */}
                {isFirst && (
                    <Image
                        source={require('@/assets/images/crown.png')}
                        style={styles.crownImageList}
                        resizeMode="contain"
                    />
                )}

                {isFirst ? (
                    // ✅ 1등: 그라데이션 테두리
                    <LinearGradient
                        colors={['#4facfe', '#00f2fe']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBorderList}
                    >
                        <View style={styles.profileInnerList}>
                            <Image
                                source={item.profileImgUrl ? { uri: item.profileImgUrl } : require('@/assets/images/JustFridge_logo.png')}
                                style={styles.profileImageFirstList}
                            />
                        </View>
                    </LinearGradient>
                ) : (
                    // 일반: 그냥 이미지
                    <Image
                        source={item.profileImgUrl ? { uri: item.profileImgUrl } : require('@/assets/images/JustFridge_logo.png')}
                        style={styles.profileImage}
                    />
                )}
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.nickname}>{item.nickname}</Text>
            </View>

            <Text style={styles.point}>{item.point.toLocaleString()} P</Text>
        </View>
    );
};

    const renderFooter = () => {
        if (isFetchingNextPage) {
            return <ActivityIndicator style={{ margin: 20 }} color="#007AFF" />;
        }
        return null;
    };

    if (isLoading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    if (error) {
        return <View style={styles.center}><Text>랭킹을 불러오는데 실패했습니다.</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: '전체 랭킹', headerBackTitle: '뒤로' }} />

            <FlatList
                data={allRankings}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.nickname}-${item.rank}-${index}`}
                onEndReached={() => {
                    if (hasNextPage) fetchNextPage();
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.listContent}
                // 1등 구분선 등 헤더가 필요하면 ListHeaderComponent 추가
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: 10,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    rankBadge: {
        width: 30,
        alignItems: 'center',
        marginRight: 10,
    },
    rankText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    topRankText: {
        color: '#007AFF', // 1,2,3위 강조 색상
        fontWeight: 'bold',
        fontSize: 18,
    },
// --- 프로필 이미지 관련 스타일 ---
    profileWrapper: {
        marginRight: 14,
        justifyContent: 'center',
        alignItems: 'center',
        // 왕관이 이미지 영역 밖으로 나갈 때 잘리지 않도록 함
        zIndex: 1,
    },
    // 일반 프로필 이미지
    profileImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eee',
    },

    // ✅ 1등용 스타일 (리스트 사이즈에 맞춤)
    crownImageList: {
        width: 20,
        height: 20,
        position: 'absolute',
        top: -12, // 이미지 위로 올림
        zIndex: 10,
    },
    gradientBorderList: {
        width: 48, // 44 + 테두리(2*2)
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInnerList: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageFirstList: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eee',
    },
    infoContainer: {
        flex: 1,
    },
    nickname: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    point: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});