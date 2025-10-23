import { Controller, Post, Body, Get, Query, Logger } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
} from "@nestjs/swagger";
import {
  IncomeAggregationService,
  IncomeSource,
  AggregatedTaxResult,
} from "../services/income-aggregation.service";
import {
  PersonalIncomeTaxDto,
  CompanyIncomeTaxDto,
} from "../dto/tax-calculation.dto";

class AggregateIncomeDto {
  @ApiProperty({
    description:
      "Array of income sources from different streams (employment, business, rental, investment, etc.)",
    example: [
      { type: "employment", amount: 5000000, description: "Salary", deductions: 100000 },
      { type: "business", amount: 2000000, description: "Consulting" },
    ],
    type: "array",
  })
  incomeSources: IncomeSource[];

  @ApiProperty({
    description:
      "Personal details for PIT calculation (optional, used for relief calculations)",
    required: false,
  })
  personalDetails?: Partial<PersonalIncomeTaxDto>;

  @ApiProperty({
    description:
      "Business details for CIT calculation (optional, used for exemption checks)",
    required: false,
  })
  businessDetails?: Partial<CompanyIncomeTaxDto>;
}

@ApiTags("Tax Calculations - Income Aggregation")
@Controller("tax/aggregate")
export class IncomeAggregationController {
  private readonly logger = new Logger(IncomeAggregationController.name);

  constructor(
    private readonly incomeAggregationService: IncomeAggregationService
  ) {}

  @Post()
  @ApiOperation({
    summary: "Aggregate multiple income sources and calculate total tax",
    description:
      "Aggregates income from multiple sources (employment, business, rental, investment, etc.) and calculates " +
      "the total tax liability. Automatically applies the correct tax rates and reliefs based on income type. " +
      "Useful for taxpayers with diverse income streams who need to file a consolidated tax return.",
  })
  @ApiResponse({
    status: 200,
    description:
      "Tax calculation completed successfully with aggregated results",
    schema: {
      type: "object",
      properties: {
        totalIncome: { type: "number", example: 7000000 },
        totalTax: { type: "number", example: 1250000 },
        effectiveRate: { type: "number", example: 17.86 },
        breakdown: {
          type: "array",
          items: {
            type: "object",
            properties: {
              source: { type: "string", example: "employment" },
              amount: { type: "number", example: 5000000 },
              tax: { type: "number", example: 850000 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid income sources or incompatible income types",
  })
  aggregateIncome(@Body() dto: AggregateIncomeDto): AggregatedTaxResult {
    this.logger.log(`Aggregating ${dto.incomeSources.length} income sources`);
    return this.incomeAggregationService.aggregateIncome(
      dto.incomeSources,
      dto.personalDetails,
      dto.businessDetails
    );
  }

  @Post("summary")
  @ApiOperation({
    summary: "Get income summary by type",
    description:
      "Provides a summary of income grouped by type (employment, business, rental, etc.) " +
      "showing count and total amount for each category. Useful for understanding income distribution.",
  })
  @ApiResponse({
    status: 200,
    description: "Income summary retrieved successfully",
    schema: {
      type: "object",
      example: {
        employment: { count: 1, total: 5000000 },
        business: { count: 2, total: 3000000 },
        rental: { count: 1, total: 1200000 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid income sources data",
  })
  getIncomeSummary(@Body() dto: { incomeSources: IncomeSource[] }): {
    [key: string]: { count: number; total: number };
  } {
    return this.incomeAggregationService.getIncomeSummary(dto.incomeSources);
  }

  @Post("validate")
  @ApiOperation({
    summary: "Validate income source compatibility",
    description:
      "Validates that income sources can be aggregated together and identifies potential issues or warnings. " +
      "Checks for incompatible income types, missing required information, and potential tax optimization opportunities.",
  })
  @ApiResponse({
    status: 200,
    description: "Validation completed successfully",
    schema: {
      type: "object",
      properties: {
        isValid: { type: "boolean", example: true },
        warnings: {
          type: "array",
          items: { type: "string" },
          example: [
            "Consider separating business income into a separate entity for tax efficiency",
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid income sources data",
  })
  validateCompatibility(@Body() dto: { incomeSources: IncomeSource[] }): {
    isValid: boolean;
    warnings: string[];
  } {
    return this.incomeAggregationService.validateIncomeSourceCompatibility(
      dto.incomeSources
    );
  }

  @Post("suggestions")
  @ApiOperation({
    summary: "Get tax optimization suggestions",
    description:
      "Analyzes income sources and provides personalized tax optimization suggestions based on Nigerian tax law. " +
      "Recommendations may include relief claims, business structure optimization, timing of income recognition, " +
      "and deduction opportunities to minimize tax liability legally.",
  })
  @ApiResponse({
    status: 200,
    description: "Tax optimization suggestions retrieved successfully",
    schema: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: { type: "string" },
          example: [
            "Claim rent relief of ₦500,000 to reduce taxable income",
            "Consider incorporating your business to benefit from SME exemption",
            "Maximize pension contributions to reduce PIT liability",
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid income sources or details",
  })
  getTaxOptimizationSuggestions(@Body() dto: AggregateIncomeDto): {
    suggestions: string[];
  } {
    const suggestions =
      this.incomeAggregationService.getTaxOptimizationSuggestions(
        dto.incomeSources,
        dto.personalDetails,
        dto.businessDetails
      );
    return { suggestions };
  }
}
