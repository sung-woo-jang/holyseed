-- 초기 데이터베이스 설정 파일

-- 데이터베이스 생성 (Docker entrypoint에서 자동으로 생성되므로 주석 처리)
-- CREATE DATABASE reservation_db;

-- 확장 기능 활성화
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 타임존 설정
SET timezone = 'Asia/Seoul';

-- 스키마 생성
CREATE SCHEMA IF NOT EXISTS ad;
CREATE SCHEMA IF NOT EXISTS pc;
CREATE SCHEMA IF NOT EXISTS iv;

-- 초기 설정 완료 로그
SELECT 'Database initialization completed' as status;
