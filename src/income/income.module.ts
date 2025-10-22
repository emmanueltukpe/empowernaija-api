import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomeRecord } from './entities/income-record.entity';
import { IncomeService } from './services/income.service';
import { IncomeController } from './controllers/income.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IncomeRecord])],
  controllers: [IncomeController],
  providers: [IncomeService],
  exports: [IncomeService],
})
export class IncomeModule {}

