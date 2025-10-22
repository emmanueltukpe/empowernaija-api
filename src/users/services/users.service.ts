import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map((user) => this.sanitizeUser(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['businesses', 'incomeRecords', 'taxCalculations'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, dto);
    await this.usersRepository.save(user);

    this.logger.log(`User updated: ${id}`);
    return this.sanitizeUser(user);
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isActive = false;
    await this.usersRepository.save(user);

    this.logger.log(`User deactivated: ${id}`);
  }

  async activate(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isActive = true;
    await this.usersRepository.save(user);

    this.logger.log(`User activated: ${id}`);
  }

  async verifyTin(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!user.tin) {
      throw new BadRequestException('TIN not provided');
    }

    user.tinVerified = true;
    await this.usersRepository.save(user);

    this.logger.log(`TIN verified for user: ${id}`);
    return this.sanitizeUser(user);
  }

  async verifyNin(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!user.nin) {
      throw new BadRequestException('NIN not provided');
    }

    user.ninVerified = true;
    await this.usersRepository.save(user);

    this.logger.log(`NIN verified for user: ${id}`);
    return this.sanitizeUser(user);
  }

  async getUserStats(id: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['businesses', 'incomeRecords', 'taxCalculations'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      totalBusinesses: user.businesses?.length || 0,
      totalIncomeRecords: user.incomeRecords?.length || 0,
      totalTaxCalculations: user.taxCalculations?.length || 0,
      accountAge: Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      ),
      lastLogin: user.lastLoginAt,
    };
  }

  private sanitizeUser(user: User): UserResponseDto {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized as UserResponseDto;
  }
}

