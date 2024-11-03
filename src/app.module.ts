import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { Movie } from './movie/entity/movie.entity';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entity/director.entity';
import { Genre } from './genre/entity/genre.entity';
import { GenreModule } from './genre/genre.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/entity/user.entity';
import { envVariableKeys } from './common/const/env.const';

@Module({
  imports: [
    // 검증
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    // Ioc 컨테이너가 해줌
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariableKeys.dbType) as 'postgres',
        host: configService.get<string>(envVariableKeys.dbHOST),
        port: configService.get<number>(envVariableKeys.dbPORT),
        username: configService.get<string>(envVariableKeys.dbUSERNAME),
        password: configService.get<string>(envVariableKeys.dbPASSWORD),
        database: configService.get<string>(envVariableKeys.dbDATABASE),
        entities: [Movie, MovieDetail, Director, Genre, User],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    // TypeOrmModule.forRoot({
    //   type: process.env.DB_TYPE as 'postgres',
    //   host: process.env.DB_HOST,
    //   port: parseInt(process.env.DB_PORT),
    //   username: process.env.DB_USERNAME,
    //   password: process.env.DB_PASSWORD,
    //   database: process.env.DB_DATABASE,
    //   entities: [],
    //   synchronize: true, // 개발 단계에서만 true, production은 이거 false
    // }),

    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
