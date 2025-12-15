import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Public } from 'src/auth/public.decorator';

@ApiTags('Categories')
@UseGuards(RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post('')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Add  a new category (Admin Only)' })
  @ApiResponse({ status: 201, description: 'Category successfully created' })
  @ApiBody({ type: CreateCategoryDto })
  async create(@Body() createCategoryDto: CreateCategoryDto, @Res() res: Response) {
    const result = await this.categoriesService.create(createCategoryDto);
    return res.status(201).json(result);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update a category by ID (Admin Only)' })
  @ApiParam({ name: 'id', description: 'Category ID', example: 1 })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Category successfully updated' })
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @Res() res: Response) {
    const result = await this.categoriesService.update(+id, updateCategoryDto);
    return res.status(200).json(result);
  }

  // @Delete(':id')
  // @Roles('admin')
  // @ApiBearerAuth('JWT')
  // @ApiOperation({ summary: 'Delete a category by ID (Admin Only)' })
  // @ApiParam({ name: 'id', description: 'Category ID', example: 1 })
  // @ApiResponse({ status: 200, description: 'Category successfully deleted' })
  // async remove(@Param('id') id: string, @Res() res: Response) {
  //   const result = await this.categoriesService.remove(+id);
  //   return res.status(200).json(result);
  // }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories (Public)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  @ApiQuery({ name: 'keywords', required: false, description: 'Search keywords in name/slug' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of categories' })
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
    @Query('keywords') keywords: string,
    @Res() res: Response,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // Only show active categories to public
    const result = await this.categoriesService.findAll(pageNum, limitNum, order, keywords, true);

    return res.status(200).json(result);
  }


  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single category by ID (Admin & Author)' })
  @ApiParam({ name: 'id', description: 'Category ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns a single category' })
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const result = await this.categoriesService.findOne(+id);
    return res.status(200).json(result);
  }
  // ==================== ADMIN SOFT DELETE ====================
  @Patch('delete/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: Soft delete any Category' })
  @ApiParam({ name: 'id', example: 1, description: 'Enter Category ID' })
  @ApiResponse({ status: 200, description: 'Category soft deleted successfully' })
  async softDeleteByAdmin(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.categoriesService.softDeleteByAdmin(+id);
    return res.status(200).json(result);
  }
}
