import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { VATService } from "../services/vat.service";
import { CreateVATRecordDto } from "../dto/create-vat-record.dto";
import { User } from "../../users/entities/user.entity";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("vat")
@Controller("vat")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class VATController extends BaseController {
  constructor(private readonly vatService: VATService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: "Create a VAT record" })
  @ApiResponse({ status: 201, description: "VAT record created" })
  async create(@CurrentUser() user: User, @Body() dto: CreateVATRecordDto) {
    return this.vatService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all VAT records" })
  @ApiQuery({
    name: "businessId",
    required: false,
    description: "Filter by business ID",
  })
  @ApiResponse({ status: 200, description: "List of VAT records" })
  async findAll(
    @CurrentUser() user: User,
    @Query("businessId") businessId?: string
  ) {
    return this.vatService.findAll(user.id, businessId);
  }

  @Get("summary")
  @ApiOperation({ summary: "Get VAT summary for a quarter" })
  @ApiQuery({ name: "businessId", required: true })
  @ApiQuery({ name: "year", required: true, example: 2026 })
  @ApiQuery({ name: "quarter", required: true, example: 1 })
  @ApiResponse({ status: 200, description: "VAT summary" })
  async getVATSummary(
    @CurrentUser() user: User,
    @Query("businessId") businessId: string,
    @Query("year") year: number,
    @Query("quarter") quarter: number
  ) {
    return this.vatService.getVATSummary(user.id, businessId, year, quarter);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get VAT record by ID" })
  @ApiParam({ name: "id", description: "VAT record ID" })
  @ApiResponse({ status: 200, description: "VAT record details" })
  @ApiResponse({ status: 404, description: "VAT record not found" })
  async findOne(@CurrentUser() user: User, @Param("id") id: string) {
    return this.vatService.findOne(id, user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete VAT record" })
  @ApiParam({ name: "id", description: "VAT record ID" })
  @ApiResponse({ status: 204, description: "VAT record deleted" })
  @ApiResponse({ status: 404, description: "VAT record not found" })
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.vatService.remove(id, user.id);
  }
}
