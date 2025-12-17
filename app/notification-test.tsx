import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '@/hooks/useNotifications';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

/**
 * 알림 테스트 화면 (개발 전용)
 */
export default function NotificationTestScreen() {
  const { expoPushToken, registerDeviceToBackend } = useNotifications();
  const [testTitle, setTestTitle] = useState('테스트 알림');
  const [testBody, setTestBody] = useState('알림 테스트입니다!');
  const [testDeepLink, setTestDeepLink] = useState('/notifications');

  /**
   * 로컬 알림 발송 (테스트용)
   */
  const sendLocalNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: testTitle,
          body: testBody,
          data: {
            deepLink: testDeepLink,
            type: 'RECIPE_LIKE',
          },
        },
        trigger: null, // 즉시 발송
      });

      Alert.alert('성공', '로컬 알림이 발송되었습니다!');
    } catch (error) {
      Alert.alert('에러', `알림 발송 실패: ${error}`);
    }
  };

  /**
   * 예약 알림 발송 (3초 후)
   */
  const sendScheduledNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: testTitle,
          body: testBody,
          data: {
            deepLink: testDeepLink,
            type: 'RECIPE_LIKE',
          },
        },
          trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, // 명시적 타입 지정
              seconds: 3,
              repeats: false, // 반복 여부도 명시하는 것이 안전합니다
          },
      });

      Alert.alert('성공', '3초 후 알림이 발송됩니다!');
    } catch (error) {
      Alert.alert('에러', `알림 예약 실패: ${error}`);
    }
  };

  /**
   * Push Token 복사
   */
  const copyPushToken = () => {
    if (expoPushToken) {
      Clipboard.setString(expoPushToken);
      Alert.alert('복사 완료', 'Push Token이 클립보드에 복사되었습니다!');
    } else {
      Alert.alert('에러', 'Push Token이 아직 발급되지 않았습니다.');
    }
  };

  /**
   * Expo Push Tool 열기
   */
  const openExpoPushTool = () => {
    Alert.alert(
      'Expo Push Tool',
      '1. Push Token을 복사합니다\n2. 브라우저에서 https://expo.dev/notifications 를 엽니다\n3. Push Token을 붙여넣고 알림을 발송합니다',
      [
        { text: '취소', style: 'cancel' },
        {
          text: 'Token 복사',
          onPress: copyPushToken,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>알림 테스트</Text>
        <Text style={styles.subtitle}>개발 전용 화면입니다</Text>

        {/* Push Token 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Token</Text>
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenText} numberOfLines={1}>
              {expoPushToken || '발급 중...'}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={copyPushToken}>
              <Text style={styles.buttonText}>복사</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={openExpoPushTool}>
              <Text style={styles.buttonTextSecondary}>Expo Tool 사용법</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 디바이스 등록 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>디바이스 등록</Text>
          <TouchableOpacity style={styles.button} onPress={registerDeviceToBackend}>
            <Text style={styles.buttonText}>백엔드에 등록</Text>
          </TouchableOpacity>
        </View>

        {/* 로컬 알림 테스트 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>로컬 알림 테스트</Text>

          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            value={testTitle}
            onChangeText={setTestTitle}
            placeholder="알림 제목"
          />

          <Text style={styles.label}>내용</Text>
          <TextInput
            style={styles.input}
            value={testBody}
            onChangeText={setTestBody}
            placeholder="알림 내용"
            multiline
          />

          <Text style={styles.label}>Deep Link</Text>
          <TextInput
            style={styles.input}
            value={testDeepLink}
            onChangeText={setTestDeepLink}
            placeholder="/notifications"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={sendLocalNotification}>
              <Text style={styles.buttonText}>즉시 발송</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={sendScheduledNotification}>
              <Text style={styles.buttonTextSecondary}>3초 후 발송</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 빠른 테스트 버튼 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 테스트</Text>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => {
              setTestTitle('레시피 좋아요');
              setTestBody('홍길동님이 회원님의 "김치찌개" 레시피를 좋아합니다!');
              setTestDeepLink('/recipe/1');
              setTimeout(sendLocalNotification, 100);
            }}
          >
            <Text style={styles.quickButtonText}>❤️ 레시피 좋아요 알림</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => {
              setTestTitle('유통기한 알림');
              setTestBody('우유의 유통기한이 3일 남았습니다!');
              setTestDeepLink('/notifications');
              setTimeout(sendLocalNotification, 100);
            }}
          >
            <Text style={styles.quickButtonText}>⏰ 유통기한 알림</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => {
              setTestTitle('새 댓글');
              setTestBody('홍길동님이 회원님의 레시피에 댓글을 남겼습니다.');
              setTestDeepLink('/recipe/1');
              setTimeout(sendLocalNotification, 100);
            }}
          >
            <Text style={styles.quickButtonText}>💬 댓글 알림</Text>
          </TouchableOpacity>
        </View>

        {/* 알림 목록으로 이동 */}
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => router.push('/notifications')}
        >
          <Text style={styles.navigateButtonText}>📬 알림 목록 보기</Text>
        </TouchableOpacity>

        {/* 설명 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 테스트 방법</Text>
          <Text style={styles.infoText}>
            1. <Text style={styles.bold}>로컬 알림 테스트:</Text> 위 버튼으로 즉시 테스트
            {'\n'}
            2. <Text style={styles.bold}>Expo Push Tool:</Text> Push Token 복사 → expo.dev/notifications
            {'\n'}
            3. <Text style={styles.bold}>백엔드 테스트:</Text> 실제 액션 수행 (좋아요, 댓글 등)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  tokenContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#495057',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#212529',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  buttonTextSecondary: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  quickButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  quickButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  navigateButton: {
    backgroundColor: '#28A745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E7F3FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
    color: '#212529',
  },
});