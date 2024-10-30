import { Exclude, Expose, Transform } from 'class-transformer';
import {
  ChildEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

// @Exclude()
// 보안에 민감할 때 노출시키지 않을 수 있다
// @Expose()
// 애는 노출시킴

// @Transform(({ value }) => 'ㅁㄴㅇ')
// 전부 ''안의 값으로 하겠다

// @Transform(({ value }) => value.toString().toUpperCase())
// 전부 대문자로 바꾸겠다

// 이렇게 공통인 애들은 common으로 빼서 다 상속해주면 편함
export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

//실제로는 이렇게 안할거지만 싱글테이블로 실습해보기 위해  movie / series -> Content
// runtime(영화 상영시간) / seriesCount(몇개 부작인지)

@Entity()
export class Movie extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  // @Column(() => BaseEntity)
  // base: BaseEntity;
  // 이거 안이쁨 객체로 들어가고 base가 생김
}
