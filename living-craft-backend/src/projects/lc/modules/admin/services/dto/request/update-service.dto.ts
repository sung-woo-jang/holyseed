import { PartialType } from '@nestjs/swagger';
import { AdminCreateServiceDto } from './create-service.dto';

export class AdminUpdateServiceDto extends PartialType(AdminCreateServiceDto) {}
