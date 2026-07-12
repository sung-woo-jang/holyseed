import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class NcpStorageService {
  private readonly s3: AWS.S3;
  private readonly bucketName: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('app.ncp.region');
    const endpoint = this.configService.get<string>('app.ncp.endpoint');
    const accessKey = this.configService.get<string>('app.ncp.accessKey');
    const secretKey = this.configService.get<string>('app.ncp.secretKey');

    this.bucketName = this.configService.get<string>('app.ncp.bucketName');
    this.endpoint = endpoint;

    // AWS S3 클라이언트 초기화 (NCP Object Storage 호환)
    this.s3 = new AWS.S3({
      endpoint: endpoint,
      region: region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      s3ForcePathStyle: true, // NCP Object Storage 필수 설정
    });
  }

  /**
   * 파일 업로드
   * @param buffer 업로드할 파일의 Buffer
   * @param key S3 Key (파일 경로, 예: images/filename.jpg)
   * @param mimeType 파일 MIME 타입
   * @returns 업로드된 파일의 공개 URL
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<string> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'public-read', // 공개 접근 허용
      };

      await this.s3.putObject(params).promise();

      const url = this.getFileUrl(key);
      console.log(`파일 업로드 성공: ${key}, 크기: ${buffer.length} bytes`);

      return url;
    } catch (error) {
      console.error('NCP 파일 업로드 실패:', {
        key,
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });
      throw new InternalServerErrorException(
        `파일 업로드에 실패했습니다: ${error.message}`,
      );
    }
  }

  /**
   * 파일 삭제
   * @param key S3 Key (파일 경로)
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
      console.log(`파일 삭제 성공: ${key}`);
    } catch (error) {
      // 파일이 없어도 에러를 던지지 않음 (로그만 출력)
      console.error('NCP 파일 삭제 실패:', {
        key,
        error: error.message,
      });
    }
  }

  /**
   * 파일 URL 생성
   * @param key S3 Key (파일 경로)
   * @returns 공개 URL
   */
  getFileUrl(key: string): string {
    return `${this.endpoint}/${this.bucketName}/${key}`;
  }

  /**
   * 파일 존재 여부 확인
   * @param key S3 Key (파일 경로)
   * @returns 파일이 존재하면 true, 아니면 false
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3
        .headObject({
          Bucket: this.bucketName,
          Key: key,
        })
        .promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}
