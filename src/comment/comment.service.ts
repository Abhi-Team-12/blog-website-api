import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Posts } from '../entities/posts.entity';
import { User } from '../entities/users.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(Posts)
    private readonly postRepository: Repository<Posts>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createCommentDto: CreateCommentDto, user_id: number) {
    const { post_id, content, parent_id } = createCommentDto;

    const user = await this.userRepository.findOne({ where: { user_id } });
    if (!user) throw new UnauthorizedException('User not found');

    const post = await this.postRepository.findOne({ where: { post_id } });
    if (!post) throw new NotFoundException('Post not found');

    if (parent_id) {
      const parentComment = await this.commentRepository.findOne({
        where: { comment_id: parent_id },
        relations: ['post'],
      });
      if (!parentComment) throw new NotFoundException('Parent comment not found');
      if (parentComment.post_id !== post_id)
        throw new BadRequestException('Parent comment does not belong to the specified post');
    }

    const newComment = this.commentRepository.create({
      content,
      post_id,
      user_id,
      parent_id: parent_id || null,
    });

    const savedComment = await this.commentRepository.save(newComment);

    return await this.commentRepository.findOne({
      where: { comment_id: savedComment.comment_id },
      relations: ['user', 'post', 'parent', 'replies'],
    });
  }

  
  async findByPost(post_id: number, page = 1, limit = 10) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { post_id, parent_id: IsNull(), isDeleted: false },
      relations: ['user', 'replies', 'replies.user'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { status: true, message: 'Comments fetched successfully', data: comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getUserComments(user_id: number, page = 1, limit = 10) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { user_id, isDeleted: false },
      relations: ['user', 'post', 'replies'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { status: true, message: 'User comments fetched successfully', data: comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getAuthorCommentsForPost(user_id: number, post_id: number, page = 1, limit = 10) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { user_id, post_id, isDeleted: false },
      relations: ['user', 'post', 'replies'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { status: true, message: 'Author comments fetched successfully', data: comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getAllCommentsAdmin(page = 1, limit = 10) {
    const [comments, total] = await this.commentRepository.findAndCount({
      relations: ['user', 'post', 'replies'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { status: true, message: 'All comments fetched successfully', data: comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getCommentsByUserAdmin(user_id: number, page = 1, limit = 10) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { user_id },
      relations: ['user', 'post', 'replies'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { status: true, message: 'User comments fetched successfully', data: comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getCommentsByPostAdmin(post_id: number, page = 1, limit = 10) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { post_id },
      relations: ['user', 'post', 'replies'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { status: true, message: 'Post comments fetched successfully', data: comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async softDeleteComment(id: number, user_id: number, user_role: string) {
    const comment = await this.commentRepository.findOne({ where: { comment_id: id } });
    if (!comment) throw new NotFoundException('Comment not found');

    if (user_role !== 'admin' && comment.user_id !== user_id) throw new ForbiddenException('Not allowed to delete this comment');

    comment.isDeleted = true;
    await this.commentRepository.save(comment);

    return { status: true, message: 'Comment soft-deleted successfully' };
  }
}
