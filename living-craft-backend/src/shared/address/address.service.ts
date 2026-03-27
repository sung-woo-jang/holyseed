import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SearchAddressDto } from './dto/request';
import { AddressSearchResponseDto, AddressItemDto } from './dto/response';

interface KakaoDocument {
  address_name: string;
  road_address_name: string;
}

interface KakaoKeywordSearchResponse {
  documents: KakaoDocument[];
  meta: { total_count: number };
}

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);
  private readonly KAKAO_API_URL =
    'https://dapi.kakao.com/v2/local/search/keyword.json';
  private readonly kakaoApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.kakaoApiKey = this.configService.get<string>('KAKAO_REST_API_KEY');
    if (!this.kakaoApiKey) {
      throw new Error('KAKAO_REST_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
  }

  async searchAddress(
    dto: SearchAddressDto,
  ): Promise<AddressSearchResponseDto> {
    const { query, regionPrefix = '인천' } = dto;

    if (!query || !query.trim()) {
      return { addresses: [], count: 0 };
    }

    const searchQuery = `${regionPrefix} ${query}`.trim();

    try {
      const response = await firstValueFrom(
        this.httpService.get<KakaoKeywordSearchResponse>(this.KAKAO_API_URL, {
          params: { query: searchQuery, size: 15 },
          headers: { Authorization: `KakaoAK ${this.kakaoApiKey}` },
        }),
      );

      // 지역명에서 "광역시", "특별시", "특별자치시", "특별자치도" 제거
      const regionName = regionPrefix
        .split(' ')[0]
        .replace(/광역시|특별시|특별자치시|특별자치도/g, '');

      const filteredDocuments = response.data.documents.filter((item) => {
        const address = item.road_address_name || item.address_name;
        return address.includes(regionName);
      });

      const addresses: AddressItemDto[] = filteredDocuments.map((item) => ({
        roadAddress: item.road_address_name || item.address_name,
        jibunAddress: item.address_name,
        zipCode: '',
      }));

      this.logger.log(`주소 검색 성공: ${searchQuery} (${addresses.length}개)`);
      return { addresses, count: addresses.length };
    } catch (error) {
      this.logger.error(`주소 검색 오류: ${error.message}`, error.stack);

      if (error.response?.status === 401) {
        throw new HttpException(
          '카카오 API 인증 실패',
          HttpStatus.UNAUTHORIZED,
        );
      } else if (error.response?.status === 429) {
        throw new HttpException('요청 한도 초과', HttpStatus.TOO_MANY_REQUESTS);
      } else if (error.code === 'ECONNABORTED') {
        throw new HttpException('요청 시간 초과', HttpStatus.REQUEST_TIMEOUT);
      }

      throw new HttpException(
        '주소 검색 중 오류 발생',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
