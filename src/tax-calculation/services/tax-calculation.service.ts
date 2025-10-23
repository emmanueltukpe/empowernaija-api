import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TaxCalculation, TaxType } from "../entities/tax-calculation.entity";
import {
  PersonalIncomeTaxDto,
  CompanyIncomeTaxDto,
  CapitalGainsTaxDto,
  PresumptiveTaxDto,
  TaxCalculationResultDto,
} from "../dto/tax-calculation.dto";
import { ValidationService } from "./validation.service";

/**
 * Tax Calculation Service
 * Implements Nigeria's 2026 Tax Reform calculations
 *
 * CRITICAL: All calculations must be accurate according to the 2026 tax laws
 */
@Injectable()
export class TaxCalculationService {
  private readonly logger = new Logger(TaxCalculationService.name);

  constructor(
    @InjectRepository(TaxCalculation)
    private readonly taxCalculationRepository: Repository<TaxCalculation>,
    private readonly validationService: ValidationService
  ) {}

  /**
   * Personal Income Tax (PIT) Calculation - 2026 Rates
   *
   * Tax Slabs (NGN):
   * 0 - 800,000: 0%
   * 800,001 - 3,000,000: 15%
   * 3,000,001 - 12,000,000: 18%
   * 12,000,001 - 25,000,000: 21%
   * 25,000,001 - 50,000,000: 23%
   * Above 50,000,000: 25%
   *
   * Reliefs:
   * - Rent Relief: Lesser of NGN 500,000 or 20% of rent paid
   * - Pension Contributions: Deductible (requires documentation)
   * - Health Insurance: Deductible (requires documentation)
   */
  calculatePersonalIncomeTax(
    dto: PersonalIncomeTaxDto
  ): TaxCalculationResultDto {
    this.logger.log(`Calculating PIT for income: ${dto.grossIncome}`);

    this.validationService.validatePITInput(dto);

    const TAX_SLABS = [
      { from: 0, to: 800000, rate: 0 },
      { from: 800001, to: 3000000, rate: 0.15 },
      { from: 3000001, to: 12000000, rate: 0.18 },
      { from: 12000001, to: 25000000, rate: 0.21 },
      { from: 25000001, to: 50000000, rate: 0.23 },
      { from: 50000001, to: Infinity, rate: 0.25 },
    ];

    let totalDeductions = 0;

    const rentRelief = dto.rentPaid ? Math.min(500000, dto.rentPaid * 0.2) : 0;
    if (rentRelief > 0 && !dto.landlordName) {
      this.logger.warn("Rent relief claimed without landlord details");
    }
    totalDeductions += rentRelief;

    const pensionDeduction = dto.pensionContribution || 0;
    if (pensionDeduction > 0 && !dto.pensionProviderName) {
      this.logger.warn("Pension deduction claimed without provider details");
    }
    totalDeductions += pensionDeduction;

    const healthInsurance = dto.healthInsurance || 0;
    if (healthInsurance > 0 && !dto.healthInsuranceProviderName) {
      this.logger.warn(
        "Health insurance deduction claimed without provider details"
      );
    }
    totalDeductions += healthInsurance;

    const taxableIncome = Math.max(0, dto.grossIncome - totalDeductions);

    let remainingIncome = taxableIncome;
    let totalTax = 0;
    const breakdown: Array<{
      from: number;
      to: number | null;
      rate: number;
      taxableAmount: number;
      tax: number;
    }> = [];

    for (const slab of TAX_SLABS) {
      if (remainingIncome <= 0) break;

      const slabSize = slab.to - slab.from + 1;
      const taxableInSlab = Math.min(remainingIncome, slabSize);
      const taxForSlab = taxableInSlab * slab.rate;

      if (taxableInSlab > 0) {
        breakdown.push({
          from: slab.from,
          to: slab.to === Infinity ? null : slab.to,
          rate: slab.rate * 100,
          taxableAmount: taxableInSlab,
          tax: taxForSlab,
        });

        totalTax += taxForSlab;
        remainingIncome -= taxableInSlab;
      }
    }

    // Calculate effective and marginal rates
    const effectiveRate =
      taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
    const marginalRate =
      breakdown.length > 0 ? breakdown[breakdown.length - 1].rate : 0;

    const result: TaxCalculationResultDto = {
      taxType: TaxType.PIT,
      grossIncome: dto.grossIncome,
      deductions: totalDeductions,
      reliefs: {
        rentRelief,
        pensionContribution: pensionDeduction,
        healthInsurance,
      },
      taxableIncome,
      taxLiability: Math.round(totalTax * 100) / 100, // Round to 2 decimal places
      netIncome: dto.grossIncome - totalTax,
      breakdown: {
        slabs: breakdown,
        effectiveRate: Math.round(effectiveRate * 100) / 100,
        marginalRate,
        totalIncome: dto.grossIncome,
        netIncome: dto.grossIncome - totalTax,
      },
    };

    this.logger.log(`PIT calculation complete: Tax = ${result.taxLiability}`);
    return result;
  }

