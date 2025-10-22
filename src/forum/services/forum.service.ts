import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForumPost, PostCategory } from '../entities/forum-post.entity';
import { CreateForumPostDto } from '../dto/create-forum-post.dto';
import { UpdateForumPostDto } from '../dto/update-forum-post.dto';

@Injectable()
export class ForumService {
  private readonly logger = new Logger(ForumService.name);

  constructor(
    @InjectRepository(ForumPost)
    private readonly forumRepository: Repository<ForumPost>,
  ) {}

  async create(authorId: string, dto: CreateForumPostDto): Promise<ForumPost> {
    const post = this.forumRepository.create({
      ...dto,
      authorId,
    });

    const saved = await this.forumRepository.save(post);
    this.logger.log(`Forum post created: ${saved.id} by author: ${authorId}`);
    return saved;
  }

  async findAll(category?: PostCategory): Promise<ForumPost[]> {
    const where: any = {};
    
    if (category) {
      where.category = category;
    }

    return this.forumRepository.find({
      where,
      relations: ['author'],
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ForumPost> {
    const post = await this.forumRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException(`Forum post with ID ${id} not found`);
    }

    post.viewCount += 1;
    await this.forumRepository.save(post);

    return post;
  }

  async update(id: string, authorId: string, dto: UpdateForumPostDto): Promise<ForumPost> {
    const post = await this.forumRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException(`Forum post with ID ${id} not found`);
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    if (post.isLocked) {
      throw new ForbiddenException('This post is locked and cannot be edited');
    }

    Object.assign(post, dto);
    const updated = await this.forumRepository.save(post);
    this.logger.log(`Forum post updated: ${id}`);
    return updated;
  }

  async remove(id: string, authorId: string): Promise<void> {
    const post = await this.forumRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Forum post with ID ${id} not found`);
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.forumRepository.remove(post);
    this.logger.log(`Forum post deleted: ${id}`);
  }

  async searchByTag(tag: string): Promise<ForumPost[]> {
    return this.forumRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where(':tag = ANY(post.tags)', { tag })
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }

  async markAsResolved(id: string, authorId: string): Promise<ForumPost> {
    const post = await this.forumRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Forum post with ID ${id} not found`);
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('Only the author can mark the post as resolved');
    }

    post.isResolved = true;
    const updated = await this.forumRepository.save(post);
    this.logger.log(`Forum post marked as resolved: ${id}`);
    return updated;
  }
}

