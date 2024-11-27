import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  UsePipes,
  ParseIntPipe,
  BadRequestException,
  Request,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { createMovieDto } from './dto/create-movie.dto';
import { updateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
// import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';

/*
 version
@Controller({
  path: 'movie',
  version: '2',

})
export class MovieControllerV2 {
  @Get()
  getMovie() {
    return [];
  }
}

path: 'movie',
// version 디폴트 때려주기
version: VERSION_NEUTRAL,

*/

@Controller('movie')
@ApiBearerAuth()
@ApiTags('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  @ApiOperation({
    description: '[Movie]를 페이지네이션 하는 API',
  })
  @ApiResponse({
    status: 200,
    description: '성곡적으로 API Pagination을 실행 했을 때!',
  })
  @ApiResponse({
    status: 400,
    description: 'pagination 데이터를 잘못 입력 했을 때',
  })
  // @UseInterceptors(CacheInterceptor)
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    // title 쿼리 타입이 string 타입인지?

    return this.movieService.findAll(dto, userId);
  }

  // movie/recent
  @Get('recent')
  @UseInterceptors(CI) //인터셉터로 캐싱을하면 url을 기반으로 한다 query가 변경될 때 마다 다른 값으로 저장된다
  @CacheKey('getMoviesRecent') // 이건 쿼리가 변경이 되어도 캐쉬키를 일괄적으로 박아줄 수 있다
  @CacheTTL(1000)
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  // movie/asdasd
  @Get(':id')
  @Public()
  getMovie(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.movieService.findOne(id);
  }

  // @Post()
  // @RBAC(Role.admin)
  // @UseInterceptors(TransactionInterceptor)
  // // @UseInterceptors(FilesInterceptor('movies'))
  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       {
  //         name: 'movie',
  //         maxCount: 1,
  //       },
  //       {
  //         name: 'poster',
  //         maxCount: 2,
  //       },
  //     ],
  //     {
  //       limits: {
  //         fileSize: 20000000,
  //       },
  //       fileFilter(req, file, callback) {
  //         console.log(file);
  //         if (file.mimetype !== 'video/mp4') {
  //           return callback(
  //             new BadRequestException('MP4 타입만 업로드 가능합니다!'),
  //             false,
  //           );
  //         }
  //         return callback(null, true);
  //       },
  //     },
  //   ),
  // )

  // @UseInterceptors(FilesInterceptor('movies'))
  // @UseInterceptors(
  //   FileInterceptor('movie', {
  //     limits: {
  //       fileSize: 20000000,
  //     },
  //     fileFilter(req, file, callback) {
  //       console.log(file);
  //       if (file.mimetype !== 'video/mp4') {
  //         return callback(
  //           new BadRequestException('MP4 타입만 업로드 가능합니다!'),
  //           false,
  //         );
  //       }
  //       return callback(null, true);
  //     },
  //   }),
  // )
  //@UploadedFile() movie: Express.Multer.File,
  // @UploadedFiles() files: Express.Multer.File[],
  // @UploadedFiles(
  // new MovieFilePipe({
  //   maxSize: 20,
  //   mimetype: 'video/mp4',
  // }),
  // files: {
  //   movie?: Express.Multer.File[];
  //   poster?: Express.Multer.File[];
  // },

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() body: createMovieDto,
    // @Request() req,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.create(body, userId, queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: updateMovieDto,
  ) {
    return this.movieService.update(id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }

  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}

/*

  [Like] [Dislike]
  아무것도 누리지 않은 상태=> Like & Dislike 모두 버튼 꺼져있음

  Like버튼 누르면 -> Like버튼 불 켜짐
  Like버튼 다시 누르면 -> Like버튼 불 꺼짐

  DisLike버튼 누르면 -> DisLike버튼 불 켜짐
  DisLike버튼 다시 누르면 -> DisLike버튼 불 꺼짐

  Like버튼 누르면 -> Like버튼 불 켜짐
  Dislike 버튼 누르면 -> Like버튼 불 꺼지고 Dislike 버튼 불 켜짐
*/
