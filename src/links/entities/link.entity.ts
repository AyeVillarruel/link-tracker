import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalUrl: string;

  @Column({ unique: true })
  shortenedUrl: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ type: 'timestamp', nullable: true })
  expirationDate: Date;

  @Column({ default: 0 })
  clicks: number;

  @Column({ default: true })
  isValid: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
