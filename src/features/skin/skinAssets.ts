// src/features/skin/skinAssets.ts

// 스킨 식별자별 assets 매핑
export const SKIN_ASSETS = {
    default: {
        thumbnail: require('@/assets/images/room.png'),
        images: [require('@/assets/images/room.png')],
        summaryBackground: require('@/assets/images/default.png'), // 요약 화면 배경
        headerBackground: require('@/assets/images/default.png'), // 헤더 배경
        fridgeBackground: require('@/assets/images/default.png'), // 냉장고 내부 배경
        freezerBackground: require('@/assets/images/default.png'), // 냉동고 내부 배경
        roomBackground: require('@/assets/images/room.png'), // 실온 배경
    },
    flower: {
        thumbnail: require('@/assets/images/flower.png'),
        images: [require('@/assets/images/flower.png')],
        summaryBackground: require('@/assets/images/flower.png'), // 요약 화면 배경
        headerBackground: require('@/assets/images/flower.png'), // 헤더 배경
        fridgeBackground: require('@/assets/images/flower.png'), // 냉장고 내부 배경
        freezerBackground: require('@/assets/images/flower.png'), // 냉동고 내부 배경
        roomBackground: require('@/assets/images/flower.png'), // 실온 배경
    },
    // 추가 스킨은 여기에 추가
    // modern: {
    //     thumbnail: require('@/assets/images/modern_thumb.png'),
    //     images: [require('@/assets/images/modern_thumb.png')],
    //     summaryBackground: require('@/assets/images/modern_summary.png'),
    //     headerBackground: require('@/assets/images/modern_header.png'),
    //     fridgeBackground: require('@/assets/images/modern_fridge.png'),
    //     freezerBackground: require('@/assets/images/modern_freezer.png'),
    //     roomBackground: require('@/assets/images/modern_room.png'),
    // },
};

export type SkinIdentifier = keyof typeof SKIN_ASSETS;

/**
 * imageUrl을 React Native Image source로 변환
 * - http/https로 시작하면 원격 URL로 처리
 * - 그 외에는 로컬 assets 식별자로 처리
 */
export const getImageSource = (imageUrl: string) => {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return { uri: imageUrl };
    }

    // 로컬 assets 매핑
    const skinId = imageUrl as SkinIdentifier;
    return SKIN_ASSETS[skinId]?.thumbnail || SKIN_ASSETS.default.thumbnail;
};

/**
 * 스킨 상세 이미지들 가져오기
 */
export const getSkinDetailImages = (imageUrls: Array<{ imageUrl: string; imageOrder: number }>) => {
    return imageUrls.map((img) => {
        if (img.imageUrl.startsWith('http://') || img.imageUrl.startsWith('https://')) {
            return { uri: img.imageUrl };
        }

        const skinId = img.imageUrl as SkinIdentifier;
        const assets = SKIN_ASSETS[skinId] || SKIN_ASSETS.default;
        // imageOrder를 인덱스로 사용, 없으면 첫 번째 이미지
        return assets.images[img.imageOrder] || assets.images[0];
    });
};

/**
 * 스킨 배경 타입
 */
export type BackgroundType = 'summary' | 'header' | 'fridge' | 'freezer' | 'room';

/**
 * 스킨별 배경 이미지 가져오기
 * @param skinId 스킨 식별자
 * @param type 배경 타입 (summary, header, fridge, freezer, room)
 * @returns 배경 이미지 소스
 */
export const getSkinBackground = (skinId: string, type: BackgroundType) => {
    // 원격 URL인 경우
    if (skinId.startsWith('http://') || skinId.startsWith('https://')) {
        return { uri: skinId };
    }

    // 로컬 assets 매핑
    const skin = SKIN_ASSETS[skinId as SkinIdentifier] || SKIN_ASSETS.default;

    switch (type) {
        case 'summary':
            return skin.summaryBackground;
        case 'header':
            return skin.headerBackground;
        case 'fridge':
            return skin.fridgeBackground;
        case 'freezer':
            return skin.freezerBackground;
        case 'room':
            return skin.roomBackground;
        default:
            return skin.summaryBackground;
    }
};