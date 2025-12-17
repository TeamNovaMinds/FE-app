import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/api/notifications';

/**
 * 읽지 않은 알림 개수를 조회하는 훅
 */
export function useUnreadNotificationCount() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadCount,
    refetchInterval: 60000, // 1분마다 자동 refetch
  });

  const unreadCount = data?.result.unreadCount || 0;

  return {
    unreadCount,
    isLoading,
    refetch,
  };
}