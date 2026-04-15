-- ============================================
-- 레거시 테이블 삭제
-- ============================================
-- 주의: 이 스크립트는 레거시 테이블을 영구 삭제합니다!
-- 마이그레이션 검증 후 실행하세요.
-- ============================================

DROP TABLE IF EXISTS zc.product_images;
DROP TABLE IF EXISTS zc.products;
DROP TABLE IF EXISTS zc.categories;

\echo '✅ 레거시 테이블 삭제 완료'

-- 남은 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'zc'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
