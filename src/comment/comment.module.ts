import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { Comment } from 'src/entities/comment.entity';
import { User } from 'src/entities/users.entity';
import { Posts } from 'src/entities/posts.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, User, Posts])],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
