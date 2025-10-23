import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorporateDonation } from '../entities/corporate-donation.entity';
import { Business } from '../../business/entities/business.entity';
import { CreateCorporateDonationDto, UpdateCorporateDonationDto } from '../dto/corporate-donation.dto';

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);
  private readonly DEDUCTION_RATE = 0.10;

  constructor(
    @InjectRepository(CorporateDonation)
    private readonly donationRepository: Repository<CorporateDonation>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async recordDonation(dto: CreateCorporateDonationDto): Promise<CorporateDonation> {
    this.logger.log(`Recording donation for business ${dto.businessId}`);

    const business = await this.businessRepository.findOne({
      where: { id: dto.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const donation = this.donationRepository.create({
      ...dto,
      deductionClaimed: 0,
      approved: false,
      recipientVerified: false,
    });

    if (dto.recipientTIN) {
      donation.recipientVerified = await this.verifyRecipientNGO(dto.recipientTIN);
    }

    return await this.donationRepository.save(donation);
  }

  async getDonation(id: string): Promise<CorporateDonation> {
    const donation = await this.donationRepository.findOne({
      where: { id },
      relations: ['business'],
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    return donation;
  }

  async getBusinessDonations(businessId: string, taxYear?: number): Promise<CorporateDonation[]> {
    const where: any = { businessId };
    if (taxYear) {
      where.taxYear = taxYear;
    }

    return await this.donationRepository.find({
      where,
      order: { donationDate: 'DESC' },
    });
  }

  async updateDonation(id: string, dto: UpdateCorporateDonationDto): Promise<CorporateDonation> {
    const donation = await this.getDonation(id);

    if (donation.deductionClaimed > 0) {
      throw new BadRequestException('Cannot update donation with claimed deductions');
    }

    Object.assign(donation, dto);

    if (dto.recipientTIN) {
      donation.recipientVerified = await this.verifyRecipientNGO(dto.recipientTIN);
    }

    return await this.donationRepository.save(donation);
  }

  async deleteDonation(id: string): Promise<void> {
    const donation = await this.getDonation(id);

    if (donation.deductionClaimed > 0) {
      throw new BadRequestException('Cannot delete donation with claimed deductions');
    }

    await this.donationRepository.remove(donation);
  }

  async approveDonation(id: string): Promise<CorporateDonation> {
    const donation = await this.getDonation(id);
    donation.approved = true;
    donation.rejectionReason = '';
    return await this.donationRepository.save(donation);
  }

  async rejectDonation(id: string, reason: string): Promise<CorporateDonation> {
    const donation = await this.getDonation(id);
    donation.approved = false;
    donation.rejectionReason = reason;
    return await this.donationRepository.save(donation);
  }

  async calculate10PercentDeduction(businessId: string, taxYear: number): Promise<{
    totalDonations: number;
    totalDeduction: number;
    donations: CorporateDonation[];
  }> {
    const donations = await this.donationRepository.find({
      where: {
        businessId,
        taxYear,
        approved: true,
      },
    });

    const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalDeduction = totalDonations * this.DEDUCTION_RATE;

    this.logger.log(
      `Total donations: ₦${totalDonations}, Deduction (10%): ₦${totalDeduction}`
    );

    return {
      totalDonations,
      totalDeduction,
      donations,
    };
  }

  async verifyRecipientNGO(tin: string): Promise<boolean> {
    const ngo = await this.businessRepository.findOne({
      where: {
        tin,
        taxExemptStatus: true,
      },
    });

    return !!ngo;
  }
}

