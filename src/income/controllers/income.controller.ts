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
import { IncomeService } from '../services/income.service';
import { CreateIncomeDto } from '../dto/create-income.dto';
import { UpdateIncomeDto } from '../dto/update-income.dto';
import { User } from '../../users/entities/user.entity';

@ApiTags('income')
@Controller('income')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  @ApiOperation({ summary: 'Create income record' })
  @ApiResponse({ status: 201, description: 'Income record created' })
  async create(@Req() req: Request, @Body() dto: CreateIncomeDto) {
    const user = req.user as User;
    return this.incomeService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all income records for current user' })
  @ApiResponse({ status: 200, description: 'List of income records' })
  async findAll(@Req() req: Request) {
    const user = req.user as User;
    return this.incomeService.findAll(user.id);
  }

  @Get('summary/yearly')
  @ApiOperation({ summary: 'Get yearly income summary' })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiResponse({ status: 200, description: 'Yearly income summary' })
  async getYearlySummary(@Req() req: Request, @Query('year') year: number) {
    const user = req.user as User;
    return this.incomeService.getYearlySummary(user.id, year);
  }

  @Get('summary/monthly')
  @ApiOperation({ summary: 'Get monthly income summary' })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiQuery({ name: 'month', required: true, example: 1 })
  @ApiResponse({ status: 200, description: 'Monthly income summary' })
  async getMonthlySummary(
    @Req() req: Request,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    const user = req.user as User;
    return this.incomeService.getMonthlySummary(user.id, year, month);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get income record by ID' })
  @ApiParam({ name: 'id', description: 'Income record ID' })
  @ApiResponse({ status: 200, description: 'Income record' })
  @ApiResponse({ status: 404, description: 'Income record not found' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.incomeService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update income record' })
  @ApiParam({ name: 'id', description: 'Income record ID' })
  @ApiResponse({ status: 200, description: 'Income record updated' })
  @ApiResponse({ status: 404, description: 'Income record not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    const user = req.user as User;
    return this.incomeService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete income record' })
  @ApiParam({ name: 'id', description: 'Income record ID' })
  @ApiResponse({ status: 204, description: 'Income record deleted' })
  @ApiResponse({ status: 404, description: 'Income record not found' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    await this.incomeService.remove(id, user.id);
  }
}

