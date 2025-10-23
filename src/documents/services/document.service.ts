import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus, DocumentType } from '../entities/document.entity';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  VerifyDocumentDto,
} from '../dto/upload-document.dto';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  /**
   * Validate file before upload
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: PDF, JPEG, PNG`,
      );
    }
  }

  /**
   * Create a document record after file upload
   */
  async createDocument(
    userId: string,
    fileUrl: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ): Promise<Document> {
    this.logger.log(
      `Creating document record for user ${userId}, type: ${dto.documentType}`,
    );

    const document = this.documentRepository.create({
      userId,
      businessId: dto.businessId,
      documentType: dto.documentType,
      fileName: file.originalname,
      fileUrl,
      fileSizeBytes: file.size,
      mimeType: file.mimetype,
      uploadDate: new Date(),
      taxYear: dto.taxYear,
      description: dto.description,
      metadata: dto.metadata,
      status: DocumentStatus.PENDING,
    });

    const saved = await this.documentRepository.save(document);
    this.logger.log(`Document created with ID: ${saved.id}`);

    return saved;
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(
    userId: string,
    taxYear?: number,
    documentType?: DocumentType,
  ): Promise<Document[]> {
    const query = this.documentRepository
      .createQueryBuilder('document')
      .where('document.userId = :userId', { userId });

    if (taxYear) {
      query.andWhere('document.taxYear = :taxYear', { taxYear });
    }

    if (documentType) {
      query.andWhere('document.documentType = :documentType', { documentType });
    }

    query.orderBy('document.uploadDate', 'DESC');

    return query.getMany();
  }

  /**
   * Get all documents for a business
   */
  async getBusinessDocuments(
    businessId: string,
    taxYear?: number,
    documentType?: DocumentType,
  ): Promise<Document[]> {
    const query = this.documentRepository
      .createQueryBuilder('document')
      .where('document.businessId = :businessId', { businessId });

    if (taxYear) {
      query.andWhere('document.taxYear = :taxYear', { taxYear });
    }

    if (documentType) {
      query.andWhere('document.documentType = :documentType', { documentType });
    }

    query.orderBy('document.uploadDate', 'DESC');

    return query.getMany();
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(id: string, userId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Check ownership
    if (document.userId !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return document;
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    id: string,
    userId: string,
    dto: UpdateDocumentDto,
  ): Promise<Document> {
    const document = await this.getDocumentById(id, userId);

    if (dto.description !== undefined) {
      document.description = dto.description;
    }

    if (dto.metadata !== undefined) {
      document.metadata = { ...document.metadata, ...dto.metadata };
    }

    if (dto.notes !== undefined) {
      document.notes = dto.notes;
    }

    const updated = await this.documentRepository.save(document);
    this.logger.log(`Document ${id} updated`);

    return updated;
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string, userId: string): Promise<void> {
    const document = await this.getDocumentById(id, userId);

    await this.documentRepository.remove(document);
    this.logger.log(`Document ${id} deleted`);

    // TODO: Also delete the file from S3/storage
  }

  /**
   * Verify a document (admin only)
   */
  async verifyDocument(
    id: string,
    adminUserId: string,
    dto: VerifyDocumentDto,
  ): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (dto.approved) {
      document.status = DocumentStatus.VERIFIED;
      document.verifiedBy = adminUserId;
      document.verifiedAt = new Date();
      document.rejectionReason = '';
    } else {
      if (!dto.rejectionReason) {
        throw new BadRequestException(
          'Rejection reason is required when rejecting a document',
        );
      }
      document.status = DocumentStatus.REJECTED;
      document.rejectionReason = dto.rejectionReason;
    }

    if (dto.notes) {
      document.notes = dto.notes;
    }

    const updated = await this.documentRepository.save(document);
    this.logger.log(
      `Document ${id} ${dto.approved ? 'verified' : 'rejected'} by admin ${adminUserId}`,
    );

    return updated;
  }

  /**
   * Get documents by status
   */
  async getDocumentsByStatus(status: DocumentStatus): Promise<Document[]> {
    return this.documentRepository.find({
      where: { status },
      order: { uploadDate: 'DESC' },
    });
  }

  /**
   * Check if required documents exist for a tax calculation
   */
  async checkRequiredDocuments(
    userId: string,
    taxYear: number,
    requiredTypes: DocumentType[],
  ): Promise<{ hasAll: boolean; missing: DocumentType[] }> {
    const documents = await this.getUserDocuments(userId, taxYear);
    const existingTypes = new Set(documents.map((d) => d.documentType));

    const missing = requiredTypes.filter((type) => !existingTypes.has(type));

    return {
      hasAll: missing.length === 0,
      missing,
    };
  }
}
