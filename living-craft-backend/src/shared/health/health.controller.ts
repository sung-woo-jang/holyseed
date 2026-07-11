import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import {
  HealthCheckSwaggerDecorator,
  DetailedHealthCheckSwaggerDecorator,
} from './docs';

@ApiTags('헬스체크')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @HealthCheckSwaggerDecorator({
    summary: '헬스체크',
    description: '서버 상태를 확인합니다.',
  })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('detailed')
  @Public()
  @DetailedHealthCheckSwaggerDecorator({
    summary: '상세 헬스체크',
    description: '서버의 상세한 상태 정보를 확인합니다.',
  })
  detailedHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: {
        used:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        total:
          Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) /
          100,
      },
      cpu: {
        usage: process.cpuUsage(),
      },
    };
  }
}
