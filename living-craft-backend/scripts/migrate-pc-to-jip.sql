-- PC 스키마 → JIP 스키마 마이그레이션 (1회 실행용)
-- 실행 전 백업 권장: pg_dump -t "pc.*" living_craft_dev > pc_backup.sql
-- 실행 후 서버 재시작하면 synchronize:true 가 새 테이블명 반영

-- 카테고리
CREATE TABLE IF NOT EXISTS jip.pc_categories (LIKE pc.categories INCLUDING ALL);
INSERT INTO jip.pc_categories SELECT * FROM pc.categories ON CONFLICT DO NOTHING;

-- 거래처
CREATE TABLE IF NOT EXISTS jip.pc_vendors (LIKE pc.vendors INCLUDING ALL);
INSERT INTO jip.pc_vendors SELECT * FROM pc.vendors ON CONFLICT DO NOTHING;

-- 제품
CREATE TABLE IF NOT EXISTS jip.pc_products (LIKE pc.products INCLUDING ALL);
INSERT INTO jip.pc_products SELECT * FROM pc.products ON CONFLICT DO NOTHING;

-- 제품 이미지
CREATE TABLE IF NOT EXISTS jip.pc_product_images (LIKE pc.product_images INCLUDING ALL);
INSERT INTO jip.pc_product_images SELECT * FROM pc.product_images ON CONFLICT DO NOTHING;

-- 제품 가격
CREATE TABLE IF NOT EXISTS jip.pc_product_prices (LIKE pc.product_prices INCLUDING ALL);
INSERT INTO jip.pc_product_prices SELECT * FROM pc.product_prices ON CONFLICT DO NOTHING;

-- 검증
SELECT 'pc.categories'       AS src, COUNT(*) FROM pc.categories
UNION ALL SELECT 'jip.pc_categories',  COUNT(*) FROM jip.pc_categories
UNION ALL SELECT 'pc.vendors',         COUNT(*) FROM pc.vendors
UNION ALL SELECT 'jip.pc_vendors',     COUNT(*) FROM jip.pc_vendors
UNION ALL SELECT 'pc.products',        COUNT(*) FROM pc.products
UNION ALL SELECT 'jip.pc_products',    COUNT(*) FROM jip.pc_products
UNION ALL SELECT 'pc.product_images',  COUNT(*) FROM pc.product_images
UNION ALL SELECT 'jip.pc_product_images', COUNT(*) FROM jip.pc_product_images
UNION ALL SELECT 'pc.product_prices',  COUNT(*) FROM pc.product_prices
UNION ALL SELECT 'jip.pc_product_prices', COUNT(*) FROM jip.pc_product_prices;

-- row count 검증 후 아래 DROP 주석 해제하여 실행:
-- DROP SCHEMA pc CASCADE;
