import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TaxReturn, TaxReturnStatus } from "../entities/tax-return.entity";
import { TaxType } from "../../tax-calculation/entities/tax-calculation.entity";
import { DocumentService } from "../../documents/services/document.service";
import { TaxCalculationService } from "../../tax-calculation/services/tax-calculation.service";
import { IncomeRecord } from "../../income/entities/income-record.entity";
import { Business } from "../../business/entities/business.entity";

@Injectable()
export class TaxReturnService {
  private readonly logger = new Logger(TaxReturnService.name);

  constructor(
    @InjectRepository(TaxReturn)
    private readonly taxReturnRepository: Repository<TaxReturn>,
    @InjectRepository(IncomeRecord)
    private readonly incomeRepository: Repository<IncomeRecord>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly documentService: DocumentService,
    private readonly taxCalculationService: TaxCalculationService
  ) {}

  async generateTaxReturn(
    userId: string,
    taxYear: number,
    taxType: TaxType,
    businessId?: string
  ): Promise<TaxReturn> {
    this.logger.log(
      `Generating tax return for user ${userId}, year ${taxYear}, type ${taxType}`
    );

    const whereCondition: any = { userId, taxYear, taxType };
    if (businessId) {
      whereCondition.businessId = businessId;
    }

    const existingReturn = await this.taxReturnRepository.findOne({
      where: whereCondition,
    });

    if (existingReturn && existingReturn.status === TaxReturnStatus.FILED) {
      throw new BadRequestException("Tax return already filed for this year");
    }

    const incomeRecords = await this.incomeRepository.find({
      where: { userId },
    });

    const totalIncome = incomeRecords.reduce(
      (sum, record) => sum + Number(record.amount),
      0
    );

    let taxCalculation;
    let business;

    if (taxType === TaxType.CIT && businessId) {
      business = await this.businessRepository.findOne({
        where: { id: businessId },
      });
      if (!business) {
        throw new NotFoundException("Business not found");
      }

      taxCalculation = this.taxCalculationService.calculateCompanyIncomeTax({
        businessName: business.name,
        annualTurnover: totalIncome,
        assetValue: 0,
        businessType: business.businessType,
        taxExemptStatus: business.taxExemptStatus,
        isAgriculturalBusiness: business.isAgriculturalBusiness,
        agriculturalBusinessStartDate: business.agriculturalBusinessStartDate,
        taxYear,
      });
    } else {
      taxCalculation = this.taxCalculationService.calculatePersonalIncomeTax({
        grossIncome: totalIncome,
      });
    }

    const userDocuments = await this.documentService.getUserDocuments(userId);
    const supportingDocuments = this.categorizeDocuments(userDocuments);

    const taxReturn =
      existingReturn ||
      this.taxReturnRepository.create({
        userId,
        businessId,
        taxYear,
        taxType,
      });

    taxReturn.totalIncome = taxCalculation.grossIncome;
    taxReturn.totalDeductions = taxCalculation.deductions;
    const reliefs = taxCalculation.reliefs || {};
    taxReturn.totalReliefs = Object.values(reliefs).reduce(
      (sum: number, val: any) => sum + Number(val),
      0
    ) as number;
    taxReturn.taxableIncome = taxCalculation.taxableIncome;
    taxReturn.taxLiability = taxCalculation.taxLiability;
    taxReturn.taxPaid = 0;
    taxReturn.taxDue = taxCalculation.taxLiability;
    taxReturn.supportingDocuments = supportingDocuments;
    taxReturn.calculationBreakdown = taxCalculation.breakdown;
    taxReturn.status = TaxReturnStatus.DRAFT;

    const validation = await this.validateDocumentation(taxReturn);
    taxReturn.documentationComplete = validation.isComplete;
    taxReturn.missingDocuments = validation.missingDocuments;
    taxReturn.validationErrors = validation.errors;

    return await this.taxReturnRepository.save(taxReturn);
  }

  async validateDocumentation(taxReturn: TaxReturn): Promise<{
    isComplete: boolean;
    missingDocuments: string[];
    errors: string[];
  }> {
    const missingDocuments: string[] = [];
    const errors: string[] = [];

    if (taxReturn.totalIncome > 800000) {
      if (!taxReturn.supportingDocuments?.incomeStatements?.length) {
        missingDocuments.push("Income statements or payslips");
      }
    }

    if (taxReturn.calculationBreakdown?.reliefs?.rentRelief > 0) {
      if (!taxReturn.supportingDocuments?.rentReceipts?.length) {
        missingDocuments.push("Rent receipts");
      }
    }

    if (taxReturn.calculationBreakdown?.reliefs?.pensionRelief > 0) {
      if (!taxReturn.supportingDocuments?.pensionCertificates?.length) {
        missingDocuments.push("Pension contribution certificates");
      }
    }

    if (taxReturn.calculationBreakdown?.reliefs?.healthInsuranceRelief > 0) {
      if (!taxReturn.supportingDocuments?.healthInsurancePolicies?.length) {
        missingDocuments.push("Health insurance policies");
      }
    }

    if (taxReturn.taxType === TaxType.CIT) {
      if (!taxReturn.supportingDocuments?.incomeStatements?.length) {
        missingDocuments.push("Financial statements");
      }
    }

    if (taxReturn.taxLiability < 0) {
      errors.push("Tax liability cannot be negative");
    }

    if (taxReturn.totalIncome < 0) {
      errors.push("Total income cannot be negative");
    }

    return {
      isComplete: missingDocuments.length === 0 && errors.length === 0,
      missingDocuments,
      errors,
    };
  }

