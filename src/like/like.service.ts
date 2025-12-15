import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from 'src/entities/like.entity';
import { User } from 'src/entities/users.entity';
import { Posts } from 'src/entities/posts.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Posts)
    private readonly postRepo: Repository<Posts>,
  ) {}

  // ---------------- TOGGLE LIKE / UNLIKE ----------------
  async toggleLike(user_id: number, post_id: number) {
    const user = await this.userRepo.findOne({ where: { user_id } });
    if (!user) throw new NotFoundException('User not found');

    const post = await this.postRepo.findOne({ where: { post_id } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.likeRepo.findOne({
      where: { user: { user_id }, post: { post_id } },
    });

    if (existing) {
      await this.likeRepo.remove(existing);
      return { status: true, message: 'Post unliked successfully' };
    }

    const newLike = this.likeRepo.create({ user, post });
    await this.likeRepo.save(newLike);
    return { status: true, message: 'Post liked successfully' };
  }

  // ---------------- GET ALL LIKES (ADMIN) ----------------
  async findAll() {
    return this.likeRepo.find({
      relations: ['user', 'post'],
      order: { like_id: 'DESC' },
    });
  }

  // ---------------- COUNT LIKES FOR A POST ----------------
  async countLikesByPost(post_id: number) {
    return this.likeRepo.count({ where: { post: { post_id } } });
  }

  // ---------------- GET ALL LIKES OF A POST (DETAILED) ----------------
  async findLikesByPostDetailed(post_id: number) {
    return this.likeRepo.find({
      where: { post: { post_id } },
      relations: ['user', 'post'],
      order: { like_id: 'DESC' },
    });
  }

  // ---------------- GET ALL LIKES BY A SPECIFIC USER ----------------
  async findLikesByUser(user_id: number) {
    return this.likeRepo.find({
      where: { user: { user_id } },
      relations: ['post'],
      order: { like_id: 'DESC' },
    });
  }

  // ---------------- GET ALL LIKES OF ALL POSTS BY AN AUTHOR ----------------
  async findLikesOfAuthor(author_id: number) {
    return this.likeRepo
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.user', 'user')
      .leftJoinAndSelect('like.post', 'post')
      .where('post.authorId = :author_id', { author_id })
      .orderBy('like.like_id', 'DESC')
      .getMany();
  }

  // ---------------- GET ALL LIKES OF A SPECIFIC POST BY AN AUTHOR ----------------
  async findLikesOfAuthorPost(author_id: number, post_id: number) {
    return this.likeRepo
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.user', 'user')
      .leftJoinAndSelect('like.post', 'post')
      .where('post.post_id = :post_id', { post_id })
      .andWhere('post.authorId = :author_id', { author_id })
      .orderBy('like.like_id', 'DESC')
      .getMany();
  }
}
