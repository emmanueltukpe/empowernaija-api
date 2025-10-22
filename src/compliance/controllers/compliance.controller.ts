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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ComplianceService } from '../services/compliance.service';
import { CreateComplianceTaskDto } from '../dto/create-compliance-task.dto';
import { UpdateComplianceTaskDto } from '../dto/update-compliance-task.dto';
import { User } from '../../users/entities/user.entity';

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a compliance task' })
  @ApiResponse({ status: 201, description: 'Compliance task created' })
  async create(@Req() req: Request, @Body() dto: CreateComplianceTaskDto) {
    const user = req.user as User;
    return this.complianceService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all compliance tasks' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' })
  @ApiResponse({ status: 200, description: 'List of compliance tasks' })
  async findAll(@Req() req: Request, @Query('businessId') businessId?: string) {
    const user = req.user as User;
    return this.complianceService.findAll(user.id, businessId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming compliance tasks' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  @ApiResponse({ status: 200, description: 'Upcoming compliance tasks' })
  async getUpcoming(@Req() req: Request, @Query('days') days?: number) {
    const user = req.user as User;
    return this.complianceService.getUpcomingTasks(user.id, days);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue compliance tasks' })
  @ApiResponse({ status: 200, description: 'Overdue compliance tasks' })
  async getOverdue(@Req() req: Request) {
    const user = req.user as User;
    return this.complianceService.getOverdueTasks(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get compliance task by ID' })
  @ApiParam({ name: 'id', description: 'Compliance task ID' })
  @ApiResponse({ status: 200, description: 'Compliance task details' })
  @ApiResponse({ status: 404, description: 'Compliance task not found' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.complianceService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update compliance task' })
  @ApiParam({ name: 'id', description: 'Compliance task ID' })
  @ApiResponse({ status: 200, description: 'Compliance task updated' })
  @ApiResponse({ status: 404, description: 'Compliance task not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateComplianceTaskDto,
  ) {
    const user = req.user as User;
    return this.complianceService.update(id, user.id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark compliance task as completed' })
  @ApiParam({ name: 'id', description: 'Compliance task ID' })
  @ApiResponse({ status: 200, description: 'Compliance task marked as completed' })
  async markAsCompleted(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.complianceService.markAsCompleted(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete compliance task' })
  @ApiParam({ name: 'id', description: 'Compliance task ID' })
  @ApiResponse({ status: 204, description: 'Compliance task deleted' })
  @ApiResponse({ status: 404, description: 'Compliance task not found' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    await this.complianceService.remove(id, user.id);
  }
}

