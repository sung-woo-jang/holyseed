import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponseDto } from '@common/dto';
import { PaginatedResponseDto } from '@common/dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponseDto<T> | PaginatedResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponseDto<T> | PaginatedResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // 이미 변환된 응답이면 그대로 반환
        if (
          data &&
          typeof data === 'object' &&
          ('success' in data || 'meta' in data)
        ) {
          return data;
        }

        // 기본 성공 응답 변환
        return new SuccessResponseDto(
          '요청이 성공적으로 처리되었습니다.',
          data,
        );
      }),
    );
  }
}
