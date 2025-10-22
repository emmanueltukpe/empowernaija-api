import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceTask } from './entities/compliance-task.entity';
import { ComplianceService } from './services/compliance.service';
import { ComplianceController } from './controllers/compliance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceTask])],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}

