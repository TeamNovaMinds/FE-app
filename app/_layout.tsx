import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken, getUserInfo } from '../utils/tokenStorage';
import axiosInstance from '@/api/axiosInstance';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 데이터를 fresh하게 유지
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지 (이전 cacheTime)
      retry: 1, // 실패 시 1번만 재시도
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
      refetchOnMount: false, // 마운트 시 자동 refetch 비활성화 (캐시 우선 사용)
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { login, setLoading } = useAuthStore();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 앱 시작 시 토큰 확인하여 자동 로그인 및 주요 데이터 prefetch
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = await getAccessToken();
        if (accessToken) {
          // 저장된 사용자 정보 불러오기
          const userInfo = await getUserInfo();
          if (userInfo) {
            // 토큰과 사용자 정보가 모두 있으면 로그인 상태로 설정
            login(userInfo);

            // 주요 데이터 미리 로딩 (백그라운드에서 실행)
            prefetchMainData();
          }
        }
      } catch (error) {
        console.error('자동 로그인 체크 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    // 주요 데이터 prefetch 함수
    const prefetchMainData = async () => {
      try {
        // 1. 프로필 정보 prefetch
        await queryClient.prefetchQuery({
          queryKey: ['profile'],
          queryFn: async () => {
            const response = await axiosInstance.get('/api/auth/me');
            if (response.data.isSuccess) {
              return response.data.result;
            }
            throw new Error(response.data.message || '프로필 조회 실패');
          },
        });

        // 2. 냉장고 재료 개수 prefetch
        await queryClient.prefetchQuery({
          queryKey: ['ingredientCount'],
          queryFn: async () => {
            const response = await axiosInstance.get('/api/refrigerators/stored-items/count');
            if (response.data.isSuccess) {
              return {
                fridge: response.data.result.refrigeratorCount,
                freezer: response.data.result.freezerCount,
                room: response.data.result.roomTempCount,
              };
            }
            throw new Error(response.data.message || '재료 개수를 불러오는데 실패했습니다.');
          },
        });

        // 3. 레시피 리스트 prefetch (최신순, 20개)
        await queryClient.prefetchQuery({
          queryKey: ['recipes', { sortBy: 'LATEST', size: 20 }],
          queryFn: async () => {
            const response = await axiosInstance.get('/api/recipes', {
              params: { sortBy: 'LATEST', size: 20 },
            });
            if (response.data.isSuccess) {
              return response.data.result.recipes || [];
            }
            throw new Error(response.data.message || '레시피를 불러오는데 실패했습니다.');
          },
        });

        console.log('✅ 주요 데이터 prefetch 완료');
      } catch (error) {
        console.error('Prefetch 에러:', error);
        // prefetch 실패는 조용히 처리 (사용자 경험에 영향 없음)
      }
    };

    checkAuth();
  }, [login, setLoading]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

    return (
        // 2. ThemeProvider를 GestureHandlerRootView로 감쌉니다. (크래시 해결)
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                        {/* 3. 재료 검색 (바텀 시트) 스크린 추가 (버튼 작동) */}
                        <Stack.Screen
                            name="ingredient-search" // app/ingredient-search.tsx
                            options={{
                                presentation: 'transparentModal', // 투명 모달
                                animation: 'slide_from_bottom', // 아래에서 위로
                                title: '재료 검색',
                                headerShown: false,
                                gestureEnabled: false, // 커스텀 제스처 사용을 위해 시스템 제스처 비활성화
                            }}
                        />

                        {/* 4. 재료 정보 입력 (모달) 스크린 추가 (버튼 작동) */}
                        <Stack.Screen
                            name="add-ingredient-form/[ingredientId]" // app/add-ingredient-form/[ingredientId].tsx
                            options={{
                                presentation: 'modal', // 일반 모달
                                title: '재료 정보 입력',
                            }}
                        />

                        {/* 1. 재료 상세 스크린 추가 (바텀 시트 스타일) */}
                        <Stack.Screen
                            name="ingredient/[storedItemId]" // app/ingredient/[storedItemId].tsx
                            options={{
                                presentation: 'transparentModal', // 투명 모달
                                animation: 'slide_from_bottom', // 아래에서 위로
                                title: '재료 정보',
                                headerShown: false, // 커스텀 헤더를 사용할 것이므로 false
                                gestureEnabled: false, // 커스텀 제스처 사용을 위해 시스템 제스처 비활성화
                            }}
                        />

                        <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="auto" />
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}