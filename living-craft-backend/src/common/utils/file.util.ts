import * as path from 'path';
import * as fs from 'fs';

export class FileUtil {
  /**
   * 파일 확장자 추출
   * @param filename 파일명
   * @returns 확장자 (점 포함, 소문자)
   */
  static getExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  /**
   * 파일명에서 확장자 제거
   * @param filename 파일명
   * @returns 확장자가 제거된 파일명
   */
  static removeExtension(filename: string): string {
    return path.parse(filename).name;
  }

  /**
   * 안전한 파일명 생성 (특수문자 제거)
   * @param filename 원본 파일명
   * @returns 안전한 파일명
   */
  static sanitizeFilename(filename: string): string {
    const extension = this.getExtension(filename);
    const basename = this.removeExtension(filename);

    // 특수문자를 언더스코어로 변경, 한글과 영숫자만 유지
    const sanitized = basename
      .replace(/[^\w\sㄱ-ㅎ가-힣-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 100); // 길이 제한

    return `${sanitized}${extension}`;
  }

  /**
   * 고유한 파일명 생성 (타임스탬프 + 랜덤)
   * @param originalFilename 원본 파일명
   * @returns 고유한 파일명
   */
  static generateUniqueFilename(originalFilename: string): string {
    const extension = this.getExtension(originalFilename);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    return `${timestamp}_${random}${extension}`;
  }

  /**
   * 이미지 파일 여부 확인
   * @param filename 파일명
   * @returns 이미지 파일 여부
   */
  static isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const extension = this.getExtension(filename);
    return imageExtensions.includes(extension);
  }

  /**
   * 파일 크기 변환 (바이트 -> 읽기 쉬운 형태)
   * @param bytes 바이트 크기
   * @returns 변환된 크기 문자열
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 디렉토리 존재 여부 확인 및 생성
   * @param dirPath 디렉토리 경로
   */
  static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 파일 MIME 타입 추출
   * @param filename 파일명
   * @returns MIME 타입
   */
  static getMimeType(filename: string): string {
    const extension = this.getExtension(filename);
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * 업로드 가능한 파일 타입 검증
   * @param filename 파일명
   * @param allowedTypes 허용된 확장자 목록
   * @returns 업로드 가능 여부
   */
  static isAllowedFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = this.getExtension(filename);
    return allowedTypes.includes(extension);
  }
}
