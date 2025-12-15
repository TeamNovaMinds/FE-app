// 냉장고 초대 관련 API 서비스

import axiosInstance from '@/api/axiosInstance';
import { InvitationListResponse } from './types';

export const invitationService = {
  // 받은 초대 목록 조회
  getReceivedInvitations: async (): Promise<InvitationListResponse> => {
    const response = await axiosInstance.get('/api/refrigerators/invitations/received');
    if (response.data.isSuccess) {
      return response.data.result;
    }
    throw new Error(response.data.message || '받은 초대 목록 조회 실패');
  },

  // 보낸 초대 목록 조회
  getSentInvitations: async (): Promise<InvitationListResponse> => {
    const response = await axiosInstance.get('/api/refrigerators/invitations/sent');
    if (response.data.isSuccess) {
      return response.data.result;
    }
    throw new Error(response.data.message || '보낸 초대 목록 조회 실패');
  },

  // 초대 수락
  acceptInvitation: async (invitationId: number): Promise<void> => {
    const response = await axiosInstance.post(`/api/refrigerators/invitations/${invitationId}/accept`);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || '초대 수락 실패');
    }
  },

  // 초대 거절
  rejectInvitation: async (invitationId: number): Promise<void> => {
    const response = await axiosInstance.post(`/api/refrigerators/invitations/${invitationId}/reject`);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || '초대 거절 실패');
    }
  },

  // 초대 취소
  cancelInvitation: async (invitationId: number): Promise<void> => {
    const response = await axiosInstance.delete(`/api/refrigerators/invitations/${invitationId}/cancel`);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || '초대 취소 실패');
    }
  },
};