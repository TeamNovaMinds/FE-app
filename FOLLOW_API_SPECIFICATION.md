# 팔로워/팔로잉 목록 조회 API 명세서

## 📌 개요
사용자의 팔로워 및 팔로잉 목록을 조회하며, 각 사용자에 대한 **냉장고 초대 가능 여부**를 함께 제공합니다.

---

## 🔐 인증
- **필수**: JWT 토큰 기반 인증 필요
- **헤더**: `Authorization: Bearer {accessToken}`
- 인증되지 않은 경우 `401 Unauthorized` 응답

---

## 📡 API 엔드포인트

### 1. 팔로워 목록 조회

**나를 팔로우하는 사람들의 목록을 조회합니다.**

#### 기본 정보
```
GET /api/members/followers
```

#### Request Headers
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

#### Query Parameters
없음

#### Request Body
없음

#### Response

**Success (200 OK)**
```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공입니다.",
  "result": {
    "followers": [
      {
        "nickname": "user123",
        "profileImgUrl": "https://example.com/profile1.jpg",
        "invitationStatus": "MUTUAL_FOLLOW_INVITE"
      },
      {
        "nickname": "foodlover",
        "profileImgUrl": "https://example.com/profile2.jpg",
        "invitationStatus": "ALREADY_SAME_REFRIGERATOR"
      },
      {
        "nickname": "chef_kim",
        "profileImgUrl": null,
        "invitationStatus": "INVITATION_PENDING"
      },
      {
        "nickname": "recipe_master",
        "profileImgUrl": "https://example.com/profile4.jpg",
        "invitationStatus": "NOT_MUTUAL"
      }
    ]
  }
}
```

**Error (401 Unauthorized)**
```json
{
  "isSuccess": false,
  "code": "MEMBER401",
  "message": "로그인이 필요한 서비스 입니다.",
  "result": null
}
```

---

### 2. 팔로잉 목록 조회

**내가 팔로우하는 사람들의 목록을 조회합니다.**

#### 기본 정보
```
GET /api/members/followings
```

#### Request Headers
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

#### Query Parameters
없음

#### Request Body
없음

#### Response

**Success (200 OK)**
```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공입니다.",
  "result": {
    "followings": [
      {
        "nickname": "user123",
        "profileImgUrl": "https://example.com/profile1.jpg",
        "invitationStatus": "MUTUAL_FOLLOW_INVITE"
      },
      {
        "nickname": "foodlover",
        "profileImgUrl": "https://example.com/profile2.jpg",
        "invitationStatus": "ALREADY_SAME_REFRIGERATOR"
      },
      {
        "nickname": "chef_kim",
        "profileImgUrl": null,
        "invitationStatus": "INVITATION_PENDING"
      },
      {
        "nickname": "recipe_master",
        "profileImgUrl": "https://example.com/profile4.jpg",
        "invitationStatus": "NOT_MUTUAL"
      }
    ]
  }
}
```

**Error (401 Unauthorized)**
```json
{
  "isSuccess": false,
  "code": "MEMBER401",
  "message": "로그인이 필요한 서비스 입니다.",
  "result": null
}
```

---

## 📦 Response DTO 구조

### ApiResponse (공통 응답 래퍼)
```typescript
{
  isSuccess: boolean;    // 성공 여부
  code: string;          // 응답 코드 (예: "COMMON200", "MEMBER401")
  message: string;       // 응답 메시지
  result: T | null;      // 실제 데이터 (에러 시 null)
}
```

### FollowersResponse
```typescript
{
  followers: FollowMemberInfo[]  // 팔로워 배열
}
```

### FollowingsResponse
```typescript
{
  followings: FollowMemberInfo[]  // 팔로잉 배열
}
```

### FollowMemberInfo
```typescript
{
  nickname: string;              // 사용자 닉네임 (필수)
  profileImgUrl: string | null;  // 프로필 이미지 URL (없으면 null)
  invitationStatus: InvitationStatus;  // 초대 상태 enum
}
```

### InvitationStatus (Enum)
```typescript
type InvitationStatus =
  | "MUTUAL_FOLLOW_INVITE"        // 맞팔이고 초대 가능
  | "ALREADY_SAME_REFRIGERATOR"   // 이미 같은 냉장고 사용 중
  | "INVITATION_PENDING"          // 이미 초대장 보냄 (대기 중)
  | "NOT_MUTUAL";                 // 맞팔 아님
```

