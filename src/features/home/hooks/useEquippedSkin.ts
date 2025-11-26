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

    // 스킨 식별자 가져오기
    const skinId = data?.thumbnailUrl as SkinIdentifier;
    const skinAsset = skinId ? SKIN_ASSETS[skinId] : SKIN_ASSETS.default;

    // 장착된 스킨의 배경 이미지 반환
    const backgroundImage = data?.thumbnailUrl
        ? getImageSource(data.thumbnailUrl)
        : require('@/assets/images/room.png'); // 기본 스킨

    // 요약 화면 배경 이미지 반환
    const summaryBackgroundImage = skinAsset?.summaryBackground || require('@/assets/images/default.png');

    // 헤더 배경 이미지 반환
    const headerBackgroundImage = skinAsset?.headerBackground || require('@/assets/images/default.png');

    // 냉장고 내부 배경 이미지 반환
    const fridgeBackgroundImage = skinAsset?.fridgeBackground || require('@/assets/images/default.png');

    // 냉동고 내부 배경 이미지 반환
    const freezerBackgroundImage = skinAsset?.freezerBackground || require('@/assets/images/default.png');

    // 실온 내부 배경 이미지 반환
    const roomBackgroundImage = skinAsset?.roomBackground || require('@/assets/images/room.png');

    return {
        equippedSkin: data,
        backgroundImage,
        summaryBackgroundImage,
        headerBackgroundImage,
        fridgeBackgroundImage,
        freezerBackgroundImage,
        roomBackgroundImage,
        isLoading,
        error,
    };
};