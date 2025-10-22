import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { User } from '../../users/entities/user.entity';

@ApiTags('business')
@Controller('business')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, description: 'Business created' })
  async create(@Req() req: Request, @Body() dto: CreateBusinessDto) {
    const user = req.user as User;
    return this.businessService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses for current user' })
  @ApiResponse({ status: 200, description: 'List of businesses' })
  async findAll(@Req() req: Request) {
    const user = req.user as User;
    return this.businessService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Business details' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.businessService.findOne(id, user.id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get business statistics' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Business statistics' })
  async getStats(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.businessService.getBusinessStats(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Business updated' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    const user = req.user as User;
    return this.businessService.update(id, user.id, dto);
  }

  @Patch(':id/verify-tin')
  @ApiOperation({ summary: 'Verify business TIN' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'TIN verified' })
  async verifyTin(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.businessService.verifyTin(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 204, description: 'Business deleted' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    await this.businessService.remove(id, user.id);
  }
}

