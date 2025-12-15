import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from 'src/entities/tags.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { HelperService } from 'src/common/helper';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class TagsService extends HelperService {
  protected readonly tagRepo: Repository<Tag>; // change private → protected

  constructor(
    @InjectRepository(Tag) tagRepo: Repository<Tag>,
    jwtService: JwtService,
    mailerService: MailerService,
  ) {
    super(null as any, jwtService, mailerService, undefined, tagRepo); // pass tagRepo to base class
    this.tagRepo = tagRepo;
  }

  // ======= CRUD =======
  async create(dto: CreateTagDto) {
    await this.validateAndCheckTagDuplicate(dto.name, dto.slug);
    const tag = await this.tagRepo.save({ ...dto, name: dto.name.trim(), slug: dto.slug.trim() });
    return this.response(true, 'Tag added successfully', tag);
  }

  async findAll(
    page = 1,
    limit = 10,
    order: 'ASC' | 'DESC' = 'DESC',
    keywords?: string,
    onlyActive = false,
  ) {
    const query = this.tagRepo.createQueryBuilder('tag');

    // 🔍 Search by name or slug
    if (keywords?.trim()) {
      query.where(
        '(LOWER(tag.name) LIKE :keywords OR LOWER(tag.slug) LIKE :keywords)',
        { keywords: `%${keywords.trim().toLowerCase()}%` },
      );
    }

    // ✅ Show only active tags
    if (onlyActive) {
      if (keywords?.trim()) query.andWhere('tag.isActive = true');
      else query.where('tag.isActive = true');
    }

    // 📄 Pagination + Sorting
    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('tag.tag_id', order);

    const [data, total] = await query.getManyAndCount();

    if (total === 0) {
      return this.response(false, 'No tags found', []);
    }

    return this.response(true, 'Tags fetched successfully', {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async findOne(tag_id: number) {
    const tag = await this.findTagOrFail(tag_id);
    return this.response(true, 'Tag fetched successfully', tag);
  }

  async update(tag_id: number, dto: UpdateTagDto) {
    await this.findTagOrFail(tag_id);
    await this.validateAndCheckTagDuplicate(dto.name, dto.slug, tag_id);
    await this.tagRepo.update(tag_id, { ...dto, isActive: true, name: dto.name?.trim(), slug: dto.slug?.trim() });
    const updated = await this.findTagOrFail(tag_id);
    return this.response(true, `Tag ${tag_id} updated successfully`, updated);
  }
  // ==================== ADMIN SOFT DELETE ====================
  async softDeleteByAdmin(tag_id: number) {
    const post = await this.findTagOrFail(tag_id);

    await this.tagRepo.update(tag_id, { isActive: false });

    return this.response(true, `Admin soft deleted post ${tag_id} successfully.`);
  }
  // async remove(tag_id: number) {
  //   const tag = await this.findTagOrFail(tag_id);
  //   await this.tagRepo.delete(tag_id);
  //   return this.response(true, `Tag ${tag_id} deleted successfully`, tag);
  // }
}
