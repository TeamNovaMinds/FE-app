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

    const renderItem = ({ item }: { item: RankingMember }) => (
        <View style={styles.itemContainer}>
            {/* 순위 뱃지 (1,2,3위는 색상 다르게 처리 가능) */}
            <View style={styles.rankBadge}>
                <Text style={[
                    styles.rankText,
                    item.rank <= 3 && styles.topRankText
                ]}>
                    {item.rank}
                </Text>
            </View>

            <Image
                source={item.profileImgUrl ? { uri: item.profileImgUrl } : require('@/assets/images/JustFridge_logo.png')}
                style={styles.profileImage}
            />

            <View style={styles.infoContainer}>
                <Text style={styles.nickname}>{item.nickname}</Text>
            </View>

            <Text style={styles.point}>{item.point.toLocaleString()} P</Text>
        </View>
    );

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
    profileImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eee',
        marginRight: 14,
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