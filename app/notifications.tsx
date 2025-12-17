
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead } from '@/api/notifications';
import { NotificationItem } from '@/types/notification';
import { format } from 'date-fns';

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  // 알림 목록 조회
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getNotifications(page, 20),
  });

  // 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  // 모두 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const notifications = data?.result.notifications || [];
  const unreadCount = data?.result.unreadCount || 0;

  /**
   * 알림 클릭 핸들러
   */
  const handleNotificationPress = async (item: NotificationItem) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!item.isRead) {
      await markAsReadMutation.mutateAsync(item.id);
    }

    // Deep Link로 이동
    if (item.deepLink) {
      router.push(item.deepLink as any);
    }
  };

  /**
   * 알림 타입에 따른 아이콘 반환
   */
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EXPIRATION_ALERT':
        return '⏰';
      case 'RECIPE_LIKE':
        return '❤️';
      case 'RECIPE_COMMENT':
        return '💬';
      case 'RECIPE_COMMENT_REPLY':
        return '↩️';
      case 'REFRIGERATOR_INVITATION':
        return '📬';
      case 'FOLLOW':
        return '👤';
      case 'REFRIGERATOR_ITEM_ADDED':
        return '🥬';
      default:
        return '🔔';
    }
  };

  /**
   * 알림 아이템 렌더링
   */
  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{getNotificationIcon(item.type)}</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.timestamp}>
          {format(new Date(item.createdAt), 'yyyy년 M월 d일 HH:mm')}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadBadge} />}
    </TouchableOpacity>
  );

  /**
   * 빈 목록 렌더링
   */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyText}>알림이 없습니다</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알림</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Text style={styles.markAllButton}>모두 읽음</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 읽지 않은 알림 개수 */}
      {unreadCount > 0 && (
        <View style={styles.unreadCountContainer}>
          <Text style={styles.unreadCountText}>읽지 않은 알림 {unreadCount}개</Text>
        </View>
      )}

      {/* 알림 목록 */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  markAllButton: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  unreadCountContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#E7F3FF',
  },
  unreadCountText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadItem: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  body: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2',
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#ADB5BD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});