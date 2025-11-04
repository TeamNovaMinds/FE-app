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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 데이터를 fresh하게 유지
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지 (이전 cacheTime)
      retry: 1, // 실패 시 1번만 재시도
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { login, setLoading } = useAuthStore();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 앱 시작 시 토큰 확인하여 자동 로그인
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
          }
        }
      } catch (error) {
        console.error('자동 로그인 체크 실패:', error);
      } finally {
        setLoading(false);
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

                        <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="auto" />
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}