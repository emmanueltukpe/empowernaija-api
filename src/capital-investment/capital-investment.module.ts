import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CapitalExpenditure } from './entities/capital-expenditure.entity';
import { TaxCreditCarryForward } from './entities/tax-credit-carryforward.entity';
import { CapitalInvestmentService } from './services/capital-investment.service';
import { CapitalInvestmentController } from './controllers/capital-investment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CapitalExpenditure, TaxCreditCarryForward])],
  controllers: [CapitalInvestmentController],
  providers: [CapitalInvestmentService],
  exports: [CapitalInvestmentService],
})
export class CapitalInvestmentModule {}

