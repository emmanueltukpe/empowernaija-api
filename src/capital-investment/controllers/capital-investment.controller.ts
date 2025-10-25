import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { CapitalInvestmentService } from "../services/capital-investment.service";
import {
  CreateCapitalExpenditureDto,
  UpdateCapitalExpenditureDto,
} from "../dto/capital-expenditure.dto";
import { CapitalExpenditure } from "../entities/capital-expenditure.entity";
import { BaseController } from "../../common/controllers";

@ApiTags("Capital Investment & Tax Credits")
@Controller("capital-investment")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CapitalInvestmentController extends BaseController {
  constructor(
    private readonly capitalInvestmentService: CapitalInvestmentService
  ) {
    super();
  }

  @Post("expenditures")
  @ApiOperation({
    summary: "Record capital expenditure",
    description:
      "Records a capital expenditure and automatically calculates the 5% capital investment tax credit " +
      "under Nigerian 2026 tax law. The credit can be carried forward for 5 years using FIFO (First-In-First-Out) method. " +
      "Eligible expenditures include machinery, equipment, buildings, and other qualifying capital assets. " +
      "Requires invoice documentation and supplier TIN for verification. " +
      "Example: ₦10,000,000 expenditure generates ₦500,000 credit (5%) valid until expiry year.",
  })
  @ApiBody({
    type: CreateCapitalExpenditureDto,
    description: "Capital expenditure details",
    examples: {
      machinery: {
        value: {
          businessId: "123e4567-e89b-12d3-a456-426614174000",
          description: "Industrial machinery for manufacturing",
          amount: 10000000,
          expenditureDate: "2026-03-15",
          supplierName: "ABC Equipment Ltd",
          supplierTin: "12345678-9012",
          invoiceNumber: "INV-2026-001",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      "Capital expenditure recorded successfully with 5% credit calculated",
    type: CapitalExpenditure,
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        businessId: "123e4567-e89b-12d3-a456-426614174000",
        description: "Industrial machinery for manufacturing",
        amount: 10000000,
        creditAmount: 500000,
        expenditureDate: "2026-03-15",
        expiryYear: 2031,
        supplierName: "ABC Equipment Ltd",
        supplierTin: "12345678-9012",
        invoiceNumber: "INV-2026-001",
        createdAt: "2026-03-15T10:30:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid expenditure data or supplier TIN format",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Business not found",
  })
  async createExpenditure(
    @Body() dto: CreateCapitalExpenditureDto
  ): Promise<CapitalExpenditure> {
    return await this.capitalInvestmentService.createExpenditure(dto);
  }

  @Get("expenditures/:id")
  @ApiOperation({
    summary: "Get capital expenditure details",
    description:
      "Retrieves detailed information for a specific capital expenditure including the calculated 5% credit, " +
      "expiry year, supplier information, and usage status. Shows how much of the credit has been used " +
      "and how much remains available for future tax years.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the capital expenditure",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Expenditure details retrieved successfully",
    type: CapitalExpenditure,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Capital expenditure not found",
  })
  async getExpenditure(@Param("id") id: string): Promise<CapitalExpenditure> {
    return await this.capitalInvestmentService.getExpenditure(id);
  }

  @Get("business/:businessId/expenditures")
  @ApiOperation({
    summary: "Get all expenditures for a business",
    description:
      "Retrieves all capital expenditures for a specific business sorted by expenditure date (most recent first). " +
      "Shows total credits generated, credits used, and credits available. Useful for tracking capital investment " +
      "history and planning future credit usage. Includes expired credits for audit purposes.",
  })
  @ApiParam({
    name: "businessId",
    description: "UUID of the business",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "List of expenditures retrieved successfully",
    type: [CapitalExpenditure],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Business not found",
  })
  async getBusinessExpenditures(
    @Param("businessId") businessId: string
  ): Promise<CapitalExpenditure[]> {
    return await this.capitalInvestmentService.getBusinessExpenditures(
      businessId
    );
  }

  @Patch("expenditures/:id")
  @ApiOperation({
    summary: "Update capital expenditure",
    description: "Update expenditure details (only if no credits claimed)",
  })
  @ApiParam({ name: "id", description: "Expenditure ID" })
  @ApiResponse({
    status: 200,
    description: "Expenditure updated successfully",
    type: CapitalExpenditure,
  })
  async updateExpenditure(
    @Param("id") id: string,
    @Body() dto: UpdateCapitalExpenditureDto
  ): Promise<CapitalExpenditure> {
    return await this.capitalInvestmentService.updateExpenditure(id, dto);
  }

  @Delete("expenditures/:id")
  @ApiOperation({
    summary: "Delete capital expenditure",
    description: "Delete an expenditure (only if no credits claimed)",
  })
  @ApiParam({ name: "id", description: "Expenditure ID" })
  @ApiResponse({
    status: 200,
    description: "Expenditure deleted successfully",
  })
  async deleteExpenditure(
    @Param("id") id: string
  ): Promise<{ message: string }> {
    await this.capitalInvestmentService.deleteExpenditure(id);
    return { message: "Capital expenditure deleted successfully" };
  }

  @Get("business/:businessId/available-credits")
  @ApiOperation({
    summary: "Get available tax credits",
    description: "Get all available capital investment credits for a business",
  })
  @ApiParam({ name: "businessId", description: "Business ID" })
  @ApiQuery({ name: "taxYear", description: "Tax year", required: true })
  @ApiResponse({
    status: 200,
    description: "Available credits",
  })
  async getAvailableCredits(
    @Param("businessId") businessId: string,
    @Query("taxYear") taxYear: number
  ): Promise<{
    totalAvailable: number;
    credits: any[];
  }> {
    return await this.capitalInvestmentService.getAvailableCredits(
      businessId,
      Number(taxYear)
    );
  }

  @Post("business/:businessId/apply-credits")
  @ApiOperation({
    summary: "Apply credits to tax liability",
    description:
      "Apply available capital investment credits to reduce tax liability",
  })
  @ApiParam({ name: "businessId", description: "Business ID" })
  @ApiResponse({
    status: 200,
    description: "Credits applied successfully",
  })
  async applyCredits(
    @Param("businessId") businessId: string,
    @Body() body: { taxYear: number; taxLiability: number }
  ): Promise<{
    creditsApplied: number;
    remainingTax: number;
    creditsUsed: any[];
  }> {
    return await this.capitalInvestmentService.applyCreditsToTax(
      businessId,
      body.taxYear,
      body.taxLiability
    );
  }
}
