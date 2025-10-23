import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Storage Service
 * 
 * This service handles file storage. Currently implements local file storage.
 * Can be extended to support AWS S3, Azure Blob Storage, or Google Cloud Storage.
 * 
 * To implement S3:
 * 1. Install: npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
 * 2. Add AWS credentials to .env
 * 3. Implement uploadToS3() method
 * 4. Update uploadFile() to use S3
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir =
      this.configService.get<string>('UPLOAD_DESTINATION') || './uploads';

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Upload file to local storage
   * Returns the file URL/path
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    documentType: string,
  ): Promise<string> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}_${documentType}_${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    this.logger.log(`File uploaded: ${fileName}`);

    // Return relative path (or S3 URL in production)
    return `/uploads/${fileName}`;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`File deleted: ${fileName}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file from storage
   */
  async getFile(fileUrl: string): Promise<Buffer> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);

      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      return await fs.promises.readFile(filePath);
    } catch (error) {
      this.logger.error(`Error reading file: ${error.message}`);
      throw error;
    }
  }

  /**
   * TODO: Implement S3 upload for production
   * 
   * Example implementation:
   * 
   * async uploadToS3(file: Express.Multer.File, key: string): Promise<string> {
   *   const s3Client = new S3Client({
   *     region: this.configService.get('AWS_REGION'),
   *     credentials: {
   *       accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
   *       secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
   *     },
   *   });
   * 
   *   const upload = new Upload({
   *     client: s3Client,
   *     params: {
   *       Bucket: this.configService.get('AWS_S3_BUCKET'),
   *       Key: key,
   *       Body: file.buffer,
   *       ContentType: file.mimetype,
   *     },
   *   });
   * 
   *   await upload.done();
   * 
   *   return `https://${this.configService.get('AWS_S3_BUCKET')}.s3.amazonaws.com/${key}`;
   * }
   */
}