---

## 📋 필드 상세 설명

### nickname
- **타입**: `string`
- **필수**: ✅
- **설명**: 사용자의 고유 닉네임
- **예시**: `"user123"`, `"foodlover"`

### profileImgUrl
- **타입**: `string | null`
- **필수**: ✅ (값이 `null`일 수 있음)
- **설명**: 프로필 이미지 URL. 프로필 이미지가 설정되지 않은 경우 `null` 반환
- **예시**:
    - 이미지 있음: `"https://example.com/profile.jpg"`
    - 이미지 없음: `null`
- **프론트 처리**: `null`인 경우 기본 이미지 사용

### invitationStatus
- **타입**: `InvitationStatus` (enum)
- **필수**: ✅
- **설명**: 냉장고 초대 가능 여부 및 상태
- **가능한 값**:

| 값 | 의미 | 프론트엔드 UI 표시 |
|---|------|-------------------|
| `MUTUAL_FOLLOW_INVITE` | 맞팔이고 초대 가능 | **"초대하기" 버튼** 표시 (클릭 가능) |
| `ALREADY_SAME_REFRIGERATOR` | 이미 같은 냉장고 사용 중 | **"같은 식구" 뱃지** 표시 (클릭 불가) |
| `INVITATION_PENDING` | 이미 초대장 보냄 (대기 중) | **"초대 대기중" 뱃지** 표시 (클릭 불가) |
| `NOT_MUTUAL` | 맞팔 아님 | **아무것도 표시 안함** |

---

## 🎯 초대 상태 결정 로직

백엔드에서 다음 순서로 상태를 판단합니다:

1. **맞팔 확인**
    - 나 → 상대방 팔로우 AND 상대방 → 나 팔로우
    - 맞팔이 아니면 → `NOT_MUTUAL` (종료)

2. **같은 냉장고 사용 중인지 확인**
    - `상대방의 냉장고 ID == 나의 냉장고 ID`
    - 같으면 → `ALREADY_SAME_REFRIGERATOR` (종료)

3. **초대 대기 중인지 확인**
    - 내가 상대방에게 보낸 초대장 중 `PENDING` 상태가 있는지 확인
    - 있으면 → `INVITATION_PENDING` (종료)

4. **위 조건 모두 해당 안 됨**
    - → `MUTUAL_FOLLOW_INVITE` (초대 가능)

---

## ⚠️ HTTP 상태 코드

| 상태 코드 | 설명 | 응답 예시 |
|----------|------|-----------|
| `200` | 성공 | `{ "isSuccess": true, "code": "COMMON200", ... }` |
| `401` | 인증 실패 (토큰 없음/만료) | `{ "isSuccess": false, "code": "MEMBER401", "message": "로그인이 필요한 서비스 입니다." }` |
| `500` | 서버 내부 오류 | `{ "isSuccess": false, "code": "COMMON500", ... }` |

---

## 🔄 실시간 업데이트 (WebSocket)

냉장고 초대 상태가 변경되면 실시간으로 목록을 업데이트해야 합니다.

### WebSocket 구독 경로
```
/topic/refrigerator/{memberId}
```

### 이벤트 타입
초대 상태 변경 시 다음 이벤트가 발생합니다:
- `INVITATION_ACCEPTED`: 초대 수락됨
- `INVITATION_REJECTED`: 초대 거절됨
- `INVITATION_CANCELED`: 초대 취소됨

### 처리 방법
위 이벤트 수신 시 **팔로워/팔로잉 목록 API를 다시 호출**하여 최신 상태로 업데이트

---

## 💡 예시 시나리오

### 시나리오 1: 맞팔이고 초대 가능
**상황**:
- 나(A)가 B를 팔로우
- B도 나(A)를 팔로우 (맞팔)
- A와 B는 다른 냉장고 사용 중
- A가 B에게 초대를 보낸 적 없음

**응답**:
```json
{
  "nickname": "B",
  "profileImgUrl": "https://example.com/b.jpg",
  "invitationStatus": "MUTUAL_FOLLOW_INVITE"
}
```

