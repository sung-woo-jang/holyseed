import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { District } from './entities/district.entity';
import { DistrictLevel } from '@common/enums/district-level.enum';
import { DistrictDto } from './dto/response/district.dto';

/**
 * Import 결과 인터페이스
 */
interface ImportResult {
  totalProcessed: number;
  created: number;
  errors: number;
  durationMs: number;
  errorMessages: string[];
}

@Injectable()
export class DistrictsService {
  private readonly logger = new Logger(DistrictsService.name);

  constructor(
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 법정동 코드에서 행정구역 레벨을 판별합니다.
   *
   * @param code 10자리 법정동 코드
   * @returns DistrictLevel (SIDO, SIGUNGU, EUPMYEONDONG)
   */
  private parseDistrictCode(code: string): DistrictLevel {
    // 뒤 8자리가 00000000이면 시/도
    if (code.endsWith('00000000')) {
      return DistrictLevel.SIDO;
    }

    // 뒤 5자리가 00000이면 시/군/구
    if (code.endsWith('00000')) {
      return DistrictLevel.SIGUNGU;
    }

    // 나머지는 읍/면/동
    return DistrictLevel.EUPMYEONDONG;
  }

  /**
   * 법정동 코드와 레벨을 기반으로 상위 행정구역 코드를 추출합니다.
   *
   * @param code 10자리 법정동 코드
   * @param level 행정구역 레벨
   * @returns 상위 행정구역 코드 또는 null (최상위인 경우)
   */
  private getParentCode(code: string, level: DistrictLevel): string | null {
    if (level === DistrictLevel.SIDO) {
      return null; // 최상위
    }

    if (level === DistrictLevel.SIGUNGU) {
      // 앞 2자리 + 00000000 (시/도 코드)
      return code.substring(0, 2) + '00000000';
    }

    if (level === DistrictLevel.EUPMYEONDONG) {
      // 앞 5자리 + 00000 (시/군/구 코드)
      return code.substring(0, 5) + '00000';
    }

    return null;
  }

  /**
   * 전체 이름에서 단일 이름을 추출합니다.
   *
   * @param fullName 전체 이름 (예: "서울특별시 종로구 청운동")
   * @param level 행정구역 레벨
   * @returns 단일 이름 (예: "청운동")
   */
  private extractSingleName(fullName: string, level: DistrictLevel): string {
    const parts = fullName.split(' ').filter((p) => p.trim());

    if (level === DistrictLevel.SIDO) {
      return parts[0]; // "서울특별시"
    }

    if (level === DistrictLevel.SIGUNGU) {
      return parts.length >= 2 ? parts[1] : parts[0]; // "종로구"
    }

    if (level === DistrictLevel.EUPMYEONDONG) {
      return parts.length >= 3 ? parts[2] : parts[parts.length - 1]; // "청운동"
    }

    return fullName;
  }

  /**
   * 법정동 코드.txt 파일을 읽어서 JSON 파일로 변환합니다.
   * 폐지된 구역은 필터링하여 제외합니다.
   *
   * @returns 변환 결과 (메시지, 파일 경로, 레코드 수)
   */
  async convertTxtToJson(): Promise<{
    message: string;
    filePath: string;
    recordCount: number;
  }> {
    this.logger.log('TXT → JSON 변환 시작');

    // 1. 법정동 코드.txt 파일 읽기
    const txtFilePath = path.join(process.cwd(), 'data/법정동 코드.txt');
    const fileContent = await fs.readFile(txtFilePath, 'utf-8');

    const lines = fileContent.split('\n').slice(1); // 헤더 제외

    // 2. 각 줄 파싱 (폐지된 구역 제외)
    const parsedRows = [];
    let skippedAbandoned = 0;
    let skippedRi = 0;

    for (const line of lines) {
      if (!line.trim()) continue;

      const [code, fullName, status] = line.split('\t');
      if (!code || !fullName) continue;

      // **폐지된 구역은 건너뛰기**
      const isAbandoned = status?.includes('폐지');
      if (isAbandoned) {
        skippedAbandoned++;
        continue;
      }

      const level = this.parseDistrictCode(code);

      // 리(RI) 레벨 제외 (현재 3단계만 지원)
      // 끝 2자리가 00이 아니면 리(RI)로 간주
      if (!code.endsWith('00')) {
        skippedRi++;
        continue;
      }

      parsedRows.push({
        code: code.trim(),
        fullName: fullName.trim(),
        name: this.extractSingleName(fullName.trim(), level),
        level,
        parentCode: this.getParentCode(code.trim(), level),
      });
    }

    // 3. JSON 파일로 저장 (타임스탬프 추가하여 유니크한 파일명 생성)
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const jsonFilePath = path.join(
      process.cwd(),
      'data',
      `districts-${timestamp}.json`,
    );
    await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });
    await fs.writeFile(
      jsonFilePath,
      JSON.stringify(parsedRows, null, 2),
      'utf-8',
    );

    this.logger.log(
      `TXT → JSON 변환 완료: ${parsedRows.length}개 레코드 (폐지 ${skippedAbandoned}개, 리 ${skippedRi}개 제외)`,
    );

