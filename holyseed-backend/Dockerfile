# 개발환경용 Dockerfile
# (애플리케이션은 Docker 없이 직접 실행하므로 실제로는 사용하지 않음)

# 개발환경 실행 방법:
# 1. docker-compose -f docker-compose.local.yml up -d  (DB/Redis 시작)
# 2. npm install
# 3. npm run start:dev  (애플리케이션 개발 모드로 시작)

# 만약 애플리케이션도 Docker로 실행하고 싶다면:
FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
