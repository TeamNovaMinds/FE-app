// src/features/member-refrigerator/types.ts
import { StoredIngredient } from '@/src/features/home/types';

export interface MemberRefrigeratorSummary {
    nickname: string;
    profileImageUrl: string | null;
    isFollowing: boolean;
    isMe: boolean;
    equippedSkinId: number | null;
    recipeCount: number;
    followerCount: number;
    followingCount: number;
    pointRanking: number | null;
}

export interface MemberRefrigeratorItemsResponse {
    nickname: string;
    profileImageUrl: string | null;
    isFollowing: boolean;
    isMe: boolean;
    equippedSkinId: number | null;
    storedIngredients: StoredIngredient[];
    addedCount?: number;
}
