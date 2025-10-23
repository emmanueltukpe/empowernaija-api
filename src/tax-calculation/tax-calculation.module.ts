import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TaxCalculation } from "./entities/tax-calculation.entity";
import { TaxCalculationService } from "./services/tax-calculation.service";
import { ValidationService } from "./services/validation.service";
import { IncomeAggregationService } from "./services/income-aggregation.service";
import { TaxCalculationController } from "./controllers/tax-calculation.controller";
import { IncomeAggregationController } from "./controllers/income-aggregation.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TaxCalculation])],
  controllers: [TaxCalculationController, IncomeAggregationController],
  providers: [
    TaxCalculationService,
    ValidationService,
    IncomeAggregationService,
  ],
  exports: [TaxCalculationService, IncomeAggregationService],
})
export class TaxCalculationModule {}
