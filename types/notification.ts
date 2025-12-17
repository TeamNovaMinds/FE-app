/**
 * 디바이스 타입
 */
export type DeviceType = 'ANDROID' | 'IOS' | 'WEB';

/**
 * 알림 타입
 */
export type NotificationType =
  | 'EXPIRATION_ALERT'           // 유통기한 알림
  | 'RECIPE_LIKE'                // 레시피 좋아요
  | 'RECIPE_COMMENT'             // 레시피 댓글
  | 'RECIPE_COMMENT_REPLY'       // 댓글 답글
  | 'REFRIGERATOR_INVITATION'    // 냉장고 초대
  | 'FOLLOW'                     // 팔로우 알림
  | 'REFRIGERATOR_ITEM_ADDED';   // 냉장고 재료 추가

/**
 * 디바이스 등록 요청
 */
export interface DeviceRegistrationRequest {
  deviceType: DeviceType;
  deviceId: string;
  expoPushToken: string;
}

/**
 * 디바이스 등록 응답
 */
export interface DeviceRegistrationResponse {
  id: number;
  deviceType: DeviceType;
  deviceId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 알림 아이템
 */
export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  deepLink: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

/**
 * 알림 목록 응답
 */
export interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

/**
 * 읽지 않은 알림 개수 응답
 */
export interface UnreadCountResponse {
  unreadCount: number;
}

/**
 * Push Notification Data
 */
export interface PushNotificationData {
  deepLink: string;
  type: NotificationType;
  notificationType: NotificationType;
}