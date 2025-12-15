import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LikeService } from './like.service';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Likes')
@Controller('likes')
export class LikeController {
  constructor(
    private readonly likeService: LikeService,
    private readonly jwtService: JwtService,
  ) {}

  private getUserFromToken(req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Token missing');
    return this.jwtService.verify(token);
  }

  // ---------------- TOGGLE LIKE / UNLIKE ----------------
  @UseGuards(RolesGuard)
  @Roles('reader', 'author')
  @ApiBearerAuth('JWT')
  @Post('toggle/:post_id')
  @ApiOperation({ summary: 'Toggle like/unlike on a post (Reader/Author)' })
  async toggleLike(@Param('post_id') post_id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const decoded: any = this.getUserFromToken(req);
      const result = await this.likeService.toggleLike(decoded.user_id, +post_id);
      return res.status(HttpStatus.OK).json(result);
    } catch {
      return res.status(401).json({ status: false, message: 'Invalid or expired token' });
    }
  }

  // ---------------- PUBLIC: GET ALL LIKES OF SPECIFIC POST ----------------
  @Get(':post_id')
  @ApiOperation({ summary: 'Get all likes of specific post (Public)' })
  async getLikesByPost(@Param('post_id') post_id: string, @Res() res: Response) {
    const likes = await this.likeService.findLikesByPostDetailed(+post_id);
    return res.status(HttpStatus.OK).json(likes);
  }

  // ---------------- READER: GET ALL LIKED POSTS ----------------
  @UseGuards(RolesGuard)
  @Roles('reader')
  @ApiBearerAuth('JWT')
  @Get('reader/me')
  @ApiOperation({ summary: 'Get all liked posts by logged-in reader' })
  async getReaderLikes(@Req() req: Request, @Res() res: Response) {
    const decoded: any = this.getUserFromToken(req);
    const likes = await this.likeService.findLikesByUser(decoded.user_id);
    return res.status(HttpStatus.OK).json(likes);
  }

  // ---------------- AUTHOR: ALL LIKES ON AUTHOR'S POSTS ----------------
  @UseGuards(RolesGuard)
  @Roles('author')
  @ApiBearerAuth('JWT')
  @Get('author/me')
  @ApiOperation({ summary: 'Get all likes of all posts by logged-in author' })
  async getAuthorLikes(@Req() req: Request, @Res() res: Response) {
    const decoded: any = this.getUserFromToken(req);
    const likes = await this.likeService.findLikesOfAuthor(decoded.user_id);
    return res.status(HttpStatus.OK).json(likes);
  }

  // ---------------- AUTHOR: LIKES OF SPECIFIC POST ----------------
  @UseGuards(RolesGuard)
  @Roles('author')
  @ApiBearerAuth('JWT')
  @Get('author/me/:post_id')
  @ApiOperation({ summary: 'Get all likes of a specific post by the logged-in author' })
  async getAuthorPostLikes(
    @Param('post_id') post_id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const decoded: any = this.getUserFromToken(req);
    const likes = await this.likeService.findLikesOfAuthorPost(decoded.user_id, +post_id);
    return res.status(HttpStatus.OK).json(likes);
  }

  // ---------------- ADMIN: ALL LIKES ----------------
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Get('admin/all')
  @ApiOperation({ summary: 'Get all likes (Admin only)' })
  async getAllLikes(@Res() res: Response) {
    const likes = await this.likeService.findAll();
    return res.status(HttpStatus.OK).json(likes);
  }

  // ---------------- ADMIN: LIKES BY AUTHOR ----------------
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Get('admin/user/:user_id')
  @ApiOperation({ summary: 'Get all likes of a specific author’s posts (Admin)' })
  async getLikesByAuthor(@Param('user_id') user_id: string, @Res() res: Response) {
    const likes = await this.likeService.findLikesOfAuthor(+user_id);
    return res.status(HttpStatus.OK).json(likes);
  }

  // ---------------- ADMIN: LIKES BY POST ----------------
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Get('admin/post/:post_id')
  @ApiOperation({ summary: 'Get all likes of a specific post (Admin)' })
  async getAdminPostLikes(@Param('post_id') post_id: string, @Res() res: Response) {
    const likes = await this.likeService.findLikesByPostDetailed(+post_id);
    return res.status(HttpStatus.OK).json(likes);
  }
}
