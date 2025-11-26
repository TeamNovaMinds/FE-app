// app/skin/index.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { skinService } from '@/src/features/skin/service';
import { RefrigeratorSkinListItem } from '@/src/features/skin/types';
import { Colors } from '@/constants/Colors'; // 프로젝트의 색상 상수 사용 권장
import { getImageSource } from '@/src/features/skin/skinAssets';

type TabType = 'SHOP' | 'OWNED';

export default function SkinListScreen() {
    const router = useRouter();
    const { tab } = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState<TabType>('SHOP');

    // URL 파라미터로 전달된 탭이 있으면 설정
    useEffect(() => {
        if (tab === 'OWNED' || tab === 'SHOP') {
            setActiveTab(tab as TabType);
        }
    }, [tab]);

    // React Query 데이터 페칭
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['skins', activeTab],
        queryFn: () =>
            activeTab === 'SHOP'
                ? skinService.getShopSkins()
                : skinService.getOwnedSkins(),
    });

    const handleItemPress = (skinId: number) => {
        router.push(`/skin/${skinId}`);
    };

    const renderItem = ({ item }: { item: RefrigeratorSkinListItem }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleItemPress(item.id)}
            activeOpacity={0.8}
        >
            <View style={styles.thumbnailContainer}>
                {item.thumbnailUrl ? (
                    <Image source={getImageSource(item.thumbnailUrl)} style={styles.thumbnail} />
                ) : (
                    <View style={[styles.thumbnail, { backgroundColor: '#ddd' }]} />
                )}
                {item.equipped && (
                    <View style={styles.equippedBadge}>
                        <Text style={styles.equippedText}>장착중</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardPrice}>
                    {item.owned ? '보유중' : `${item.price.toLocaleString()} P`}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* 탭 헤더 */}
            <View style={styles.tabContainer}>
    <TouchableOpacity
        style={[styles.tabButton, activeTab === 'SHOP' && styles.activeTab]}
    onPress={() => setActiveTab('SHOP')}
>
    <Text style={[styles.tabText, activeTab === 'SHOP' && styles.activeTabText]}>
    스킨 상점
    </Text>
    </TouchableOpacity>
    <TouchableOpacity
    style={[styles.tabButton, activeTab === 'OWNED' && styles.activeTab]}
    onPress={() => setActiveTab('OWNED')}
>
    <Text style={[styles.tabText, activeTab === 'OWNED' && styles.activeTabText]}>
    보유 스킨
    </Text>
    </TouchableOpacity>
    </View>

    {/* 컨텐츠 영역 */}
    {isLoading ? (
        <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90E2" />
        </View>
    ) : error ? (
        <View style={styles.center}>
            <Text>데이터를 불러오는데 실패했습니다.</Text>
    <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
        <Text>다시 시도</Text>
    </TouchableOpacity>
    </View>
    ) : (
        <FlatList
            data={data?.skins || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>
    {activeTab === 'SHOP' ? '판매 중인 스킨이 없습니다.' : '보유 중인 스킨이 없습니다.'}
        </Text>
        </View>
    }
        />
    )}
    </View>
);
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: { borderBottomColor: '#4A90E2' },
    tabText: { fontSize: 16, color: '#888', fontWeight: '600' },
    activeTabText: { color: '#4A90E2' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },
    columnWrapper: { justifyContent: 'space-between' },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    thumbnailContainer: { position: 'relative' },
    thumbnail: { width: '100%', height: 140, resizeMode: 'cover' },
    equippedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#4A90E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    equippedText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    cardContent: { padding: 12 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4, color: '#333' },
    cardPrice: { fontSize: 13, color: '#666' },
    retryButton: { marginTop: 10, padding: 10 },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#999', fontSize: 15 },
});