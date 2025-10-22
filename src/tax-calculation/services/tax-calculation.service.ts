import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TaxCalculation, TaxType } from "../entities/tax-calculation.entity";
import {
  PersonalIncomeTaxDto,
  CompanyIncomeTaxDto,
  CapitalGainsTaxDto,
  TaxCalculationResultDto,
} from "../dto/tax-calculation.dto";

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
    private readonly taxCalculationRepository: Repository<TaxCalculation>
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
    totalDeductions += rentRelief;

    const pensionDeduction = dto.pensionContribution || 0;
    totalDeductions += pensionDeduction;

    const healthInsurance = dto.healthInsurance || 0;
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
   * - 0% for small companies (turnover ≤ NGN 50-100M, assets ≤ NGN 250M)
   * - 30% for others
   * - 15% minimum effective tax rate for multinationals (EUR 750M+ group turnover)
   *   or large locals (NGN 20B+ turnover)
   */
  calculateCompanyIncomeTax(dto: CompanyIncomeTaxDto): TaxCalculationResultDto {
    this.logger.log(`Calculating CIT for business: ${dto.businessName}`);

    let taxRate = 0.3;
    let isSmallCompany = false;
    let isLargeCompany = false;

    if (
      dto.annualTurnover <= 100000000 &&
      dto.assetValue <= 250000000
    ) {
      taxRate = 0;
      isSmallCompany = true;
      this.logger.log("Classified as small company - 0% tax rate");
    }

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
}
