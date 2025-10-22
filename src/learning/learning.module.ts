import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningModule as LearningModuleEntity } from './entities/learning-module.entity';
import { LearningService } from './services/learning.service';
import { LearningController } from './controllers/learning.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LearningModuleEntity])],
  controllers: [LearningController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}

