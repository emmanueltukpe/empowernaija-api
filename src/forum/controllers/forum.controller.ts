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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ForumService } from '../services/forum.service';
import { CreateForumPostDto } from '../dto/create-forum-post.dto';
import { UpdateForumPostDto } from '../dto/update-forum-post.dto';
import { PostCategory } from '../entities/forum-post.entity';
import { User } from '../../users/entities/user.entity';

@ApiTags('forum')
@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a forum post' })
  @ApiResponse({ status: 201, description: 'Forum post created' })
  async create(@Req() req: Request, @Body() dto: CreateForumPostDto) {
    const user = req.user as User;
    return this.forumService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all forum posts' })
  @ApiQuery({ name: 'category', required: false, enum: PostCategory })
  @ApiResponse({ status: 200, description: 'List of forum posts' })
  async findAll(@Query('category') category?: PostCategory) {
    return this.forumService.findAll(category);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search forum posts by tag' })
  @ApiQuery({ name: 'tag', required: true })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchByTag(@Query('tag') tag: string) {
    return this.forumService.searchByTag(tag);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get forum post by ID' })
  @ApiParam({ name: 'id', description: 'Forum post ID' })
  @ApiResponse({ status: 200, description: 'Forum post details' })
  @ApiResponse({ status: 404, description: 'Forum post not found' })
  async findOne(@Param('id') id: string) {
    return this.forumService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update forum post' })
  @ApiParam({ name: 'id', description: 'Forum post ID' })
  @ApiResponse({ status: 200, description: 'Forum post updated' })
  @ApiResponse({ status: 404, description: 'Forum post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateForumPostDto,
  ) {
    const user = req.user as User;
    return this.forumService.update(id, user.id, dto);
  }

  @Patch(':id/resolve')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark forum post as resolved' })
  @ApiParam({ name: 'id', description: 'Forum post ID' })
  @ApiResponse({ status: 200, description: 'Forum post marked as resolved' })
  async markAsResolved(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.forumService.markAsResolved(id, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete forum post' })
  @ApiParam({ name: 'id', description: 'Forum post ID' })
  @ApiResponse({ status: 204, description: 'Forum post deleted' })
  @ApiResponse({ status: 404, description: 'Forum post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    await this.forumService.remove(id, user.id);
  }
}

