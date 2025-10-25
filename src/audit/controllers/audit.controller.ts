import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { AuditService, AuditLogFilter } from "../services/audit.service";
import {
  AuditLog,
  AuditAction,
  AuditEntityType,
} from "../entities/audit-log.entity";
import { BaseController } from "../../common/controllers";

@ApiTags("Audit")
@Controller("audit")
export class AuditController extends BaseController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: "Get audit logs with filters (Admin only)" })
  @ApiQuery({ name: "userId", required: false })
  @ApiQuery({ name: "action", required: false, enum: AuditAction })
  @ApiQuery({ name: "entityType", required: false, enum: AuditEntityType })
  @ApiQuery({ name: "entityId", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Audit logs retrieved successfully",
  })
  async getAuditLogs(
    @Query("userId") userId?: string,
    @Query("action") action?: AuditAction,
    @Query("entityType") entityType?: AuditEntityType,
    @Query("entityId") entityId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("limit", new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const filter: AuditLogFilter = {
      userId,
      action,
      entityType,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.auditService.getAuditLogs(filter, limit, offset);
  }

  @Get("entity/:entityType/:entityId")
  @ApiOperation({ summary: "Get audit trail for a specific entity" })
  @ApiResponse({
    status: 200,
    description: "Entity audit trail retrieved successfully",
  })
  async getEntityAuditTrail(
    @Param("entityType") entityType: AuditEntityType,
    @Param("entityId") entityId: string,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit?: number
  ): Promise<AuditLog[]> {
    return this.auditService.getEntityAuditTrail(entityType, entityId, limit);
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get user activity logs" })
  @ApiResponse({
    status: 200,
    description: "User activity logs retrieved successfully",
  })
  async getUserActivity(
    @Param("userId") userId: string,
    @Query("limit", new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.auditService.getUserActivity(userId, limit, offset);
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get audit statistics (Admin only)" })
  @ApiQuery({ name: "startDate", required: true })
  @ApiQuery({ name: "endDate", required: true })
  @ApiResponse({
    status: 200,
    description: "Audit statistics retrieved successfully",
  })
  async getAuditStatistics(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string
  ): Promise<{
    totalLogs: number;
    byAction: { [key: string]: number };
    byEntityType: { [key: string]: number };
    byUser: { [key: string]: number };
  }> {
    return this.auditService.getAuditStatistics(
      new Date(startDate),
      new Date(endDate)
    );
  }
}
