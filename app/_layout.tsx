import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken, getUserInfo } from '../utils/tokenStorage';

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
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
