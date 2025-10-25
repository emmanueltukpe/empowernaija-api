import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ComplianceService } from "../services/compliance.service";
import { CreateComplianceTaskDto } from "../dto/create-compliance-task.dto";
import { UpdateComplianceTaskDto } from "../dto/update-compliance-task.dto";
import { User } from "../../users/entities/user.entity";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("compliance")
@Controller("compliance")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ComplianceController extends BaseController {
  constructor(private readonly complianceService: ComplianceService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: "Create a compliance task" })
  @ApiResponse({ status: 201, description: "Compliance task created" })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateComplianceTaskDto
  ) {
    return this.complianceService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all compliance tasks" })
  @ApiQuery({
    name: "businessId",
    required: false,
    description: "Filter by business ID",
  })
  @ApiResponse({ status: 200, description: "List of compliance tasks" })
  async findAll(
    @CurrentUser() user: User,
    @Query("businessId") businessId?: string
  ) {
    return this.complianceService.findAll(user.id, businessId);
  }

  @Get("upcoming")
  @ApiOperation({ summary: "Get upcoming compliance tasks" })
  @ApiQuery({ name: "days", required: false, example: 30 })
  @ApiResponse({ status: 200, description: "Upcoming compliance tasks" })
  async getUpcoming(@CurrentUser() user: User, @Query("days") days?: number) {
    return this.complianceService.getUpcomingTasks(user.id, days);
  }

  @Get("overdue")
  @ApiOperation({ summary: "Get overdue compliance tasks" })
  @ApiResponse({ status: 200, description: "Overdue compliance tasks" })
  async getOverdue(@CurrentUser() user: User) {
    return this.complianceService.getOverdueTasks(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get compliance task by ID" })
  @ApiParam({ name: "id", description: "Compliance task ID" })
  @ApiResponse({ status: 200, description: "Compliance task details" })
  @ApiResponse({ status: 404, description: "Compliance task not found" })
  async findOne(@CurrentUser() user: User, @Param("id") id: string) {
    return this.complianceService.findOne(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update compliance task" })
  @ApiParam({ name: "id", description: "Compliance task ID" })
  @ApiResponse({ status: 200, description: "Compliance task updated" })
  @ApiResponse({ status: 404, description: "Compliance task not found" })
  async update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateComplianceTaskDto
  ) {
    return this.complianceService.update(id, user.id, dto);
  }

  @Patch(":id/complete")
  @ApiOperation({ summary: "Mark compliance task as completed" })
  @ApiParam({ name: "id", description: "Compliance task ID" })
  @ApiResponse({
    status: 200,
    description: "Compliance task marked as completed",
  })
  async markAsCompleted(@CurrentUser() user: User, @Param("id") id: string) {
    return this.complianceService.markAsCompleted(id, user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete compliance task" })
  @ApiParam({ name: "id", description: "Compliance task ID" })
  @ApiResponse({ status: 204, description: "Compliance task deleted" })
  @ApiResponse({ status: 404, description: "Compliance task not found" })
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.complianceService.remove(id, user.id);
  }
}
