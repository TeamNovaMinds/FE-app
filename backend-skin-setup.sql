-- 냉장고 스킨 초기 데이터 세팅 가이드
-- 백엔드 DB에 실행할 SQL

-- 1. 기본 스킨 등록 (무료, 기본 장착)
INSERT INTO refrigerator_skin (skin_name, description, price, is_default)
VALUES ('기본 냉장고', '심플하고 깔끔한 기본 디자인', 0, true);

-- 2. 기본 스킨 이미지 등록
-- imageUrl에 'default' 식별자를 저장 (프론트엔드에서 assets/images/room.png로 매핑됨)
INSERT INTO refrigerator_skin_image (refrigerator_skin_id, image_url, image_order)
VALUES
  (1, 'default', 0);  -- 썸네일 및 상세 이미지

-- 3. Flower 스킨 추가 (예시)
INSERT INTO refrigerator_skin (skin_name, description, price, is_default)
VALUES ('플라워 냉장고', '화사한 꽃무늬 디자인', 1500, false);

-- refrigerator_skin_id는 위에서 생성된 ID 확인 필요 (예: 2번)
INSERT INTO refrigerator_skin_image (refrigerator_skin_id, image_url, image_order)
VALUES (2, 'flower', 0);

-- 4. (참고) 추가 스킨 예시
-- 나중에 새로운 스킨 추가 시 예시:
--
-- INSERT INTO refrigerator_skin (skin_name, description, price, is_default)
-- VALUES ('모던 냉장고', '세련된 모던 스타일', 1000, false);
--
-- INSERT INTO refrigerator_skin_image (refrigerator_skin_id, image_url, image_order)
-- VALUES
--   (3, 'modern', 0),  -- 썸네일
--   (3, 'modern', 1);  -- 상세 이미지 1
--
-- 프론트엔드 assets에 해당 이미지 추가 필요:
-- assets/images/skins/modern/thumbnail.png
-- assets/images/skins/modern/detail1.png
--
-- 그리고 src/features/skin/skinAssets.ts에 매핑 추가:
-- modern: {
--     thumbnail: require('@/assets/images/skins/modern/thumbnail.png'),
--     images: [
--         require('@/assets/images/skins/modern/detail1.png'),
--     ],
-- },

-- 4. (참고) 원격 이미지 URL 사용 예시
-- 나중에 서버에 이미지를 업로드하고 사용하는 경우:
--
-- INSERT INTO refrigerator_skin_image (refrigerator_skin_id, image_url, image_order)
-- VALUES
--   (3, 'https://example.com/skins/premium/thumbnail.png', 0),
--   (3, 'https://example.com/skins/premium/detail1.png', 1);
--
-- 이 경우 프론트엔드는 자동으로 원격 URL로 인식하여 처리함

-- 5. 회원에게 기본 스킨 자동 지급
-- 회원 가입 시 또는 기존 회원에게 기본 스킨 지급 (백엔드 로직에서 처리 필요)
-- INSERT INTO member_refrigerator_skin (member_id, refrigerator_skin_id, is_equipped)
-- VALUES ('member_uuid', 1, true);