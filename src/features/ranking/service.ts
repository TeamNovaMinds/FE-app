// src/features/ranking/service.ts
import axiosInstance from '@/api/axiosInstance';
import { Top8RankingResponse, AllRankingResponse } from './types';

export const rankingService = {
    // Top 8 랭킹 조회
    getTop8Ranking: async (): Promise<Top8RankingResponse> => {
        const response = await axiosInstance.get('/api/members/ranking/top8');
        if (response.data.isSuccess) {
            return response.data.result;
        }
        throw new Error(response.data.message || '랭킹 정보를 불러오는데 실패했습니다.');
    },

    // 전체 랭킹 조회 (무한 스크롤)
    getAllRanking: async (cursor?: string | null): Promise<AllRankingResponse> => {
        const params = cursor ? { cursor } : {}; // size는 기본값 20 사용
        const response = await axiosInstance.get('/api/members/ranking/all', { params });

        if (response.data.isSuccess) {
            return response.data.result;
        }
        throw new Error(response.data.message || '전체 랭킹을 불러오는데 실패했습니다.');
    }
};