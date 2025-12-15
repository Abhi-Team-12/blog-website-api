import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@ApiTags('Comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  @UseGuards(RolesGuard)
  @Roles('reader', 'author')
  @ApiBearerAuth('JWT')
  @Post()
  async create(@Req() req: any, @Body() dto: CreateCommentDto) {
    const user = req.user;
    return await this.commentService.create(dto, user.user_id);
  }


  @Public()
  @Get('post/:post_id')
  async getByPost(@Param('post_id') post_id: string, @Query('page') page: string, @Query('limit') limit: string) {
    return await this.commentService.findByPost(+post_id, Number(page) || 1, Number(limit) || 10);
  }

  @UseGuards(RolesGuard)
  @Roles('reader')
  @ApiBearerAuth('JWT')
  @Get('reader/me')
  async getReaderComments(@Req() req: any, @Query('page') page: string, @Query('limit') limit: string) {
    return await this.commentService.getUserComments(req.user.user_id, Number(page) || 1, Number(limit) || 10);
  }

  @UseGuards(RolesGuard)
  @Roles('author')
  @ApiBearerAuth('JWT')
  @Get('author/me')
  async getAuthorComments(@Req() req: any, @Query('page') page: string, @Query('limit') limit: string) {
    return await this.commentService.getUserComments(req.user.user_id, Number(page) || 1, Number(limit) || 10);
  }

  @UseGuards(RolesGuard)
  @Roles('author')
  @ApiBearerAuth('JWT')
  @Get('author/me/:post_id')
  async getAuthorCommentsForPost(@Req() req: any, @Param('post_id') post_id: string, @Query('page') page: string, @Query('limit') limit: string) {
    return await this.commentService.getAuthorCommentsForPost(req.user.user_id, +post_id, Number(page) || 1, Number(limit) || 10);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Get('admin/all')
  async getAllCommentsAdmin(@Query('page') page: string, @Query('limit') limit: string) {
    return await this.commentService.getAllCommentsAdmin(Number(page) || 1, Number(limit) || 10);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Get('admin/user/:user_id')
  async getUserCommentsAdmin(@Param('user_id') user_id: string, @Query('page') page: string, @Query('limit') limit: string) {
    return await this.commentService.getCommentsByUserAdmin(+user_id, Number(page) || 1, Number(limit) || 10);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Get('admin/post/:post_id')
  async getPostCommentsAdmin(@Param('post_id') post_id: string, @Query('page') page: string, @Query('limit') limit: string) {
    return await this.commentService.getCommentsByPostAdmin(+post_id, Number(page) || 1, Number(limit) || 10);
  }

  @UseGuards(RolesGuard)
  @Roles('author')
  @ApiBearerAuth('JWT')
  @Patch('author/soft-delete/:id')
  async softDeleteAuthor(@Param('id') id: string, @Req() req: any) {
    return await this.commentService.softDeleteComment(+id, req.user.user_id, req.user.role);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Patch('admin/soft-delete/:id')
  async softDeleteAdmin(@Param('id') id: string, @Req() req: any) {
    return await this.commentService.softDeleteComment(+id, req.user.user_id, req.user.role);
  }
}
