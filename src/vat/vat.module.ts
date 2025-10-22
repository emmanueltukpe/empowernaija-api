import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VATRecord } from './entities/vat-record.entity';
import { Business } from '../business/entities/business.entity';
import { VATService } from './services/vat.service';
import { VATController } from './controllers/vat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VATRecord, Business])],
  controllers: [VATController],
  providers: [VATService],
  exports: [VATService],
})
export class VATModule {}

