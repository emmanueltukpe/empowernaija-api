import {
  Controller,
  Get,
  Post,
  Patch,
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
import { IncomeService } from "../services/income.service";
import { CreateIncomeDto } from "../dto/create-income.dto";
import { UpdateIncomeDto } from "../dto/update-income.dto";
import { User } from "../../users/entities/user.entity";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("income")
@Controller("income")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class IncomeController extends BaseController {
  constructor(private readonly incomeService: IncomeService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: "Create income record" })
  @ApiResponse({ status: 201, description: "Income record created" })
  async create(@CurrentUser() user: User, @Body() dto: CreateIncomeDto) {
    return this.incomeService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all income records for current user" })
  @ApiResponse({ status: 200, description: "List of income records" })
  async findAll(@CurrentUser() user: User) {
    return this.incomeService.findAll(user.id);
  }

  @Get("summary/yearly")
  @ApiOperation({ summary: "Get yearly income summary" })
  @ApiQuery({ name: "year", required: true, example: 2026 })
  @ApiResponse({ status: 200, description: "Yearly income summary" })
  async getYearlySummary(
    @CurrentUser() user: User,
    @Query("year") year: number
  ) {
    return this.incomeService.getYearlySummary(user.id, year);
  }

  @Get("summary/monthly")
  @ApiOperation({ summary: "Get monthly income summary" })
  @ApiQuery({ name: "year", required: true, example: 2026 })
  @ApiQuery({ name: "month", required: true, example: 1 })
  @ApiResponse({ status: 200, description: "Monthly income summary" })
  async getMonthlySummary(
    @CurrentUser() user: User,
    @Query("year") year: number,
    @Query("month") month: number
  ) {
    return this.incomeService.getMonthlySummary(user.id, year, month);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get income record by ID" })
  @ApiParam({ name: "id", description: "Income record ID" })
  @ApiResponse({ status: 200, description: "Income record" })
  @ApiResponse({ status: 404, description: "Income record not found" })
  async findOne(@CurrentUser() user: User, @Param("id") id: string) {
    return this.incomeService.findOne(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update income record" })
  @ApiParam({ name: "id", description: "Income record ID" })
  @ApiResponse({ status: 200, description: "Income record updated" })
  @ApiResponse({ status: 404, description: "Income record not found" })
  async update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateIncomeDto
  ) {
    return this.incomeService.update(id, user.id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete income record" })
  @ApiParam({ name: "id", description: "Income record ID" })
  @ApiResponse({ status: 204, description: "Income record deleted" })
  @ApiResponse({ status: 404, description: "Income record not found" })
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.incomeService.remove(id, user.id);
  }
}
