import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    request.queryRunner = queryRunner;

    return next.handle().pipe(
      tap(async () => {
        await queryRunner.commitTransaction();
        await queryRunner.release();
      }),
      catchError(async (error) => {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw new InternalServerErrorException(error.message);
      }),
    );
  }
}
