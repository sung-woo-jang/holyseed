import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Customer } from './entities';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerJwtStrategy } from './strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerJwtStrategy],
  exports: [CustomersService],
})
export class CustomersModule {}
