import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ComplianceTask, ComplianceStatus } from '../entities/compliance-task.entity';
import { CreateComplianceTaskDto } from '../dto/create-compliance-task.dto';
import { UpdateComplianceTaskDto } from '../dto/update-compliance-task.dto';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(ComplianceTask)
    private readonly complianceRepository: Repository<ComplianceTask>,
  ) {}

  async create(userId: string, dto: CreateComplianceTaskDto): Promise<ComplianceTask> {
    const task = this.complianceRepository.create({
      ...dto,
      userId,
    });

    const saved = await this.complianceRepository.save(task);
    this.logger.log(`Compliance task created: ${saved.id} for user: ${userId}`);
    return saved;
  }

  async findAll(userId: string, businessId?: string): Promise<ComplianceTask[]> {
    const where: any = { userId };
    
    if (businessId) {
      where.businessId = businessId;
    }

    const tasks = await this.complianceRepository.find({
      where,
      order: { dueDate: 'ASC' },
    });

    await this.updateOverdueTasks(tasks);

    return tasks;
  }

  async findOne(id: string, userId: string): Promise<ComplianceTask> {
    const task = await this.complianceRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException(`Compliance task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, userId: string, dto: UpdateComplianceTaskDto): Promise<ComplianceTask> {
    const task = await this.findOne(id, userId);
    Object.assign(task, dto);
    const updated = await this.complianceRepository.save(task);
    this.logger.log(`Compliance task updated: ${id}`);
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.complianceRepository.remove(task);
    this.logger.log(`Compliance task deleted: ${id}`);
  }

  async markAsCompleted(id: string, userId: string): Promise<ComplianceTask> {
    const task = await this.findOne(id, userId);
    task.status = ComplianceStatus.COMPLETED;
    task.completedDate = new Date();
    const updated = await this.complianceRepository.save(task);
    this.logger.log(`Compliance task marked as completed: ${id}`);
    return updated;
  }

  async getUpcomingTasks(userId: string, days = 30): Promise<ComplianceTask[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.complianceRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueDate >= :today', { today })
      .andWhere('task.dueDate <= :futureDate', { futureDate })
      .andWhere('task.status != :completed', { completed: ComplianceStatus.COMPLETED })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
  }

  async getOverdueTasks(userId: string): Promise<ComplianceTask[]> {
    const today = new Date();

    return this.complianceRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueDate < :today', { today })
      .andWhere('task.status != :completed', { completed: ComplianceStatus.COMPLETED })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
  }

  private async updateOverdueTasks(tasks: ComplianceTask[]): Promise<void> {
    const today = new Date();
    const overdueTasks = tasks.filter(
      (task) =>
        task.dueDate < today &&
        task.status !== ComplianceStatus.COMPLETED &&
        task.status !== ComplianceStatus.OVERDUE,
    );

    for (const task of overdueTasks) {
      task.status = ComplianceStatus.OVERDUE;
      await this.complianceRepository.save(task);
    }
  }
}

