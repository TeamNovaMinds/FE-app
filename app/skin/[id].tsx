import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skinService } from '@/src/features/skin/service';
import { getSkinDetailImages } from '@/src/features/skin/skinAssets';
import { SvgImage } from '@/components/SvgImage';

const { width } = Dimensions.get('window');

export default function SkinDetailScreen() {
    const { id } = useLocalSearchParams();
    const queryClient = useQueryClient();
    const skinId = Number(id);

    // 스킨 상세 데이터 조회
    const { data: skin, isLoading, error } = useQuery({
        queryKey: ['skinDetail', skinId],
        queryFn: () => skinService.getSkinDetail(skinId),
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    // 구매 Mutation
    const purchaseMutation = useMutation({
        mutationFn: skinService.purchaseSkin,
        onSuccess: () => {
            Alert.alert('알림', '스킨 구매가 완료되었습니다.');
            queryClient.invalidateQueries({ queryKey: ['skinDetail', skinId] });
            queryClient.invalidateQueries({ queryKey: ['skins'] });
        },
        onError: (err: any) => {
            const errorCode = err.response?.data?.code;
            if (errorCode === 'POINT401') {
                Alert.alert('구매 실패', '포인트가 부족합니다.');
            } else if (errorCode === 'SKIN403') {
                Alert.alert('알림', '이미 보유한 스킨입니다.');
            } else {
                Alert.alert('오류', '구매 중 문제가 발생했습니다.');
            }
        },
    });

    // 장착 Mutation
    const equipMutation = useMutation({
        mutationFn: skinService.equipSkin,
        onSuccess: () => {
            Alert.alert('알림', '스킨이 적용되었습니다.');
            queryClient.invalidateQueries({ queryKey: ['skinDetail'] });
            queryClient.invalidateQueries({ queryKey: ['skins'] });
            queryClient.invalidateQueries({ queryKey: ['equippedSkin'] });
        },
        onError: () => {
            Alert.alert('오류', '스킨 적용에 실패했습니다.');
        },
    });

    const handleActionButton = () => {
        if (!skin) return;

        if (!skin.owned) {
            Alert.alert('스킨 구매', `이 스킨을 구매하시겠습니까?`, [
                { text: '취소', style: 'cancel' },
                { text: '구매', onPress: () => purchaseMutation.mutate(skinId) },
            ]);
        } else if (!skin.equipped) {
            equipMutation.mutate(skinId);
        }
    };

    if (isLoading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4A90E2" /></View>;
    }

    if (error || !skin) {
        return (
            <View style={styles.loadingContainer}>
                <Text>스킨 정보를 불러올 수 없습니다.</Text>
            </View>
        );
    }

    const imageSources = skin ? getSkinDetailImages(skin.skinImageUrls) : [];
    // 첫 번째 이미지만 가져옵니다.
    const mainImage = imageSources.length > 0 ? imageSources[0] : null;

    return (
        <View style={styles.container}>
            {/* 1. 상단 이미지 영역 (고정 이미지, 움직임 없음) */}
            <View style={styles.imageArea}>
                {mainImage ? (
                    <SvgImage
                        source={mainImage}
                        style={styles.detailImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.detailImage, { backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{color:'#888'}}>이미지 없음</Text>
                    </View>
                )}
            </View>

            {/* 2. 하단 텍스트 영역 (흰색 배경, 세로 스크롤 가능) */}
            <View style={styles.textAreaContainer}>
                <ScrollView
                    contentContainerStyle={styles.textContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{skin.name}</Text>
                        {skin.equipped && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>사용중</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.description}>{skin.description}</Text>
                </ScrollView>
            </View>

            {/* 3. 하단 액션 버튼 (고정) */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        skin.equipped && styles.disabledButton,
                        skin.owned && !skin.equipped && styles.equipButton,
                    ]}
                    onPress={handleActionButton}
                    disabled={skin.equipped || purchaseMutation.isPending || equipMutation.isPending}
                >
                    {purchaseMutation.isPending || equipMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.actionButtonText}>
                            {skin.equipped
                                ? '현재 적용 중입니다'
                                : skin.owned
                                    ? '적용하기'
                                    : '구매하기'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // 이미지 영역: 높이 500 고정
    imageArea: {
        height: 500,
        width: width,
        backgroundColor: '#fff', // 이미지가 로드되기 전 배경색
    },
    // 이미지 스타일
    detailImage: {
        width: width,
        height: 500
    },

    // 텍스트 영역 컨테이너: flex: 1로 남은 공간 채움
    textAreaContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    // 텍스트 내용 여백
    textContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 100,
    },

    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginRight: 10 },
    badge: { backgroundColor: '#4A90E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    description: { fontSize: 16, color: '#555', lineHeight: 24 },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    equipButton: {
        backgroundColor: '#50C878',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});