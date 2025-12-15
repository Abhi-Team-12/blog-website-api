import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './users.entity';
import { Posts } from './posts.entity';

@Entity('likes')
@Unique(['user_id', 'post_id'])
export class Like {
  @PrimaryGeneratedColumn()
  like_id: number;

  // ----------- RELATION: USER -----------
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: number;

  // ----------- RELATION: POST -----------
  @ManyToOne(() => Posts, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Posts;

  @Column()
  post_id: number;

  // ----------- TIMESTAMP -----------
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