    return {
      message: 'TXT 파일을 JSON으로 변환했습니다.',
      filePath: jsonFilePath,
      recordCount: parsedRows.length,
    };
  }

  /**
   * JSON 파일에서 데이터를 읽어 DB로 import합니다.
   * 트랜잭션 내에서 레벨별 순차 처리하여 부모-자식 관계를 보장합니다.
   *
   * @param filePath JSON 파일 경로 (선택사항, 미지정 시 기본값 사용)
   * @returns Import 결과 (처리 개수, 성공, 실패 등)
   */
  async importFromJson(filePath?: string): Promise<ImportResult> {
    const startTime = Date.now();
    const result: ImportResult = {
      totalProcessed: 0,
      created: 0,
      errors: 0,
      durationMs: 0,
      errorMessages: [],
    };

    this.logger.log('JSON → DB Import 시작');

    try {
      // 1. JSON 파일 읽기
      const jsonFilePath =
        filePath || path.join(process.cwd(), 'data', 'districts.json');
      const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
      const parsedRows = JSON.parse(fileContent);

      this.logger.log(`JSON 파일 로드 완료: ${parsedRows.length}개 레코드`);

      // 2. 트랜잭션 내에서 레벨별 순차 처리 (시/도 → 시/군/구 → 읍/면/동)
      await this.dataSource.transaction(async (manager) => {
        const districtRepo = manager.getRepository(District);

        // 기존 데이터 전체 삭제 (replace 모드) - clear() 사용
        await districtRepo.clear();
        this.logger.log('기존 데이터 삭제 완료');

        const codeToIdMap = new Map<string, number>();

        // 레벨별 순차 처리 (부모 ID 확보 후 자식 생성)
        for (const level of [
          DistrictLevel.SIDO,
          DistrictLevel.SIGUNGU,
          DistrictLevel.EUPMYEONDONG,
        ]) {
          const rowsForLevel = parsedRows.filter((r) => r.level === level);
          this.logger.log(`${level} 레벨 처리 시작: ${rowsForLevel.length}개`);

          // 배치 처리 (500개씩)
          const batchSize = 500;
          for (let i = 0; i < rowsForLevel.length; i += batchSize) {
            const batch = rowsForLevel.slice(i, i + batchSize);

            for (const row of batch) {
              try {
                const parentId = row.parentCode
                  ? codeToIdMap.get(row.parentCode) || null
                  : null;

                const district = districtRepo.create({
                  code: row.code,
                  fullName: row.fullName,
                  name: row.name,
                  level: row.level,
                  isAbandoned: false, // JSON에는 폐지 제외된 것만 있음
                  isActive: true,
                  parentId: parentId,
                });

                const saved = await districtRepo.save(district);
                codeToIdMap.set(saved.code, saved.id);
                result.created++;
              } catch (error) {
                result.errors++;
                result.errorMessages.push(
                  `코드 ${row.code} 처리 실패: ${error.message}`,
                );
              }
            }

            this.logger.log(
              `${level} 레벨 배치 처리 중: ${Math.min(i + batchSize, rowsForLevel.length)}/${rowsForLevel.length}`,
            );
          }

          result.totalProcessed += rowsForLevel.length;
          this.logger.log(`${level} 레벨 처리 완료`);
        }
      });

      result.durationMs = Date.now() - startTime;
      this.logger.log(
        `JSON → DB Import 완료: ${result.created}개 생성, ${result.errors}개 실패, ${result.durationMs}ms 소요`,
      );

      return result;
    } catch (error) {
      result.errors++;
      result.errorMessages.push(`Import 실패: ${error.message}`);
      result.durationMs = Date.now() - startTime;

      this.logger.error('JSON → DB Import 실패', error.stack);
      throw error;
    }
  }

  /**
   * 행정구역 목록 조회 (레벨, 부모 ID 필터링 가능)
   *
   * @param level 조회할 행정구역 레벨 (선택사항)
   * @param parentId 상위 행정구역 ID (선택사항)
   * @returns DistrictDto 배열
   */
  async findAll(
    level?: DistrictLevel,
    parentId?: number,
  ): Promise<DistrictDto[]> {
    const queryBuilder = this.districtRepository
      .createQueryBuilder('district')
      .where('district.isActive = :isActive', { isActive: true })
      .orderBy('district.code', 'ASC');

    if (level) {
      queryBuilder.andWhere('district.level = :level', { level });
    }

    if (parentId !== undefined) {
      if (parentId === null) {
        queryBuilder.andWhere('district.parentId IS NULL');
      } else {
        queryBuilder.andWhere('district.parentId = :parentId', { parentId });
      }
    }

    const districts = await queryBuilder.getMany();

    return districts.map((district) => this.toDistrictDto(district));
  }

  /**
   * District 엔티티를 DistrictDto로 변환
   *
   * @param district District 엔티티
   * @returns DistrictDto
   */
  private toDistrictDto(district: District): DistrictDto {
    return {
      id: district.id,
      code: district.code,
      name: district.name,
      fullName: district.fullName,
      level: district.level,
      parentId: district.parentId,
    };
  }
}
