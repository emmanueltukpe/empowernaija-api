import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { VATRecord, VATType } from '../entities/vat-record.entity';
import { Business } from '../../business/entities/business.entity';
import { CreateVATRecordDto } from '../dto/create-vat-record.dto';

@Injectable()
export class VATService {
  private readonly logger = new Logger(VATService.name);
  private readonly VAT_RATE = 7.5;

  constructor(
    @InjectRepository(VATRecord)
    private readonly vatRepository: Repository<VATRecord>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async create(userId: string, dto: CreateVATRecordDto): Promise<VATRecord> {
    const business = await this.businessRepository.findOne({
      where: { id: dto.businessId, ownerId: userId },
    });

    if (!business) {
      throw new ForbiddenException('Business not found or access denied');
    }

    if (!business.vatRegistered) {
      throw new ForbiddenException('Business is not VAT registered');
    }

    const vatRate = dto.isZeroRated ? 0 : this.VAT_RATE;
    const vatAmount = (dto.baseAmount * vatRate) / 100;
    const totalAmount = dto.baseAmount + vatAmount;

    const record = this.vatRepository.create({
      ...dto,
      vatRate,
      vatAmount,
      totalAmount,
    });

    const saved = await this.vatRepository.save(record);
    this.logger.log(`VAT record created: ${saved.id} for business: ${dto.businessId}`);
    return saved;
  }

  async findAll(userId: string, businessId?: string): Promise<VATRecord[]> {
    const query = this.vatRepository
      .createQueryBuilder('vat')
      .leftJoinAndSelect('vat.business', 'business')
      .where('business.ownerId = :userId', { userId });

    if (businessId) {
      query.andWhere('vat.businessId = :businessId', { businessId });
    }

    return query.orderBy('vat.transactionDate', 'DESC').getMany();
  }

  async findOne(id: string, userId: string): Promise<VATRecord> {
    const record = await this.vatRepository
      .createQueryBuilder('vat')
      .leftJoinAndSelect('vat.business', 'business')
      .where('vat.id = :id', { id })
      .andWhere('business.ownerId = :userId', { userId })
      .getOne();

    if (!record) {
      throw new NotFoundException(`VAT record with ID ${id} not found`);
    }

    return record;
  }

  async remove(id: string, userId: string): Promise<void> {
    const record = await this.findOne(id, userId);
    await this.vatRepository.remove(record);
    this.logger.log(`VAT record deleted: ${id}`);
  }

  async getVATSummary(userId: string, businessId: string, year: number, quarter: number): Promise<any> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId, ownerId: userId },
    });

    if (!business) {
      throw new ForbiddenException('Business not found or access denied');
    }

    const quarterMonths = {
      1: [0, 1, 2],
      2: [3, 4, 5],
      3: [6, 7, 8],
      4: [9, 10, 11],
    };

    const months = quarterMonths[quarter];
    const startDate = new Date(year, months[0], 1);
    const endDate = new Date(year, months[2] + 1, 0);

    const records = await this.vatRepository.find({
      where: {
        businessId,
        transactionDate: Between(startDate, endDate),
      },
    });

    const inputVAT = records
      .filter((r) => r.type === VATType.INPUT)
      .reduce((sum, r) => sum + Number(r.vatAmount), 0);

    const outputVAT = records
      .filter((r) => r.type === VATType.OUTPUT)
      .reduce((sum, r) => sum + Number(r.vatAmount), 0);

    const netVAT = outputVAT - inputVAT;

    return {
      year,
      quarter,
      inputVAT: Math.round(inputVAT * 100) / 100,
      outputVAT: Math.round(outputVAT * 100) / 100,
      netVAT: Math.round(netVAT * 100) / 100,
      totalRecords: records.length,
      inputRecords: records.filter((r) => r.type === VATType.INPUT).length,
      outputRecords: records.filter((r) => r.type === VATType.OUTPUT).length,
    };
  }
}

