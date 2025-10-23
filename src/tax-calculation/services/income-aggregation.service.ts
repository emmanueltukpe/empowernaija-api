import { Injectable, Logger } from "@nestjs/common";
import { TaxCalculationService } from "./tax-calculation.service";
import {
  PersonalIncomeTaxDto,
  CompanyIncomeTaxDto,
  TaxCalculationResultDto,
} from "../dto/tax-calculation.dto";
import { TaxType } from "../entities/tax-calculation.entity";

export interface IncomeSource {
  type: "employment" | "freelance" | "business" | "investment" | "rental";
  amount: number;
  description: string;
  deductions?: number;
}

export interface AggregatedTaxResult {
  totalGrossIncome: number;
  totalDeductions: number;
  totalTaxableIncome: number;
  totalTaxLiability: number;
  totalNetIncome: number;
  incomeSources: IncomeSource[];
  pitLiability: number;
  citLiability: number;
  breakdown: {
    employmentIncome: number;
    freelanceIncome: number;
    businessIncome: number;
    investmentIncome: number;
    rentalIncome: number;
  };
  taxCalculations: {
    pit?: TaxCalculationResultDto;
    cit?: TaxCalculationResultDto;
  };
}

/**
 * Service for aggregating multiple income sources and calculating combined tax liability
 */
@Injectable()
export class IncomeAggregationService {
  private readonly logger = new Logger(IncomeAggregationService.name);

  constructor(private readonly taxCalculationService: TaxCalculationService) {}

  /**
   * Aggregate multiple income sources and calculate total tax liability
   */
  aggregateIncome(
    incomeSources: IncomeSource[],
    personalDetails?: Partial<PersonalIncomeTaxDto>,
    businessDetails?: Partial<CompanyIncomeTaxDto>
  ): AggregatedTaxResult {
    this.logger.log(
      `Aggregating ${incomeSources.length} income sources`
    );

    const breakdown = {
      employmentIncome: 0,
      freelanceIncome: 0,
      businessIncome: 0,
      investmentIncome: 0,
      rentalIncome: 0,
    };

    let totalGrossIncome = 0;
    let totalDeductions = 0;

    incomeSources.forEach((source) => {
      totalGrossIncome += source.amount;
      totalDeductions += source.deductions || 0;

      switch (source.type) {
        case "employment":
          breakdown.employmentIncome += source.amount;
          break;
        case "freelance":
          breakdown.freelanceIncome += source.amount;
          break;
        case "business":
          breakdown.businessIncome += source.amount;
          break;
        case "investment":
          breakdown.investmentIncome += source.amount;
          break;
        case "rental":
          breakdown.rentalIncome += source.amount;
          break;
      }
    });

    const personalIncome =
      breakdown.employmentIncome +
      breakdown.freelanceIncome +
      breakdown.investmentIncome +
      breakdown.rentalIncome;

    const businessIncome = breakdown.businessIncome;

    let pitResult: TaxCalculationResultDto | undefined;
    let citResult: TaxCalculationResultDto | undefined;

    if (personalIncome > 0) {
      const pitDto: PersonalIncomeTaxDto = {
        grossIncome: personalIncome,
        rentPaid: personalDetails?.rentPaid,
        pensionContribution: personalDetails?.pensionContribution,
        healthInsurance: personalDetails?.healthInsurance,
        landlordName: personalDetails?.landlordName,
        landlordTIN: personalDetails?.landlordTIN,
        landlordAddress: personalDetails?.landlordAddress,
        rentReceiptNumbers: personalDetails?.rentReceiptNumbers,
        pensionProviderName: personalDetails?.pensionProviderName,
        pensionPolicyNumber: personalDetails?.pensionPolicyNumber,
        healthInsuranceProviderName: personalDetails?.healthInsuranceProviderName,
        healthInsurancePolicyNumber: personalDetails?.healthInsurancePolicyNumber,
      };

      pitResult = this.taxCalculationService.calculatePersonalIncomeTax(pitDto);
      this.logger.log(`PIT calculated: ₦${pitResult.taxLiability.toLocaleString()}`);
    }

    if (businessIncome > 0 && businessDetails) {
      const citDto: CompanyIncomeTaxDto = {
        businessName: businessDetails.businessName || "Business",
        annualTurnover: businessIncome,
        assetValue: businessDetails.assetValue || 0,
        businessType: businessDetails.businessType,
        taxExemptStatus: businessDetails.taxExemptStatus,
        isAgriculturalBusiness: businessDetails.isAgriculturalBusiness,
        agriculturalBusinessStartDate: businessDetails.agriculturalBusinessStartDate,
        taxYear: businessDetails.taxYear,
      };

      citResult = this.taxCalculationService.calculateCompanyIncomeTax(citDto);
      this.logger.log(`CIT calculated: ₦${citResult.taxLiability.toLocaleString()}`);
    }

    const totalTaxLiability =
      (pitResult?.taxLiability || 0) + (citResult?.taxLiability || 0);

    const result: AggregatedTaxResult = {
      totalGrossIncome,
      totalDeductions,
      totalTaxableIncome:
        (pitResult?.taxableIncome || 0) + (citResult?.taxableIncome || 0),
      totalTaxLiability,
      totalNetIncome: totalGrossIncome - totalTaxLiability,
      incomeSources,
      pitLiability: pitResult?.taxLiability || 0,
      citLiability: citResult?.taxLiability || 0,
      breakdown,
      taxCalculations: {
        pit: pitResult,
        cit: citResult,
      },
    };

    this.logger.log(
      `Income aggregation complete: Total Income = ₦${totalGrossIncome.toLocaleString()}, Total Tax = ₦${totalTaxLiability.toLocaleString()}`
    );

    return result;
  }

