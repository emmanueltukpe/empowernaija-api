import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxCalculation } from './entities/tax-calculation.entity';
import { TaxCalculationService } from './services/tax-calculation.service';
import { TaxCalculationController } from './controllers/tax-calculation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaxCalculation])],
  controllers: [TaxCalculationController],
  providers: [TaxCalculationService],
  exports: [TaxCalculationService],
})
export class TaxCalculationModule {}

