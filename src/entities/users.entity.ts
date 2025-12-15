import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  contact: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: ["admin", "author", "reader"]})
  role: "admin" | "author" | "reader";

  @Column({ type: "enum", enum: ["Accepted", "Rejected", "Pending"]})
  Request: "Accepted" | "Rejected" | "Pending";

  @Column({ type: "enum", enum: ["Block", "Inactive", "Active"]})
  Status: "Block" | "Inactive" | "Active";

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}