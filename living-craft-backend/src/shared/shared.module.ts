import { Module } from '@nestjs/common';
import { FilesModule } from '@shared/files/files.module';
import { HealthModule } from '@shared/health/health.module';
import { AddressModule } from '@shared/address/address.module';

/**
 * SharedModule
 *
 * 여러 프로젝트에서 공통으로 사용되는 모듈들을 통합 관리합니다.
 * - FilesModule: 파일 업로드 및 관리
 * - HealthModule: 헬스 체크
 * - AddressModule: 주소 검색 API
 */
@Module({
  imports: [FilesModule, HealthModule, AddressModule],
  exports: [FilesModule, HealthModule, AddressModule],
})
export class SharedModule {}
