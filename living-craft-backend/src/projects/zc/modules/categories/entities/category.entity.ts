import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity({ schema: 'zc', name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, comment: '통합 카테고리명' })
  name: string;

  @Column({ type: 'uuid', nullable: true, comment: '상위 카테고리 ID (self FK)' })
  parentId: string;

  @Column({ type: 'int', default: 1, comment: '1: 대분류, 2: 중분류, 3: 소분류' })
  level: number;

  @Column({ type: 'int', default: 0, comment: '정렬 순서' })
  sortOrder: number;

  @Column({ type: 'text', nullable: true, comment: '설명' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];
}
