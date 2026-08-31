import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Couple } from '../couples/entities/couple.entity';
import { WeddingMedia, ModerationStatus } from '../media/entities/wedding-media.entity';

const SITE_ORIGIN = 'https://wedding.holyseed.p-e.kr';

@Injectable()
export class OgService {
  constructor(
    @InjectRepository(Couple)
    private readonly coupleRepo: Repository<Couple>,
    @InjectRepository(WeddingMedia)
    private readonly mediaRepo: Repository<WeddingMedia>,
  ) {}

  /**
   * 카카오톡 등 링크 공유 미리보기 크롤러용 OG 메타태그 HTML 렌더링.
   * 크롤러는 JS를 실행하지 않으므로 SPA의 index.html 대신 이 정적 HTML을 응답해야 함.
   */
  async renderOgHtml(slug: string): Promise<string> {
    const couple = await this.coupleRepo.findOne({ where: { slug } });
    if (!couple) {
      return this.buildHtml({ title: 'Wedding Archive', description: '', imageUrl: undefined, url: `${SITE_ORIGIN}/${slug}` });
    }

    let media: WeddingMedia | null = null;
    if (couple.ogImageMediaId) {
      media = await this.mediaRepo.findOne({
        where: { id: couple.ogImageMediaId, coupleId: couple.id, moderationStatus: ModerationStatus.APPROVED },
      });
    }
    if (!media) {
      media = await this.mediaRepo.findOne({
        where: { coupleId: couple.id, moderationStatus: ModerationStatus.APPROVED },
        order: { createdAt: 'DESC' },
      });
    }

    const title = `${couple.groomName} ♥ ${couple.brideName} 결혼식에 초대합니다`;
    const venue = couple.weddingVenue as { name?: string } | undefined;
    const dateLabel = couple.weddingDate
      ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' }).format(
          new Date(couple.weddingDate),
        )
      : '';
    const description = [dateLabel, venue?.name].filter(Boolean).join(' · ') || '저희 결혼식에 초대합니다.';
    const imageUrl = media ? `${SITE_ORIGIN}/api/wedding/media/${media.id}/resized` : undefined;
    const url = `${SITE_ORIGIN}/${slug}`;

    return this.buildHtml({ title, description, imageUrl, url });
  }

  private buildHtml({
    title,
    description,
    imageUrl,
    url,
  }: {
    title: string;
    description: string;
    imageUrl?: string;
    url: string;
  }): string {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(url)}" />
${imageUrl ? `<meta property="og:image" content="${esc(imageUrl)}" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
${imageUrl ? `<meta name="twitter:image" content="${esc(imageUrl)}" />` : ''}
</head>
<body></body>
</html>`;
  }
}
