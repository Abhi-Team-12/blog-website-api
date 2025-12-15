import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Public } from 'src/auth/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  // ---------------- PUBLIC ----------------
  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'User signup (Public)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Req() req: Request, @Res() res: Response) {
    const result = await this.usersService.create(req.body);
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Public()
  @Post('Request')
  @ApiOperation({ summary: 'Only for Author Request' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User (Author) created successfully' })
  async Request(@Req() req: Request, @Res() res: Response) {
    const result = await this.usersService.Request(req.body);
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP for signup (Public)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { token: { type: 'string' }, otp: { type: 'string' } },
    },
  })
  async verifyOtp(@Req() req: Request, @Res() res: Response) {
    const { token, otp } = req.body;
    const result = await this.usersService.verifyOtp(token, otp);
    return res.status(HttpStatus.OK).json(result);
  }

  @Public()
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP for signup (Public)' })
  @ApiBody({
    schema: { type: 'object', properties: { token: { type: 'string' } } },
  })
  async resendOtp(@Req() req: Request, @Res() res: Response) {
    const { token } = req.body;
    const result = await this.usersService.resendOtp(token);
    return res.status(HttpStatus.OK).json(result);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login (Public)' })
  @ApiBody({ type: LoginUserDto })
  async login(@Req() req: Request, @Res() res: Response) {
    const result = await this.usersService.login(req.body);
    return res.status(HttpStatus.OK).json(result);
  }

  @Public()
  @Post('login-verify-otp')
  @ApiOperation({ summary: 'Verify OTP for login (Public)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { token: { type: 'string' }, otp: { type: 'string' } },
    },
  })
  async verifyLoginOtp(@Req() req: Request, @Res() res: Response) {
    const { token, otp } = req.body;
    const result = await this.usersService.verifyLoginOtp(token, otp);
    return res.status(HttpStatus.OK).json(result);
  }

  @Public()
  @Post('login-otp-resend')
  @ApiOperation({ summary: 'Resend OTP for login (Public)' })
  @ApiBody({
    schema: { type: 'object', properties: { token: { type: 'string' } } },
  })
  async loginOtpResend(@Req() req: Request, @Res() res: Response) {
    const { token } = req.body;
    const result = await this.usersService.loginOtpResend(token);
    return res.status(HttpStatus.OK).json(result);
  }

  // ---------------- CHANGE PASSWORD ----------------
  @Post('change-password')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Change password (requires Bearer token)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { oldPassword: { type: 'string' }, newPassword: { type: 'string' } },
    },
  })
  async changePassword(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new UnauthorizedException('Token missing');

      const decoded: any = this.jwtService.verify(token);
      const { oldPassword, newPassword } = req.body;

      const result = await this.usersService.changePassword(decoded.user_id, oldPassword, newPassword);
      return res.status(result.status ? 200 : 400).json(result);
    } catch {
      return res.status(401).json({ status: false, message: 'Invalid or expired token' });
    }
  }

  // ---------------- FORGOT PASSWORD ----------------
  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  @ApiBody({
    schema: { type: 'object', properties: { email: { type: 'string' } } },
  })
  async forgotPassword(@Req() req: Request, @Res() res: Response) {
    const { email } = req.body;
    const result = await this.usersService.forgetPassword(email);
    return res.status(result.status ? 200 : 400).json(result);
  }

  @Public()
  @Post('verify-forgot-password')
  @ApiOperation({ summary: 'Verify OTP and reset password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { token: { type: 'string' }, otp: { type: 'string' }, newPassword: { type: 'string' } },
    },
  })
  async verifyForgotPassword(@Req() req: Request, @Res() res: Response) {
    const { token, otp, newPassword } = req.body;
    const result = await this.usersService.verifyForgetPasswordOtp(token, otp, newPassword);
    return res.status(result.status ? 200 : 400).json(result);
  }

  @Public()
  @Post('forgot-password-resend')
  @ApiOperation({ summary: 'Resend OTP for password reset' })
  @ApiBody({
    schema: { type: 'object', properties: { token: { type: 'string' } } },
  })
  async forgotPasswordResend(@Req() req: Request, @Res() res: Response) {
    const { token } = req.body;
    const result = await this.usersService.resendForgetPasswordOtp(token);
    return res.status(result.status ? 200 : 400).json(result);
  }

  // ---------------- ADMIN PROTECTED ----------------
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Get('all')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Enter Number of Page' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Enter Limit of Page' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'keywords', required: false, type: String })
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
    @Query('keywords') keywords: string,
    @Res() res: Response,
  ) {
    const result = await this.usersService.findAll(Number(page) || 1, Number(limit) || 10, order, keywords);
    return res.status(HttpStatus.OK).json(result);
  }

  // @UseGuards(RolesGuard)
  // @Roles('admin')
  // @ApiBearerAuth('JWT')
  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a user by ID (Admin only)' })
  // @ApiParam({ name: 'id', type: Number })
  // async remove(@Param('id') id: string, @Res() res: Response) {
  //   const result = await this.usersService.remove(+id);
  //   return res.status(HttpStatus.OK).json(result);
  // }

  // ==================== GET Details OWN USER (Author/Reader/Admin) ====================
  @UseGuards(RolesGuard)
  @Roles('author', 'reader', 'admin')
  @ApiBearerAuth('JWT')
  @Get('me')
  @ApiOperation({
    summary: 'Get own profile (Admin/Reader/Author)',
    description: 'Fetch logged-in user profile using token.',
  })
  async getOwnProfile(@Req() req: Request, @Res() res: Response) {
    const loggedInUser = req.user as any;
    const result = await this.usersService.findOne(loggedInUser.user_id);
    return res.status(HttpStatus.OK).json(result);
  }

  // ==================== GET ANY USER BY ID (Admin only) ====================
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Get(':id')
  @ApiOperation({
    summary: 'Get any user by ID (Admin only)',
    description: 'Admin can fetch any user details using user_id.',
  })
  @ApiParam({ name: 'id', type: Number })
  async findOneById(@Param('id') id: string, @Res() res: Response) {
    const result = await this.usersService.findOne(+id);
    return res.status(HttpStatus.OK).json(result);
  }

  // ==================== UPDATE OWN PROFILE ====================
  @UseGuards(RolesGuard)
  @Roles('author', 'reader', 'admin')
  @ApiBearerAuth('JWT')
  @Patch('me')
  @ApiOperation({
    summary: 'Update own profile (Admin/Reader/Author)',
    description: 'Reader/Author can update their own profile via token.',
  })
  @ApiBody({ type: UpdateUserDto })
  async updateOwn(@Req() req: Request, @Res() res: Response) {
    const loggedInUser = req.user as any;
    const result = await this.usersService.update(loggedInUser.user_id, req.body);
    return res.status(HttpStatus.OK).json(result);
  }

  // ==================== UPDATE ANY USER BY ID (Admin only) ====================
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update any user by ID (Admin only)',
    description: 'Only admin can update any user using their ID.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateUserDto })
  async updateById(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const result = await this.usersService.update(+id, req.body);
    return res.status(HttpStatus.OK).json(result);
  }

  // ==================== ADMIN SOFT DELETE ====================
  @Patch('delete/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: Soft delete any user' })
  @ApiParam({ name: 'id', example: 1, description: 'Enter User ID' })
  @ApiResponse({ status: 200, description: 'User soft deleted successfully' })
  async softDeleteByAdmin(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.usersService.softDeleteByAdmin(+id);
    return res.status(200).json(result);
  }

}

