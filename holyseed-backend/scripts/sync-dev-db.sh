#!/usr/bin/env bash
# 운영 DB(holyseed)의 데이터를 로컬 개발 DB(holyseed_dev)로 통째로 복사한다.
# 같은 holyseed_postgres 컨테이너 안에서 DB 이름만 다르므로 docker exec만으로 처리 가능.
# 사용법·배경: docs/local-dev-db-sync.md 참고
set -euo pipefail

CONTAINER="holyseed_postgres"
PROD_DB="holyseed"
DEV_DB="holyseed_dev"

if ! docker exec "${CONTAINER}" pg_isready -U postgres >/dev/null 2>&1; then
  echo "❌ ${CONTAINER} 컨테이너가 떠있지 않습니다. (npm run docker:up 으로 기동)"
  exit 1
fi

echo "⚠️  ${DEV_DB}(로컬)를 삭제하고 ${PROD_DB}(운영) 데이터로 새로 채웁니다."
echo "   로컬 DB에만 있던 데이터/변경사항은 사라집니다."
read -r -p "계속할까요? (y/N) " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  echo "취소했습니다."
  exit 1
fi

echo "▶ ${DEV_DB}에 연결 중인 세션 종료..."
docker exec "${CONTAINER}" psql -U postgres -d postgres -q -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DEV_DB}' AND pid <> pg_backend_pid();" >/dev/null

echo "▶ ${DEV_DB} 재생성..."
docker exec "${CONTAINER}" psql -U postgres -d postgres -q -c "DROP DATABASE IF EXISTS ${DEV_DB};"
docker exec "${CONTAINER}" psql -U postgres -d postgres -q -c "CREATE DATABASE ${DEV_DB};"

echo "▶ ${PROD_DB} → ${DEV_DB} 덤프 복사 중... (데이터량에 따라 수 초~수 분 소요)"
docker exec "${CONTAINER}" pg_dump -U postgres -d "${PROD_DB}" \
  | docker exec -i "${CONTAINER}" psql -U postgres -d "${DEV_DB}" -q >/dev/null

echo "✅ 완료: ${DEV_DB}가 ${PROD_DB} 데이터로 동기화됐습니다."
