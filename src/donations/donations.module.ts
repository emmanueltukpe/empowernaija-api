import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateDonation } from './entities/corporate-donation.entity';
import { Business } from '../business/entities/business.entity';
import { DonationService } from './services/donation.service';
import { DonationController } from './controllers/donation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorporateDonation, Business])],
  controllers: [DonationController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationsModule {}

