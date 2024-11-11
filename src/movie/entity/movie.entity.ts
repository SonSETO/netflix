import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './movie-user-like.entity';

// ManyToOne Director -> 감독은 여러개의 영화를 만들 수 있음
// OneToOne MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
// ManyToMany Genre -> 영화는 여러개의 장르를 갖을 수 있고 장르는 여러개의 영화에 속할 수 있음

// @Exclude()
// 보안에 민감할 때 노출시키지 않을 수 있다
// @Expose()
// 애는 노출시킴

// @Transform(({ value }) => 'ㅁㄴㅇ')
// 전부 ''안의 값으로 하겠다

// @Transform(({ value }) => value.toString().toUpperCase())
// 전부 대문자로 바꾸겠다

// 이렇게 공통인 애들은 common으로 빼서 다 상속해주면 편함

//실제로는 이렇게 안할거지만 싱글테이블로 실습해보기 위해  movie / series -> Content
// runtime(영화 상영시간) / seriesCount(몇개 부작인지)

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.createdMovies)
  creator: User;

  @Column({
    unique: true,
  })
  title: string;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  @Column({
    default: 0,
  })
  likeCount: number;

  @OneToOne(() => MovieDetail, (MovieDetail) => MovieDetail.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetail;

  @Column()
  @Transform(({ value }) => `http://localhost:3000/${value}`)
  movieFilePath: string;

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: Director;

  @OneToMany(() => MovieUserLike, (mul) => mul.movie)
  likedUsers: MovieUserLike[];

  // @Column(() => BaseEntity)
  // base: BaseEntity;
  // 이거 안이쁨 객체로 들어가고 base가 생김
}
