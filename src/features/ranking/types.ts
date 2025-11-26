// src/features/ranking/types.ts

export interface RankingMember {
    rank: number;
    nickname: string;
    profileImgUrl: string | null;
    point: number;
}

export interface Top8RankingResponse {
    rankings: RankingMember[];
}

export interface AllRankingResponse {
    rankings: RankingMember[];
    nextCursor: string | null; // API 명세상 cursor는 String
    hasNext: boolean;
}