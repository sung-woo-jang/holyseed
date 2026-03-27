import { ApiOperationOptions } from '@nestjs/swagger/dist/decorators/api-operation.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiResponseOptions } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { swaggerBaseApplyDecorator } from '@common/decorators/swagger-base-apply.decorator';

const apiHealthResponse: ApiResponseOptions = {
  status: 200,
  description: '서버 정상',
  schema: {
    example: {
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      uptime: 123.456,
      environment: 'development',
    },
  },
};

const apiDetailedHealthResponse: ApiResponseOptions = {
  status: 200,
  description: '서버 상세 상태',
};

export const HealthCheckSwaggerDecorator = (
  apiOperation: ApiOperationOptions,
) => {
  return swaggerBaseApplyDecorator(
    ApiOperation(apiOperation),
    ApiResponse(apiHealthResponse),
  );
};

export const DetailedHealthCheckSwaggerDecorator = (
  apiOperation: ApiOperationOptions,
) => {
  return swaggerBaseApplyDecorator(
    ApiOperation(apiOperation),
    ApiResponse(apiDetailedHealthResponse),
  );
};
