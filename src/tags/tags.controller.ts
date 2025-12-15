import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Public } from 'src/auth/public.decorator';

@ApiTags('Tags')
@UseGuards(RolesGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) { }

  @Post()
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Add a new tag (Admin Only)' })
  @ApiResponse({ status: 201, description: 'Tag successfully created' })
  @ApiBody({ type: CreateTagDto })
  async create(@Body() dto: CreateTagDto, @Res() res: Response) {
    const result = await this.tagsService.create(dto);
    return res.status(201).json(result);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update a tag by ID (Admin Only)' })
  @ApiParam({ name: 'id', description: 'Tag ID', example: 1 })
  @ApiBody({ type: UpdateTagDto })
  @ApiResponse({ status: 200, description: 'Tag successfully updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto, @Res() res: Response) {
    const result = await this.tagsService.update(+id, dto);
    return res.status(200).json(result);
  }

  // @Delete(':id')
  // @Roles('admin')
  // @ApiBearerAuth('JWT')
  // @ApiOperation({ summary: 'Delete a tag by ID (Admin Only)' })
  // @ApiParam({ name: 'id', description: 'Tag ID', example: 1 })
  // @ApiResponse({ status: 200, description: 'Tag successfully deleted' })
  // async remove(@Param('id') id: string, @Res() res: Response) {
  //   const result = await this.tagsService.remove(+id);
  //   return res.status(200).json(result);
  // }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all tags (Public)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  @ApiQuery({ name: 'keywords', required: false, description: 'Search by name or slug' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of active tags' })
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
    @Query('keywords') keywords: string,
    @Res() res: Response,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // Only show active tags publicly
    const result = await this.tagsService.findAll(pageNum, limitNum, order, keywords, true);

    return res.status(200).json(result);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single tag by ID (Admin/Author/Reader)' })
  @ApiParam({ name: 'id', description: 'Tag ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns a single tag' })
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const result = await this.tagsService.findOne(+id);
    return res.status(200).json(result);
  }
  // ==================== ADMIN SOFT DELETE ====================
  @Patch('delete/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: Soft delete any Tag' })
  @ApiParam({ name: 'id', example: 1, description: 'Enter Tag ID' })
  @ApiResponse({ status: 200, description: 'Tag soft deleted successfully' })
  async softDeleteByAdmin(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.tagsService.softDeleteByAdmin(+id);
    return res.status(200).json(result);
  }

}
