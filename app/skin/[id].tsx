// app/skin/[id].tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skinService } from '@/src/features/skin/service';
import { LinearGradient } from 'expo-linear-gradient';
import { getSkinDetailImages } from '@/src/features/skin/skinAssets';

const { width } = Dimensions.get('window');

export default function SkinDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const skinId = Number(id);

    // 스킨 상세 데이터 조회
    const { data: skin, isLoading, error } = useQuery({
        queryKey: ['skinDetail', skinId],
        queryFn: () => skinService.getSkinDetail(skinId),
        staleTime: 0, // 항상 최신 데이터 가져오기
        refetchOnMount: 'always', // 화면에 들어올 때마다 refetch
        refetchOnWindowFocus: true, // 포커스 시 refetch
    });

    // 구매 Mutation
    const purchaseMutation = useMutation({
        mutationFn: skinService.purchaseSkin,
        onSuccess: () => {
            Alert.alert('알림', '스킨 구매가 완료되었습니다.');
            queryClient.invalidateQueries({ queryKey: ['skinDetail', skinId] });
            queryClient.invalidateQueries({ queryKey: ['skins'] }); // 리스트 갱신
        },
        onError: (err: any) => {
            // 백엔드 에러 코드 처리는 상황에 맞게 조정
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
            queryClient.invalidateQueries({ queryKey: ['skinDetail'] }); // 모든 스킨 상세 캐시 무효화
            queryClient.invalidateQueries({ queryKey: ['skins'] });
            queryClient.invalidateQueries({ queryKey: ['equippedSkin'] }); // 홈 화면 배경 갱신
        },
        onError: () => {
            Alert.alert('오류', '스킨 적용에 실패했습니다.');
        },
    });

    const handleActionButton = () => {
        if (!skin) return;

        if (!skin.owned) {
            // 구매 로직 (API에서 가격 정보를 상세 DTO에 포함하지 않는 경우 리스트 등에서 가져오거나 백엔드 수정 필요.
            // 여기서는 구매 의사 확인 팝업만 띄움)
            Alert.alert('스킨 구매', `이 스킨을 구매하시겠습니까?`, [
                { text: '취소', style: 'cancel' },
                { text: '구매', onPress: () => purchaseMutation.mutate(skinId) },
            ]);
        } else if (!skin.equipped) {
            // 장착 로직
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

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 이미지 슬라이더 영역 */}
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageSlider}>
                    {imageSources.length > 0 ? (
                        imageSources.map((source, index) => (
                            <Image
                                key={index}
                                source={source}
                                style={styles.detailImage}
                                resizeMode="cover"
                            />
                        ))
                    ) : (
                        <View style={[styles.detailImage, { backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{color:'#888'}}>이미지 없음</Text>
                        </View>
                    )}
                </ScrollView>

                {/* 페이지네이션 인디케이터 등 추가 가능 */}

                <View style={styles.infoContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{skin.name}</Text>
                        {skin.equipped && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>사용중</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.description}>{skin.description}</Text>
                </View>
            </ScrollView>

            {/* 하단 액션 바 */}
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
    scrollContent: { paddingBottom: 100 },
    imageSlider: { height: 350, width: width },
    detailImage: { width: width, height: 350 },
    infoContainer: { padding: 24 },
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
        backgroundColor: '#4A90E2', // 구매 버튼 색상 (파랑)
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    equipButton: {
        backgroundColor: '#50C878', // 장착 버튼 색상 (초록)
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