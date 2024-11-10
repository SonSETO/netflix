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
// import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  // @UseInterceptors(CacheInterceptor)
  getMovies(@Query() dto: GetMoviesDto) {
    // title 쿼리 타입이 string 타입인지?

    return this.movieService.findAll(dto);
  }

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
  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  // @UseInterceptors(FilesInterceptor('movies'))
  @UseInterceptors(
    FileInterceptor('movie', {
      limits: {
        fileSize: 20000000,
      },
      fileFilter(req, file, callback) {
        console.log(file);
        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadRequestException('MP4 타입만 업로드 가능합니다!'),
            false,
          );
        }
        return callback(null, true);
      },
    }),
  )
  postMovie(
    @Body() body: createMovieDto,
    @Request() req,
    // @UploadedFiles() files: Express.Multer.File[],
    // @UploadedFiles(
    @UploadedFile(
      new MovieFilePipe({
        maxSize: 20,
        mimetype: 'video/mp4',
      }),
    )
    movie: Express.Multer.File,
    // files: {
    //   movie?: Express.Multer.File[];
    //   poster?: Express.Multer.File[];
    // },
  ) {
    console.log('--------------');
    console.log(movie);
    return this.movieService.create(body, req.queryRunner);
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
}
