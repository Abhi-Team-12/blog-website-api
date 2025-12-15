import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { Like } from 'src/entities/like.entity';
import { User } from 'src/entities/users.entity';
import { Posts } from 'src/entities/posts.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Like, User, Posts])],
  controllers: [LikeController],
  providers: [LikeService],
  exports: [LikeService], // optional
})
export class LikeModule {}