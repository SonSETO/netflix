import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Movie } from './entity/movie.entity';
// import { MovieDetail } from './entity/movie-detail.entity';
// import { Director } from 'src/director/entity/director.entity';
// import { Genre } from 'src/genre/entity/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './schema/movie.schema';
import { MovieDetail, MovieDetailSchema } from './schema/movie-detail.schema';
import {
  MovieUserLike,
  MovieUserLikeSchema,
} from './schema/movie-user-like.schema';
import { Director, DirectorSchema } from 'src/director/schema/director.schema';
import { Genre, GenreSchema } from 'src/genre/schema/genre.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
// import { MulterModule } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { join } from 'path';
// import { v4 } from 'uuid';
// import { User } from 'src/user/entity/user.entity';
// import { MovieUserLike } from './entity/movie-user-like.entity';

@Module({
  imports: [
    // TypeOrmModule.forFeature([
    //   Movie,
    //   MovieDetail,
    //   Director,
    //   Genre,
    //   User,
    //   MovieUserLike,
    // ]),

    MongooseModule.forFeature([
      {
        name: Movie.name,
        schema: MovieSchema,
      },
      {
        name: MovieDetail.name,
        schema: MovieDetailSchema,
      },
      {
        name: MovieUserLike.name,
        schema: MovieUserLikeSchema,
      },
      {
        name: Director.name,
        schema: DirectorSchema,
      },
      {
        name: Genre.name,
        schema: GenreSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    CommonModule,

    // MulterModule.register({
    //   storage: diskStorage({
    //     destination: join(process.cwd(), 'public', 'movie'),
    //     filename: (req, file, callback) => {
    //       const split = file.originalname.split('.');

    //       let extension = 'mp4';

    //       if (split.length > 1) {
    //         extension = split[split.length - 1];
    //       }
    //       callback(null, `${v4()}_${Date.now()}.${extension}`);
    //     },
    //   }),
    // }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
