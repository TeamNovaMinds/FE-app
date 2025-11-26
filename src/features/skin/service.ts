// src/features/skin/service.ts
import axiosInstance from '@/api/axiosInstance';
import { RefrigeratorSkinsPageResponse, RefrigeratorSkinDetail } from './types';

export const skinService = {
    // 스킨 상점 목록 조회 (전체 스킨)
    getShopSkins: async (cursorId?: number): Promise<RefrigeratorSkinsPageResponse> => {
        const response = await axiosInstance.get('/api/refrigerators/skins', {
            params: { cursorId },
        });
        return response.data.result;
    },

    // 보유 중인 스킨 목록 조회
    getOwnedSkins: async (cursorId?: number): Promise<RefrigeratorSkinsPageResponse> => {
        const response = await axiosInstance.get('/api/refrigerators/skins/owned', {
            params: { cursorId },
        });
        return response.data.result;
    },

    // 스킨 상세 조회
    getSkinDetail: async (skinId: number): Promise<RefrigeratorSkinDetail> => {
        const response = await axiosInstance.get(`/api/refrigerators/skins/${skinId}`);
        return response.data.result;
    },

    // 스킨 구매
    purchaseSkin: async (skinId: number): Promise<number> => {
        const response = await axiosInstance.post(`/api/refrigerators/skins/${skinId}`);
        return response.data.result;
    },

    // 스킨 장착
    equipSkin: async (skinId: number): Promise<number> => {
        const response = await axiosInstance.post(`/api/refrigerators/skins/${skinId}/equipped`);
        return response.data.result;
    },
};