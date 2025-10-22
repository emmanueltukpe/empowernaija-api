import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningModule, ModuleCategory, DifficultyLevel } from '../entities/learning-module.entity';
import { CreateLearningModuleDto } from '../dto/create-learning-module.dto';
import { UpdateLearningModuleDto } from '../dto/update-learning-module.dto';

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);

  constructor(
    @InjectRepository(LearningModule)
    private readonly learningRepository: Repository<LearningModule>,
  ) {}

  async create(dto: CreateLearningModuleDto): Promise<LearningModule> {
    const module = this.learningRepository.create(dto);
    const saved = await this.learningRepository.save(module);
    this.logger.log(`Learning module created: ${saved.id}`);
    return saved;
  }

  async findAll(
    category?: ModuleCategory,
    difficulty?: DifficultyLevel,
    publishedOnly = true,
  ): Promise<LearningModule[]> {
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (publishedOnly) {
      where.isPublished = true;
    }

    return this.learningRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LearningModule> {
    const module = await this.learningRepository.findOne({ where: { id } });

    if (!module) {
      throw new NotFoundException(`Learning module with ID ${id} not found`);
    }

    module.viewCount += 1;
    await this.learningRepository.save(module);

    return module;
  }

  async update(id: string, dto: UpdateLearningModuleDto): Promise<LearningModule> {
    const module = await this.learningRepository.findOne({ where: { id } });

    if (!module) {
      throw new NotFoundException(`Learning module with ID ${id} not found`);
    }

    Object.assign(module, dto);
    const updated = await this.learningRepository.save(module);
    this.logger.log(`Learning module updated: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const module = await this.learningRepository.findOne({ where: { id } });

    if (!module) {
      throw new NotFoundException(`Learning module with ID ${id} not found`);
    }

    await this.learningRepository.remove(module);
    this.logger.log(`Learning module deleted: ${id}`);
  }

  async searchByTag(tag: string): Promise<LearningModule[]> {
    return this.learningRepository
      .createQueryBuilder('module')
      .where(':tag = ANY(module.tags)', { tag })
      .andWhere('module.isPublished = :published', { published: true })
      .orderBy('module.createdAt', 'DESC')
      .getMany();
  }
}

