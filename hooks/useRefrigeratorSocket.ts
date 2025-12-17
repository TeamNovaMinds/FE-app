import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from '../utils/tokenStorage';

// 백엔드 주소
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

interface SocketMessage {
    type: string;
    message: string;
}

/**
 * @param refrigeratorId 구독할 냉장고 ID
 * @param onUpdate 재료 변경 알림이 왔을 때 실행할 콜백 함수 (데이터 다시 불러오기 등)
 */
export const useRefrigeratorSocket = (refrigeratorId: number | null, onUpdate: () => void) => {
    const client = useRef<Client | null>(null);
    const onUpdateRef = useRef(onUpdate); // onUpdate를 ref로 관리하여 재연결 방지

    // onUpdate가 변경되면 ref 업데이트
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        // 냉장고 ID가 없으면 연결하지 않음
        if (!refrigeratorId) {
            console.log('⚠️ WebSocket: Not connecting - refrigeratorId:', refrigeratorId);
            return;
        }

        // 비동기로 토큰을 가져오고 웹소켓 연결
        const connectWebSocket = async () => {
            const token = await getAccessToken();

            if (!token) {
                console.log('⚠️ WebSocket: Not connecting - token not found');
                return;
            }

            // SockJS 엔드포인트 URL 생성 (http/https 그대로 사용)
            const sockJsUrl = BASE_URL + '/ws-stomp';
            console.log('🔌 WebSocket: Connecting to refrigerator:', refrigeratorId);
            console.log('🔗 SockJS URL:', sockJsUrl);

            // 1. 클라이언트 생성 (SockJS 사용)
            client.current = new Client({
                // brokerURL 대신 webSocketFactory 사용
                webSocketFactory: () => new SockJS(sockJsUrl) as any,
                connectHeaders: {
                    Authorization: `Bearer ${token}`, // STOMP 프레임 헤더 (StompHandler 검증용)
                },

                debug: (str) => {
                    console.log('[WS Debug]:', str);
                },

                // 재연결 설정
                reconnectDelay: 5000,

                // 2. 연결 성공 시 실행될 로직
                onConnect: () => {
                    console.log('🔗 WebSocket Connected to Refrigerator:', refrigeratorId);

                    // 3. 구독 (Subscribe) 설정
                    // 백엔드: sendRefreshSignal 메서드의 destination 참고 ("/sub/refrigerator/{id}")
                    const subscription = client.current?.subscribe(`/sub/refrigerator/${refrigeratorId}`, (message) => {
                        if (message.body) {
                            try {
                                const parsedBody: SocketMessage = JSON.parse(message.body);

                                // 메시지 타입이 'INGREDIENT_UPDATE'이면 화면 갱신 함수 실행
                                if (parsedBody.type === 'INGREDIENT_UPDATE') {
                                    console.log('🔄 Ingredient updated, refreshing...');
                                    onUpdateRef.current(); // ref를 통해 최신 콜백 호출
                                }
                            } catch (error) {
                                console.error('❌ Failed to parse WebSocket message:', error);
                            }
                        }
                    });

                    console.log('✅ Subscribed to /sub/refrigerator/' + refrigeratorId, subscription?.id);
                },

                // 연결 끊김 혹은 에러 처리
                onStompError: (frame) => {
                    console.error('❌ STOMP Error:', frame.headers['message']);
                    console.error('Error details:', frame.body);
                },

                onWebSocketClose: (evt) => {
                    console.warn('⚠️ WebSocket Closed:', evt.reason || 'No reason provided');
                    console.warn('Close code:', evt.code);
                },

                onWebSocketError: (evt) => {
                    console.error('❌ WebSocket Error:', evt);
                },
            });

            // 4. 활성화 (연결 시작)
            client.current.activate();
        };

        connectWebSocket();

        // 5. 컴포넌트 언마운트 시 연결 종료 (Cleanup)
        return () => {
            console.log('🔌 WebSocket Disconnecting...');
            client.current?.deactivate();
        };
    }, [refrigeratorId]); // refrigeratorId만 의존성으로 설정
};