import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface UpdateAsset {
  hash: string;
  key: string;
  contentType: string;
  /** updatesDir 기준 상대경로 — /ad-native-updates/ static 마운트에 그대로 이어붙임 */
  path: string;
}

export interface UpdateEntry {
  id: string;
  createdAt: string;
  launchAsset: UpdateAsset;
  assets: UpdateAsset[];
}

type UpdatesIndex = Record<string, Record<string, UpdateEntry[]>>;

export interface UpdateManifest {
  id: string;
  createdAt: string;
  runtimeVersion: string;
  launchAsset: { hash: string; key: string; contentType: string; url: string };
  assets: { hash: string; key: string; contentType: string; url: string }[];
  metadata: Record<string, never>;
  extra: Record<string, never>;
}

/** ad-native(Expo RN 앱)용 자체 호스팅 OTA 업데이트 서버 — Expo Updates 프로토콜(v1, 비서명) */
@Injectable()
export class UpdatesService {
  private readonly logger = new Logger(UpdatesService.name);
  private readonly updatesDir: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.updatesDir = this.configService.get<string>('app.adNativeUpdatesDir')!;
    this.publicBaseUrl = this.configService.get<string>('app.publicBaseUrl')!;
  }

  private readIndex(): UpdatesIndex {
    const indexPath = join(this.updatesDir, 'index.json');
    if (!existsSync(indexPath)) return {};
    try {
      return JSON.parse(readFileSync(indexPath, 'utf-8'));
    } catch (err) {
      this.logger.error(`업데이트 인덱스 파싱 실패: ${err instanceof Error ? err.message : err}`);
      return {};
    }
  }

  /** 최신 업데이트 — 배열 맨 앞이 최신(publish 스크립트가 unshift) */
  getLatest(platform: string, runtimeVersion: string): UpdateEntry | null {
    const entries = this.readIndex()[platform]?.[runtimeVersion];
    return entries?.[0] ?? null;
  }

  toManifest(entry: UpdateEntry, runtimeVersion: string): UpdateManifest {
    const toPublicAsset = (a: UpdateAsset) => ({
      hash: a.hash,
      key: a.key,
      contentType: a.contentType,
      url: `${this.publicBaseUrl}/ad-native-updates/${a.path}`,
    });
    return {
      id: entry.id,
      createdAt: entry.createdAt,
      runtimeVersion,
      launchAsset: toPublicAsset(entry.launchAsset),
      assets: entry.assets.map(toPublicAsset),
      metadata: {},
      extra: {},
    };
  }
}
