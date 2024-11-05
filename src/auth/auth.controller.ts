import {
  Controller,
  Get,
  Headers,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }

  @Public()
  @Post('login')
  loginUser(@Headers('authorization') token: string) {
    return this.authService.login(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Request() req) {
    return {
      accessToken: await this.authService.issueToken(
        { id: req.user.sub, role: req.user.role },
        false,
      ),
    };
  }

  // @UseGuards(LocalAuthGuard)
  // @Post('login/passport')
  // async loginUserPassport(@Request() req) {
  //   return {
  //     refreshToken: await this.authService.issueToken(req.user, true),
  //     accessToken: await this.authService.issueToken(req.user, false),
  //   };
  // }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  async private(@Request() req) {
    return req.user;
  }
}

/*
귀찮게 basic토큰 없이 일반적으로 할 때
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.register(email, password);
  }

  @Post('login')
  loginUser(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.login(email, password);
  }

  @Post('refresh-token')
  async refreshAccessToken(@Headers('authorization') refreshToken: string) {
    const token = refreshToken.replace('Bearer ', '');
    return {
      accessToken: await this.authService.refreshAccessToken(token),
    };
  }
}
 */
