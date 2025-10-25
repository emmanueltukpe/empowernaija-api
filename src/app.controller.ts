import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { BaseController } from "./common/controllers";

@ApiTags("Health")
@Controller()
export class AppController extends BaseController {
  constructor(private readonly appService: AppService) {
    super();
  }

  @Get("health")
  @ApiOperation({
    summary: "Health check endpoint",
    description:
      "Check the health status of the API server and database connection",
  })
  @ApiResponse({
    status: 200,
    description: "API is healthy and operational",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ok" },
        timestamp: { type: "string", example: "2026-01-15T10:30:00.000Z" },
        uptime: { type: "number", example: 3600 },
        database: { type: "string", example: "connected" },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Service unavailable - API or database is down",
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  @ApiOperation({
    summary: "API root endpoint",
    description:
      "Get basic information about the EmpowerNaija Tax Compliance API",
  })
  @ApiResponse({
    status: 200,
    description: "API information retrieved successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Welcome to EmpowerNaija API" },
        version: { type: "string", example: "1.0.0" },
        documentation: { type: "string", example: "/api/docs" },
      },
    },
  })
  getRoot() {
    return {
      message: "Welcome to EmpowerNaija API",
      version: "1.0.0",
      documentation: "/api/docs",
    };
  }
}
