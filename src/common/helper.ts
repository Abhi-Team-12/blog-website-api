import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { Repository, LessThanOrEqual } from 'typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { User } from 'src/entities/users.entity';
import { Posts } from 'src/entities/posts.entity';
import { Tag } from 'src/entities/tags.entity';
import { Category } from 'src/entities/categories.entity';

// -------------------- HELPER SERVICE --------------------
export class HelperService {
  constructor(
    protected readonly usersRepo: Repository<User>,
    protected readonly jwtService: JwtService,
    protected readonly mailerService: MailerService,
    protected readonly postRepo?: Repository<Posts>,
    protected readonly tagRepo?: Repository<Tag>,
    protected readonly categoryRepo?: Repository<Category>
  ) { }

  // ===================== COMMON RESPONSE =====================
  protected response(status: boolean, message: string, data: any = null) {
    return { status, message, data };
  }

  // ===================== PASSWORD HASHING =====================
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  // ===================== OTP GENERATION =====================
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateExpiry(minutes = 5): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  // ===================== JWT TOKEN =====================
  generateToken(user_id: number, role: string | null) {
    const token = this.jwtService.sign({ user_id, role }, { expiresIn: '1h' });
    return { token };
  }

  // ===================== EMAIL =====================
  async sendOTPEmail(email: string, otp: string, subject: string): Promise<void> {
    await this.mailerService.sendMail({
      from: '"Abhishek Singh" <abhi@appworks.com>',
      to: email,
      subject,
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });
  }

  // ===================== SANITIZE USER =====================
  sanitizeUser(user: any) {
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  }

  sanitizeUsers(users: any[]) {
    return users.map(u => this.sanitizeUser(u));
  }

  // ===================== USER FIND =====================
  async findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email },
      select: ['user_id', 'email', 'name', 'contact', 'password', 'role'],
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { user_id: id } });
  }

  async findUserOrFail(user_id: number): Promise<User> {
    const user = await this.findUserById(user_id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ===================== USER VALIDATION =====================
  async validateUserData(dto: CreateUserDto | UpdateUserDto, isUpdate = false): Promise<void> {
    if (!isUpdate) {
      if (!dto.email?.trim()) throw new BadRequestException('Email is required');
      if (!dto.password?.toString().trim()) throw new BadRequestException('Password is required');

      const exists = await this.usersRepo.findOne({ where: { email: dto.email.trim() } });
      if (exists) throw new UnauthorizedException('Email already in use');
    } else {
      if (dto.password && !dto.password.toString().trim())
        throw new BadRequestException('Password cannot be empty if provided');
    }
  }

  // -------------------- PAGINATION HELPER --------------------
  async paginate<T>(
    query: Promise<[T[], number]>,
    page = 1,
    limit = 10,
    message = 'Records fetched successfully',
  ) {
    const [data, total] = await query;

    return {
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===================== POST HELPERS =====================
  protected async findPostOrFail(post_id: number) {
    const post = await this.postRepo!.findOne({ where: { post_id } });
    if (!post) throw new NotFoundException(`Post with id ${post_id} not found`);
    return post;
  }

  protected async validatePostDuplicate(
    title?: string,
    slug?: string,
    excludeId?: number,
    isUpdate: boolean = false,
  ) {
    if (!isUpdate) {
      if (!title?.trim()) throw new BadRequestException('Post title is required.');
      if (!slug?.trim()) throw new BadRequestException('Post slug is required.');
    }

    const query = this.postRepo!.createQueryBuilder('post');
    const conditions: string[] = [];

    if (title?.trim()) conditions.push(`LOWER(TRIM(post.title)) = :title`);
    if (slug?.trim()) conditions.push(`LOWER(TRIM(post.slug)) = :slug`);
    if (!conditions.length) return;

    query.where(conditions.join(' OR '), { title: title?.trim().toLowerCase(), slug: slug?.trim().toLowerCase() });
    if (excludeId) query.andWhere('post.post_id != :excludeId', { excludeId });

    const exists = await query.getOne();
    if (!exists) return;

    if (title && exists.title.trim().toLowerCase() === title.trim().toLowerCase())
      throw new UnauthorizedException('Post title already exists.');
    if (slug && exists.slug.trim().toLowerCase() === slug.trim().toLowerCase())
      throw new UnauthorizedException('Post slug already exists.');
  }

  protected async processScheduledPosts() {
    const now = new Date();
    const scheduledPosts = await this.postRepo!.find({
      where: { status: 'scheduled' as any, scheduled_at: LessThanOrEqual(now), isActive: false },
    });

    for (const post of scheduledPosts) {
      post.status = 'published';
      post.isActive = true;
      post.approved = false;
      post.scheduled_at = null;
      await this.postRepo!.save(post);
    }
  }

  protected async paginatePosts(queryPromise: Promise<[Posts[], number]>, page: number, limit: number) {
    const [data, total] = await queryPromise;
    if (total === 0) return this.response(false, 'No records found.', []);
    return this.response(true, 'Records fetched successfully.', {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  }

  // ===================== TAG HELPERS =====================
  protected async findTagOrFail(tag_id: number) {
    const tag = await this.tagRepo!.findOneBy({ tag_id });
    if (!tag) throw new NotFoundException(`Tag with id ${tag_id} not found`);
    return tag;
  }

  protected async validateAndCheckTagDuplicate(name?: string, slug?: string, excludeId?: number) {
    if (!name || !name.trim()) throw new BadRequestException('Tag name is required.');
    if (!slug || !slug.trim()) throw new BadRequestException('Tag slug is required.');

    const query = this.tagRepo!.createQueryBuilder('tag')
      .where('LOWER(TRIM(tag.name)) = :name', { name: name.trim().toLowerCase() })
      .orWhere('LOWER(TRIM(tag.slug)) = :slug', { slug: slug.trim().toLowerCase() });

    if (excludeId) query.andWhere('tag.tag_id != :excludeId', { excludeId });

    const exists = await query.getOne();
    if (exists) throw new UnauthorizedException('This tag name or slug is already used.');
  }

  // ===================== CATEGORY HELPERS =====================
  protected async findCategoryOrFail(category_id: number) {
    const category = await this.categoryRepo!.findOneBy({ category_id });
    if (!category) throw new NotFoundException(`Category with id ${category_id} not found`);
    return category;
  }

  protected async validateAndCheckCategoryDuplicate(
    name?: string,
    slug?: string,
    excludeId?: number,
    isUpdate: boolean = false
  ) {
    if (!isUpdate) {
      if (!name?.trim()) throw new BadRequestException('Category name is required.');
      if (!slug?.trim()) throw new BadRequestException('Category slug is required.');
    }

    const query = this.categoryRepo!.createQueryBuilder('category');

    if (name?.trim()) query.where('LOWER(TRIM(category.name)) = :name', { name: name.trim().toLowerCase() });
    if (slug?.trim()) {
      if (query.getSql()) query.orWhere('LOWER(TRIM(category.slug)) = :slug', { slug: slug.trim().toLowerCase() });
      else query.where('LOWER(TRIM(category.slug)) = :slug', { slug: slug.trim().toLowerCase() });
    }
    if (excludeId) query.andWhere('category.category_id != :excludeId', { excludeId });

    const exists = await query.getOne();
    if (exists) {
      if (name && exists.name.trim().toLowerCase() === name.trim().toLowerCase())
        throw new UnauthorizedException('Category name already exists.');
      if (slug && exists.slug.trim().toLowerCase() === slug.trim().toLowerCase())
        throw new UnauthorizedException('Category slug already exists.');
    }
  }
}
