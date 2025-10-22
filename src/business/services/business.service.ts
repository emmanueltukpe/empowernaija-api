import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async create(ownerId: string, dto: CreateBusinessDto): Promise<Business> {
    const business = this.businessRepository.create({
      ...dto,
      ownerId,
    });

    const saved = await this.businessRepository.save(business);
    this.logger.log(`Business created: ${saved.id} for owner: ${ownerId}`);
    return saved;
  }

  async findAll(ownerId: string): Promise<Business[]> {
    return this.businessRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { id, ownerId },
      relations: ['invoices', 'taxCalculations'],
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  async update(id: string, ownerId: string, dto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findOne(id, ownerId);
    Object.assign(business, dto);
    const updated = await this.businessRepository.save(business);
    this.logger.log(`Business updated: ${id}`);
    return updated;
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const business = await this.findOne(id, ownerId);
    await this.businessRepository.remove(business);
    this.logger.log(`Business deleted: ${id}`);
  }

  async verifyTin(id: string, ownerId: string): Promise<Business> {
    const business = await this.findOne(id, ownerId);
    
    if (!business.tin) {
      throw new ForbiddenException('TIN not provided');
    }

    business.tinVerified = true;
    const updated = await this.businessRepository.save(business);
    this.logger.log(`TIN verified for business: ${id}`);
    return updated;
  }

  async getBusinessStats(id: string, ownerId: string): Promise<any> {
    const business = await this.findOne(id, ownerId);

    return {
      totalInvoices: business.invoices?.length || 0,
      totalTaxCalculations: business.taxCalculations?.length || 0,
      estimatedAnnualTurnover: business.estimatedAnnualTurnover,
      estimatedAssetValue: business.estimatedAssetValue,
      size: business.size,
      sector: business.sector,
      vatRegistered: business.vatRegistered,
      tinVerified: business.tinVerified,
    };
  }
}

