import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between } from "typeorm";
import {
  AuditLog,
  AuditAction,
  AuditEntityType,
} from "../entities/audit-log.entity";

export interface CreateAuditLogDto {
  userId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  description?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  isSensitive?: boolean;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  isSensitive?: boolean;
}

/**
 * Audit Service
 * Handles creation and retrieval of audit logs
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>
  ) {}

  /**
   * Create an audit log entry
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: dto.userId,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        description: dto.description,
        oldValue: this.sanitizeSensitiveData(dto.oldValue, dto.isSensitive),
        newValue: this.sanitizeSensitiveData(dto.newValue, dto.isSensitive),
        metadata: dto.metadata,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        isSensitive: dto.isSensitive || false,
      });

      const saved = await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: ${dto.action} on ${dto.entityType}${dto.entityId ? ` (${dto.entityId})` : ""} by user ${dto.userId || "system"}`
      );

      return saved;
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Log a tax calculation
   */
  async logTaxCalculation(
    userId: string,
    taxType: string,
    result: any,
    metadata?: any
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.CALCULATE,
      entityType: AuditEntityType.TAX_CALCULATION,
      description: `Calculated ${taxType} tax`,
      newValue: {
        taxType,
        taxLiability: result.taxLiability,
        taxableIncome: result.taxableIncome,
      },
      metadata,
    });
  }

  /**
   * Log a document upload
   */
  async logDocumentUpload(
    userId: string,
    documentId: string,
    documentType: string,
    metadata?: any
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.UPLOAD,
      entityType: AuditEntityType.DOCUMENT,
      entityId: documentId,
      description: `Uploaded ${documentType} document`,
      metadata,
    });
  }

  /**
   * Log a tax return submission
   */
  async logTaxReturnSubmission(
    userId: string,
    taxReturnId: string,
    metadata?: any
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditAction.SUBMIT,
      entityType: AuditEntityType.TAX_RETURN,
      entityId: taxReturnId,
      description: "Submitted tax return to FIRS",
      metadata,
    });
  }

  /**
   * Log a data change (create, update, delete)
   */
  async logDataChange(
    userId: string,
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    oldValue?: any,
    newValue?: any,
    metadata?: any
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action,
      entityType,
      entityId,
      description: `${action} ${entityType}`,
      oldValue,
      newValue,
      metadata,
      isSensitive: this.isSensitiveEntity(entityType),
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(
    filter: AuditLogFilter,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: FindOptionsWhere<AuditLog> = {};

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.action) {
      where.action = filter.action;
    }

    if (filter.entityType) {
      where.entityType = filter.entityType;
    }

    if (filter.entityId) {
      where.entityId = filter.entityId;
    }

    if (filter.isSensitive !== undefined) {
      where.isSensitive = filter.isSensitive;
    }

    if (filter.startDate && filter.endDate) {
      where.createdAt = Between(filter.startDate, filter.endDate);
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
      relations: ["user"],
    });

    return { logs, total };
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditTrail(
    entityType: AuditEntityType,
    entityId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: "DESC" },
      take: limit,
      relations: ["user"],
    });
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return { logs, total };
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalLogs: number;
    byAction: { [key: string]: number };
    byEntityType: { [key: string]: number };
    byUser: { [key: string]: number };
  }> {
    const logs = await this.auditLogRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const byAction: { [key: string]: number } = {};
    const byEntityType: { [key: string]: number } = {};
    const byUser: { [key: string]: number } = {};

    logs.forEach((log) => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byEntityType[log.entityType] = (byEntityType[log.entityType] || 0) + 1;
      if (log.userId) {
        byUser[log.userId] = (byUser[log.userId] || 0) + 1;
      }
    });

    return {
      totalLogs: logs.length,
      byAction,
      byEntityType,
      byUser,
    };
  }

  /**
   * Sanitize sensitive data before logging
   */
  private sanitizeSensitiveData(data: any, isSensitive?: boolean): any {
    if (!data || !isSensitive) return data;

    const sanitized = { ...data };
    const sensitiveFields = [
      "password",
      "pin",
      "secret",
      "token",
      "apiKey",
      "creditCard",
      "bankAccount",
    ];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  /**
   * Check if entity type contains sensitive data
   */
  private isSensitiveEntity(entityType: AuditEntityType): boolean {
    const sensitiveEntities = [
      AuditEntityType.USER,
      AuditEntityType.TAX_RETURN,
      AuditEntityType.INCOME_RECORD,
    ];
    return sensitiveEntities.includes(entityType);
  }
}

