# JustFridge 알림 기능 사용 가이드

백엔드에서 Expo를 통한 알림 기능이 구현되었으며, 프론트엔드에서도 호환되도록 알림 관련 코드를 구현했습니다.

## 📦 설치된 패키지

```bash
npx expo install expo-notifications expo-device
```

- `expo-notifications`: Push 알림 수신 및 처리
- `expo-device`: 디바이스 정보 및 물리 디바이스 확인

## 🔧 구현된 기능

### 1. API 함수 (`api/notifications.ts`)

백엔드 API와 통신하는 함수들:

- `registerDevice()`: 디바이스 등록
- `getNotifications()`: 알림 목록 조회
- `getUnreadCount()`: 읽지 않은 알림 개수 조회
- `markAsRead()`: 특정 알림 읽음 처리
- `markAllAsRead()`: 모든 알림 읽음 처리

### 2. 타입 정의 (`types/notification.ts`)

```typescript
// 디바이스 타입
type DeviceType = 'ANDROID' | 'IOS' | 'WEB';

// 알림 타입
type NotificationType =
  | 'EXPIRATION_ALERT'           // 유통기한 알림
  | 'RECIPE_LIKE'                // 레시피 좋아요
  | 'RECIPE_COMMENT'             // 레시피 댓글
  | 'RECIPE_COMMENT_REPLY'       // 댓글 답글
  | 'REFRIGERATOR_INVITATION'    // 냉장고 초대
  | 'FOLLOW'                     // 팔로우 알림
  | 'REFRIGERATOR_ITEM_ADDED';   // 냉장고 재료 추가
```

### 3. 알림 관리 훅 (`hooks/useNotifications.ts`)

앱 시작 시 자동으로 초기화되며, 다음 기능을 제공합니다:

- Expo Push Token 자동 발급
- 알림 수신 리스너 설정
- 알림 클릭 시 Deep Link 처리
- 백엔드에 디바이스 등록

### 4. 알림 화면 (`app/notifications.tsx`)

- 알림 목록 표시
- 읽음/안읽음 상태 표시
- 알림 클릭 시 읽음 처리 및 Deep Link 이동
- 모두 읽음 처리 버튼
- Pull to Refresh

### 5. 읽지 않은 알림 개수 훅 (`hooks/useUnreadNotificationCount.ts`)

```typescript
const { unreadCount, isLoading, refetch } = useUnreadNotificationCount();
```

1분마다 자동으로 읽지 않은 알림 개수를 업데이트합니다.

## 🚀 사용 방법

### 알림 화면으로 이동

```typescript
import { router } from 'expo-router';

// 알림 화면으로 이동
router.push('/notifications');
```

### 읽지 않은 알림 개수 표시 (예: 마이페이지)

```typescript
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';

function MyPage() {
  const { unreadCount } = useUnreadNotificationCount();

  return (
    <TouchableOpacity onPress={() => router.push('/notifications')}>
      <Text>알림</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text>{unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
```

### Deep Link 처리

백엔드에서 보낸 알림의 `deepLink` 필드에 따라 자동으로 해당 화면으로 이동합니다:

- `/recipe/123` → 레시피 상세 화면
- `/member/nickname/refrigerator` → 타인 냉장고 화면
- 기타 expo-router가 지원하는 모든 경로

## 🔄 자동 초기화

`app/_layout.tsx`에서 자동으로 초기화됩니다:

1. 앱 시작 시 Push Token 발급
2. 알림 리스너 설정
3. 로그인 후 디바이스 등록

## 📱 테스트 방법

### 1. 물리 디바이스에서 테스트

Push 알림은 **물리 디바이스에서만** 작동합니다. 시뮬레이터/에뮬레이터에서는 작동하지 않습니다.

### 2. Expo Go 앱 사용

```bash
npm start
```

실행 후 Expo Go 앱으로 QR 코드 스캔

### 3. 개발 빌드 사용 (권장)

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## 🛠️ 백엔드 API 명세

### 1. 디바이스 등록

```http
POST /api/devices
Authorization: Bearer {token}

{
  "deviceType": "ANDROID" | "IOS" | "WEB",
  "deviceId": "unique-device-id",
  "expoPushToken": "ExponentPushToken[xxxxxx]"
}
```

### 2. 알림 목록 조회

```http
GET /api/notifications?page=0&size=20
Authorization: Bearer {token}
```

### 3. 읽지 않은 알림 개수

```http
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

### 4. 알림 읽음 처리

```http
PATCH /api/notifications/{notificationId}/read
Authorization: Bearer {token}
```

### 5. 모든 알림 읽음 처리

```http
PATCH /api/notifications/read-all
Authorization: Bearer {token}
```

## 📝 주의사항

1. **물리 디바이스 필요**: Push 알림은 시뮬레이터/에뮬레이터에서 작동하지 않습니다.
2. **알림 권한**: 앱 실행 시 사용자에게 알림 권한을 요청합니다.
3. **Foreground 알림**: 앱이 foreground에 있을 때도 알림이 표시됩니다.
4. **Deep Link**: 알림 클릭 시 자동으로 해당 화면으로 이동합니다.

## 🔍 디버깅

콘솔에서 다음 로그를 확인할 수 있습니다:

- `✅ Expo Push Token: ...` - Push Token 발급 성공
- `📬 알림 수신: ...` - 알림 수신
- `👆 알림 클릭: ...` - 알림 클릭
- `🔗 Deep Link: ...` - Deep Link 처리
- `✅ 디바이스 등록 성공: ...` - 디바이스 등록 성공

## 📚 참고 자료

- [Expo Notifications 공식 문서](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications 가이드](https://docs.expo.dev/push-notifications/overview/)