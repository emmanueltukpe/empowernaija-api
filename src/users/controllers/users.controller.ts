import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "../services/users.service";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserResponseDto } from "../dto/user-response.dto";
import { User } from "../entities/user.entity";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("users")
@Controller("users")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class UsersController extends BaseController {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: "Get all users (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "List of all users",
    type: [UserResponseDto],
  })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "Current user profile",
    type: UserResponseDto,
  })
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.findOne(user.id);
  }

  @Get("me/stats")
  @ApiOperation({ summary: "Get current user statistics" })
  @ApiResponse({ status: 200, description: "User statistics" })
  async getMyStats(@CurrentUser() user: User) {
    return this.usersService.getUserStats(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User profile",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id") id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile updated",
    type: UserResponseDto,
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(user.id, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user by ID (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User updated",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Patch("me/verify-tin")
  @ApiOperation({ summary: "Verify user TIN" })
  @ApiResponse({ status: 200, description: "TIN verified" })
  async verifyMyTin(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.verifyTin(user.id);
  }

  @Patch("me/verify-nin")
  @ApiOperation({ summary: "Verify user NIN" })
  @ApiResponse({ status: 200, description: "NIN verified" })
  async verifyMyNin(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.verifyNin(user.id);
  }

  @Delete("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Deactivate current user account" })
  @ApiResponse({ status: 204, description: "Account deactivated" })
  async deactivateAccount(@CurrentUser() user: User): Promise<void> {
    await this.usersService.deactivate(user.id);
  }

  @Patch("me/activate")
  @ApiOperation({ summary: "Reactivate current user account" })
  @ApiResponse({ status: 200, description: "Account activated" })
  async activateAccount(@CurrentUser() user: User): Promise<void> {
    await this.usersService.activate(user.id);
  }
}
