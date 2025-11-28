import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { rankingService } from '@/src/features/ranking/service';
import { LinearGradient } from 'expo-linear-gradient'; // ✅ 추가
import { format } from 'date-fns';
import FirstCrownIcon from '@/assets/icons/first_crown.svg';
import SecondCrownIcon from '@/assets/icons/second_crown.svg';
import ThirdCrownIcon from '@/assets/icons/thrid_crown.svg';
import UnknownIcon from '@/assets/icons/unknown.svg';

const { width } = Dimensions.get('window');

export default function RankingScreen() {
    const router = useRouter();
    const today = format(new Date(), 'yyyy/MM/dd');

    const { data, isLoading } = useQuery({
        queryKey: ['rankingTop8'],
        queryFn: rankingService.getTop8Ranking,
    });

    const rankings = data?.rankings || [];
    const top3 = rankings.slice(0, 3);
    const rest = rankings.slice(3);
    const podiumData = [top3[1], top3[0], top3[2]].filter(Boolean);

    const navigateToUserRefrigerator = (nickname: string) => {
        if (!nickname) return;
        router.push(`/member/${encodeURIComponent(nickname)}/refrigerator`);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: '랭킹', headerBackTitle: '커뮤니티', headerShadowVisible: false }} />

            {isLoading && (
                <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
            )}

            {!isLoading && (

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>포인트 랭킹 TOP 3</Text>
                        <Text style={styles.cardDate}>{today} 기준</Text>
                    </View>

                    <View style={styles.podiumContainer}>
                        {podiumData.map((item, index) => {
                            const isFirst = item.rank === 1;
                            const isSecond = item.rank === 2;
                            const isThird = item.rank === 3;

                            return (
                                <View key={item.nickname} style={[styles.podiumItem, isFirst && styles.podiumItemFirst]}>
                                    {/* 👑 왕관 (1, 2, 3등) */}
                                    {isFirst && (
                                        <FirstCrownIcon width={30} height={30} style={styles.crownImageFirst} />
                                    )}
                                    {isSecond && (
                                        <SecondCrownIcon width={30} height={30} style={styles.crownImageSmall} />
                                    )}
                                    {isThird && (
                                        <ThirdCrownIcon width={30} height={30} style={styles.crownImageSmall} />
                                    )}

                                    {/* ✅ 1,2,3등 모두 LinearGradient로 감싸서 그라데이션 테두리 표현 */}
                                    <TouchableOpacity onPress={() => navigateToUserRefrigerator(item.nickname)} activeOpacity={0.8}>
                                        <LinearGradient
                                            colors={
                                                isFirst
                                                    ? ['#FFD700', '#FFA500'] // 1등: 금색
                                                    : isSecond
                                                    ? ['#d4d4d4', '#a8a8a8'] // 2등: 은색
                                                    : ['#cd7f32', '#b8860b'] // 3등: 동색
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={isFirst ? styles.gradientBorder : styles.gradientBorderSmall}
                                        >
                                            <View style={isFirst ? styles.profileInner : styles.profileInnerSmall}>
                                                {item.profileImgUrl ? (
                                                    <Image
                                                        source={{ uri: item.profileImgUrl }}
                                                        style={isFirst ? styles.profileImageFirst : styles.profileImage}
                                                        contentFit="contain"
                                                        transition={200}
                                                        cachePolicy="memory-disk"
                                                    />
                                                ) : (
                                                    <UnknownIcon width={isFirst ? 70 : 50} height={isFirst ? 70 : 50} />
                                                )}
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => navigateToUserRefrigerator(item.nickname)} activeOpacity={0.8}>
                                        <Text style={styles.podiumName} numberOfLines={1}>{item.nickname}</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.podiumPoint}>{item.point.toLocaleString()}</Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.listContainer}>
                        {rest.map((item) => (
                            <TouchableOpacity
                                key={item.nickname}
                                style={styles.listItem}
                                onPress={() => navigateToUserRefrigerator(item.nickname)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.rankNumber}>{item.rank}</Text>
                                {item.profileImgUrl ? (
                                    <Image
                                        source={{ uri: item.profileImgUrl }}
                                        style={styles.listProfileImage}
                                        contentFit="contain"
                                        transition={200}
                                        cachePolicy="memory-disk"
                                    />
                                ) : (
                                    <View style={styles.listProfileImage}>
                                        <UnknownIcon width={36} height={36} />
                                    </View>
                                )}
                                <Text style={styles.listName} numberOfLines={1}>{item.nickname}</Text>
                                <Text style={styles.listPoint}>{item.point.toLocaleString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.viewAllButton}
                        onPress={() => router.push('/community/ranking/all')}
                    >
                        <Text style={styles.viewAllText}>전체순위보기</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // ... (기존 스타일 유지)
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        minHeight: 500,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#4891FF' },
    cardDate: { fontSize: 12, color: '#999' },

    // Podium
    podiumContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: 30 },
    podiumItem: { alignItems: 'center', width: width * 0.22 },
    podiumItemFirst: { marginBottom: 20 },

    // ✅ 1등 왕관 스타일
    crownImageFirst: {
        width: 30,
        height: 30,
        marginBottom: -4, // 프로필 이미지 바로 위에 위치
        zIndex: 10,
    },
    // ✅ 2,3등 왕관 스타일
    crownImageSmall: {
        width: 30,
        height: 30,
        marginBottom: -7, // 2,3등 프로필 이미지에 맞춰 위치 조정
        zIndex: 10,
    },

    // ✅ 1등 그라데이션 테두리 컨테이너
    gradientBorder: {
        width: 76, // 이미지(70) + 테두리(3*2)
        height: 76,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        // 그림자
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
    },
    // ✅ 2,3등 그라데이션 테두리 컨테이너
    gradientBorderSmall: {
        width: 56, // 이미지(50) + 테두리(3*2)
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        // 그림자
        shadowColor: "#999",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    // ✅ 1등 이미지 감싸는 흰색 영역 (이미지와 테두리 사이 여백)
    profileInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff', // 이미지 배경 흰색
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ✅ 2,3등 이미지 감싸는 흰색 영역
    profileInnerSmall: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 2,3등 프로필 컨테이너
    profileContainer: { marginBottom: 8 },

    // 이미지 스타일
    profileImage: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
    profileImageFirst: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#eee' },

    podiumName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4, textAlign: 'center' },
    podiumPoint: { fontSize: 13, color: '#666', textAlign: 'center' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },
    listContainer: { marginBottom: 20 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9F9F9' },
    rankNumber: { width: 30, fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center' },
    listProfileImage: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', marginHorizontal: 12 },
    listName: { flex: 1, fontSize: 15, color: '#333' },
    listPoint: { fontSize: 15, fontWeight: '500', color: '#555' },
    viewAllButton: { marginTop: 20, alignItems: 'center', padding: 10 },
    viewAllText: { fontSize: 14, color: '#666', textDecorationLine: 'underline' },
});