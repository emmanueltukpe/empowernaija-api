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
import { InvoiceService } from "../services/invoice.service";
import { CreateInvoiceDto } from "../dto/create-invoice.dto";
import { UpdateInvoiceDto } from "../dto/update-invoice.dto";
import { User } from "../../users/entities/user.entity";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("invoices")
@Controller("invoices")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class InvoiceController extends BaseController {
  constructor(private readonly invoiceService: InvoiceService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: "Create a new invoice" })
  @ApiResponse({ status: 201, description: "Invoice created" })
  async create(@CurrentUser() user: User, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all invoices for current user" })
  @ApiQuery({
    name: "businessId",
    required: false,
    description: "Filter by business ID",
  })
  @ApiResponse({ status: 200, description: "List of invoices" })
  async findAll(
    @CurrentUser() user: User,
    @Query("businessId") businessId?: string
  ) {
    return this.invoiceService.findAll(user.id, businessId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get invoice by ID" })
  @ApiParam({ name: "id", description: "Invoice ID" })
  @ApiResponse({ status: 200, description: "Invoice details" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async findOne(@CurrentUser() user: User, @Param("id") id: string) {
    return this.invoiceService.findOne(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update invoice" })
  @ApiParam({ name: "id", description: "Invoice ID" })
  @ApiResponse({ status: 200, description: "Invoice updated" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateInvoiceDto
  ) {
    return this.invoiceService.update(id, user.id, dto);
  }

  @Patch(":id/mark-paid")
  @ApiOperation({ summary: "Mark invoice as paid" })
  @ApiParam({ name: "id", description: "Invoice ID" })
  @ApiResponse({ status: 200, description: "Invoice marked as paid" })
  async markAsPaid(@CurrentUser() user: User, @Param("id") id: string) {
    return this.invoiceService.markAsPaid(id, user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete invoice" })
  @ApiParam({ name: "id", description: "Invoice ID" })
  @ApiResponse({ status: 204, description: "Invoice deleted" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.invoiceService.remove(id, user.id);
  }
}
