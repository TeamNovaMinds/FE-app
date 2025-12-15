// 초대 아이템 컴포넌트

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { InvitationInfo } from '../types';
import UnknownIcon from '@/assets/icons/unknown.svg';

interface InvitationItemProps {
  invitation: InvitationInfo;
  type: 'received' | 'sent';
  onAccept?: (invitationId: number) => void;
  onReject?: (invitationId: number) => void;
  onCancel?: (invitationId: number) => void;
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING':
      return '대기 중';
    case 'ACCEPTED':
      return '수락됨';
    case 'REJECTED':
      return '거절됨';
    case 'CANCELED':
      return '취소됨';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return '#FF9500';
    case 'ACCEPTED':
      return '#34C759';
    case 'REJECTED':
      return '#FF3B30';
    case 'CANCELED':
      return '#8E8E93';
    default:
      return '#8E8E93';
  }
};

export const InvitationItem: React.FC<InvitationItemProps> = ({
  invitation,
  type,
  onAccept,
  onReject,
  onCancel,
}) => {
  const displayNickname = type === 'received' ? invitation.inviterNickname : invitation.inviteeNickname;
  const displayImage = type === 'received' ? invitation.inviterProfileImage : invitation.inviteeProfileImage;
  const isPending = invitation.status === 'PENDING';

  return (
    <View style={styles.container}>
      <View style={styles.infoSection}>
        {displayImage ? (
          <Image source={{ uri: displayImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImage}>
            <UnknownIcon width={50} height={50} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.nickname}>{displayNickname}</Text>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor(invitation.status) }]}>
              {getStatusText(invitation.status)}
            </Text>
          </View>
        </View>
      </View>

      {isPending && (
        <View style={styles.buttonContainer}>
          {type === 'received' && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => onAccept?.(invitation.id)}
              >
                <Text style={styles.acceptButtonText}>수락</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => onReject?.(invitation.id)}
              >
                <Text style={styles.rejectButtonText}>거절</Text>
              </TouchableOpacity>
            </>
          )}
          {type === 'sent' && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => onCancel?.(invitation.id)}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  textContainer: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4891FF',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  rejectButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8E8E93',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
});