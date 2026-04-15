-- ============================================
-- ZC 크롤러 레거시 테이블 → v2 구조 마이그레이션
-- ============================================
-- 실행 전 반드시 백업!
--
-- 실행 방법:
-- psql -U postgres -d living_craft -f migrate-legacy-to-v2.sql
-- ============================================

-- ===== 1. 백업 테이블 생성 =====
CREATE TABLE IF NOT EXISTS zc.categories_backup AS SELECT * FROM zc.categories;
CREATE TABLE IF NOT EXISTS zc.products_backup AS SELECT * FROM zc.products;
CREATE TABLE IF NOT EXISTS zc.product_images_backup AS SELECT * FROM zc.product_images;

\echo '✅ 백업 테이블 생성 완료'

-- ===== 2. 마이그레이션 검증 =====
-- Dasis 사이트가 존재하는지 확인
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM zc.sites WHERE code = 'dasis') THEN
    RAISE EXCEPTION 'Dasis 사이트가 존재하지 않습니다. 먼저 크롤러를 1번 실행하세요.';
  END IF;
END $$;

\echo '✅ Dasis 사이트 존재 확인'

-- ===== 3. categories → site_categories 마이그레이션 =====
-- 기존 데이터가 있는지 확인
SELECT
  COUNT(*) AS legacy_count,
  '레거시 categories 개수' AS description
FROM zc.categories;

-- 마이그레이션 실행 (중복 방지: ON CONFLICT DO NOTHING)
INSERT INTO zc.site_categories (
  "siteId",
  "siteCategoryCode",
  name,
  "parentId",
  level,
  url,
  "createdAt",
  "updatedAt"
)
SELECT
  (SELECT id FROM zc.sites WHERE code = 'dasis'),
  "dasisCategoryCode",
  name,
  NULL, -- parentId는 2차 패스에서 업데이트
  level,
  url,
  "createdAt",
  "updatedAt"
FROM zc.categories
ON CONFLICT ("siteId", "siteCategoryCode") DO NOTHING;

\echo '✅ 카테고리 마이그레이션 1차 완료'

-- parentId 매핑 (2차 패스)
UPDATE zc.site_categories sc
SET "parentId" = (
  SELECT parent_sc.id
  FROM zc.categories c
  INNER JOIN zc.categories parent_c ON c."parentId" = parent_c."dasisCategoryCode"
  INNER JOIN zc.site_categories parent_sc
    ON parent_sc."siteCategoryCode" = parent_c."dasisCategoryCode"
    AND parent_sc."siteId" = sc."siteId"
  WHERE sc."siteCategoryCode" = c."dasisCategoryCode"
    AND sc."siteId" = (SELECT id FROM zc.sites WHERE code = 'dasis')
)
WHERE "siteId" = (SELECT id FROM zc.sites WHERE code = 'dasis')
  AND "parentId" IS NULL
  AND EXISTS (
    SELECT 1 FROM zc.categories WHERE "dasisCategoryCode" = sc."siteCategoryCode" AND "parentId" IS NOT NULL
  );

\echo '✅ parentId 매핑 완료'

-- ===== 4. 마이그레이션 검증 =====
SELECT
  COUNT(*) AS migrated_count,
  'site_categories에 마이그레이션된 개수' AS description
FROM zc.site_categories
WHERE "siteId" = (SELECT id FROM zc.sites WHERE code = 'dasis');

-- 마이그레이션 전후 개수 비교
DO $$
DECLARE
  legacy_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO legacy_count FROM zc.categories;
  SELECT COUNT(*) INTO migrated_count FROM zc.site_categories WHERE "siteId" = (SELECT id FROM zc.sites WHERE code = 'dasis');

  IF legacy_count != migrated_count THEN
    RAISE WARNING '⚠️  개수 불일치: 레거시 %, 마이그레이션 %', legacy_count, migrated_count;
  ELSE
    RAISE NOTICE '✅ 마이그레이션 검증 성공: % 개', migrated_count;
  END IF;
END $$;

-- ===== 5. 레거시 테이블 삭제 (주석 해제하여 실행) =====
--
-- 경고: 아래 명령을 실행하면 레거시 테이블이 영구 삭제됩니다!
-- 마이그레이션 검증 후 주석을 해제하고 실행하세요.
--
-- DROP TABLE IF EXISTS zc.product_images;
-- DROP TABLE IF EXISTS zc.products;
-- DROP TABLE IF EXISTS zc.categories;
--
-- \echo '✅ 레거시 테이블 삭제 완료'

\echo ''
\echo '============================================'
\echo '마이그레이션 완료!'
\echo '============================================'
\echo '다음 단계:'
\echo '1. site_categories 데이터 확인'
\echo '2. 검증 완료 후 위 SQL의 DROP TABLE 주석 해제하여 레거시 테이블 삭제'
\echo '3. 백업 테이블도 필요 없으면 삭제:'
\echo '   DROP TABLE zc.categories_backup;'
\echo '   DROP TABLE zc.products_backup;'
\echo '   DROP TABLE zc.product_images_backup;'
\echo '============================================'
