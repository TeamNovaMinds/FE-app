// src/features/skin/types.ts

// 스킨 상세 이미지 정보
export interface RefrigeratorSkinImage {
    imageOrder: number;
    imageUrl: string;
}

// 스킨 리스트 아이템 (목록 조회용)
export interface RefrigeratorSkinListItem {
    id: number;
    name: string;
    description: string;
    price: number;
    thumbnailUrl: string;
    owned: boolean;
    equipped: boolean;
}

// 페이징 응답 래퍼
export interface RefrigeratorSkinsPageResponse {
    skins: RefrigeratorSkinListItem[];
    nextCursor: number | null;
    hasNext: boolean;
}

// 스킨 상세 정보 (상세 조회용)
export interface RefrigeratorSkinDetail {
    id: number;
    name: string;
    description: string;
    skinImageUrls: RefrigeratorSkinImage[];
    owned: boolean;
    equipped: boolean;
    price?: number; // 상세 조회 DTO에는 없지만 구매 로직 등에서 필요할 수 있어, 리스트 데이터나 별도 로직으로 보완 고려 (현재 백엔드 DTO 기준으로는 없음)
}