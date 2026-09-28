import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private minioClient: Minio.Client;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: Number(this.configService.get<number>('MINIO_PORT', 9000)),
      useSSL: false,
      accessKey: this.configService.get<string>('MINIO_ROOT_USER'),
      secretKey: this.configService.get<string>('MINIO_ROOT_PASSWORD'),
    });
  }

  // Génère une URL qui expire après 24h pour une image
  async getFileUrl(bucketName: string, fileName: string) {
    try {
      return await this.minioClient.presignedGetObject(
        bucketName,
        fileName,
        24 * 60 * 60,
      );
    } catch {
      throw new InternalServerErrorException('Error generating MinIO URL');
    }
  }

  async refreshPresignedUrl(fileUrl: string): Promise<string> {
    try {
      const parsed = new URL(fileUrl);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const [bucketName, ...objectParts] = pathParts;
      const fileName = objectParts.join('/');

      if (!bucketName || !fileName) {
        throw new Error('Invalid MinIO object URL');
      }

      return await this.getFileUrl(bucketName, decodeURIComponent(fileName));
    } catch {
      throw new InternalServerErrorException('Error refreshing MinIO URL');
    }
  }

  async uploadFile(
    bucketName: string,
    fileName: string,
    file: Buffer,
    mimeType: string,
  ) {
    try {
      // Check if bucket exists, if not create it
      const bucketExists = await this.minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(bucketName);
      }

      await this.minioClient.putObject(
        bucketName,
        fileName,
        file,
        file.length,
        {
          'Content-Type': mimeType,
        },
      );
      return fileName;
    } catch {
      throw new InternalServerErrorException('Error uploading file to MinIO');
    }
  }

  async deleteFile(bucketName: string, fileName: string) {
    try {
      await this.minioClient.removeObject(bucketName, fileName);
    } catch {
      throw new InternalServerErrorException('Error deleting file from MinIO');
    }
  }

  async listObjects(bucketName: string, prefix = '') {
    try {
      const objects: string[] = [];
      const stream = this.minioClient.listObjectsV2(bucketName, prefix, true);

      return new Promise<string[]>((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) objects.push(obj.name);
        });
        stream.on('error', (err) => reject(err));
        stream.on('end', () => {
          // Sort items numerically if possible (e.g., 1.png, 2.png)
          objects.sort((a, b) => {
            const baseA = a.split('/').pop() || a;
            const baseB = b.split('/').pop() || b;
            const numA = parseInt(baseA.split('.')[0], 10);
            const numB = parseInt(baseB.split('.')[0], 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
          });
          resolve(objects);
        });
      });
    } catch {
      throw new InternalServerErrorException('Error listing files from MinIO');
    }
  }

  async getFile(bucketName: string, fileName: string): Promise<string> {
    try {
      const stream = await this.minioClient.getObject(bucketName, fileName);
      return new Promise((resolve, reject) => {
        let content = '';
        stream.on('data', (chunk) => (content += chunk));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(content));
      });
    } catch {
      throw new InternalServerErrorException('Error getting file from MinIO');
    }
  }
}
