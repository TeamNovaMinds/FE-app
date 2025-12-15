// 냉장고 초대 관련 타입 정의

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export interface InvitationInfo {
  id: number;
  inviterNickname: string;
  inviterProfileImage: string | null;
  inviteeNickname: string;
  inviteeProfileImage: string | null;
  status: InvitationStatus;
}

export interface InvitationListResponse {
  invitations: InvitationInfo[];
}