import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Movie } from './movie.entity';
import { User } from 'src/user/entity/user.entity';

@Entity()
export class MovieUserLike {
  @PrimaryColumn({
    name: 'movieId',
    type: 'int8',
  })
  @ManyToOne(() => Movie, (movie) => movie.likedUsers, {
    onDelete: 'CASCADE',
  })
  movie: Movie;

  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.likedMovies, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  isLike: boolean;
  // 애가 트루면 좋아요 상태
}
/*
    중간테이블 만들고 M:N일 때 이런식으로도 가능
*/
