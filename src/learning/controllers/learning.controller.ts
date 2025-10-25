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
import { LearningService } from "../services/learning.service";
import { CreateLearningModuleDto } from "../dto/create-learning-module.dto";
import { UpdateLearningModuleDto } from "../dto/update-learning-module.dto";
import {
  ModuleCategory,
  DifficultyLevel,
} from "../entities/learning-module.entity";
import { BaseController } from "../../common/controllers";

@ApiTags("learning")
@Controller("learning")
export class LearningController extends BaseController {
  constructor(private readonly learningService: LearningService) {
    super();
  }

  @Post()
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a learning module (Admin only)" })
  @ApiResponse({ status: 201, description: "Learning module created" })
  async create(@Body() dto: CreateLearningModuleDto) {
    return this.learningService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all learning modules" })
  @ApiQuery({ name: "category", required: false, enum: ModuleCategory })
  @ApiQuery({ name: "difficulty", required: false, enum: DifficultyLevel })
  @ApiResponse({ status: 200, description: "List of learning modules" })
  async findAll(
    @Query("category") category?: ModuleCategory,
    @Query("difficulty") difficulty?: DifficultyLevel
  ) {
    return this.learningService.findAll(category, difficulty);
  }

  @Get("search")
  @ApiOperation({ summary: "Search learning modules by tag" })
  @ApiQuery({ name: "tag", required: true })
  @ApiResponse({ status: 200, description: "Search results" })
  async searchByTag(@Query("tag") tag: string) {
    return this.learningService.searchByTag(tag);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get learning module by ID" })
  @ApiParam({ name: "id", description: "Learning module ID" })
  @ApiResponse({ status: 200, description: "Learning module details" })
  @ApiResponse({ status: 404, description: "Learning module not found" })
  async findOne(@Param("id") id: string) {
    return this.learningService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update learning module (Admin only)" })
  @ApiParam({ name: "id", description: "Learning module ID" })
  @ApiResponse({ status: 200, description: "Learning module updated" })
  @ApiResponse({ status: 404, description: "Learning module not found" })
  async update(@Param("id") id: string, @Body() dto: UpdateLearningModuleDto) {
    return this.learningService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete learning module (Admin only)" })
  @ApiParam({ name: "id", description: "Learning module ID" })
  @ApiResponse({ status: 204, description: "Learning module deleted" })
  @ApiResponse({ status: 404, description: "Learning module not found" })
  async remove(@Param("id") id: string) {
    await this.learningService.remove(id);
  }
}
