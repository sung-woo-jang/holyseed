import { randomUUID } from 'crypto';
import { Controller, Get, Headers, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '@common/decorators';
import { UpdatesService } from './updates.service';

/** Expo Updates 클라이언트가 보내는 요청 — Swagger로 노출할 REST API가 아니라 문서에서 제외 */
@Controller('ad-native/updates')
@ApiExcludeController()
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Get('manifest')
  @Public()
  async manifest(
    @Headers('expo-platform') platform: string | undefined,
    @Headers('expo-runtime-version') runtimeVersion: string | undefined,
    @Headers('expo-current-update-id') currentUpdateId: string | undefined,
    @Res() res: Response,
  ) {
    const boundary = randomUUID();
    res.set({
      'expo-protocol-version': '1',
      'expo-sfv-version': '0',
      'cache-control': 'private, no-cache',
      'content-type': `multipart/mixed; boundary=${boundary}`,
    });

    if (!platform || !runtimeVersion) {
      return res.status(400).send(buildPart(boundary, 'directive', { type: 'noUpdateAvailable' }));
    }

    const entry = this.updatesService.getLatest(platform, runtimeVersion);
    if (!entry || entry.id === currentUpdateId) {
      return res.status(200).send(buildPart(boundary, 'directive', { type: 'noUpdateAvailable' }));
    }

    const manifest = this.updatesService.toManifest(entry, runtimeVersion);
    return res.status(200).send(buildPart(boundary, 'manifest', manifest));
  }
}

/** Expo Updates 프로토콜의 multipart/mixed 단일 파트(manifest 또는 directive) 생성 */
function buildPart(boundary: string, name: 'manifest' | 'directive', body: unknown): string {
  return [
    `--${boundary}`,
    'Content-Type: application/json; charset=utf-8',
    `Content-Disposition: form-data; name="${name}"`,
    '',
    JSON.stringify(body),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}
