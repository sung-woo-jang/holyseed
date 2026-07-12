import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ERROR_MESSAGES } from '@common/constants';

/**
 * 커스텀 Validation Pipe
 *
 * - class-validator로 DTO 검증
 * - transform: true (자동 타입 변환)
 * - whitelist: true (DTO에 없는 속성 제거)
 * - forbidNonWhitelisted: true (허용되지 않은 속성이 있으면 에러)
 * - 모든 에러 메시지를 한국어로 제공
 */
@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // DTO로 변환 (nested object의 @Type() 데코레이터가 작동하도록 옵션 추가)
    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
    });

    // 허용되지 않은 필드 체크 (forbidNonWhitelisted)
    const unknownKeys = this.getUnknownKeys(value, object);
    if (unknownKeys.length > 0) {
      const errors = unknownKeys.map((key) =>
        ERROR_MESSAGES.SYSTEM.UNEXPECTED_FIELD(key),
      );
      throw new BadRequestException(errors);
    }

    // class-validator로 검증
    const errors = await validate(object, {
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidUnknownValues: true, // 알 수 없는 값 금지
      validationError: {
        target: false, // 에러 응답에 클래스 객체 제외
        value: false, // 에러 응답에 입력값 제외
      },
    });

    if (errors.length > 0) {
      throw new BadRequestException(this.buildErrorMessages(errors));
    }

    return object;
  }

  /**
   * 검증이 필요한 메타타입인지 확인
   */
  private toValidate(metatype: new (...args: any[]) => any): boolean {
    const types: Array<new (...args: any[]) => any> = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype);
  }

  /**
   * 허용되지 않은 키 찾기
   */
  private getUnknownKeys(value: any, transformed: any): string[] {
    if (!value || typeof value !== 'object') {
      return [];
    }

    const valueKeys = Object.keys(value);
    const transformedKeys = Object.keys(transformed);

    // value에는 있지만 transformed에는 없는 키 = 허용되지 않은 키
    return valueKeys.filter((key) => !transformedKeys.includes(key));
  }

  /**
   * Validation 에러를 사용자 친화적인 메시지 배열로 변환
   */
  private buildErrorMessages(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    errors.forEach((error) => {
      // 일반 validation 에러
      if (error.constraints) {
        Object.values(error.constraints).forEach((message) => {
          messages.push(message);
        });
      }

      // Nested validation 에러 (재귀 처리)
      if (error.children && error.children.length > 0) {
        messages.push(...this.buildErrorMessages(error.children));
      }
    });

    return messages;
  }
}
