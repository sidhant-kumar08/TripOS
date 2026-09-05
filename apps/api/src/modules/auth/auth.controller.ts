import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  OAuthLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  GoogleOAuthCallbackDto,
  GoogleVerifyTokenDto,
  FacebookOAuthCallbackDto,
} from './dtos/auth.dto';
import { JwtGuard } from './guards/jwt.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth 2.0 authorization code callback' })
  async googleCallback(@Body() dto: GoogleOAuthCallbackDto) {
    return this.authService.handleGoogleCallback(dto);
  }

  @Post('google/verify-token')
  @ApiOperation({ summary: 'Verify Google ID Token from Google One-Tap' })
  async googleVerifyToken(@Body() dto: GoogleVerifyTokenDto) {
    return this.authService.verifyGoogleIdToken(dto);
  }

  @Post('facebook/callback')
  @ApiOperation({ summary: 'Handle Facebook OAuth 2.0 authorization code callback' })
  async facebookCallback(@Body() dto: FacebookOAuthCallbackDto) {
    return this.authService.handleFacebookCallback(dto);
  }

  @Post('oauth')
  @ApiOperation({ summary: 'Login or signup with OAuth (Google, Facebook, Apple)' })
  async oauth(@Body() dto: OAuthLoginDto) {
    return this.authService.oauthLogin(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset token' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: any) {
    return this.authService.validateUser(req.user.sub);
  }
}


