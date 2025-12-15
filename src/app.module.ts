import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { register_user } from './entities/register-users.entity';
import { User } from './entities/users.entity';
import { OTP_Logs } from './entities/otp_logs.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.module';
import config from './config/config';
import { Category } from './entities/categories.entity';
import { Posts } from './entities/posts.entity';
import { TagsModule } from './tags/tags.module';
import { Tag } from './entities/tags.entity';
import { LikeModule } from './like/like.module';
import { Like } from './entities/like.entity';
import { CommentModule } from './comment/comment.module';
import { Comment } from './entities/comment.entity';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, load: [config] }),
    JwtModule.registerAsync({ imports: [ConfigModule], useFactory: async (config) => ({ secret: config.get('jwt.secret'), }), global: true, inject: [ConfigService] }),
    UsersModule, TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'abhi-aws-database.c0ju68os8sbk.us-east-1.rds.amazonaws.com',
      port: process.env.DB_PORT ? +process.env.DB_PORT : 3306,
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASS || 'AbhiLove533',
      database: process.env.DB_NAME || 'blog_website_db',
      // host: 'abhi-aws-database.c0ju68os8sbk.us-east-1.rds.amazonaws.com',
      // port: 3306,
      // username: 'admin',
      // password: 'AbhiLove533',
      // database: 'blog_website_db',
      entities: [register_user, User, OTP_Logs, Category, Posts, Tag, Like, Comment],
      synchronize: true,
      autoLoadEntities: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'abhisheksingh.appworks@gmail.com',
          pass: 'dyzxohugzqjwqkun', // Gmail ke liye App Password use karein
        },
      },
      defaults: {
        from: '"This message send by Abhishek Singh" from AppWorks Technologies Pvt. Ltd.',
      },
    }),
    ScheduleModule.forRoot(), // ✅ enable cron jobs
    PostsModule,
    CategoriesModule,
    TagsModule,
    LikeModule,
    CommentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
