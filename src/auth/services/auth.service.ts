import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User, AuthProvider, UserRole } from "../../users/entities/user.entity";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { AuthResponseDto, UserResponseDto } from "../dto/auth-response.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registering new user: ${dto.email}`);

    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      roles: dto.roles || [UserRole.EMPLOYEE],
      authProvider: AuthProvider.LOCAL,
    });

    await this.usersRepository.save(user);

    const tokens = await this.generateTokens(user);

    this.logger.log(`User registered successfully: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for: ${dto.email}`);

    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    const tokens = await this.generateTokens(user);

    this.logger.log(`User logged in successfully: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async validateGoogleUser(profile: any): Promise<User> {
    this.logger.log(`Validating Google user: ${profile.email}`);

    let user = await this.usersRepository.findOne({
      where: { googleId: profile.id },
    });

    if (!user) {
      user = await this.usersRepository.findOne({
        where: { email: profile.email },
      });

      if (user) {
        user.googleId = profile.id;
        user.authProvider = AuthProvider.GOOGLE;
        user.avatar = profile.picture;
        await this.usersRepository.save(user);
      } else {
        user = this.usersRepository.create({
          email: profile.email,
          googleId: profile.id,
          firstName: profile.given_name || profile.name,
          lastName: profile.family_name || "",
          avatar: profile.picture,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: profile.email_verified || false,
          roles: [UserRole.EMPLOYEE],
        });
        await this.usersRepository.save(user);
      }
    }

    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    return user;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const tokens = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { refreshToken: "" });
    this.logger.log(`User logged out: ${userId}`);
  }

  async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: "30d",
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await this.usersRepository.save(user);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User): UserResponseDto {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized as UserResponseDto;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (user && user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        return user;
      }
    }

    return null;
  }
}
