import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// import { Role, User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaClient, Role } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/common/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    // private readonly prisma: PrismaService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async tokenBlock(token: string) {
    const payload = this.jwtService.decode(token);
    const expiryDay = +new Date(payload['exp'] * 1000);
    const now = +Date.now();

    const differenceInSeconds = (expiryDay - now) / 1000;

    await this.cacheManager.set(
      `BLOCK_TOKEN_${token}`,
      payload,
      Math.max(differenceInSeconds * 1000, 1),
    );

    return true;
  }

  parseBasicToken(rawToken: string) {
    // 1) 토큰을 ' ' 기준으로 스플릿 한 후 토큰 값만 추출하기
    // ['Basic', $token]
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰이 포맷이 잘못됐습니다!');
    }

    const [basic, token] = basicSplit;

    if (basic.toLocaleLowerCase() !== 'basic') {
      throw new BadRequestException('토큰이 포맷이 잘못됐습니다!');
    }

    // 2) 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    // "email:password"
    // [email, password]
    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰이 포맷이 잘못됐습니다!');
    }

    const [email, password] = tokenSplit;

    return {
      email,
      password,
    };
  }

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰이 포맷이 잘못됐습니다!');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰이 포맷이 잘못됐습니다!');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefreshToken
            ? envVariableKeys.refreshTokenSecret
            : envVariableKeys.accessTokenSecret,
        ),
      });

      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('Refresh 토큰을 입력해주세요!');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력해주세요!');
        }
      }

      return payload;
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료됐습니다!');
    }
  }

  // rawToken => "Basic $token"
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    return this.userService.create({
      email,
      password,
    });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userModel.findOne(
      {
        email,
      },
      {
        password: 1,
        role: 1,
      },
    );

    // const user = await this.prisma.user.findUnique({
    //   where: { email },
    //   select: {
    //     id: true,
    //     email: true,
    //     password: true,
    //     role: true,
    //   },
    // });

    // const user = await this.userRepository.findOne({
    //   where: {
    //     email,
    //   },
    // });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다!');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보입니다!');
    }

    return user;
  }

  async issueToken(user: { _id: any; role: Role }, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    );
    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.accessTokenSecret,
    );

    return await this.jwtService.signAsync(
      {
        sub: user._id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : '15m',
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}

/*
귀찮게 basic토큰 없이 일반적으로 할 때
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('이미 가입한 이메일입니다!');
    }

    const hashedPassword = await bcrypt.hash(
      password,
      this.configService.get<number>('HASH_ROUNDS'),
    );

    const newUser = this.userRepository.create({ email, password: hashedPassword });
    return await this.userRepository.save(newUser);
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다!');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('잘못된 로그인 정보입니다!');
    }

    return user;
  }

  async issueToken(user: User, isRefreshToken: boolean) {
    const secret = isRefreshToken
      ? this.configService.get<string>('REFRESH_TOKEN_SECRET')
      : this.configService.get<string>('ACCESS_TOKEN_SECRET');

    return await this.jwtService.signAsync(
      { sub: user.id, role: user.role, type: isRefreshToken ? 'refresh' : 'access' },
      { secret, expiresIn: isRefreshToken ? '7d' : '15m' },
    );
  }

  async login(email: string, password: string) {
    const user = await this.authenticate(email, password);

    return {
      accessToken: await this.issueToken(user, false),
      refreshToken: await this.issueToken(user, true),
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    if (payload.type !== 'refresh') {
      throw new BadRequestException('Refresh 토큰이 아닙니다!');
    }

    const user = await this.userRepository.findOne(payload.sub);
    if (!user) {
      throw new BadRequestException('유효하지 않은 사용자입니다!');
    }

    return this.issueToken(user, false);
  }
}
   */
