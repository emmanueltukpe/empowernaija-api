import { ApiProperty } from '@nestjs/swagger';
import { UserRole, AuthProvider } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  phoneNumber?: string;

  @ApiProperty({ enum: UserRole, isArray: true })
  roles: UserRole[];

  @ApiProperty({ enum: AuthProvider })
  authProvider: AuthProvider;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  tin?: string;

  @ApiProperty({ required: false })
  nin?: string;

  @ApiProperty()
  tinVerified: boolean;

  @ApiProperty()
  ninVerified: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  lastLoginAt?: Date;
}