  /**
   * Company Income Tax (CIT) Calculation - 2026 Rates
   *
   * Rates:
   * - 0% for small companies (turnover ≤ NGN 100M, assets ≤ NGN 250M)
   * - 0% for agricultural businesses (first 5 years)
   * - 0% for NGOs/charities with tax-exempt status
   * - 30% for others
   * - 15% minimum effective tax rate for multinationals (EUR 750M+ group turnover)
   *   or large locals (NGN 20B+ turnover)
   */
  calculateCompanyIncomeTax(dto: CompanyIncomeTaxDto): TaxCalculationResultDto {
    this.logger.log(`Calculating CIT for business: ${dto.businessName}`);

    this.validationService.validateCITInput(dto);

    let taxRate = 0.3;
    let isSmallCompany = false;
    let isLargeCompany = false;
    let isExempt = false;
    let exemptionReason = "";

    // Check NGO/Charity exemption
    if (
      dto.businessType &&
      ["ngo", "charity", "religious", "educational"].includes(dto.businessType)
    ) {
      if (dto.taxExemptStatus) {
        isExempt = true;
        exemptionReason = "NGO/Charity tax exemption";
        this.logger.log(`Business is tax-exempt: ${exemptionReason}`);
      }
    }

    // Check agricultural tax holiday (5 years from start date)
    if (dto.isAgriculturalBusiness && dto.agriculturalBusinessStartDate) {
      const startYear = new Date(
        dto.agriculturalBusinessStartDate
      ).getFullYear();
      const currentYear = dto.taxYear || new Date().getFullYear();
      const yearsInOperation = currentYear - startYear;

      if (yearsInOperation < 5) {
        isExempt = true;
        exemptionReason = `Agricultural tax holiday (Year ${yearsInOperation + 1} of 5)`;
        this.logger.log(`Agricultural business exempt: ${exemptionReason}`);
      }
    }

    // If exempt, return zero tax
    if (isExempt) {
      const assessableProfits =
        dto.assessableProfits || dto.annualTurnover * 0.1;
      return {
        taxType: TaxType.CIT,
        grossIncome: dto.annualTurnover,
        deductions: 0,
        reliefs: {},
        taxableIncome: assessableProfits,
        taxLiability: 0,
        netIncome: assessableProfits,
        breakdown: {
          effectiveRate: 0,
          marginalRate: 0,
          isExempt: true,
          exemptionReason,
          isSmallCompany: false,
          isLargeCompany: false,
          developmentLevy: 0,
          totalTaxBurden: 0,
        },
      };
    }

    // Check small company exemption
    if (dto.annualTurnover <= 100000000 && dto.assetValue <= 250000000) {
      taxRate = 0;
      isSmallCompany = true;
      this.logger.log("Classified as small company - 0% tax rate");
    }

    // Check large company status
    if (dto.annualTurnover >= 20000000000) {
      isLargeCompany = true;
      this.logger.log("Classified as large company - 15% minimum ETR applies");
    }

    const assessableProfits = dto.assessableProfits || dto.annualTurnover * 0.1;
    const taxLiability = assessableProfits * taxRate;

    let finalTax = taxLiability;
    if (isLargeCompany && !isSmallCompany) {
      const minimumETR = assessableProfits * 0.15;
      finalTax = Math.max(taxLiability, minimumETR);
    }

    const developmentLevy = isSmallCompany ? 0 : assessableProfits * 0.04;

    const result: TaxCalculationResultDto = {
      taxType: TaxType.CIT,
      grossIncome: dto.annualTurnover,
      deductions: 0,
      reliefs: {},
      taxableIncome: assessableProfits,
      taxLiability: Math.round(finalTax * 100) / 100,
      netIncome: assessableProfits - finalTax - developmentLevy,
      breakdown: {
        effectiveRate:
          assessableProfits > 0 ? (finalTax / assessableProfits) * 100 : 0,
        marginalRate: taxRate * 100,
        isSmallCompany,
        isLargeCompany,
        developmentLevy: Math.round(developmentLevy * 100) / 100,
        totalTaxBurden: finalTax + developmentLevy,
      },
    };

    this.logger.log(
      `CIT calculation complete: Tax = ${result.taxLiability}, Development Levy = ${developmentLevy}`
    );
    return result;
  }

