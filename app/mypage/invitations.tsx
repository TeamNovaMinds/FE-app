// app/mypage/invitations.tsx
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
import { Stack, useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationService } from '@/src/features/refrigerator/service';
import { InvitationItem } from '@/src/features/refrigerator/components/InvitationItem';
import { InvitationInfo } from '@/src/features/refrigerator/types';

type TabType = 'received' | 'sent';

export default function InvitationsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const queryClient = useQueryClient();

  // 받은 초대 목록 조회
  const {
    data: receivedData,
    isLoading: isLoadingReceived,
    refetch: refetchReceived,
  } = useQuery({
    queryKey: ['invitations', 'received'],
    queryFn: invitationService.getReceivedInvitations,
    staleTime: 1000 * 60, // 1분
  });

  // 보낸 초대 목록 조회
  const {
    data: sentData,
    isLoading: isLoadingSent,
    refetch: refetchSent,
  } = useQuery({
    queryKey: ['invitations', 'sent'],
    queryFn: invitationService.getSentInvitations,
    staleTime: 1000 * 60, // 1분
  });

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      refetchReceived();
      refetchSent();
    }, [refetchReceived, refetchSent])
  );

  // 초대 수락 mutation
  const acceptMutation = useMutation({
    mutationFn: invitationService.acceptInvitation,
    onSuccess: () => {
      Alert.alert('성공', '초대를 수락했습니다.');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '초대 수락에 실패했습니다.';
      Alert.alert('오류', message);
    },
  });

  // 초대 거절 mutation
  const rejectMutation = useMutation({
    mutationFn: invitationService.rejectInvitation,
    onSuccess: () => {
      Alert.alert('성공', '초대를 거절했습니다.');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '초대 거절에 실패했습니다.';
      Alert.alert('오류', message);
    },
  });

  // 초대 취소 mutation
  const cancelMutation = useMutation({
    mutationFn: invitationService.cancelInvitation,
    onSuccess: () => {
      Alert.alert('성공', '초대를 취소했습니다.');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '초대 취소에 실패했습니다.';
      Alert.alert('오류', message);
    },
  });

  // 액션 핸들러
  const handleAccept = (invitationId: number) => {
    Alert.alert(
      '초대 수락',
      '이 초대를 수락하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수락',
          onPress: () => acceptMutation.mutate(invitationId),
        },
      ]
    );
  };

  const handleReject = (invitationId: number) => {
    Alert.alert(
      '초대 거절',
      '이 초대를 거절하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: () => rejectMutation.mutate(invitationId),
        },
      ]
    );
  };

  const handleCancel = (invitationId: number) => {
    Alert.alert(
      '초대 취소',
      '이 초대를 취소하시겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '취소',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(invitationId),
        },
      ]
    );
  };

  const handleRefreshData = useCallback(() => {
    refetchReceived();
    refetchSent();
  }, [refetchReceived, refetchSent]);

  const currentData = activeTab === 'received' ? receivedData?.invitations : sentData?.invitations;
  const isLoading = activeTab === 'received' ? isLoadingReceived : isLoadingSent;

  const renderItem = ({ item }: { item: InvitationInfo }) => (
    <InvitationItem
      invitation={item}
      type={activeTab}
      onAccept={handleAccept}
      onReject={handleReject}
      onCancel={handleCancel}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {activeTab === 'received' ? '받은 초대가 없습니다.' : '보낸 초대가 없습니다.'}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '냉장고 초대 관리',
          headerTintColor: '#000',
          headerBackTitle: '마이페이지',
        }}
      />
      <View style={styles.container}>
        {/* 탭 헤더 */}
        <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            받은 초대 {receivedData?.invitations?.length ?? 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            보낸 초대 {sentData?.invitations?.length ?? 0}
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
          keyExtractor={(item, index) => `${item.id}-${index}`}
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
    </>
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