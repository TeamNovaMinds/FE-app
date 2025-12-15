// src/features/follow/service.ts
import axiosInstance from '@/api/axiosInstance';
import {
  ApiResponse,
  FollowersResponse,
  FollowingsResponse,
} from './types';

/**
 * 팔로우 관련 API 서비스
 */
export const followService = {
  /**
   * 팔로워 목록 조회 (나를 팔로우하는 사람들)
   */
  getFollowers: async (): Promise<FollowersResponse> => {
    const response = await axiosInstance.get<ApiResponse<FollowersResponse>>('/api/members/followers');
    const data = response.data;

    if (data && data.isSuccess === false) {
      throw new Error(data.message || '팔로워 목록을 불러오는데 실패했습니다.');
    }

    return data?.result ?? { followers: [] };
  },

  /**
   * 팔로잉 목록 조회 (내가 팔로우하는 사람들)
   */
  getFollowings: async (): Promise<FollowingsResponse> => {
    const response = await axiosInstance.get<ApiResponse<FollowingsResponse>>('/api/members/followings');
    const data = response.data;

    if (data && data.isSuccess === false) {
      throw new Error(data.message || '팔로잉 목록을 불러오는데 실패했습니다.');
    }

    return data?.result ?? { followings: [] };
  },
};