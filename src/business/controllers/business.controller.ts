import {
  Controller,
  Get,
  Post,
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
import { BusinessService } from "../services/business.service";
import { CreateBusinessDto } from "../dto/create-business.dto";
import { UpdateBusinessDto } from "../dto/update-business.dto";
import { User } from "../../users/entities/user.entity";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("business")
@Controller("business")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class BusinessController extends BaseController {
  constructor(private readonly businessService: BusinessService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: "Create a new business" })
  @ApiResponse({ status: 201, description: "Business created" })
  async create(@CurrentUser() user: User, @Body() dto: CreateBusinessDto) {
    return this.businessService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all businesses for current user" })
  @ApiResponse({ status: 200, description: "List of businesses" })
  async findAll(@CurrentUser() user: User) {
    return this.businessService.findAll(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get business by ID" })
  @ApiParam({ name: "id", description: "Business ID" })
  @ApiResponse({ status: 200, description: "Business details" })
  @ApiResponse({ status: 404, description: "Business not found" })
  async findOne(@CurrentUser() user: User, @Param("id") id: string) {
    return this.businessService.findOne(id, user.id);
  }

  @Get(":id/stats")
  @ApiOperation({ summary: "Get business statistics" })
  @ApiParam({ name: "id", description: "Business ID" })
  @ApiResponse({ status: 200, description: "Business statistics" })
  async getStats(@CurrentUser() user: User, @Param("id") id: string) {
    return this.businessService.getBusinessStats(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update business" })
  @ApiParam({ name: "id", description: "Business ID" })
  @ApiResponse({ status: 200, description: "Business updated" })
  @ApiResponse({ status: 404, description: "Business not found" })
  async update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateBusinessDto
  ) {
    return this.businessService.update(id, user.id, dto);
  }

  @Patch(":id/verify-tin")
  @ApiOperation({ summary: "Verify business TIN" })
  @ApiParam({ name: "id", description: "Business ID" })
  @ApiResponse({ status: 200, description: "TIN verified" })
  async verifyTin(@CurrentUser() user: User, @Param("id") id: string) {
    return this.businessService.verifyTin(id, user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete business" })
  @ApiParam({ name: "id", description: "Business ID" })
  @ApiResponse({ status: 204, description: "Business deleted" })
  @ApiResponse({ status: 404, description: "Business not found" })
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.businessService.remove(id, user.id);
  }
}
