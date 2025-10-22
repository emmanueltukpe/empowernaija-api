import {
  Controller,
  Get,
  Post,
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
import { VATService } from '../services/vat.service';
import { CreateVATRecordDto } from '../dto/create-vat-record.dto';
import { User } from '../../users/entities/user.entity';

@ApiTags('vat')
@Controller('vat')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VATController {
  constructor(private readonly vatService: VATService) {}

  @Post()
  @ApiOperation({ summary: 'Create a VAT record' })
  @ApiResponse({ status: 201, description: 'VAT record created' })
  async create(@Req() req: Request, @Body() dto: CreateVATRecordDto) {
    const user = req.user as User;
    return this.vatService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all VAT records' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' })
  @ApiResponse({ status: 200, description: 'List of VAT records' })
  async findAll(@Req() req: Request, @Query('businessId') businessId?: string) {
    const user = req.user as User;
    return this.vatService.findAll(user.id, businessId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get VAT summary for a quarter' })
  @ApiQuery({ name: 'businessId', required: true })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiQuery({ name: 'quarter', required: true, example: 1 })
  @ApiResponse({ status: 200, description: 'VAT summary' })
  async getVATSummary(
    @Req() req: Request,
    @Query('businessId') businessId: string,
    @Query('year') year: number,
    @Query('quarter') quarter: number,
  ) {
    const user = req.user as User;
    return this.vatService.getVATSummary(user.id, businessId, year, quarter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get VAT record by ID' })
  @ApiParam({ name: 'id', description: 'VAT record ID' })
  @ApiResponse({ status: 200, description: 'VAT record details' })
  @ApiResponse({ status: 404, description: 'VAT record not found' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.vatService.findOne(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete VAT record' })
  @ApiParam({ name: 'id', description: 'VAT record ID' })
  @ApiResponse({ status: 204, description: 'VAT record deleted' })
  @ApiResponse({ status: 404, description: 'VAT record not found' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    await this.vatService.remove(id, user.id);
  }
}