**프론트 처리**: "초대하기" 버튼 표시

---

### 시나리오 2: 이미 같은 냉장고
**상황**:
- A와 B는 맞팔
- A와 B는 **같은 냉장고** 사용 중

**응답**:
```json
{
  "nickname": "B",
  "profileImgUrl": "https://example.com/b.jpg",
  "invitationStatus": "ALREADY_SAME_REFRIGERATOR"
}
```

**프론트 처리**: "같은 식구" 뱃지 표시 (초대 불가)

---

### 시나리오 3: 이미 초대장 보냄
**상황**:
- A와 B는 맞팔
- A와 B는 다른 냉장고 사용 중
- A가 B에게 초대를 보냈고, 아직 `PENDING` 상태

**응답**:
```json
{
  "nickname": "B",
  "profileImgUrl": "https://example.com/b.jpg",
  "invitationStatus": "INVITATION_PENDING"
}
```

**프론트 처리**: "초대 대기중" 뱃지 표시 (추가 초대 불가)

---

### 시나리오 4: 맞팔 아님
**상황**:
- A가 B를 팔로우하지 않음
- 또는 B가 A를 팔로우하지 않음

**응답**:
```json
{
  "nickname": "B",
  "profileImgUrl": "https://example.com/b.jpg",
  "invitationStatus": "NOT_MUTUAL"
}
```

**프론트 처리**: 아무것도 표시 안 함 (빈 공간)

---

## 📊 빈 목록 케이스

### 팔로워가 0명일 때
```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공입니다.",
  "result": {
    "followers": []
  }
}
```

### 팔로잉이 0명일 때
```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공입니다.",
  "result": {
    "followings": []
  }
}
```

---

## 🔗 관련 API (참고)

프론트엔드에서 "초대하기" 버튼 클릭 시 호출할 API는 별도로 확인 필요:

### 냉장고 초대 API (예상)
```
POST /api/refrigerators/invitations
```

**Request Body**:
```json
{
  "inviteeNickname": "user123"
}
```

---

## 📝 프론트엔드 구현 시 체크리스트

- [ ] `Authorization` 헤더에 JWT 토큰 포함
- [ ] `isSuccess` 필드로 성공/실패 확인
- [ ] 4가지 `invitationStatus` 모두 처리
- [ ] `profileImgUrl`이 `null`인 경우 기본 이미지 사용
- [ ] 401 에러 시 로그인 페이지로 리다이렉트
- [ ] 빈 배열(`[]`)인 경우 "팔로워/팔로잉이 없습니다" 메시지 표시
- [ ] WebSocket 이벤트 수신 시 목록 새로고침
- [ ] 로딩 상태 UI 구현
- [ ] 에러 상태 UI 구현

---

## 🎨 UI 가이드

### invitationStatus별 표시 방법

| Status | 표시 타입 | 텍스트 | 클릭 가능 여부 | 추천 색상 |
|--------|----------|--------|---------------|----------|
| `MUTUAL_FOLLOW_INVITE` | 버튼 | "초대하기" | ✅ 가능 | 파란색 계열 (Primary) |
| `ALREADY_SAME_REFRIGERATOR` | 뱃지 | "같은 식구" | ❌ 불가 | 초록색 계열 |
| `INVITATION_PENDING` | 뱃지 | "초대 대기중" | ❌ 불가 | 노란색/오렌지 계열 |
| `NOT_MUTUAL` | 없음 | - | - | - |

---

## 🧪 테스트 데이터

### 모든 상태 포함된 예시 응답
```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공입니다.",
  "result": {
    "followers": [
      {
        "nickname": "alice",
        "profileImgUrl": "https://example.com/alice.jpg",
        "invitationStatus": "MUTUAL_FOLLOW_INVITE"
      },
      {
        "nickname": "bob",
        "profileImgUrl": null,
        "invitationStatus": "ALREADY_SAME_REFRIGERATOR"
      },
      {
        "nickname": "charlie",
        "profileImgUrl": "https://example.com/charlie.jpg",
        "invitationStatus": "INVITATION_PENDING"
      },
      {
        "nickname": "david",
        "profileImgUrl": "https://example.com/david.jpg",
        "invitationStatus": "NOT_MUTUAL"
      }
    ]
  }
}
```