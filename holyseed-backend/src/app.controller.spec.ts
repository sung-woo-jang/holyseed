import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('API 상태 확인 메시지를 반환한다', () => {
      expect(appController.getHello()).toBe('예약 서비스 플랫폼 API가 정상적으로 작동 중입니다!');
    });
  });
});
