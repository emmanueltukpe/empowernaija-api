import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Document } from './entities/document.entity';
import { DocumentService } from './services/document.service';
import { StorageService } from './services/storage.service';
import { DocumentController } from './controllers/document.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), ConfigModule],
  controllers: [DocumentController],
  providers: [DocumentService, StorageService],
  exports: [DocumentService, StorageService],
})
export class DocumentsModule {}

