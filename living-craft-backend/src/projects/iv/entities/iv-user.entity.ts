import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('users', { schema: 'iv' })
export class IvUser {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 50 })
  username: string

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string

  @Column({ length: 50, nullable: true, default: null })
  nickname: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
