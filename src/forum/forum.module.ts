import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumPost } from './entities/forum-post.entity';
import { ForumService } from './services/forum.service';
import { ForumController } from './controllers/forum.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ForumPost])],
  controllers: [ForumController],
  providers: [ForumService],
  exports: [ForumService],
})
export class ForumModule {}