  /**
   * Capital Gains Tax (CGT) Calculation - 2026 Rates
   *
   * Rates:
   * - 30% for companies
   * - Progressive PIT rates for individuals
   *
   * Exemptions:
   * - Proceeds < NGN 150M and gains < NGN 10M
   * - Private residences
   * - Two personal vehicles
   * - Loss-of-office up to NGN 50M
   */
  calculateCapitalGainsTax(dto: CapitalGainsTaxDto): TaxCalculationResultDto {
    this.logger.log(
      `Calculating CGT: Proceeds = ${dto.proceeds}, Cost = ${dto.costBasis}`
    );

    this.validationService.validateCGTInput(dto);

    const capitalGain = dto.proceeds - dto.costBasis;

    // Check exemptions
    let isExempt = false;
    let exemptionReason = "";

    if (dto.proceeds < 150000000 && capitalGain < 10000000) {
      isExempt = true;
      exemptionReason = "Proceeds < NGN 150M and gains < NGN 10M";
    }

    if (dto.isPrivateResidence) {
      isExempt = true;
      exemptionReason = "Private residence exemption";
    }

    if (dto.isPersonalVehicle && (dto.vehicleCount || 0) <= 2) {
      isExempt = true;
      exemptionReason = "Personal vehicle exemption (up to 2 vehicles)";
    }

    if (dto.isLossOfOffice && dto.proceeds <= 50000000) {
      isExempt = true;
      exemptionReason = "Loss-of-office exemption (up to NGN 50M)";
    }

    if (isExempt) {
      this.logger.log(`CGT exempt: ${exemptionReason}`);
      return {
        taxType: TaxType.CGT,
        grossIncome: dto.proceeds,
        deductions: dto.costBasis,
        reliefs: {},
        taxableIncome: capitalGain,
        taxLiability: 0,
        netIncome: capitalGain,
        breakdown: {
          isExempt: true,
          exemptionReason,
          capitalGain,
        },
      };
    }

    // Calculate tax based on entity type
    let taxRate: number;
    if (dto.isCompany) {
      taxRate = 0.3; // 30% for companies
    } else {
      // Use progressive PIT rates for individuals
      const pitResult = this.calculatePersonalIncomeTax({
        grossIncome: capitalGain,
      });
      return {
        ...pitResult,
        taxType: TaxType.CGT,
      };
    }

    const taxLiability = capitalGain * taxRate;

    const result: TaxCalculationResultDto = {
      taxType: TaxType.CGT,
      grossIncome: dto.proceeds,
      deductions: dto.costBasis,
      reliefs: {},
      taxableIncome: capitalGain,
      taxLiability: Math.round(taxLiability * 100) / 100,
      netIncome: capitalGain - taxLiability,
      breakdown: {
        capitalGain,
        taxRate: taxRate * 100,
        isCompany: dto.isCompany,
      },
    };

    this.logger.log(`CGT calculation complete: Tax = ${result.taxLiability}`);
    return result;
  }

