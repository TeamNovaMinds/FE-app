import axiosInstance from './axiosInstance';
import { ApiResponse } from '@/types/api';
import {
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types/notification';

/**
 * 디바이스 등록 API
 */
export const registerDevice = async (
  data: DeviceRegistrationRequest
): Promise<ApiResponse<DeviceRegistrationResponse>> => {
  const response = await axiosInstance.post('/api/devices', data);
  return response.data;
};

/**
 * 알림 목록 조회 API
 */
export const getNotifications = async (
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<NotificationListResponse>> => {
  const response = await axiosInstance.get('/api/notifications', {
    params: { page, size },
  });
  return response.data;
};

/**
 * 읽지 않은 알림 개수 조회 API
 */
export const getUnreadCount = async (): Promise<ApiResponse<UnreadCountResponse>> => {
  const response = await axiosInstance.get('/api/notifications/unread-count');
  return response.data;
};

/**
 * 알림 읽음 처리 API
 */
export const markAsRead = async (notificationId: number): Promise<ApiResponse<string>> => {
  const response = await axiosInstance.patch(`/api/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * 모든 알림 읽음 처리 API
 */
export const markAllAsRead = async (): Promise<ApiResponse<string>> => {
  const response = await axiosInstance.patch('/api/notifications/read-all');
  return response.data;
};