import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from 'src/entities/categories.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { HelperService } from 'src/common/helper';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CategoriesService extends HelperService {
  protected readonly categoryRepo: Repository<Category>;

  constructor(
    @InjectRepository(Category) categoryRepo: Repository<Category>,
    jwtService: JwtService,
    mailerService: MailerService
  ) {
    super(null as any, jwtService, mailerService, undefined, undefined, categoryRepo);
    this.categoryRepo = categoryRepo;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    await this.validateAndCheckCategoryDuplicate(createCategoryDto.name, createCategoryDto.slug);
    const category = await this.categoryRepo.save({
      ...createCategoryDto,
      name: createCategoryDto.name.trim(),
      slug: createCategoryDto.slug.trim(),
    });
    return this.response(true, 'Category added successfully.', category);
  }

  async findAll(
    page = 1,
    limit = 10,
    order: 'ASC' | 'DESC' = 'DESC',
    keywords?: string,
    onlyActive = false,
  ) {
    const query = this.categoryRepo.createQueryBuilder('category');

    // Search by name or slug
    if (keywords?.trim()) {
      query.where(
        '(LOWER(category.name) LIKE :keywords OR LOWER(category.slug) LIKE :keywords)',
        { keywords: `%${keywords.trim().toLowerCase()}%` },
      );
    }

    // Show only active categories
    if (onlyActive) {
      if (keywords?.trim()) query.andWhere('category.isActive = true');
      else query.where('category.isActive = true');
    }

    // Pagination & Sorting
    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('category.category_id', order);

    const [data, total] = await query.getManyAndCount();

    if (total === 0) {
      return this.response(false, 'No categories found.', []);
    }

    return this.response(true, 'Categories fetched successfully.', {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async findOne(category_id: number) {
    const category = await this.findCategoryOrFail(category_id);
    return this.response(true, 'Category fetched successfully.', category);
  }

  async update(category_id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findCategoryOrFail(category_id);
    await this.validateAndCheckCategoryDuplicate(
      updateCategoryDto.name,
      updateCategoryDto.slug,
      category_id,
      true
    );

    await this.categoryRepo.update(category_id, {
      ...updateCategoryDto,
      name: updateCategoryDto.name?.trim(),
      slug: updateCategoryDto.slug?.trim(),
      isActive: true,
    });

    const updated = await this.findCategoryOrFail(category_id);
    return this.response(true, `Category ${category_id} updated successfully.`, updated);
  }
  // ==================== ADMIN SOFT DELETE ====================
  async softDeleteByAdmin(category_id: number) {
    const post = await this.findCategoryOrFail(category_id);

    await this.categoryRepo.update(category_id, { isActive: false });

    return this.response(true, `Admin soft deleted Category ${category_id} successfully.`);
  }

  // async remove(category_id: number) {
  //   const category = await this.findCategoryOrFail(category_id);
  //   await this.categoryRepo.delete(category_id);
  //   return this.response(true, `Category ${category_id} deleted successfully.`, category);
  // }
}
