import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxReturn } from './entities/tax-return.entity';
import { TaxReturnService } from './services/tax-return.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { TaxReturnController } from './controllers/tax-return.controller';
import { DocumentsModule } from '../documents/documents.module';
import { TaxCalculationModule } from '../tax-calculation/tax-calculation.module';
import { IncomeRecord } from '../income/entities/income-record.entity';
import { Business } from '../business/entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxReturn, IncomeRecord, Business]),
    DocumentsModule,
    TaxCalculationModule,
  ],
  controllers: [TaxReturnController],
  providers: [TaxReturnService, PdfGeneratorService],
  exports: [TaxReturnService, PdfGeneratorService],
})
export class TaxReturnModule {}