  /**
   * Get income summary by type
   */
  getIncomeSummary(incomeSources: IncomeSource[]): {
    [key: string]: { count: number; total: number };
  } {
    const summary: { [key: string]: { count: number; total: number } } = {};

    incomeSources.forEach((source) => {
      if (!summary[source.type]) {
        summary[source.type] = { count: 0, total: 0 };
      }
      summary[source.type].count++;
      summary[source.type].total += source.amount;
    });

    return summary;
  }

  /**
   * Validate that user is not claiming both employee and business owner status simultaneously
   */
  validateIncomeSourceCompatibility(incomeSources: IncomeSource[]): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const hasEmployment = incomeSources.some((s) => s.type === "employment");
    const hasBusiness = incomeSources.some((s) => s.type === "business");

    if (hasEmployment && hasBusiness) {
      warnings.push(
        "You have both employment and business income. Ensure you are not claiming employee benefits for business income."
      );
    }

    const totalIncome = incomeSources.reduce((sum, s) => sum + s.amount, 0);
    if (totalIncome > 1000000000) {
      warnings.push(
        "Total income exceeds ₦1 billion. Additional tax compliance requirements may apply."
      );
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Calculate effective tax rate across all income sources
   */
  calculateEffectiveTaxRate(result: AggregatedTaxResult): number {
    if (result.totalGrossIncome === 0) return 0;
    return (result.totalTaxLiability / result.totalGrossIncome) * 100;
  }

  /**
   * Get tax optimization suggestions based on income sources
   */
  getTaxOptimizationSuggestions(
    incomeSources: IncomeSource[],
    personalDetails?: Partial<PersonalIncomeTaxDto>,
    businessDetails?: Partial<CompanyIncomeTaxDto>
  ): string[] {
    const suggestions: string[] = [];

    const totalIncome = incomeSources.reduce((sum, s) => sum + s.amount, 0);

    if (!personalDetails?.pensionContribution && totalIncome > 2000000) {
      suggestions.push(
        "Consider making pension contributions to reduce your taxable income (up to 20% of gross income is deductible)."
      );
    }

    if (!personalDetails?.healthInsurance && totalIncome > 1000000) {
      suggestions.push(
        "Consider purchasing health insurance - premiums are fully deductible from taxable income."
      );
    }

    if (!personalDetails?.rentPaid && totalIncome > 3000000) {
      suggestions.push(
        "If you pay rent, claim rent relief (20% of rent paid, capped at ₦500,000)."
      );
    }

    const businessIncome = incomeSources
      .filter((s) => s.type === "business")
      .reduce((sum, s) => sum + s.amount, 0);

    if (
      businessIncome > 0 &&
      businessIncome <= 100000000 &&
      (!businessDetails?.assetValue || businessDetails.assetValue <= 250000000)
    ) {
      suggestions.push(
        "Your business may qualify as an SME (0% CIT) if turnover ≤ ₦100M AND assets ≤ ₦250M."
      );
    }

    if (businessIncome > 100000000) {
      suggestions.push(
        "Consider capital investment credits - 5% of capital expenditure is deductible, with 5-year carryforward."
      );
      suggestions.push(
        "Corporate donations to verified NGOs qualify for 10% deduction."
      );
    }

    return suggestions;
  }
}

