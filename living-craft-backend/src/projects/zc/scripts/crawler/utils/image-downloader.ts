import * as path from 'path'
import axios from 'axios'
import * as fs from 'fs/promises'
import { config } from '../config'
import { logger } from './logger'

/**
 * 이미지 다운로더
 */
export class ImageDownloader {
  private downloadDir: string

  constructor(downloadDir?: string) {
    this.downloadDir = downloadDir || config.crawl.imagesDir
  }

  /**
   * 이미지 URL에서 파일 다운로드
   */
  async downloadImage(
    url: string,
    productGoodsNo: string,
    type: 'thumbnail' | 'detail',
    index?: number
  ): Promise<string | null> {
    try {
      // URL에서 확장자 추출
      const ext = this.getImageExtension(url)

      // 파일명 생성
      const filename = this.generateFilename(productGoodsNo, type, index, ext)
      const filepath = path.join(this.downloadDir, filename)

      // 이미 다운로드된 파일인지 확인
      try {
        await fs.access(filepath)
        logger.info(`이미 다운로드됨: ${filename}`)
        return filepath
      } catch {
        // 파일이 없으면 다운로드 진행
      }

      // 디렉토리 생성
      await fs.mkdir(this.downloadDir, { recursive: true })

      // 이미지 다운로드
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      })

      // 파일 저장
      await fs.writeFile(filepath, response.data)

      logger.success(`이미지 다운로드: ${filename}`)

      return filepath
    } catch (error) {
      logger.error(`이미지 다운로드 실패: ${url}`, error)
      return null
    }
  }

  /**
   * 여러 이미지 다운로드
   */
  async downloadImages(
    urls: string[],
    productGoodsNo: string,
    type: 'thumbnail' | 'detail'
  ): Promise<Array<{ url: string; localPath: string | null }>> {
    const results: Array<{ url: string; localPath: string | null }> = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      const localPath = await this.downloadImage(url, productGoodsNo, type, i)

      results.push({ url, localPath })

      // 서버 부하 방지를 위한 짧은 대기
      if (i < urls.length - 1) {
        await this.delay(200)
      }
    }

    return results
  }

  /**
   * URL에서 이미지 확장자 추출
   */
  private getImageExtension(url: string): string {
    const match = url.match(/\.(jpg|jpeg|png|gif|webp)/i)
    return match ? match[1].toLowerCase() : 'jpg'
  }

  /**
   * 파일명 생성
   */
  private generateFilename(
    productGoodsNo: string,
    type: 'thumbnail' | 'detail',
    index: number | undefined,
    ext: string
  ): string {
    if (type === 'thumbnail') {
      return `${productGoodsNo}_thumb.${ext}`
    } else {
      const idx = index !== undefined ? index + 1 : 0
      return `${productGoodsNo}_detail_${idx}.${ext}`
    }
  }

  /**
   * 대기 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
