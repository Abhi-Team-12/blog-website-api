import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { register_user } from 'src/entities/register-users.entity';
import { User} from 'src/entities/users.entity';
import { OTP_Logs } from 'src/entities/otp_logs.entity';


@Module({
  imports: [TypeOrmModule.forFeature([register_user, User, OTP_Logs])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
