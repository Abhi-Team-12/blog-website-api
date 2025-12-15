import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Posts } from 'src/entities/posts.entity';
import { User } from 'src/entities/users.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HelperService } from 'src/common/helper';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class PostsService extends HelperService {
  constructor(
    @InjectRepository(Posts)
    private readonly postRepository: Repository<Posts>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    jwtService: JwtService,
    mailerService: MailerService,
  ) {
    super(null as any, jwtService, mailerService, postRepository);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.processScheduledPosts();
  }

  async create(createPostDto: CreatePostDto, user_id: number) {
    if (!user_id) throw new BadRequestException('User ID is required');

    const userExists = await this.userRepository.findOne({ where: { user_id } });
    if (!userExists) throw new BadRequestException('User does not exist');

    await this.validatePostDuplicate(createPostDto.title, createPostDto.slug);

    let status: 'draft' | 'scheduled' | 'published' = 'published';
    let isActive = true;
    let approved = false;
    let scheduled_at = createPostDto.scheduled_at ?? null;

    if (scheduled_at) {
      const scheduledTime = new Date(scheduled_at);
      if (scheduledTime > new Date()) {
        status = 'scheduled';
        isActive = true;
      } else scheduled_at = null;
    } else if (createPostDto.status === 'draft') {
      status = 'draft';
      isActive = true;
    }

    const post = await this.postRepository.save({
      ...createPostDto,
      title: createPostDto.title.trim(),
      slug: createPostDto.slug.trim(),
      user_id,
      status,
      isActive,
      approved,
      scheduled_at,
    });

    return this.response(true, 'Post created successfully.', post);
  }

  async findAllFiltered(filters: any, page = 1, limit = 10, order: 'ASC' | 'DESC' = 'DESC', onlyActive = false) {
    await this.processScheduledPosts();

    const query = this.postRepository.createQueryBuilder('post');

    if (filters.keywords) {
      query.andWhere('(LOWER(post.title) LIKE :kw OR LOWER(post.content) LIKE :kw)', { kw: `%${filters.keywords.toLowerCase()}%` });
    }
    if (filters.status) query.andWhere('post.status = :status', { status: filters.status });
    if (filters.category_id) query.andWhere('post.category_id = :category_id', { category_id: filters.category_id });
    if (filters.user_id) query.andWhere('post.user_id = :user_id', { user_id: filters.user_id });
    if (onlyActive) query.andWhere('post.isActive = true AND post.approved = true');

    query.orderBy('post.post_id', order);
    query.skip((page - 1) * limit);
    query.take(limit);

    const posts = await query.getManyAndCount();
    return this.paginatePosts(Promise.resolve(posts), page, limit);
  }

  async findAllAdminFiltered(filters: any, page = 1, limit = 10, order: 'ASC' | 'DESC' = 'DESC', onlyActive = false) {
    await this.processScheduledPosts();

    const query = this.postRepository.createQueryBuilder('post');

    if (filters.keywords) {
      query.andWhere('(LOWER(post.title) LIKE :kw OR LOWER(post.content) LIKE :kw)', { kw: `%${filters.keywords.toLowerCase()}%` });
    }
    if (filters.status) query.andWhere('post.status = :status', { status: filters.status });
    if (filters.category_id) query.andWhere('post.category_id = :category_id', { category_id: filters.category_id });
    if (filters.user_id) query.andWhere('post.user_id = :user_id', { user_id: filters.user_id });
    if (onlyActive) query.andWhere('post.isActive = true');

    query.orderBy('post.post_id', order);
    query.skip((page - 1) * limit);
    query.take(limit);

    const posts = await query.getManyAndCount();
    return this.paginatePosts(Promise.resolve(posts), page, limit);
  }

  async findOne(post_id: number) {
    await this.processScheduledPosts();
    const post = await this.findPostOrFail(post_id);
    return this.response(true, 'Post fetched successfully.', post);
  }

  // =============== ADMIN UPDATE ANY POST ================
  // =============== ADMIN APPROVE POST ================
  async approvePostByAdmin(post_id: number) {
    const existingPost = await this.findPostOrFail(post_id);

    const updateData = {
      approved: true,          // click karte hi approve
      isActive: true,          // optional: post ko active bhi kar de
    };

    await this.postRepository.update(post_id, updateData);

    const updated = await this.findPostOrFail(post_id);
    return this.response(true, `Post ${post_id} approved successfully.`, updated);
  }

  // =============== AUTHOR UPDATE OWN POST ===============
  async updateByAuthor(post_id: number, updatePostDto: UpdatePostDto, authorId: number) {
    const existingPost = await this.findPostOrFail(post_id);

    // check ownership
    if (existingPost.user_id !== authorId) {
      throw new ForbiddenException('You can only update your own posts.');
    }

    await this.validatePostDuplicate(
      updatePostDto.title ?? existingPost.title,
      updatePostDto.slug ?? existingPost.slug,
      post_id,
      true,
    );

    let status = existingPost.status;
    let isActive = existingPost.isActive;
    let approved = existingPost.approved;

    if (updatePostDto.scheduled_at !== undefined) {
      const scheduledTime = new Date(updatePostDto.scheduled_at);
      const now = new Date();
      status = scheduledTime <= now ? 'published' : 'scheduled';
      isActive = status === 'published';
      approved = status === 'scheduled' ? false : approved;
    }

    const updateData: any = {
      title: updatePostDto.title?.trim() ?? existingPost.title,
      slug: updatePostDto.slug?.trim() ?? existingPost.slug,
      content: updatePostDto.content ?? existingPost.content,
      scheduled_at: updatePostDto.scheduled_at ?? existingPost.scheduled_at,
      status,
      isActive,
      approved,
    };

    await this.postRepository.update(post_id, updateData);
    const updated = await this.findPostOrFail(post_id);

    return this.response(true, `Author updated post ${post_id} successfully.`, updated);
  }
  // ==================== GET POST BY ADMIN ====================
  async getByAdmin(post_id: number) {
    const post = await this.findPostOrFail(post_id);
    return this.response(true, `Admin fetched post ${post_id} successfully.`, post);
  }

  // ==================== GET POST BY AUTHOR ====================
  async getByAuthor(post_id: number, authorId: number) {
    const post = await this.findPostOrFail(post_id);

    if (post.user_id !== authorId) {
      throw new ForbiddenException('You can only fetch your own posts.');
    }

    return this.response(true, `Author fetched post ${post_id} successfully.`, post);
  }

  // ==================== ADMIN SOFT DELETE ====================
  async softDeleteByAdmin(post_id: number) {
    const post = await this.findPostOrFail(post_id);

    await this.postRepository.update(post_id, { isActive: false });

    return this.response(true, `Admin soft deleted post ${post_id} successfully.`);
  }

  // ==================== AUTHOR SOFT DELETE ====================
  async softDeleteByAuthor(post_id: number, authorId: number) {
    const post = await this.findPostOrFail(post_id);

    if (post.user_id !== authorId) {
      throw new ForbiddenException('You can only delete your own posts.');
    }

    await this.postRepository.update(post_id, { isActive: false });

    return this.response(true, `Author soft deleted post ${post_id} successfully.`);
  }
  // async remove(post_id: number) {
  //   const post = await this.findPostOrFail(post_id);
  //   await this.postRepository.delete(post_id);
  //   return this.response(true, `Post ${post_id} deleted successfully.`, post);
  // }

  // -------------------- GET POSTS BY USER_ID --------------------
  async findAllBy(user_id: number, page = 1, limit = 10) {
    await this.processScheduledPosts();

    // ✅ Validate page & limit
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const [data, total] = await this.postRepository.findAndCount({
      where: { user_id },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      order: { post_id: 'DESC' },
    });

    return this.paginate(Promise.resolve([data, total]), pageNum, limitNum);
  }

  // -------------------- GET POSTS BY LOGGED-IN USER --------------------
  async findAllByMe(user_id: number, page = 1, limit = 10) {
    await this.processScheduledPosts();

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const [data, total] = await this.postRepository.findAndCount({
      where: { user_id, isActive: true },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      order: { post_id: 'DESC' },
    });

    return this.paginate(Promise.resolve([data, total]), pageNum, limitNum);
  }

  // -------------------- GET UNAPPROVED POSTS --------------------
  // async findAllUnapproved(page = 1, limit = 10) {
  //   await this.processScheduledPosts();

  //   const pageNum = Number(page) || 1;
  //   const limitNum = Number(limit) || 10;

  //   if (pageNum < 1 || limitNum < 1) {
  //     throw new BadRequestException('Invalid pagination parameters');
  //   }

  //   const [data, total] = await this.postRepository.findAndCount({
  //     where: { approved: false },
  //     skip: (pageNum - 1) * limitNum,
  //     take: limitNum,
  //     order: { post_id: 'DESC' },
  //   });

  //   return this.paginate(Promise.resolve([data, total]), pageNum, limitNum);
  // }

  // // -------------------- APPROVE POST --------------------
  // async approvePost(post_id: number) {
  //   const post = await this.postRepository.findOne({ where: { post_id } });
  //   if (!post) throw new NotFoundException(`Post ${post_id} not found`);

  //   if (post.status === 'scheduled' && post.scheduled_at) {
  //     const now = new Date();
  //     if (post.scheduled_at <= now) {
  //       post.status = 'published';
  //       post.isActive = true;
  //     }
  //   } else {
  //     post.status = 'published';
  //     post.isActive = true;
  //   }

  //   post.approved = true;
  //   await this.postRepository.save(post);
  //   return { success: true, message: `Post ${post_id} approved successfully`, post };
  // }
}
