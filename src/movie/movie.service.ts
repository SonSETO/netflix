import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/Update-movie.dto';
// import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
// import { MovieDetail } from './entity/movie-detail.entity';
// import { Director } from 'src/director/entity/director.entity';
// import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
// import { User } from 'src/user/entity/user.entity';

// import { MovieUserLike } from './entity/movie-user-like.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
import { InjectModel } from '@nestjs/mongoose';
import { Movie } from './schema/movie.schema';
import { Model, Types, Document } from 'mongoose';
import { MovieDetail } from './schema/movie-detail.schema';
import { Director } from 'src/director/schema/director.schema';
import { Genre } from 'src/genre/schema/genre.schema';
import { User } from 'src/user/schema/user.schema';
import { MovieUserLike } from './schema/movie-user-like.schema';
// import { PrismaService } from 'src/common/prisma.service';
// import { Prisma } from '@prisma/client';

@Injectable()
export class MovieService {
  constructor(
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,
    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    // private readonly prisma: PrismaService,
    @InjectModel(Movie.name)
    private readonly movieModel: Model<Movie>,
    @InjectModel(MovieDetail.name)
    private readonly movieDetailModel: Model<MovieDetail>,
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(MovieUserLike.name)
    private readonly movieUserLikeModel: Model<MovieUserLike>,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.movieModel
      .find()
      .sort({ cratedAt: -1 })
      .limit(10)
      .exec();

    // const data = await this.prisma.movie.findMany({
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    //   take: 10,
    // });

    // const data = await this.movieRepository.find({
    //   order: {
    //     createdAt: 'DESC',
    //   },
    //   take: 10,
    // });

    // set에서 맨마지막은 TTL 저장시간을 뜻함
    // 모듈단에서 정의를 해도 서비스단에서 정의를 하면 오버라이딩해서 서비스단에서 정의한 값이 적용됨
    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  async getMovies() {
    // return this.movieRepository.createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    // return this.movieUserLikeRepository.createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .where('movie.id IN(:...movieIds)', { movieIds })
    //   .andWhere('user.id = :userId', { userId })
    //   .getMany()
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title, cursor, take, order } = dto;

    const orderBy = order.reduce((acc, field) => {
      const [column, direction] = field.split('_');
      if (column === 'id') {
        acc['_id'] = direction.toLowerCase();
      } else {
        acc[column] = direction.toLowerCase();
      }
      return acc;
    }, {});

    // const orderBy = order.map((field) => {
    //   const [column, direction] = field.split('_');
    //   return { [column]: direction.toLocaleLowerCase() };
    // });

    const query = this.movieModel
      .find(
        title
          ? {
              title: {
                $regex: title,
              },
              $option: 'i',
            }
          : {},
      )
      .sort(orderBy)
      .limit(take + 1);

    if (cursor) {
      query.skip(1).gt('_id', new Types.ObjectId(cursor));
    }

    const movies = await query.populate('genres director').exec();

    // const movies = await this.prisma.movie.findMany({
    //   where: title ? { title: { contains: title } } : {},
    //   take: take + 1,
    //   skip: cursor ? 1 : 0,
    //   cursor: cursor ? { id: parseInt(cursor) } : undefined,
    //   orderBy,
    //   include: {
    //     genres: true,
    //     director: true,
    //   },
    // });

    const hasNextPage = movies.length > take;

    if (hasNextPage) movies.pop();

    const nextCursor = hasNextPage
      ? movies[movies.length - 1]._id.toString()
      : null;

    // const { title, take, page } = dto; // page-Pagination
    // Query Builder 사용
    // const qb = await this.getMovies()

    // if (title) {
    //   qb.where('movie.title LIKE :title', { title: `%${title}%` });
    // }

    // const { nextCursor } =
    //   await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    // commonServer와 모듈 받아서 주입
    // page기반 pagination
    // if (take && page) {
    // this.commonService.applyPagePaginationParamsToQb(qb, dto);
    // }

    // let [data, count] = await qb.getManyAndCount();

    if (userId) {
      const movieIds = movies.map((movie) => movie._id);
      // const movieIds = data.map((movie) => movie.id);

      // const likedMovies =
      //   movieIds.length < 1
      //     ? []
      //     : await this.prisma.movieUserLike.findMany({
      //         where: {
      //           movieId: { in: movieIds },
      //           userId: userId,
      //         },
      //         include: {
      //           movie: true,
      //         },
      //       });

      const likedMovies =
        movieIds.length < 1
          ? []
          : await this.movieUserLikeModel
              .find({
                movie: { $in: movieIds },
                user: userId,
              })
              .populate('movie')
              .exec();

      // const likedMovies =
      //   movieIds.length < 1 ? [] : await this.getLikedMovies(movieIds, userId);

      // movieUserLikeRepository
      //     .createQueryBuilder('mul')
      //     .leftJoinAndSelect('mul.user', 'user')
      //     .leftJoinAndSelect('mul.movie', 'movie')
      //     .where('movie.id IN(:...movieIds', { movieIds })
      //     .andWhere('user.id = :userId', { userId })
      //     .getMany();

      /*
    map으로 변환해줄거임
      {
      movieId:boolean
      }
    */
      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie._id.toString()]: next.isLike,
        }),
        {},
      );

      return {
        data: movies.map((movie) => ({
          ...movie.toObject(),
          likeStatus:
            movie._id.toString() in likedMovieMap
              ? likedMovieMap[movie._id.toString()]
              : null,
        })) as (Document<unknown, {}, Movie> &
          Movie &
          Required<{
            _id: unknown;
          }> & {
            __v?: number;
          } & {
            likeStatus: boolean;
          })[],
        nextCursor,
        hasNextPage,
      };

      //   data = data.map((x) => ({
      //     ...x,
      //     // null || true || false
      //     likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null,
      //   }));
    }

    return {
      data: movies,
      nextCursor,
      hasNextPage,
    };

    // Repository 사용
    // if (!title) {
    //   // title필터가 선택적이므로 필터 조건이 없을 때는 전체 데이터를 반환
    //   return [
    //     await this.movieRepository.find({
    //       relations: ['director', 'detail', 'genres'],
    //     }),
    //     await this.movieRepository.count(),
    //   ];
    // }

    // return this.movieRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`),
    //   },
    //   relations: ['director'],
    // });
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    // return this.movieRepository.createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres')
    //   .leftJoinAndSelect('movie.detail', 'detail')
    //   .leftJoinAndSelect('movie.creator', 'creator')
    //   .where('movie.id = :id', { id })
    //   .getOne();
  }

  async findOne(id: number) {
    const movie = await this.movieModel.findById(id);

    // const movie = await this.prisma.movie.findUnique({
    //   where: { id },
    // });

    // const movie = await this.findMovieDetail(id)
    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director', 'genres'],
    // });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }

    return movie;
  }

  /* istanbul ignore next */
  async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto) {
    // return qr.manager.createQueryBuilder()
    //   .insert()
    //   .into(MovieDetail)
    //   .values({
    //     detail: createMovieDto.detail,
    //   })
    //   .execute()
  }

  /* istanbul ignore next */
  createMovie(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
    director: Director,
    movieDetailId: number,
    userId: number,
    movieFolder: string,
  ) {
    // return qr.manager.createQueryBuilder()
    //   .insert()
    //   .into(Movie)
    //   .values({
    //     title: createMovieDto.title,
    //     detail: {
    //       id: movieDetailId,
    //     },
    //     director,
    //     creator: {
    //       id: userId,
    //     },
    //     movieFilePath: join(movieFolder, createMovieDto.movieFileName),
    //   })
    //   .execute()
  }

  /* istanbul ignore next */
  createMovieGenreRelation(qr: QueryRunner, movieId: number, genres: Genre[]) {
    // return qr.manager.createQueryBuilder()
    //   .relation(Movie, 'genres')
    //   .of(movieId)
    //   .add(genres.map(genre => genre.id));
  }

  renameMovieFile(
    tempFolder: string,
    movieFolder: string,
    createMovieDto: CreateMovieDto,
  ) {
    if (this.configService.get<string>(envVariableKeys.env) !== 'prod') {
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    } else {
      return this.commonService.saveMovieToPermanentStorage(
        createMovieDto.movieFileName,
      );
    }
  }

  async create(createMovieDto: CreateMovieDto, userId: number) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const director = await this.directorModel
        .findById(createMovieDto.directorId)
        .exec();
      if (!director) {
        throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
      }

      const genres = await this.genreModel
        .find({ _id: { $in: createMovieDto.genreIds } })
        .exec();

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다! 현재 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      const movieDetail = await this.movieDetailModel.create(
        [
          {
            detail: createMovieDto.detail,
          },
        ],
        {
          session,
        },
      );

      const movie = await this.movieModel.create(
        [
          {
            title: createMovieDto.title,
            movieFilePath: createMovieDto.movieFileName,
            creator: userId,
            director: director._id,
            genres: genres.map((genre) => genre._id),
            detail: movieDetail[0]._id,
          },
        ],
        {
          session,
        },
      );

      await session.commitTransaction();
      return this.movieModel
        .findById(movie[0]._id)
        .populate('detail')
        .populate('director')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();
    } catch (e) {
      await session.abortTransaction();
      console.log(e);
      throw new InternalServerErrorException('트랜잭션 실패');
    } finally {
      session.endSession();
    }

    // return this.prisma.$transaction(async (prisma) => {
    // const director = await prisma.director.findUnique({
    //   where: {
    //     id: createMovieDto.directorId,
    //   },
    // });
    // if (!director) {
    //   throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
    // }

    // const genres = await prisma.genre.findMany({
    //   where: {
    //     id: {
    //       in: createMovieDto.genreIds,
    //     },
    //   },
    // });
    // if (genres.length !== createMovieDto.genreIds.length) {
    //   throw new NotFoundException(
    //     `존재하지 않는 장르가 있습니다! 현재 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
    //   );
    // }

    // const movieDetail = await prisma.movieDetail.create({
    //   data: { detail: createMovieDto.detail },
    // });

    // const movie = await prisma.movie.create({
    //   data: {
    //     title: createMovieDto.title,
    //     movieFilePath: createMovieDto.movieFileName,
    //     creator: { connect: { id: userId } },
    //     director: { connect: { id: director.id } },
    //     genres: { connect: genres.map((genre) => ({ id: genre.id })) },
    //     detail: { connect: { id: movieDetail.id } },
    //   },
    // });

    //   return prisma.movie.findUnique({
    //     where: {
    //       id: movie.id,
    //     },
    //     include: {
    //       detail: true,
    //       director: true,
    //       genres: true,
    //     },
    //   });
    // });
  }

  // async create(createMovieDto: CreateMovieDto, userId: number) {
  // const director = await qr.manager.findOne(Director, {
  //   where: {
  //     id: createMovieDto.directorId,
  //   },
  // });

  // if (!director) {
  //   throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
  // }

  // const genres = await qr.manager.find(Genre, {
  //   where: {
  //     id: In(createMovieDto.genreIds),
  //   },
  // });

  // if (genres.length !== createMovieDto.genreIds.length) {
  //   throw new NotFoundException(
  //     `존재하지 않는 장르가 있습니다! 현재 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
  //   );
  // }

  // const movieDetail = await this.createMovieDetail(qr, createMovieDto)

  // throw new NotFoundException('일부로 에러던짐');

  // const movieDetailId = movieDetail.identifiers[0].id;

  // const movieFolder = join('public', 'movie');
  // const tempFolder = join('public', 'temp');

  // const movie = await this.createMovie(
  //   qr,
  //   createMovieDto,
  //   director,
  //   movieDetailId,
  //   userId,
  //   movieFilePath,
  // );

  // const movieId = movie.identifiers[0].id;

  // await this.createMovieGenreRelation(qr,movieId,genres)

  // await this.renameMovieFile(tempFolder, movieFolder, createMovieDto)

  // const movie = await this.movieRepository.save({
  //   title: createMovieDto.title,
  //   detail: {
  //     detail: createMovieDto.detail,
  //   },
  //   director,
  //   genres,
  // });

  // return await qr.manager.findOne(Movie, {
  //   where: {
  //     id: movieId,
  //   },
  //   relations: ['detail', 'director', 'genres'],
  // });
  // }

  /* istanbul ignore next */
  updateMovie(qr: QueryRunner, movieUpdateFields: UpdateMovieDto, id: number) {
    // return qr.manager.createQueryBuilder()
    //     .update(Movie)
    //     .set(movieUpdateFields)
    //     .where('id = :id', { id })
    //     .execute()
  }

  /* istanbul ignore next */
  updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
    // return qr.manager.createQueryBuilder()
    //       .update(MovieDetail)
    //       .set({
    //         detail,
    //       })
    //       .where('id = :id', { id: movie.detail.id })
    //       .execute();
  }

  /* istanbul ignore next */
  updateMovieGenreRelation(
    qr: QueryRunner,
    id: number,
    newGenres: Genre[],
    movie: Movie,
  ) {
    // return qr.manager.createQueryBuilder()
    //       .relation(Movie, 'genres')
    //       .of(id)
    //       .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id));
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const movie = await this.movieModel
        .findById(id)
        .populate('detail genres')
        .exec();
      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
      }

      const { genreIds, detail, directorId, ...movieRest } = updateMovieDto;

      let movieUpdateParams: {
        title?: string;
        movieFileName?: string;
        director?: Types.ObjectId;
        genres?: Types.ObjectId[];
      } = {
        ...movieRest,
      };

      if (directorId) {
        const director = await this.directorModel.findById(directorId).exec();

        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
        }

        movieUpdateParams.director = director._id as Types.ObjectId;
      }

      if (genreIds) {
        const genres = await this.genreModel
          .find({
            _id: { $in: genreIds },
          })
          .exec();

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
          );
        }

        movieUpdateParams.genres = genres.map(
          (genre) => genre._id,
        ) as Types.ObjectId[];
      }

      if (detail) {
        await this.movieDetailModel
          .findByIdAndUpdate(movie.detail._id, {
            detail,
          })
          .exec();
      }

      await this.movieModel.findByIdAndUpdate(id, movieUpdateParams);

      await session.commitTransaction();

      return this.movieModel
        .findById(id)
        .populate('detail director')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();
    } catch (e) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }

    // return this.prisma.$transaction(async (prisma) => {
    // const movie = await prisma.movie.findUnique({
    //   where: { id },
    //   include: {
    //     detail: true,
    //     genres: true,
    //   },
    // });
    // if (!movie) {
    //   throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    // }

    // const { genreIds, detail, directorId, ...movieRest } = updateMovieDto;

    // let movieUpdateParams: Prisma.MovieUpdateInput = {
    //   ...movieRest,
    // };

    // if (directorId) {
    //   const director = await prisma.director.findUnique({
    //     where: { id: directorId },
    //   });
    // if (!director) {
    //   throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
    // }

    // movieUpdateParams.director = { connect: { id: directorId } };
    // }
    // if (genreIds) {
    //   const genres = await prisma.genre.findMany({
    //     where: { id: { in: genreIds } },
    //   });
    //   if (genres.length !== genreIds.length) {
    //     throw new NotFoundException(
    //       `존재하지 않는 장르가 있습니다! 현재 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
    //     );
    //   }

    //   movieUpdateParams.genres = {
    //     set: genres.map((genre) => ({ id: genre.id })),
    //   };
    // }

    //   await prisma.movie.update({
    //     where: { id },
    //     data: movieUpdateParams,
    //   });

    //   if (detail) {
    //     await prisma.movieDetail.update({
    //       where: { id: movie.detail.id },
    //       data: { detail },
    //     });
    //   }

    //   return prisma.movie.findUnique({
    //     where: { id },
    //     include: {
    //       detail: true,
    //       genres: true,
    //       director: true,
    //     },
    //   });
    // });
  }

  // async update(id: number, updateMovieDto: UpdateMovieDto) {
  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();
  //   await qr.startTransaction();

  //   try {
  // const movie = await qr.manager.findOne(Movie, {
  //   where: {
  //     id,
  //   },
  //   relations: ['detail', 'genres'],
  // });

  // if (!movie) {
  //   throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
  // }

  // const { genreIds, detail, directorId, ...movieRest } = updateMovieDto;

  // let newDirector;

  // if (directorId) {
  //   const director = await qr.manager.findOne(Director, {
  //     where: {
  //       id: directorId,
  //     },
  //   });
  // if (!director) {
  //   throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
  // }
  // newDirector = director;
  // }

  // let newGenres;

  // if (genreIds) {
  //   const genres = await qr.manager.find(Genre, {
  //     where: {
  //       id: In(genreIds),
  //     },
  //   });
  //   if (genres.length !== updateMovieDto.genreIds.length) {
  //     throw new NotFoundException(
  //       `존재하지 않는 장르가 있습니다! 현재 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
  //     );
  //   }
  //   newGenres = genres;
  // }

  // const movieUpdateFields = {
  //   ...movieRest,
  //   ...(newDirector && { director: newDirector }),
  // };

  // await this.updateMovie(qr,movieUpdateFields,id)

  // await this.movieRepository.update({ id }, movieUpdateFields);

  // if (detail) {
  //   await this.updateMovieDetail(qr,detail,movie)

  // await this.movieDetailRepository.update(
  //   {
  //     id: movie.detail.id,
  //   },
  //   {
  //     detail,
  //   },
  // );
  // }

  // if (newGenres) {
  //   await this.updateMovieGenreRelation(qr,id,newGenres,movie)
  // }

  // const newMovie = await this.movieRepository.findOne({
  //   where: {
  //     id,
  //   },
  //   relations: ['detail', 'director'],
  // });

  // newMovie.genres = newGenres;

  // await this.movieRepository.save(newMovie);

  //     await qr.commitTransaction();

  //     return this.movieRepository.findOne({
  //       where: {
  //         id,
  //       },
  //       relations: ['detail', 'director', 'genres'],
  //     });
  //   } catch (e) {
  //     await qr.rollbackTransaction();

  //     throw e;
  //   } finally {
  //     await qr.release();
  //   }
  // }

  /* istanbul ignore next */
  deleteMovie(id: number) {
    // return this.movieRepository.createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();
  }

  async remove(id: number) {
    const movie = await this.movieModel.findById(id).populate('detail').exec();

    // const movie = await this.prisma.movie.findUnique({
    //   where: { id },
    //   include: {
    //     detail: true,
    //   },
    // });

    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail'],
    // });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }

    await this.movieModel.findByIdAndDelete(id).exec();

    // await this.prisma.movie.delete({
    //   where: { id },
    // });

    //  await this.deleteMovie(id)

    // await this.movieRepository
    //   .createQueryBuilder()
    //   .delete()
    //   .where('id=:id', { id })
    //   .execute();

    // await this.movieRepository.delete(id);

    await this.movieDetailModel.findByIdAndDelete(movie.detail._id).exec();

    // await this.prisma.movie.delete({
    //   where: {
    //     id: movie.detail.id,
    //   },
    // });

    // await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }

  /* istanbul ignore next */
  getLikedRecord(movieId: number, userId: number) {
    // return this.movieUserLikeRepository.createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();
  }
  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieModel.findById(movieId).exec();

    // const movie = await this.prisma.movie.findUnique({
    //   where: {
    //     id: movieId,
    //   },
    // });

    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id: movieId,
    //   },
    // });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다!');
    }

    const user = await this.userModel.findById(userId).exec();

    // const user = await this.prisma.user.findUnique({
    //   where: {
    //     id: userId,
    //   },
    // });

    // const user = await this.userRepository.findOne({
    //   where: {
    //     id: userId,
    //   },
    // });

    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다!');
    }

    const likeRecord = await this.movieUserLikeModel.findOne({
      movie: movieId,
      user: userId,
    });

    // const likeRecord = await this.prisma.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: { movieId, userId },
    //   },
    // });

    // const likeRecord = await this.getLikedRecord(movieId,userId)

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeModel.findByIdAndDelete(likeRecord._id);

        // await this.prisma.movieUserLike.delete({
        //   where: {
        //     movieId_userId: { movieId, userId },
        //   },
        // });

        // await this.movieUserLikeRepository.delete({
        //   movie,
        //   user,
        // });
      } else {
        likeRecord.isLike = isLike;
        likeRecord.save();
        // await this.movieUserLikeModel.findByIdAndUpdate(likeRecord._id,{isLike})

        // await this.prisma.movieUserLike.update({
        //   where: {
        //     movieId_userId: { movieId, userId },
        //   },
        //   data: {
        //     isLike,
        //   },
        // });

        // await this.movieUserLikeRepository.update(
        //   {
        //     movie,
        //     user,
        //   },
        //   {
        //     isLike,
        //   },
        // );
      }
    } else {
      await this.movieUserLikeModel.create({
        movie: movieId,
        user: userId,
        isLike,
      });

      // await this.prisma.movieUserLike.create({
      //   data: {
      //     movie: { connect: { id: movieId } },
      //     user: { connect: { id: userId } },
      //     isLike,
      //   },
      // });

      // await this.movieUserLikeRepository.save({
      //   movie,
      //   user,
      //   isLike,
      // });
    }

    const result = await this.movieUserLikeModel.findOne({
      movie: movieId,
      user: userId,
    });

    // const result = await this.prisma.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: { movieId, userId },
    //   },
    // });

    // const result = await this.getLikedMovies(movieId,userId)

    return {
      isLike: result && result.isLike,
    };
  }
}
