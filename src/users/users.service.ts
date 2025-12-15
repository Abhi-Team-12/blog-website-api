import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { register_user } from 'src/entities/register-users.entity';
import { User } from 'src/entities/users.entity';
import { OTP_Logs } from 'src/entities/otp_logs.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { HelperService } from 'src/common/helper';
@Injectable()
export class UsersService extends HelperService {
  private otpStore: Record<string, { otp: string; expires: Date }> = {};
  private readonly registerRepo: Repository<register_user>;
  private readonly otpLogsRepo: Repository<OTP_Logs>;

  constructor(
    @InjectRepository(register_user) registerRepo: Repository<register_user>,
    @InjectRepository(User) usersRepo: Repository<User>,
    @InjectRepository(OTP_Logs) otpLogsRepo: Repository<OTP_Logs>,
    jwtService: JwtService,
    mailerService: MailerService,
  ) {
    super(usersRepo, jwtService, mailerService);
    this.registerRepo = registerRepo;
    this.otpLogsRepo = otpLogsRepo;
  }
  // ================= Registration =================
  async create(dto: CreateUserDto) {
    await this.validateUserData(dto);

    const password = await this.hashPassword(dto.password.toString());
    const otp = this.generateOTP();
    const otpExpiry = this.generateExpiry();

    const user = await this.registerRepo.save({
      ...dto,
      password,
      otp,
      role: "reader",
      Request: "Accepted",
      Status: "Active",
      otpExpiresAt: otpExpiry,
      isVerified: false,
    });

    await this.otpLogsRepo.save({
      user_id: user.register_id,
      name: user.name,
      email: user.email,
      contact: user.contact,
      otp,
    });

    await this.sendOTPEmail(user.email, otp, "Account Verification OTP");

    const { token } = this.generateToken(user.register_id, user.role);
    return this.response(true, "OTP sent successfully", {
      token,
      user: this.sanitizeUser(user),
    });
  }

  // ================= Author Request Registration =================
  async Request(dto: CreateUserDto) {
    await this.validateUserData(dto);

    const AuthorRequest = await this.usersRepo.findOne({
      where: { email: dto.email },
    });

    // Check if author already exists or requested
    if (AuthorRequest && ["Accepted", "Pending"].includes(AuthorRequest.Request)) {
      return this.response(false, "Author Already Requested");
    }

    const password = await this.hashPassword(dto.password.toString());
    const otp = this.generateOTP();
    const otpExpiry = this.generateExpiry();

    const user = await this.registerRepo.save({
      ...dto,
      password,
      otp,
      role: "author",
      Request: "Pending",
      Status: "Active",
      otpExpiresAt: otpExpiry,
      isVerified: false,
    });

    await this.otpLogsRepo.save({
      user_id: user.register_id,
      name: user.name,
      email: user.email,
      contact: user.contact,
      otp,
    });

    await this.sendOTPEmail(user.email, otp, "Account Verification OTP");

    const { token } = this.generateToken(user.register_id, user.role);
    return this.response(true, "OTP sent successfully", {
      token,
      user: this.sanitizeUser(user),
    });
  }

  // ================= Verify OTP =================
  async verifyOtp(token: string, otp: string) {
    if (!token) return this.response(false, "Token not found");

    const decoded = this.jwtService.verify<{ user_id: number }>(token);
    const otpRecord = await this.otpLogsRepo.findOne({
      where: { user_id: decoded.user_id },
    });

    if (!otpRecord) return this.response(false, "OTP record not found");

    const user = await this.registerRepo.findOne({
      where: { email: otpRecord.email },
    });
    if (!user) return this.response(false, "User not found");
    if (user.isVerified) return this.response(true, "User already verified");

    if (user.otp !== otp) return this.response(false, "Invalid OTP");
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date())
      return this.response(false, "OTP expired");

    // Mark as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await this.registerRepo.save(user);

    // Move to verified users table
    const verifiedUser = await this.usersRepo.save({
      name: user.name,
      email: user.email,
      contact: user.contact,
      password: user.password,
      Request: user.Request,
      Status: user.Status,
      role: user.role,
    });