  /**
   * Save tax calculation to database
   */
  async saveTaxCalculation(
    result: TaxCalculationResultDto,
    userId?: string,
    businessId?: string
  ): Promise<TaxCalculation> {
    const calculation = this.taxCalculationRepository.create({
      taxType: result.taxType,
      taxYear: "2026" as any,
      taxableIncome: result.taxableIncome,
      taxLiability: result.taxLiability,
      deductions: result.deductions,
      reliefs: result.reliefs.rentRelief || 0,
      rentRelief: result.reliefs.rentRelief || 0,
      pensionContribution: result.reliefs.pensionContribution || 0,
      healthInsurance: result.reliefs.healthInsurance || 0,
      breakdown: result.breakdown as any,
      calculationDate: new Date(),
      userId,
      businessId,
    });

    return await this.taxCalculationRepository.save(calculation);
  }

  /**
   * Get user's tax calculations
   */
  async getUserTaxCalculations(userId: string): Promise<TaxCalculation[]> {
    return await this.taxCalculationRepository.find({
      where: { userId },
      order: { calculationDate: "DESC" },
    });
  }

  /**
   * Get business tax calculations
   */
  async getBusinessTaxCalculations(
    businessId: string
  ): Promise<TaxCalculation[]> {
    return await this.taxCalculationRepository.find({
      where: { businessId },
      order: { calculationDate: "DESC" },
    });
  }

  /**
   * Presumptive Tax Calculation (for informal sector workers)
   *
   * The Nigerian tax law allows presumptive tax assessments for informal
   * sector workers who don't keep formal books. Tax rates vary by activity type.
   *
   * Rates:
   * - Street vendors: 1% of estimated turnover
   * - Artisans (mechanics, tailors, etc.): 1.5% of estimated turnover
   * - Small traders: 2% of estimated turnover
   * - Taxi drivers: 1.5% of estimated turnover
   * - Food vendors: 1% of estimated turnover
   * - Other activities: 2% of estimated turnover
   */
  calculatePresumptiveTax(dto: PresumptiveTaxDto): TaxCalculationResultDto {
    this.logger.log(
      `Calculating presumptive tax for ${dto.activityType}: Turnover = ${dto.estimatedTurnover}`
    );

    this.validationService.validatePresumptiveTaxInput(dto);

    const presumptiveRates: { [key: string]: number } = {
      street_vendor: 0.01, // 1%
      food_vendor: 0.01, // 1%
      artisan: 0.015, // 1.5%
      mechanic: 0.015, // 1.5%
      tailor: 0.015, // 1.5%
      hairdresser: 0.015, // 1.5%
      taxi_driver: 0.015, // 1.5%
      small_trader: 0.02, // 2%
      other: 0.02, // 2% (default)
    };

    const rate = presumptiveRates[dto.activityType] || 0.02;
    const taxLiability = dto.estimatedTurnover * rate;

    // If turnover is below ₦800k, no tax is due
    if (dto.estimatedTurnover <= 800000) {
      this.logger.log(`Turnover below ₦800k threshold - no tax due`);
      return {
        taxType: TaxType.PIT,
        grossIncome: dto.estimatedTurnover,
        deductions: 0,
        reliefs: {},
        taxableIncome: 0,
        taxLiability: 0,
        netIncome: dto.estimatedTurnover,
        breakdown: {
          isPresumptive: true,
          activityType: dto.activityType,
          presumptiveRate: rate * 100,
          belowThreshold: true,
          effectiveRate: 0,
        },
      };
    }

    const result: TaxCalculationResultDto = {
      taxType: TaxType.PIT,
      grossIncome: dto.estimatedTurnover,
      deductions: 0,
      reliefs: {},
      taxableIncome: dto.estimatedTurnover,
      taxLiability: Math.round(taxLiability * 100) / 100,
      netIncome: dto.estimatedTurnover - taxLiability,
      breakdown: {
        isPresumptive: true,
        activityType: dto.activityType,
        presumptiveRate: rate * 100,
        effectiveRate:
          dto.estimatedTurnover > 0
            ? (taxLiability / dto.estimatedTurnover) * 100
            : 0,
        employeeCount: dto.employeeCount || 0,
        location: dto.location,
      },
    };

    this.logger.log(
      `Presumptive tax calculation complete: Tax = ${result.taxLiability} (${rate * 100}% of turnover)`
    );
    return result;
  }
}
