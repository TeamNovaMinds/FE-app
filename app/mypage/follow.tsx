// app/mypage/follow.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { followService } from '@/src/features/follow/service';
import { FollowMemberItem } from '@/src/features/follow/components/FollowMemberItem';
import { FollowMemberInfo } from '@/src/features/follow/types';
import { useAuthStore } from '@/store/authStore';
import { useFocusEffect } from 'expo-router';
import axiosInstance from '@/api/axiosInstance';

type TabType = 'followers' | 'followings';

export default function FollowScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('followers');
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // 팔로워 목록 조회
  const {
    data: followersData,
    isLoading: isLoadingFollowers,
    refetch: refetchFollowers,
  } = useQuery({
    queryKey: ['followers'],
    queryFn: followService.getFollowers,
    staleTime: 1000 * 60, // 1분
  });

  // 팔로잉 목록 조회
  const {
    data: followingsData,
    isLoading: isLoadingFollowings,
    refetch: refetchFollowings,
  } = useQuery({
    queryKey: ['followings'],
    queryFn: followService.getFollowings,
    staleTime: 1000 * 60, // 1분
  });

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      refetchFollowers();
      refetchFollowings();
      // 프로필도 함께 새로고침 (팔로워/팔로잉 카운트 업데이트)
      queryClient.invalidateQueries({ queryKey: ['profile'], refetchType: 'active' });
    }, [refetchFollowers, refetchFollowings, queryClient])
  );

  // WebSocket으로 초대 상태 변경 시 목록 새로고침 함수
  const handleRefreshData = useCallback(() => {
    refetchFollowers();
    refetchFollowings();
    // 프로필 정보도 갱신 (팔로워/팔로잉 카운트 업데이트)
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  }, [refetchFollowers, refetchFollowings, queryClient]);

  // 초대하기 버튼 클릭 핸들러
  const handleInvite = async (nickname: string) => {
    try {
      Alert.alert(
        '냉장고 초대',
        `${nickname}님을 냉장고에 초대하시겠습니까?`,
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '초대하기',
            onPress: async () => {
              try {
                const response = await axiosInstance.post(`/api/refrigerators/invitations/${nickname}/send`);

                if (response.data.isSuccess) {
                  Alert.alert('성공', '초대장을 보냈습니다.');
                  // 목록 새로고침
                  handleRefreshData();
                } else {
                  throw new Error(response.data.message || '초대 실패');
                }
              } catch (error: any) {
                console.error('초대 오류:', error);
                const message = error.response?.data?.message || '초대 중 오류가 발생했습니다.';
                Alert.alert('초대 실패', message);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('초대 오류:', error);
    }
  };

  // 팔로잉/언팔로잉 핸들러
  const handleFollowToggle = async (nickname: string, isCurrentlyFollowing: boolean) => {
    try {
      const endpoint = `/api/members/${encodeURIComponent(nickname)}/following`;

      if (isCurrentlyFollowing) {
        // 언팔로잉
        await axiosInstance.delete(endpoint);
        Alert.alert('성공', '언팔로잉했습니다.');
      } else {
        // 팔로잉
        await axiosInstance.post(endpoint);
        Alert.alert('성공', '팔로잉했습니다.');
      }

      // 목록 및 프로필 새로고침 (언팔로잉 시 목록에서 사라짐)
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['followings'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error: any) {
      console.error('팔로잉 토글 오류:', error);
      const message = error.response?.data?.message || '처리 중 오류가 발생했습니다.';
      Alert.alert('오류', message);
    }
  };

  const currentData = activeTab === 'followers' ? followersData?.followers : followingsData?.followings;
  const isLoading = activeTab === 'followers' ? isLoadingFollowers : isLoadingFollowings;

  const renderItem = ({ item }: { item: FollowMemberInfo }) => (
    <FollowMemberItem
      member={item}
      tabType={activeTab}
      onInvite={handleInvite}
      onFollowToggle={handleFollowToggle}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {activeTab === 'followers' ? '팔로워가 없습니다.' : '팔로잉이 없습니다.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 탭 헤더 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            팔로워 {followersData?.followers?.length ?? 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followings' && styles.activeTab]}
          onPress={() => setActiveTab('followings')}
        >
          <Text style={[styles.tabText, activeTab === 'followings' && styles.activeTabText]}>
            팔로잉 {followingsData?.followings?.length ?? 0}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4891FF" />
        </View>
      ) : (
        <FlatList
          data={currentData || []}
          keyExtractor={(item, index) => `${item.nickname}-${index}`}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefreshData}
              tintColor="#4891FF"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4891FF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#4891FF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
  },
});