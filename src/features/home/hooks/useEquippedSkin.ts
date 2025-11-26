// src/features/home/hooks/useEquippedSkin.ts
import { useQuery } from '@tanstack/react-query';
import { skinService } from '@/src/features/skin/service';
import { getImageSource, SKIN_ASSETS, SkinIdentifier } from '@/src/features/skin/skinAssets';

/**
 * 현재 장착된 스킨을 조회하고 배경 이미지를 반환하는 훅
 */
export const useEquippedSkin = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['equippedSkin'],
        queryFn: async () => {
            const response = await skinService.getOwnedSkins();
            // equipped: true인 스킨 찾기
            const equippedSkin = response.skins.find(skin => skin.equipped);
            return equippedSkin;
        },
        staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    });

    // 장착된 스킨의 배경 이미지 반환
    const backgroundImage = data?.thumbnailUrl
        ? getImageSource(data.thumbnailUrl)
        : require('@/assets/images/room.png'); // 기본 스킨

    // 요약 화면 배경 이미지 반환
    const summaryBackgroundImage = data?.thumbnailUrl
        ? SKIN_ASSETS[data.thumbnailUrl as SkinIdentifier]?.summaryBackground || require('@/assets/images/default.png')
        : require('@/assets/images/default.png'); // 기본 스킨

    // 헤더 배경 이미지 반환
    const headerBackgroundImage = data?.thumbnailUrl
        ? SKIN_ASSETS[data.thumbnailUrl as SkinIdentifier]?.headerBackground || require('@/assets/images/default.png')
        : require('@/assets/images/default.png'); // 기본 스킨

    return {
        equippedSkin: data,
        backgroundImage,
        summaryBackgroundImage,
        headerBackgroundImage,
        isLoading,
        error,
    };
};