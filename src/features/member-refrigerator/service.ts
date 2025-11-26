// src/features/member-refrigerator/service.ts
import axiosInstance from '@/api/axiosInstance';
import { STORAGE_TYPE_MAP } from '@/src/features/home/constants';
import { TabName } from '@/src/features/home/types';
import { MemberRefrigeratorItemsResponse, MemberRefrigeratorSummary } from './types';

const normalizeMemberItems = (result: any, fallbackNickname: string): MemberRefrigeratorItemsResponse => ({
    nickname: result?.nickname ?? fallbackNickname,
    profileImageUrl: result?.profileImage ?? result?.profileImageUrl ?? null,
    isFollowing: result?.isFollowing ?? result?.following ?? false,
    isMe: result?.isMe ?? false,
    equippedSkinId: result?.equippedSkinId ?? null,
    storedIngredients: result?.storedIngredients ?? [],
    addedCount: result?.addedCount,
});

export const memberRefrigeratorService = {
    getSummary: async (nickname: string): Promise<MemberRefrigeratorSummary> => {
        const response = await axiosInstance.get(`/api/refrigerators/members/${nickname}/summary`);
        const data = response.data;

        if (data && data.isSuccess === false) {
            throw new Error(data.message || '타인 냉장고 요약 정보를 불러오는데 실패했습니다.');
        }

        const result = data?.result ?? data;

        return {
            nickname: result?.nickname ?? nickname,
            profileImageUrl: result?.profileImage ?? result?.profileImageUrl ?? null,
            isFollowing: result?.isFollowing ?? result?.following ?? false,
            isMe: result?.isMe ?? false,
            equippedSkinId: result?.equippedSkinId ?? null,
            recipeCount: result?.recipeCount ?? 0,
            followerCount: result?.followerCount ?? 0,
            followingCount: result?.followingCount ?? 0,
            pointRanking: result?.pointRank ?? result?.pointRanking ?? null,
        };
    },

    getStoredItems: async (nickname: string, tabName: TabName, keyword?: string): Promise<MemberRefrigeratorItemsResponse> => {
        const storageType = STORAGE_TYPE_MAP[tabName];
        const response = await axiosInstance.get(`/api/refrigerators/members/${nickname}/stored-items`, {
            params: { storageType, keyword },
        });
        const data = response.data;

        if (data && data.isSuccess === false) {
            throw new Error(data.message || '타인 냉장고 재료를 불러오는데 실패했습니다.');
        }

        const result = data?.result ?? data;
        return normalizeMemberItems(result, nickname);
    },
};
