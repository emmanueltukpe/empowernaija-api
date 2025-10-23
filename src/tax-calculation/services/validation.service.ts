import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import {
  PersonalIncomeTaxDto,
  CompanyIncomeTaxDto,
  CapitalGainsTaxDto,
  PresumptiveTaxDto,
} from "../dto/tax-calculation.dto";

/**
 * Cross-field validation service for tax calculations
 * Implements business rules and prevents illogical data entry
 */
@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  /**
   * Validate Personal Income Tax input with cross-field rules
   */
  validatePITInput(dto: PersonalIncomeTaxDto): void {
    if (dto.grossIncome < 0) {
      throw new BadRequestException("Gross income cannot be negative");
    }

    if (dto.grossIncome > 1000000000) {
      this.logger.warn(
        `Unusually high gross income: ₦${dto.grossIncome.toLocaleString()}`
      );
    }

    if (dto.rentPaid && dto.rentPaid < 0) {
      throw new BadRequestException("Rent paid cannot be negative");
    }

    if (dto.rentPaid && dto.rentPaid > dto.grossIncome) {
      throw new BadRequestException(
        "Rent paid cannot exceed gross income"
      );
    }

    if (dto.pensionContribution && dto.pensionContribution < 0) {
      throw new BadRequestException("Pension contribution cannot be negative");
    }

    if (dto.pensionContribution && dto.pensionContribution > dto.grossIncome * 0.2) {
      this.logger.warn(
        "Pension contribution exceeds 20% of gross income - may require additional documentation"
      );
    }

    if (dto.healthInsurance && dto.healthInsurance < 0) {
      throw new BadRequestException("Health insurance cannot be negative");
    }

    const totalDeductions =
      (dto.rentPaid || 0) +
      (dto.pensionContribution || 0) +
      (dto.healthInsurance || 0);

    if (totalDeductions > dto.grossIncome) {
      throw new BadRequestException(
        `Total deductions (₦${totalDeductions.toLocaleString()}) cannot exceed gross income (₦${dto.grossIncome.toLocaleString()})`
      );
    }

    if (dto.rentPaid && dto.rentPaid > 0) {
      if (!dto.landlordName) {
        throw new BadRequestException(
          "Landlord name is required when claiming rent relief"
        );
      }
      if (!dto.landlordTIN) {
        this.logger.warn(
          "Landlord TIN is recommended for rent relief claims"
        );
      }
      if (!dto.landlordAddress) {
        throw new BadRequestException(
          "Landlord address is required when claiming rent relief"
        );
      }
    }

    if (dto.pensionContribution && dto.pensionContribution > 0) {
      if (!dto.pensionProviderName) {
        throw new BadRequestException(
          "Pension provider name is required when claiming pension deduction"
        );
      }
      if (!dto.pensionPolicyNumber) {
        this.logger.warn(
          "Pension policy number is recommended for pension deduction claims"
        );
      }
    }

    if (dto.healthInsurance && dto.healthInsurance > 0) {
      if (!dto.healthInsuranceProviderName) {
        throw new BadRequestException(
          "Health insurance provider name is required when claiming health insurance deduction"
        );
      }
      if (!dto.healthInsurancePolicyNumber) {
        this.logger.warn(
          "Health insurance policy number is recommended for health insurance deduction claims"
        );
      }
    }
  }

  /**
   * Validate Company Income Tax input with cross-field rules
   */
  validateCITInput(dto: CompanyIncomeTaxDto): void {
    if (!dto.businessName || dto.businessName.trim().length === 0) {
      throw new BadRequestException("Business name is required");
    }

    if (dto.annualTurnover < 0) {
      throw new BadRequestException("Annual turnover cannot be negative");
    }

    if (dto.assetValue < 0) {
      throw new BadRequestException("Asset value cannot be negative");
    }

    if (dto.assetValue > dto.annualTurnover * 10) {
      this.logger.warn(
        "Asset value is more than 10x annual turnover - please verify"
      );
    }

    const isSME = dto.annualTurnover <= 100000000 && dto.assetValue <= 250000000;
    if (isSME) {
      this.logger.log(
        "Business qualifies as SME (0% CIT) - Turnover ≤ ₦100M AND Assets ≤ ₦250M"
      );
    }

    if (dto.isAgriculturalBusiness) {
      if (!dto.agriculturalBusinessStartDate) {
        throw new BadRequestException(
          "Agricultural business start date is required for agricultural businesses"
        );
      }

      const startDate = new Date(dto.agriculturalBusinessStartDate);
      const currentYear = dto.taxYear || new Date().getFullYear();
      const startYear = startDate.getFullYear();
      const yearsInOperation = currentYear - startYear;

      if (startDate > new Date()) {
        throw new BadRequestException(
          "Agricultural business start date cannot be in the future"
        );
      }

      if (yearsInOperation < 0) {
        throw new BadRequestException(
          "Agricultural business start date cannot be in the future"
        );
      }

      if (yearsInOperation > 50) {
        throw new BadRequestException(
          "Agricultural business start date seems invalid (more than 50 years ago)"
        );
      }

      if (yearsInOperation < 5) {
        this.logger.log(
          `Agricultural business qualifies for tax holiday (Year ${yearsInOperation + 1} of 5)`
        );
      } else {
        this.logger.log(
          "Agricultural business has exceeded 5-year tax holiday period"
        );
      }
    }

    if (
      dto.businessType &&
      ["ngo", "charity", "religious", "educational"].includes(dto.businessType)
    ) {
      if (!dto.taxExemptStatus) {
        this.logger.warn(
          "NGO/Charity business type selected but tax-exempt status is not confirmed"
        );
      }
    }

    if (dto.taxExemptStatus && !dto.businessType) {
      throw new BadRequestException(
        "Business type is required when claiming tax-exempt status"
      );
    }
  }

  /**
   * Validate Capital Gains Tax input with cross-field rules
   */
  validateCGTInput(dto: CapitalGainsTaxDto): void {
    if (dto.proceeds < 0) {
      throw new BadRequestException("Proceeds cannot be negative");
    }

    if (dto.costBasis < 0) {
      throw new BadRequestException("Cost basis cannot be negative");
    }

    const capitalGain = dto.proceeds - dto.costBasis;

    if (capitalGain < 0) {
      this.logger.warn(
        `Capital loss detected: ₦${Math.abs(capitalGain).toLocaleString()} - no CGT liability`
      );
    }

    if (dto.costBasis > dto.proceeds) {
      this.logger.warn(
        "Cost basis exceeds proceeds - this will result in a capital loss (no tax)"
      );
    }

    if (dto.isPrivateResidence && dto.isPersonalVehicle) {
      throw new BadRequestException(
        "Asset cannot be both a private residence and a personal vehicle"
      );
    }

    if (dto.isPersonalVehicle && (!dto.vehicleCount || dto.vehicleCount < 1)) {
      throw new BadRequestException(
        "Vehicle count is required when claiming personal vehicle exemption"
      );
    }

    if (dto.vehicleCount && dto.vehicleCount > 2) {
      this.logger.warn(
        "Only the first 2 personal vehicles are exempt from CGT"
      );
    }

    if (dto.isLossOfOffice) {
      if (!dto.severanceAmount || dto.severanceAmount <= 0) {
        throw new BadRequestException(
          "Severance amount is required when claiming loss-of-office exemption"
        );
      }

      if (dto.severanceAmount > 50000000) {
        this.logger.warn(
          `Severance amount (₦${dto.severanceAmount.toLocaleString()}) exceeds ₦50M exemption cap - excess will be taxable`
        );
      }

      if (!dto.terminationDate) {
        throw new BadRequestException(
          "Termination date is required when claiming loss-of-office exemption"
        );
      }

      if (!dto.employerName) {
        throw new BadRequestException(
          "Employer name is required when claiming loss-of-office exemption"
        );
      }

      if (!dto.terminationReason) {
        this.logger.warn(
          "Termination reason is recommended for loss-of-office claims"
        );
      }

      const terminationDate = new Date(dto.terminationDate);
      if (terminationDate > new Date()) {
        throw new BadRequestException(
          "Termination date cannot be in the future"
        );
      }

      if (dto.yearsOfService && dto.yearsOfService < 0) {
        throw new BadRequestException("Years of service cannot be negative");
      }

      if (dto.yearsOfService && dto.yearsOfService > 50) {
        this.logger.warn(
          "Years of service exceeds 50 years - please verify"
        );
      }
    }
  }

  /**
   * Validate Presumptive Tax input with cross-field rules
   */
  validatePresumptiveTaxInput(dto: PresumptiveTaxDto): void {
    if (!dto.activityType) {
      throw new BadRequestException("Activity type is required");
    }

    if (dto.estimatedTurnover < 0) {
      throw new BadRequestException("Estimated turnover cannot be negative");
    }

    if (dto.estimatedTurnover > 100000000) {
      this.logger.warn(
        "Estimated turnover exceeds ₦100M - consider registering for standard CIT instead of presumptive tax"
      );
    }

    if (dto.employeeCount && dto.employeeCount < 0) {
      throw new BadRequestException("Employee count cannot be negative");
    }

    if (dto.employeeCount && dto.employeeCount > 10) {
      this.logger.warn(
        "Employee count exceeds 10 - may not qualify for presumptive tax regime"
      );
    }
  }
}

