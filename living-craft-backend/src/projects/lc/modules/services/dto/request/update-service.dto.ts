import { PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';

/**
 * 서비스 수정 DTO
 * CreateServiceDto의 모든 필드를 선택적(optional)으로 만듦
 */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
