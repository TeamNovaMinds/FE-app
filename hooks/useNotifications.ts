import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants'; // 👈 1. Constants 임포트 추가
import { Platform } from 'react-native';
import { registerDevice } from '@/api/notifications';
import { DeviceType, PushNotificationData } from '@/types/notification';
import { router } from 'expo-router';

/**
 * Expo Notifications 기본 설정
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * 알림 관리 훅
 */
export function useNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string>('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(
        undefined
    );
    const notificationListener = useRef<Notifications.EventSubscription>();
    const responseListener = useRef<Notifications.EventSubscription>();

    useEffect(() => {
        // 1. Push Token 등록
        registerForPushNotificationsAsync().then((token) => {
            if (token) {
                setExpoPushToken(token);
            }
        });

        // 2. 알림 수신 리스너 (앱이 foreground일 때)
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('📬 알림 수신:', notification);
                setNotification(notification);
            }
        );

        // 3. 알림 클릭 리스너 (사용자가 알림을 탭했을 때)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log('👆 알림 클릭:', response);
                handleNotificationResponse(response);
            }
        );

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    /**
     * 알림 클릭 시 Deep Link 처리
     */
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
        const data = response.notification.request.content.data as unknown as PushNotificationData;

        if (data?.deepLink) {
            console.log('🔗 Deep Link:', data.deepLink);
            router.push(data.deepLink as any);
        }
    };

    /**
     * 디바이스 등록 (백엔드에 Push Token 저장)
     */
    const registerDeviceToBackend = async () => {
        if (!expoPushToken) {
            console.warn('⚠️ Push Token이 없습니다.');
            return;
        }

        try {
            const deviceType = getDeviceType();
            const deviceId = getDeviceId();

            const response = await registerDevice({
                deviceType,
                deviceId,
                expoPushToken,
            });

            if (response.isSuccess) {
                console.log('✅ 디바이스 등록 성공:', response.result);
            } else {
                console.error('❌ 디바이스 등록 실패:', response.message);
            }
        } catch (error) {
            console.error('❌ 디바이스 등록 에러:', error);
        }
    };

    return {
        expoPushToken,
        notification,
        registerDeviceToBackend,
    };
}

/**
 * Push Token 등록
 */
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    console.log('🔍 [DEBUG] Push Token 등록 시작');
    console.log('🔍 [DEBUG] Platform.OS:', Platform.OS);
    console.log('🔍 [DEBUG] Device.isDevice:', Device.isDevice);

    if (Platform.OS === 'android') {
        console.log('🔍 [DEBUG] Android 채널 설정 중...');
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        console.log('🔍 [DEBUG] 물리 디바이스 확인 완료');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('🔍 [DEBUG] 기존 권한 상태:', existingStatus);
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            console.log('🔍 [DEBUG] 알림 권한 요청 중...');
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log('🔍 [DEBUG] 권한 요청 결과:', finalStatus);
        }

        if (finalStatus !== 'granted') {
            console.warn('⚠️ 알림 권한이 거부되었습니다.');
            return;
        }

        // Expo Push Token 발급
        try {
            // 👇 2. Project ID 가져오기
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.manifest?.extra?.eas?.projectId;

            console.log('🔍 [DEBUG] Project ID:', projectId);

            if (!projectId) {
                throw new Error('Project ID를 찾을 수 없습니다.');
            }

            console.log('🔍 [DEBUG] Push Token 발급 시도 중...');

            // 👇 3. projectId를 옵션으로 전달
            token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId: projectId,
                })
            ).data;

            console.log('✅ Expo Push Token:', token);
        } catch (error) {
            console.error('❌ [DEBUG] Push Token 발급 에러:', error);
            console.warn('⚠️ Push Token 발급 실패:', error);
            return;
        }
    } else {
        console.warn('⚠️ 물리 디바이스에서만 Push 알림을 사용할 수 있습니다.');
        console.log('🔍 [DEBUG] Device.isDevice가 false입니다. 시뮬레이터 또는 웹 환경일 수 있습니다.');
    }

    return token;
}

/**
 * 디바이스 타입 판별
 */
function getDeviceType(): DeviceType {
    if (Platform.OS === 'android') return 'ANDROID';
    if (Platform.OS === 'ios') return 'IOS';
    return 'WEB';
}

/**
 * 디바이스 ID 생성 (고유 식별자)
 */
function getDeviceId(): string {
    return `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}