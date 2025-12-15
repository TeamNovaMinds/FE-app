// src/features/follow/components/FollowMemberItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { FollowMemberInfo } from '../types';
import UnknownIcon from '../../../../assets/icons/unknown.svg';

interface FollowMemberItemProps {
  member: FollowMemberInfo;
  tabType: 'followers' | 'followings';
  onInvite?: (nickname: string) => void;
  onFollowToggle?: (nickname: string, isCurrentlyFollowing: boolean) => void;
}

/**
 * 팔로워/팔로잉 목록의 개별 아이템 컴포넌트
 */
export const FollowMemberItem: React.FC<FollowMemberItemProps> = ({
  member,
  tabType,
  onInvite,
  onFollowToggle,
}) => {
  const { nickname, profileImgUrl, invitationStatus } = member;

  // 팔로워 탭: NOT_MUTUAL이면 내가 역팔로우 안 함 (팔로잉 버튼 표시)
  // 팔로잉 탭: 항상 내가 팔로우 중 (언팔로잉 버튼 표시)
  const isFollowing = tabType === 'followings' || invitationStatus !== 'NOT_MUTUAL';

  const renderFollowButton = () => {
    return (
      <TouchableOpacity
        style={[styles.followButton, isFollowing && styles.unfollowButton]}
        onPress={() => onFollowToggle?.(nickname, isFollowing)}
      >
        <Text style={[styles.followButtonText, isFollowing && styles.unfollowButtonText]}>
          {isFollowing ? '언팔로잉' : '팔로잉'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderInviteButton = () => {
    switch (invitationStatus) {
      case 'MUTUAL_FOLLOW_INVITE':
        return (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => onInvite?.(nickname)}
          >
            <Text style={styles.inviteButtonText}>초대하기</Text>
          </TouchableOpacity>
        );

      case 'ALREADY_SAME_REFRIGERATOR':
        return (
          <View style={styles.badgeGreen}>
            <Text style={styles.badgeText}>같은 식구</Text>
          </View>
        );

      case 'INVITATION_PENDING':
        return (
          <View style={styles.badgeYellow}>
            <Text style={styles.badgeText}>초대 대기중</Text>
          </View>
        );

      case 'NOT_MUTUAL':
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Link href={`/member/${nickname}/refrigerator`} asChild>
        <TouchableOpacity style={styles.leftSection}>
          {profileImgUrl ? (
            <Image
              source={{ uri: profileImgUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImageContainer}>
              <UnknownIcon width={48} height={48} />
            </View>
          )}
          <Text style={styles.nickname}>{nickname}</Text>
        </TouchableOpacity>
      </Link>
      <View style={styles.rightSection}>
        {renderInviteButton()}
        {renderFollowButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  nickname: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4891FF',
    backgroundColor: '#fff',
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfollowButton: {
    backgroundColor: '#4891FF',
    borderColor: '#4891FF',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4891FF',
  },
  unfollowButtonText: {
    color: '#fff',
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#34C759',
    borderRadius: 8,
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  badgeGreen: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeYellow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});