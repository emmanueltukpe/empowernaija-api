import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CapitalExpenditure } from '../entities/capital-expenditure.entity';
import { TaxCreditCarryForward } from '../entities/tax-credit-carryforward.entity';
import { CreateCapitalExpenditureDto, UpdateCapitalExpenditureDto } from '../dto/capital-expenditure.dto';

@Injectable()
export class CapitalInvestmentService {
  private readonly logger = new Logger(CapitalInvestmentService.name);
  private readonly CREDIT_RATE = 0.05;
  private readonly CARRYFORWARD_YEARS = 5;

  constructor(
    @InjectRepository(CapitalExpenditure)
    private readonly expenditureRepository: Repository<CapitalExpenditure>,
    @InjectRepository(TaxCreditCarryForward)
    private readonly carryForwardRepository: Repository<TaxCreditCarryForward>,
  ) {}

  async createExpenditure(dto: CreateCapitalExpenditureDto): Promise<CapitalExpenditure> {
    this.logger.log(`Creating capital expenditure for business ${dto.businessId}`);

    const credit = this.calculate5PercentCredit(dto.amount);
    const expiryYear = dto.taxYear + this.CARRYFORWARD_YEARS;

    const expenditure = this.expenditureRepository.create({
      ...dto,
      creditClaimed: 0,
      creditRemaining: credit,
      fullyUtilized: false,
      expiryYear,
    });

    const savedExpenditure = await this.expenditureRepository.save(expenditure);

    await this.createCarryForward(savedExpenditure);

    return savedExpenditure;
  }

  async getExpenditure(id: string): Promise<CapitalExpenditure> {
    const expenditure = await this.expenditureRepository.findOne({
      where: { id },
      relations: ['business'],
    });

    if (!expenditure) {
      throw new NotFoundException('Capital expenditure not found');
    }

    return expenditure;
  }

  async getBusinessExpenditures(businessId: string): Promise<CapitalExpenditure[]> {
    return await this.expenditureRepository.find({
      where: { businessId },
      order: { expenditureDate: 'DESC' },
    });
  }

  async updateExpenditure(id: string, dto: UpdateCapitalExpenditureDto): Promise<CapitalExpenditure> {
    const expenditure = await this.getExpenditure(id);

    if (expenditure.creditClaimed > 0) {
      throw new BadRequestException('Cannot update expenditure with claimed credits');
    }

    Object.assign(expenditure, dto);

    if (dto.amount) {
      const newCredit = this.calculate5PercentCredit(dto.amount);
      expenditure.creditRemaining = newCredit;
    }

    return await this.expenditureRepository.save(expenditure);
  }

  async deleteExpenditure(id: string): Promise<void> {
    const expenditure = await this.getExpenditure(id);

    if (expenditure.creditClaimed > 0) {
      throw new BadRequestException('Cannot delete expenditure with claimed credits');
    }

    await this.carryForwardRepository.delete({ capitalExpenditureId: id });
    await this.expenditureRepository.remove(expenditure);
  }

  async applyCreditsToTax(businessId: string, taxYear: number, taxLiability: number): Promise<{
    creditsApplied: number;
    remainingTax: number;
    creditsUsed: TaxCreditCarryForward[];
  }> {
    this.logger.log(`Applying capital investment credits for business ${businessId}, year ${taxYear}`);

    const availableCredits = await this.carryForwardRepository.find({
      where: {
        businessId,
        fullyUtilized: false,
      },
      order: { originYear: 'ASC' },
    });

    const validCredits = availableCredits.filter(
      credit => credit.expiryYear >= taxYear && credit.remainingAmount > 0
    );

    let remainingTax = taxLiability;
    let totalCreditsApplied = 0;
    const creditsUsed: TaxCreditCarryForward[] = [];

    for (const credit of validCredits) {
      if (remainingTax <= 0) break;

      const creditToApply = Math.min(credit.remainingAmount, remainingTax);
      credit.remainingAmount -= creditToApply;
      credit.lastAppliedYear = taxYear;

      if (credit.remainingAmount <= 0) {
        credit.fullyUtilized = true;
      }

      await this.carryForwardRepository.save(credit);

      if (credit.capitalExpenditureId) {
        const expenditure = await this.expenditureRepository.findOne({
          where: { id: credit.capitalExpenditureId },
        });

        if (expenditure) {
          expenditure.creditClaimed += creditToApply;
          expenditure.creditRemaining -= creditToApply;

          if (expenditure.creditRemaining <= 0) {
            expenditure.fullyUtilized = true;
          }

          await this.expenditureRepository.save(expenditure);
        }
      }

      remainingTax -= creditToApply;
      totalCreditsApplied += creditToApply;
      creditsUsed.push(credit);
    }

    this.logger.log(`Applied ₦${totalCreditsApplied} in credits, remaining tax: ₦${remainingTax}`);

    return {
      creditsApplied: totalCreditsApplied,
      remainingTax,
      creditsUsed,
    };
  }

  async getAvailableCredits(businessId: string, taxYear: number): Promise<{
    totalAvailable: number;
    credits: TaxCreditCarryForward[];
  }> {
    const credits = await this.carryForwardRepository.find({
      where: {
        businessId,
        fullyUtilized: false,
      },
      order: { originYear: 'ASC' },
    });

    const validCredits = credits.filter(
      credit => credit.expiryYear >= taxYear && credit.remainingAmount > 0
    );

    const totalAvailable = validCredits.reduce(
      (sum, credit) => sum + Number(credit.remainingAmount),
      0
    );

    return {
      totalAvailable,
      credits: validCredits,
    };
  }

  calculate5PercentCredit(amount: number): number {
    return amount * this.CREDIT_RATE;
  }

  private async createCarryForward(expenditure: CapitalExpenditure): Promise<TaxCreditCarryForward> {
    const carryForward = this.carryForwardRepository.create({
      businessId: expenditure.businessId,
      capitalExpenditureId: expenditure.id,
      originYear: expenditure.taxYear,
      originalAmount: expenditure.creditRemaining,
      remainingAmount: expenditure.creditRemaining,
      expiryYear: expenditure.expiryYear,
      fullyUtilized: false,
    });

    return await this.carryForwardRepository.save(carryForward);
  }
}

