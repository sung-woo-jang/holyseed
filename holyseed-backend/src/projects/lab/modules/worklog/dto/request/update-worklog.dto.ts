import { PartialType } from '@nestjs/swagger';
import { CreateWorklogDto } from './create-worklog.dto';

export class UpdateWorklogDto extends PartialType(CreateWorklogDto) {}
