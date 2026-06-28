import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    dto: {
      name?: string;
      username?: string;
      password?: string;
      role?: 'owner' | 'admin' | 'finance' | 'hr';
    },
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(
    @Body()
    dto: {
      username?: string;
      password?: string;
    },
  ) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: unknown }) {
    return req.user;
  }
}
