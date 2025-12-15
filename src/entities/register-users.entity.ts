import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('register-users')
export class register_user {
  @PrimaryGeneratedColumn()
  register_id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  contact: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: ["admin", "author", "reader"]})
  role: "admin" | "author" | "reader";

  @Column({ type: "enum", enum: ["Accepted", "Rejected", "Pending"] })
  Request: "Accepted" | "Rejected" | "Pending";

  @Column({ type: "enum", enum: ["Block", "Inactive", "Active"]})
  Status: "Block" | "Inactive" | "Active";

  @Column({ type: 'varchar', length: 10, nullable: true })
  otp: string | null;

  @Column({ type: 'datetime', nullable: true })
  otpExpiresAt: Date | null;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