    const { token: finalToken } = this.generateToken(
      verifiedUser.user_id,
      verifiedUser.role,
    );
    return this.response(true, "Email verified successfully", {
      token: finalToken,
      user: this.sanitizeUser(verifiedUser),
    });
  }

  async resendOtp(token: string) {
    if (!token) throw new UnauthorizedException('Token not found');

    const decoded = this.jwtService.verify<{ user_id: number }>(token);
    const otpRecord = await this.otpLogsRepo.findOne({
      where: { user_id: decoded.user_id },
    });
    if (!otpRecord) throw new UnauthorizedException('OTP record not found');

    const user = await this.registerRepo.findOne({
      where: { email: otpRecord.email },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.isVerified) return this.response(true, 'User already verified');

    const otp = this.generateOTP();
    user.otp = otp;
    user.otpExpiresAt = this.generateExpiry();
    await this.registerRepo.save(user);

    await this.otpLogsRepo.save({
      user_id: user.register_id,
      otp,
      name: user.name,
      email: user.email,
      contact: user.contact,
    });

    await this.sendOTPEmail(user.email, otp, 'Resend Account Verification OTP');
    return this.response(true, 'New OTP sent successfully', {
      token,
      user: this.sanitizeUser(user),
    });
  }

  // ================= Login =================
  async login(dto: LoginUserDto) {
    const user = await this.findUserByEmail(dto.email);
    if (!user) return this.response(false, 'Invalid email');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) return this.response(false, 'Invalid password');

    const AuthRequest = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (AuthRequest?.Status !== "Active") {
      return this.response(false, "You are not active, please contact website admin.")
    }
    // Check if author already exists or requested
    if (AuthRequest && ["Rejected", "Pending"].includes(AuthRequest.Request)) {
      return this.response(false, "Author not Accepted");
    }

    const { token } = this.generateToken(user.user_id, user.role);
    const otp = this.generateOTP();
    this.otpStore[token] = { otp, expires: this.generateExpiry() };

    await this.sendOTPEmail(user.email, otp, 'Login OTP');

    return this.response(true, 'Login OTP sent successfully', {
      token,
      user: this.sanitizeUser(user),
    });
  }

  async verifyLoginOtp(token: string, otp: string) {
    if (!token) return this.response(false, 'Token not found');
    const record = this.otpStore[token];
    if (!record) return this.response(false, 'OTP not found');
    if (record.expires < new Date()) {
      delete this.otpStore[token];
      return this.response(false, 'OTP expired');
    }
    if (record.otp !== otp) return this.response(false, 'Invalid OTP');

    const decoded = this.jwtService.verify<{ user_id: number }>(token);
    const user = await this.findUserOrFail(decoded.user_id);

    delete this.otpStore[token];
    const { token: finalToken } = this.generateToken(user.user_id, user.role);
    return this.response(true, 'Login successful', {
      token: finalToken,
      user: this.sanitizeUser(user),
    });
  }

  async loginOtpResend(token: string) {
    if (!token) throw new UnauthorizedException('Token not found');
    const decoded = this.jwtService.verify<{ user_id: number }>(token);
    const user = await this.findUserOrFail(decoded.user_id);

    const otp = this.generateOTP();
    this.otpStore[token] = { otp, expires: this.generateExpiry() };

    await this.sendOTPEmail(user.email, otp, 'Resend Login OTP');
    return this.response(true, 'Login OTP resent successfully', {
      token,
      user: this.sanitizeUser(user),
    });
  }

  // ================= Change Password =================
  async changePassword(
    user_id: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.findUserOrFail(user_id);
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return this.response(false, 'Old password incorrect');

    user.password = await this.hashPassword(newPassword);
    await this.usersRepo.save(user);

    return this.response(true, 'Password changed successfully', this.sanitizeUser(user));
  }

  // ================= Forget Password =================
  async forgetPassword(email: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return this.response(false, 'User not found');

    const otp = this.generateOTP();
    const otpExpiry = this.generateExpiry();
    const { token } = this.generateToken(user.user_id, user.role);

    this.otpStore[token] = { otp, expires: otpExpiry };

    await this.sendOTPEmail(email, otp, 'Password Reset OTP');
    return this.response(true, 'OTP sent successfully', { token });
  }

  async verifyForgetPasswordOtp(
    token: string,
    otp: string,
    newPassword: string,
  ) {
    if (!token) return this.response(false, 'Token not found');
    const record = this.otpStore[token];
    if (!record) return this.response(false, 'OTP not found or expired');
    if (record.expires < new Date()) {
      delete this.otpStore[token];
      return this.response(false, 'OTP expired');
    }
    if (record.otp !== otp) return this.response(false, 'Invalid OTP');

    const decoded = this.jwtService.verify<{ user_id: number }>(token);
    const user = await this.findUserOrFail(decoded.user_id);

    user.password = await this.hashPassword(newPassword);
    await this.usersRepo.save(user);
    delete this.otpStore[token];

    return this.response(true, 'Password reset successfully', this.sanitizeUser(user));
  }

  async resendForgetPasswordOtp(token: string) {
    if (!token) throw new UnauthorizedException('Token not found');
    const decoded = this.jwtService.verify<{ user_id: number }>(token);
    const user = await this.findUserOrFail(decoded.user_id);

    const otp = this.generateOTP();
    const otpExpiry = this.generateExpiry();
    this.otpStore[token] = { otp, expires: otpExpiry };

    await this.sendOTPEmail(user.email, otp, 'Resend Password Reset OTP');
    return this.response(true, 'New OTP sent successfully', {
      token,
      user: this.sanitizeUser(user),
    });
  }

  // ================= CRUD =================
  async findAll(
    page = 1,
    limit = 10,
    order: 'ASC' | 'DESC' = 'DESC',
    keywords?: string,
  ) {
    const query = this.usersRepo.createQueryBuilder('user');
    if (keywords?.trim()) {
      query.where(
        'LOWER(user.name) LIKE :keywords OR LOWER(user.email) LIKE :keywords OR LOWER(user.contact) LIKE :keywords',
        { keywords: `%${keywords.trim().toLowerCase()}%` },
      );
    }

    query.skip((page - 1) * limit).take(limit).orderBy('user.user_id', order);
    const [data, total] = await query.getManyAndCount();

    if (total === 0) return this.response(false, 'No users found', []);
    return this.response(true, 'Users fetched successfully', {
      data: this.sanitizeUsers(data),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }


  // ===================== FIND ONE USER =====================
  async findOne(user_id: number) {
    const user = await this.findUserById(user_id);
    if (!user) return this.response(false, 'User not found');
    return this.response(true, 'User fetched successfully', this.sanitizeUser(user));
  }

  // ===================== UPDATE USER =====================
  async update(user_id: number, dto: UpdateUserDto) {
    const userfind = await this.findUserById(user_id);
    if (!userfind) return this.response(false, 'User not found');
    await this.validateUserData(dto, true);
    // re-fetch to confirm user exists
    const user = await this.findUserOrFail(user_id);
    // Hash password if provided
    if (dto.password) dto.password = await this.hashPassword(dto.password);
    // Prevent email change
    delete dto.email;
    // Update in DB
    await this.usersRepo.update(user_id, dto);
    const updated = await this.findUserById(user_id);
    return this.response(true, 'User updated successfully', this.sanitizeUser(updated));
  }
  // ==================== ADMIN SOFT DELETE ====================
  async softDeleteByAdmin(user_id: number) {
    const user = await this.findUserOrFail(user_id);

    await this.usersRepo.update(user_id, { Status: "Block" });

    return this.response(true, `Admin soft deleted user ${user_id} successfully.`);
  }

  // async remove(user_id: number) {
  //   const user = await this.findUserById(user_id);
  //   if (!user) return this.response(false, 'User not found');
  //   await this.findUserOrFail(user_id);
  //   await this.usersRepo.delete(user_id);
  //   return this.response(true, 'User deleted successfully');
  // }
}
