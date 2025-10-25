import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { TaxCalculationService } from "../services/tax-calculation.service";
import {
  PersonalIncomeTaxDto,
  CompanyIncomeTaxDto,
  CapitalGainsTaxDto,
  PresumptiveTaxDto,
  VATCalculationDto,
  TaxCalculationResultDto,
  SaveTaxCalculationRequestDto,
} from "../dto/tax-calculation.dto";
import { User } from "../../users/entities/user.entity";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("Tax Calculations")
@Controller("tax")
export class TaxCalculationController extends BaseController {
  constructor(private readonly taxCalculationService: TaxCalculationService) {
    super();
  }

  @Post("calculate/pit")
  @ApiOperation({
    summary: "Calculate Personal Income Tax (PIT)",
    description:
      "Calculates PIT based on Nigerian 2026 tax law with progressive rates (0%, 15%, 18%, 21%, 23%, 25%), " +
      "₦800,000 tax-free threshold, automatic relief calculations including 20% rent relief (capped at ₦500,000), " +
      "pension contributions, health insurance premiums, and ₦50M severance exemption. Requires landlord details " +
      "for rent relief and provider information for pension/health insurance claims.",
  })
  @ApiResponse({
    status: 200,
    description:
      "Tax calculation completed successfully with detailed breakdown",
    type: TaxCalculationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data - validation errors in request body",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error during tax calculation",
  })
  calculatePIT(@Body() dto: PersonalIncomeTaxDto): TaxCalculationResultDto {
    return this.taxCalculationService.calculatePersonalIncomeTax(dto);
  }

  @Post("calculate/cit")
  @ApiOperation({
    summary: "Calculate Company Income Tax (CIT)",
    description:
      "Calculates CIT based on Nigerian 2026 tax law with SME exemptions (0% CIT for businesses with turnover ≤₦100M AND assets ≤₦250M), " +
      "5-year agricultural tax holiday from business start date, NGO/charity tax exemptions with certificate verification, " +
      "5% capital investment credit with 5-year FIFO carryforward, and 10% corporate donation deductions. " +
      "Standard CIT rate is 30% for non-exempt businesses.",
  })
  @ApiResponse({
    status: 200,
    description:
      "Tax calculation completed successfully with exemption details",
    type: TaxCalculationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data - validation errors in request body",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error during tax calculation",
  })
  calculateCIT(@Body() dto: CompanyIncomeTaxDto): TaxCalculationResultDto {
    return this.taxCalculationService.calculateCompanyIncomeTax(dto);
  }

  @Post("calculate/cgt")
  @ApiOperation({
    summary: "Calculate Capital Gains Tax (CGT)",
    description:
      "Calculates CGT on disposal of chargeable assets at 10% rate. Includes exemptions for government securities, " +
      "owner-occupied residential property, and assets held for more than 10 years. Requires purchase price, " +
      "sale price, and disposal date for accurate calculation.",
  })
  @ApiResponse({
    status: 200,
    description: "Capital gains tax calculated successfully",
    type: TaxCalculationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data - validation errors in request body",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error during tax calculation",
  })
  calculateCGT(@Body() dto: CapitalGainsTaxDto): TaxCalculationResultDto {
    return this.taxCalculationService.calculateCapitalGainsTax(dto);
  }

  @Post("calculate/presumptive")
  @ApiOperation({
    summary: "Calculate Presumptive Tax (for informal sector workers)",
    description:
      "Calculates presumptive tax for informal sector workers based on estimated annual turnover and activity type. " +
      "Rates: 1% for street vendors, 1.5% for artisans/craftsmen, 2% for traders/retailers. " +
      "This simplified tax regime helps informal sector workers comply with tax obligations without complex record-keeping.",
  })
  @ApiResponse({
    status: 200,
    description: "Presumptive tax calculated successfully",
    type: TaxCalculationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data - validation errors in request body",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error during tax calculation",
  })
  calculatePresumptiveTax(
    @Body() dto: PresumptiveTaxDto
  ): TaxCalculationResultDto {
    return this.taxCalculationService.calculatePresumptiveTax(dto);
  }

  @Post("calculate/vat")
  @ApiOperation({
    summary: "Calculate VAT",
    description:
      "Calculates Value Added Tax (VAT) at 7.5% standard rate. Supports zero-rating for essential items " +
      "such as basic food items, medical supplies, educational materials, and agricultural products. " +
      "Returns base amount, VAT amount, and total amount including VAT.",
  })
  @ApiResponse({
    status: 200,
    description: "VAT calculation completed successfully",
    schema: {
      type: "object",
      properties: {
        baseAmount: { type: "number", example: 10000 },
        vatRate: { type: "number", example: 7.5 },
        vatAmount: { type: "number", example: 750 },
        totalAmount: { type: "number", example: 10750 },
        isZeroRated: { type: "boolean", example: false },
        itemDescription: { type: "string", example: "Electronics" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data - validation errors in request body",
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

  @Post("save")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Save tax calculation to history",
    description:
      "Saves a completed tax calculation to the user's calculation history for future reference. " +
      "Can be associated with a specific business if businessId is provided. Useful for tracking " +
      "tax calculations over time and generating tax returns.",
  })
  @ApiResponse({
    status: 201,
    description: "Tax calculation saved successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid calculation data or missing required fields",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  async saveTaxCalculation(
    @CurrentUser() user: User,
    @Body() body: SaveTaxCalculationRequestDto
  ) {
    return this.taxCalculationService.saveTaxCalculation(
      body.calculation,
      user.id,
      body.businessId
    );
  }

  @Get("history")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user tax calculation history",
    description:
      "Retrieves all tax calculations performed by the authenticated user, ordered by most recent first. " +
      "Includes calculations for all tax types (PIT, CIT, CGT, VAT, Presumptive) and associated businesses.",
  })
  @ApiResponse({
    status: 200,
    description: "Tax calculation history retrieved successfully",
    type: [TaxCalculationResultDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  async getUserHistory(@CurrentUser() user: User) {
    return this.taxCalculationService.getUserTaxCalculations(user.id);
  }

  @Get("business/:businessId/history")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get business tax calculation history",
    description:
      "Retrieves all tax calculations for a specific business, ordered by most recent first. " +
      "Useful for tracking business tax obligations over multiple tax years.",
  })
  @ApiParam({
    name: "businessId",
    description: "UUID of the business",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Business tax calculation history retrieved successfully",
    type: [TaxCalculationResultDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Business not found",
  })
  async getBusinessHistory(@Param("businessId") businessId: string) {
    return this.taxCalculationService.getBusinessTaxCalculations(businessId);
  }
}
