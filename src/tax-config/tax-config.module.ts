import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxConfiguration } from './entities/tax-configuration.entity';
import { TaxConfigService } from './services/tax-config.service';
import { TaxConfigController } from './controllers/tax-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaxConfiguration])],
  controllers: [TaxConfigController],
  providers: [TaxConfigService],
  exports: [TaxConfigService],
})
export class TaxConfigModule {}

