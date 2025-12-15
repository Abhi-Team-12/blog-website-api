import {
  Controller, Get, Post, Body, Patch, Param,
  UseInterceptors,
  UploadedFile, Query, UseGuards, Res, Req,
  UnauthorizedException, BadRequestException
} from '@nestjs/common';
import type { Response } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Public } from 'src/auth/public.decorator';
import { GetUser } from 'src/auth/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  // -------------------- PROTECTED: CREATE POST --------------------
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @Post()
  @Roles('admin', 'author')
  @ApiOperation({ summary: 'Create a new post (Admin/Author)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/posts',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `post-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  @ApiBody({
    description: 'Form data for creating a post',
    type: CreatePostDto,
  })
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    if (!user || !user.user_id) {
      return res
        .status(401)
        .json({ status: false, message: 'Invalid token or user not found' });
    }

    try {
      const imagePath = file ? `/uploads/posts/${file.filename}` : null;
      const result = await this.postsService.create(
        { ...createPostDto, image: imagePath },
        user.user_id,
      );
      return res.status(201).json(result);
    } catch (error) {
      return res
        .status(error.status || 400)
        .json({ status: false, message: error.message || 'Failed to create post' });
    }
  }

  // -------------------- PUBLIC: Active & Published POSTS --------------------
  @Public()
  @Get('all')
  @ApiOperation({ summary: 'Get all active & published posts (Public)' })
  @ApiQuery({ name: 'keywords', required: false, description: 'Search keywords in title or content' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by post status' })
  @ApiQuery({ name: 'category_id', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'user_id', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', example: 10 })
  @ApiQuery({ name: 'order', required: false, description: 'Order ASC/DESC', example: 'DESC' })
  @ApiResponse({ status: 200, description: 'Active posts fetched successfully' })
  async findActive(
    @Query('keywords') keywords: string,
    @Query('status') status: string,
    @Query('category_id') category_id: string,
    @Query('user_id') user_id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('order') order: 'ASC' | 'DESC',
    @Res() res: Response
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const orderType = order || 'DESC';

    const filters = {
      keywords,
      status,
      category_id: category_id ? Number(category_id) : undefined,
      user_id: user_id ? Number(user_id) : undefined,
    };

    const result = await this.postsService.findAllFiltered(filters, pageNum, limitNum, orderType, true);
    return res.status(200).json(result);
  }


  // -------------------- PUBLIC: SINGLE POST --------------------
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID (Public)' })
  @ApiParam({ name: 'id', description: 'ID of the post', example: 1 })
  @ApiResponse({ status: 200, description: 'Post fetched successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const result = await this.postsService.findOne(+id);
    return res.status(200).json(result);
  }

  // -------------------- Admin: All POSTS --------------------
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @Get("admin")
  @Roles('admin')
  @ApiOperation({ summary: 'Get all posts (Admin)' })
  @ApiQuery({ name: 'keywords', required: false, description: 'Search keywords in title or content' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by post status' })
  @ApiQuery({ name: 'category_id', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'user_id', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', example: 10 })
  @ApiQuery({ name: 'order', required: false, description: 'Order ASC/DESC', example: 'DESC' })
  @ApiResponse({ status: 200, description: 'Active posts fetched successfully' })
  async findAll(
    @Query('keywords') keywords: string,
    @Query('status') status: string,
    @Query('category_id') category_id: string,
    @Query('user_id') user_id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('order') order: 'ASC' | 'DESC',
    @Res() res: Response
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const orderType = order || 'DESC';

    const filters = {
      keywords,
      status,
      category_id: category_id ? Number(category_id) : undefined,
      user_id: user_id ? Number(user_id) : undefined,
    };

    const result = await this.postsService.findAllAdminFiltered(filters, pageNum, limitNum, orderType);
    return res.status(200).json(result);
  }
  // ADMIN: GET POSTS BY ANY USER ID
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @Get(':user_id')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Get posts by any user_id' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findByUserId(
    @Param('user_id') user_id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    if (!user_id || isNaN(Number(user_id))) {
      throw new BadRequestException('Invalid user_id parameter');
    }

    return this.postsService.findAllBy(Number(user_id), pageNum, limitNum);
  }

  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @Patch('admin/approve/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Approve post instantly' })
  @ApiParam({ name: 'id', example: 1, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post approved successfully' })
  async approvePostByAdmin(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.postsService.approvePostByAdmin(+id);
    return res.status(200).json(result);
  }

  // ==================== GET POST BY ADMIN ====================
  @Get('admin/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: Get any post by ID' })
  @ApiParam({ name: 'id', example: 1, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post fetched successfully' })
  async getByAdmin(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.postsService.getByAdmin(+id);
    return res.status(200).json(result);
  }

  // ==================== ADMIN SOFT DELETE ====================
  @Patch('admin/delete/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: Soft delete any post' })
  @ApiParam({ name: 'id', example: 1, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post soft deleted successfully' })
  async softDeleteByAdmin(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.postsService.softDeleteByAdmin(+id);
    return res.status(200).json(result);
  }


  // -------------------- GET OWN POSTS --------------------
  @UseGuards(RolesGuard) // or JwtAuthGuard + RolesGuard
  @ApiBearerAuth('JWT')
  @Get('me')
  @Roles('admin', 'author') // both roles can access
  @ApiOperation({ summary: 'Get own posts using token user_id' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findMyPosts(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Get user_id from token
    const user = req['user'] as { user_id: number; role: string };

    if (!user || !user.user_id) {
      throw new UnauthorizedException('Invalid or missing user in token');
    }

    // Safe pagination
    const pageNum = !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const limitNum = !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;

    // Call service with token's user_id
    return this.postsService.findAllByMe(user.user_id, pageNum, limitNum);
  }


  // -------- Author Update Own Post --------
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @Patch('me/:id')
  @Roles('author')
  @ApiOperation({ summary: 'Author: Update only own post' })
  @ApiParam({ name: 'id', example: 1, description: 'Post ID' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  async updateByAuthor(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Req() req,
    @Res() res: Response,
  ) {
    const result = await this.postsService.updateByAuthor(+id, dto, req.user.id);
    return res.status(200).json(result);
  }

  // ==================== GET POST BY AUTHOR ====================
  @Get('me/:id')
  @Roles('author')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Author: Get only own post by ID' })
  @ApiParam({ name: 'id', example: 1, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post fetched successfully' })
  async getByAuthor(
    @Param('id') id: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const result = await this.postsService.getByAuthor(+id, req.user.id);
    return res.status(200).json(result);
  }
  // ==================== AUTHOR SOFT DELETE ====================
  @Patch('me/delete/:id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('author')
  @ApiOperation({ summary: 'Author: Soft delete own post' })
  @ApiParam({ name: 'id', example: 1, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post soft deleted successfully' })
  async softDeleteByAuthor(
    @Param('id') id: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const result = await this.postsService.softDeleteByAuthor(+id, req.user.id);
    return res.status(200).json(result);
  }
  // -------------------- PROTECTED: DELETE POST --------------------
  // @UseGuards(RolesGuard)
  // @ApiBearerAuth('JWT')
  // @Delete(':id')
  // @Roles('admin', 'author')
  // @ApiOperation({ summary: 'Delete a post (Admin/Author)' })
  // @ApiParam({ name: 'id', description: 'ID of the post', example: 1 })
  // @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  // @ApiResponse({ status: 404, description: 'Post not found' })
  // async remove(@Param('id') id: string, @Res() res: Response) {
  //   const result = await this.postsService.remove(+id);
  //   return res.status(200).json(result);
  // }


  // ADMIN: GET UNAPPROVED POSTS
  // @UseGuards(RolesGuard)
  // @ApiBearerAuth('JWT')
  // @Get('unapproved')
  // @Roles('admin')
  // @ApiOperation({ summary: 'Admin: Get all unapproved posts' })
  // @ApiQuery({ name: 'page', required: false, example: 1 })
  // @ApiQuery({ name: 'limit', required: false, example: 10 })
  // async findUnapproved(
  //   @Query('page') page?: string,
  //   @Query('limit') limit?: string,
  // ) {
  //   const pageNum = Number(page) || 1;
  //   const limitNum = Number(limit) || 10;

  //   if (pageNum < 1 || limitNum < 1) {
  //     throw new BadRequestException('Invalid pagination parameters');
  //   }

  //   return this.postsService.findAllUnapproved(pageNum, limitNum);
  // }
  // // -------------------- APPROVE POST (ADMIN ONLY) --------------------
  // @UseGuards(RolesGuard)
  // @ApiBearerAuth('JWT')
  // @Roles('admin')
  // @Post('approve/:id')
  // @ApiParam({ name: 'id', description: 'Post ID' })
  // @ApiOperation({ summary: 'Approve a post (Admin only)' })
  // async approvePost(@Param('id') id: string, @Res() res: Response) {
  //   const postId = id && !isNaN(Number(id)) ? Number(id) : null;
  //   if (!postId) return res.status(400).json({ success: false, message: 'Invalid post ID' });

  //   const result = await this.postsService.approvePost(postId);
  //   return res.status(200).json(result);
  // }
}
