import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
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
import { TaxConfigService } from "../services/tax-config.service";
import {
  TaxConfiguration,
  ConfigValueType,
} from "../entities/tax-configuration.entity";
import { BaseController } from "../../common/controllers";

@ApiTags("tax-config")
@Controller("tax-config")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TaxConfigController extends BaseController {
  constructor(private readonly taxConfigService: TaxConfigService) {
    super();
  }

  @Get(":taxYear/:key")
  @ApiOperation({
    summary: "Get tax configuration value",
    description: "Retrieve a specific configuration value for a tax year",
  })
  @ApiParam({ name: "taxYear", description: "Tax year" })
  @ApiParam({ name: "key", description: "Configuration key" })
  @ApiResponse({
    status: 200,
    description: "Configuration value",
  })
  async getConfig(
    @Param("taxYear") taxYear: number,
    @Param("key") key: string
  ): Promise<{ key: string; value: any }> {
    const value = await this.taxConfigService.getConfig(Number(taxYear), key);
    return { key, value };
  }

  @Get(":taxYear")
  @ApiOperation({
    summary: "Get all configurations for a tax year",
    description: "Retrieve all active configurations for a specific tax year",
  })
  @ApiParam({ name: "taxYear", description: "Tax year" })
  @ApiResponse({
    status: 200,
    description: "List of configurations",
    type: [TaxConfiguration],
  })
  async getAllConfigs(
    @Param("taxYear") taxYear: number
  ): Promise<TaxConfiguration[]> {
    return await this.taxConfigService.getAllConfigs(Number(taxYear));
  }

  @Post()
  @ApiOperation({
    summary: "Create tax configuration (Admin only)",
    description: "Create a new tax configuration",
  })
  @ApiResponse({
    status: 201,
    description: "Configuration created successfully",
    type: TaxConfiguration,
  })
  async createConfig(
    @Body()
    body: {
      taxYear: number;
      key: string;
      value: any;
      valueType: ConfigValueType;
      description?: string;
      effectiveDate?: string;
      expiryDate?: string;
    }
  ): Promise<TaxConfiguration> {
    return await this.taxConfigService.createConfig(
      body.taxYear,
      body.key,
      body.value,
      body.valueType,
      body.description,
      body.effectiveDate ? new Date(body.effectiveDate) : undefined,
      body.expiryDate ? new Date(body.expiryDate) : undefined
    );
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update tax configuration (Admin only)",
    description: "Update an existing tax configuration value",
  })
  @ApiParam({ name: "id", description: "Configuration ID" })
  @ApiResponse({
    status: 200,
    description: "Configuration updated successfully",
    type: TaxConfiguration,
  })
  async updateConfig(
    @Param("id") id: string,
    @Body() body: { value: any }
  ): Promise<TaxConfiguration> {
    return await this.taxConfigService.updateConfig(id, body.value);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete tax configuration (Admin only)",
    description: "Delete a tax configuration",
  })
  @ApiParam({ name: "id", description: "Configuration ID" })
  @ApiResponse({
    status: 200,
    description: "Configuration deleted successfully",
  })
  async deleteConfig(@Param("id") id: string): Promise<{ message: string }> {
    await this.taxConfigService.deleteConfig(id);
    return { message: "Configuration deleted successfully" };
  }

  @Post("seed/:taxYear")
  @ApiOperation({
    summary: "Seed default configurations (Admin only)",
    description: "Seed default tax configurations for a specific year",
  })
  @ApiParam({ name: "taxYear", description: "Tax year" })
  @ApiResponse({
    status: 200,
    description: "Default configurations seeded successfully",
  })
  async seedDefaultConfigs(
    @Param("taxYear") taxYear: number
  ): Promise<{ message: string }> {
    await this.taxConfigService.seedDefaultConfigs(Number(taxYear));
    return { message: `Default configurations seeded for year ${taxYear}` };
  }
}
