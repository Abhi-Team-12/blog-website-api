import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './users.entity';
import { Category } from './categories.entity';
import { Tag } from './tags.entity';

@Entity('posts')
export class Posts {
  @PrimaryGeneratedColumn()
  post_id: number;

  // Relation + foreign key for User
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column() // foreign key column
  user_id: number;

  // Relation + foreign key for Category
  @ManyToOne(() => Category, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ nullable: true }) // foreign key column
  category_id: number;

  // Relation + foreign key for Category
  @ManyToOne(() => Tag, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @Column({ nullable: true }) // foreign key column
  tag_id: number;

  @Column({ unique: true })
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  image: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'scheduled'],
    default: 'published',
  })
  status: 'draft' | 'published' | 'scheduled';

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date | null;

  @Column({ default: false })
  approved: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
