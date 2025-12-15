// src/features/follow/types.ts

/**
 * 초대 상태 타입
 */
export type InvitationStatus =
  | 'MUTUAL_FOLLOW_INVITE'        // 맞팔이고 초대 가능
  | 'ALREADY_SAME_REFRIGERATOR'   // 이미 같은 냉장고 사용 중
  | 'INVITATION_PENDING'          // 이미 초대장 보냄 (대기 중)
  | 'NOT_MUTUAL';                 // 맞팔 아님

/**
 * 팔로우 멤버 정보
 */
export interface FollowMemberInfo {
  nickname: string;
  profileImgUrl: string | null;
  invitationStatus: InvitationStatus;
}

/**
 * 팔로워 목록 응답
 */
export interface FollowersResponse {
  followers: FollowMemberInfo[];
}

/**
 * 팔로잉 목록 응답
 */
export interface FollowingsResponse {
  followings: FollowMemberInfo[];
}

/**
 * API 공통 응답 래퍼
 */
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T | null;
}