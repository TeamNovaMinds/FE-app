# 알림 테스트 가이드

## 방법 1: Expo Push Notification Tool (가장 쉬움)

### 1단계: 앱 실행 및 Push Token 확인

```bash
npm start
```

앱을 실행하면 콘솔에 다음과 같은 로그가 표시됩니다:
```
✅ Expo Push Token: ExponentPushToken[xxxxxxxxxxxxxx]
```

이 토큰을 복사하세요!

### 2단계: Expo Push Notification Tool 사용

1. 브라우저에서 https://expo.dev/notifications 접속
2. "Expo Push Token" 필드에 복사한 토큰 붙여넣기
3. "Message Title"과 "Message Body" 입력
4. "Send a Notification" 버튼 클릭

예시:
- Title: `테스트 알림`
- Message: `알림 테스트입니다!`
- JSON Data (선택):
```json
{
  "deepLink": "/notifications",
  "type": "RECIPE_LIKE"
}
```

---

## 방법 2: 백엔드 API 직접 호출

### 필요한 것
- 로그인된 사용자의 Access Token
- Postman 또는 cURL

### API 엔드포인트

백엔드에 알림 생성 API가 있다면 직접 호출:

```bash
# 예시: 레시피 좋아요 알림 발송
POST /api/notifications/send
Authorization: Bearer {ACCESS_TOKEN}

{
  "userId": 1,
  "type": "RECIPE_LIKE",
  "title": "레시피 좋아요",
  "body": "누군가가 회원님의 레시피를 좋아합니다!",
  "deepLink": "/recipe/123"
}
```

---

## 방법 3: 백엔드에서 직접 발송 (개발 환경)

백엔드 코드에서 직접 테스트:

```java
// NotificationController.java에 테스트 엔드포인트 추가

@PostMapping("/test")
public ApiResponse<String> sendTestNotification(
    @AuthenticationPrincipal UserDetails userDetails
) {
    Member member = memberRepository.findByEmail(userDetails.getUsername())
        .orElseThrow();

    notificationService.sendNotification(
        member,
        NotificationType.RECIPE_LIKE,
        "테스트 알림",
        "테스트 메시지입니다!",
        "/notifications"
    );

    return ApiResponse.onSuccess("테스트 알림 발송 완료");
}
```

그리고 cURL로 호출:
```bash
curl -X POST http://localhost:8080/api/notifications/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 방법 4: 프론트엔드 테스트 화면 추가 (추천!)

개발 환경에서만 사용할 간단한 테스트 화면을 만들 수 있습니다.

---

## 테스트 시나리오

### 1. 기본 알림 테스트
1. ✅ 앱 실행 → Push Token 발급 확인
2. ✅ 디바이스 등록 확인 (백엔드 로그)
3. ✅ Expo Tool로 알림 발송
4. ✅ 앱에서 알림 수신 확인

### 2. Deep Link 테스트
1. ✅ Deep Link가 포함된 알림 발송
2. ✅ 알림 클릭 시 해당 화면 이동 확인

### 3. 읽음 처리 테스트
1. ✅ 알림 목록에서 읽지 않은 알림 확인
2. ✅ 알림 클릭 → 읽음 처리
3. ✅ 읽지 않은 알림 개수 감소 확인

### 4. 백엔드 통합 테스트
1. ✅ 실제 액션 수행 (레시피 좋아요 등)
2. ✅ 알림 자동 발송 확인
3. ✅ 알림 데이터 정확성 확인

---

## 디버깅 팁

### 콘솔 로그 확인
앱 실행 시 다음 로그들을 확인하세요:

```
✅ Expo Push Token: ExponentPushToken[...]  → Push Token 발급 성공
📬 알림 수신: {...}                          → 알림 수신 (foreground)
👆 알림 클릭: {...}                          → 알림 클릭
🔗 Deep Link: /recipe/123                   → Deep Link 처리
✅ 디바이스 등록 성공: {...}                  → 백엔드 디바이스 등록
```

### 문제 해결

**알림이 안 오는 경우:**
1. 물리 디바이스에서 테스트하고 있는지 확인
2. 알림 권한이 허용되어 있는지 확인
3. Push Token이 정상적으로 발급되었는지 확인
4. 네트워크 연결 확인

**Deep Link가 작동하지 않는 경우:**
1. Deep Link 형식이 올바른지 확인 (`/recipe/123` 형식)
2. 해당 경로의 화면이 존재하는지 확인
3. 콘솔에서 Deep Link 처리 로그 확인