  async submitTaxReturn(taxReturnId: string): Promise<TaxReturn> {
    const taxReturn = await this.taxReturnRepository.findOne({
      where: { id: taxReturnId },
    });

    if (!taxReturn) {
      throw new NotFoundException("Tax return not found");
    }

    if (taxReturn.status === TaxReturnStatus.FILED) {
      throw new BadRequestException("Tax return already filed");
    }

    if (!taxReturn.documentationComplete) {
      throw new BadRequestException(
        "Documentation incomplete. Cannot submit tax return."
      );
    }

    if (taxReturn.validationErrors && taxReturn.validationErrors.length > 0) {
      throw new BadRequestException(
        "Validation errors exist. Cannot submit tax return."
      );
    }

    taxReturn.status = TaxReturnStatus.FILED;
    taxReturn.submitted = true;
    taxReturn.submissionDate = new Date();
    taxReturn.firsReferenceNumber = this.generateFIRSReferenceNumber(taxReturn);

    return await this.taxReturnRepository.save(taxReturn);
  }

  async getTaxReturn(taxReturnId: string): Promise<TaxReturn> {
    const taxReturn = await this.taxReturnRepository.findOne({
      where: { id: taxReturnId },
      relations: ["user", "business"],
    });

    if (!taxReturn) {
      throw new NotFoundException("Tax return not found");
    }

    return taxReturn;
  }

  async getUserTaxReturns(userId: string): Promise<TaxReturn[]> {
    return await this.taxReturnRepository.find({
      where: { userId },
      order: { taxYear: "DESC", createdAt: "DESC" },
    });
  }

  async updateTaxReturn(
    taxReturnId: string,
    updates: Partial<TaxReturn>
  ): Promise<TaxReturn> {
    const taxReturn = await this.getTaxReturn(taxReturnId);

    if (taxReturn.status === TaxReturnStatus.FILED) {
      throw new BadRequestException("Cannot update filed tax return");
    }

    Object.assign(taxReturn, updates);

    const validation = await this.validateDocumentation(taxReturn);
    taxReturn.documentationComplete = validation.isComplete;
    taxReturn.missingDocuments = validation.missingDocuments;
    taxReturn.validationErrors = validation.errors;

    return await this.taxReturnRepository.save(taxReturn);
  }

  async deleteTaxReturn(taxReturnId: string): Promise<void> {
    const taxReturn = await this.getTaxReturn(taxReturnId);

    if (taxReturn.status === TaxReturnStatus.FILED) {
      throw new BadRequestException("Cannot delete filed tax return");
    }

    await this.taxReturnRepository.remove(taxReturn);
  }

  private categorizeDocuments(documents: any[]): any {
    const categorized: any = {
      rentReceipts: [],
      pensionCertificates: [],
      healthInsurancePolicies: [],
      capitalExpenditureInvoices: [],
      donationReceipts: [],
      severanceDocuments: [],
      incomeStatements: [],
      bankStatements: [],
    };

    documents.forEach((doc) => {
      if (
        doc.documentType === "rent_receipt" ||
        doc.documentType === "lease_agreement"
      ) {
        categorized.rentReceipts.push(doc.fileUrl);
      } else if (doc.documentType === "pension_certificate") {
        categorized.pensionCertificates.push(doc.fileUrl);
      } else if (doc.documentType === "health_insurance_policy") {
        categorized.healthInsurancePolicies.push(doc.fileUrl);
      } else if (doc.documentType === "capital_expenditure_invoice") {
        categorized.capitalExpenditureInvoices.push(doc.fileUrl);
      } else if (doc.documentType === "donation_receipt") {
        categorized.donationReceipts.push(doc.fileUrl);
      } else if (
        doc.documentType === "severance_agreement" ||
        doc.documentType === "termination_letter"
      ) {
        categorized.severanceDocuments.push(doc.fileUrl);
      } else if (
        doc.documentType === "income_statement" ||
        doc.documentType === "payslip"
      ) {
        categorized.incomeStatements.push(doc.fileUrl);
      } else if (doc.documentType === "bank_statement") {
        categorized.bankStatements.push(doc.fileUrl);
      }
    });

    return categorized;
  }

  private generateFIRSReferenceNumber(taxReturn: TaxReturn): string {
    const year = taxReturn.taxYear;
    const type = taxReturn.taxType === TaxType.PIT ? "PIT" : "CIT";
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `FIRS-${type}-${year}-${random}`;
  }
}
