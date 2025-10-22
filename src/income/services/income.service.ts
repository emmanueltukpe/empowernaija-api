import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { IncomeRecord } from '../entities/income-record.entity';
import { CreateIncomeDto } from '../dto/create-income.dto';
import { UpdateIncomeDto } from '../dto/update-income.dto';

@Injectable()
export class IncomeService {
  private readonly logger = new Logger(IncomeService.name);

  constructor(
    @InjectRepository(IncomeRecord)
    private readonly incomeRepository: Repository<IncomeRecord>,
  ) {}

  async create(userId: string, dto: CreateIncomeDto): Promise<IncomeRecord> {
    const income = this.incomeRepository.create({
      ...dto,
      userId,
    });

    const saved = await this.incomeRepository.save(income);
    this.logger.log(`Income record created: ${saved.id} for user: ${userId}`);
    return saved;
  }

  async findAll(userId: string): Promise<IncomeRecord[]> {
    return this.incomeRepository.find({
      where: { userId },
      order: { incomeDate: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<IncomeRecord> {
    const income = await this.incomeRepository.findOne({
      where: { id, userId },
    });

    if (!income) {
      throw new NotFoundException(`Income record with ID ${id} not found`);
    }

    return income;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateIncomeDto,
  ): Promise<IncomeRecord> {
    const income = await this.findOne(id, userId);
    Object.assign(income, dto);
    const updated = await this.incomeRepository.save(income);
    this.logger.log(`Income record updated: ${id}`);
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const income = await this.findOne(id, userId);
    await this.incomeRepository.remove(income);
    this.logger.log(`Income record deleted: ${id}`);
  }

  async getYearlySummary(userId: string, year: number): Promise<any> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const incomes = await this.incomeRepository.find({
      where: {
        userId,
        incomeDate: Between(startDate, endDate),
      },
    });

    const totalIncome = incomes.reduce(
      (sum, income) => sum + Number(income.amount),
      0,
    );

    const bySource = incomes.reduce((acc, income) => {
      const source = income.source;
      if (!acc[source]) {
        acc[source] = 0;
      }
      acc[source] += Number(income.amount);
      return acc;
    }, {});

    const taxCalculated = incomes.filter((i) => i.taxCalculated).length;
    const taxPaid = incomes.filter((i) => i.taxPaid).length;

    return {
      year,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalRecords: incomes.length,
      bySource,
      taxCalculated,
      taxPaid,
      taxPending: taxCalculated - taxPaid,
    };
  }

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
  ): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const incomes = await this.incomeRepository.find({
      where: {
        userId,
        incomeDate: Between(startDate, endDate),
      },
    });

    const totalIncome = incomes.reduce(
      (sum, income) => sum + Number(income.amount),
      0,
    );

    return {
      year,
      month,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalRecords: incomes.length,
      incomes,
    };
  }
}

