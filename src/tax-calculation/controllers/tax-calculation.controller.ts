import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
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
import { TaxCalculationService } from '../services/tax-calculation.service';
import {
  PersonalIncomeTaxDto,
  CompanyIncomeTaxDto,
  CapitalGainsTaxDto,
  VATCalculationDto,
  TaxCalculationResultDto,
  SaveTaxCalculationRequestDto,
} from '../dto/tax-calculation.dto';
import { User } from '../../users/entities/user.entity';

@ApiTags('tax-calculation')
@Controller('tax')
export class TaxCalculationController {
  constructor(
    private readonly taxCalculationService: TaxCalculationService,
  ) {}

  @Post('calculate/pit')
  @ApiOperation({
    summary: 'Calculate Personal Income Tax (PIT)',
    description: 'Calculate tax based on Nigeria 2026 progressive tax rates',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax calculation result',
    type: TaxCalculationResultDto,
  })
  calculatePIT(@Body() dto: PersonalIncomeTaxDto): TaxCalculationResultDto {
    return this.taxCalculationService.calculatePersonalIncomeTax(dto);
  }

  @Post('calculate/cit')
  @ApiOperation({
    summary: 'Calculate Company Income Tax (CIT)',
    description: 'Calculate company tax with small business exemptions',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax calculation result',
    type: TaxCalculationResultDto,
  })
  calculateCIT(@Body() dto: CompanyIncomeTaxDto): TaxCalculationResultDto {
    return this.taxCalculationService.calculateCompanyIncomeTax(dto);
  }

  @Post('calculate/cgt')
  @ApiOperation({
    summary: 'Calculate Capital Gains Tax (CGT)',
    description: 'Calculate capital gains tax with exemptions',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax calculation result',
    type: TaxCalculationResultDto,
  })
  calculateCGT(@Body() dto: CapitalGainsTaxDto): TaxCalculationResultDto {
    return this.taxCalculationService.calculateCapitalGainsTax(dto);
  }

  @Post('calculate/vat')
  @ApiOperation({
    summary: 'Calculate VAT',
    description: 'Calculate VAT with zero-rating for essential items',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT calculation result',
  })
  calculateVAT(@Body() dto: VATCalculationDto) {
    const VAT_RATE = 0.075;
    const vatAmount = dto.isZeroRated ? 0 : dto.baseAmount * VAT_RATE;
    const totalAmount = dto.baseAmount + vatAmount;

    return {
      baseAmount: dto.baseAmount,
      vatRate: dto.isZeroRated ? 0 : VAT_RATE * 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      isZeroRated: dto.isZeroRated || false,
      itemDescription: dto.itemDescription,
    };
  }

  @Post('save')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save tax calculation',
    description: 'Save a tax calculation to user history',
  })
  @ApiResponse({ status: 201, description: 'Calculation saved' })
  async saveTaxCalculation(
    @Req() req: Request,
    @Body() body: SaveTaxCalculationRequestDto,
  ) {
    const user = req.user as User;
    return this.taxCalculationService.saveTaxCalculation(
      body.calculation,
      user.id,
      body.businessId,
    );
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user tax calculation history',
    description: 'Retrieve all tax calculations for the current user',
  })
  @ApiResponse({ status: 200, description: 'Tax calculation history' })
  async getUserHistory(@Req() req: Request) {
    const user = req.user as User;
    return this.taxCalculationService.getUserTaxCalculations(user.id);
  }

  @Get('business/:businessId/history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get business tax calculation history',
    description: 'Retrieve all tax calculations for a specific business',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Business tax calculation history' })
  async getBusinessHistory(@Param('businessId') businessId: string) {
    return this.taxCalculationService.getBusinessTaxCalculations(businessId);
  }
}

