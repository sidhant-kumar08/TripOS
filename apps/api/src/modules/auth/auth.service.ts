import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/common/services/prisma.service';
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists with this email');
    }

    // Hash password
    const passwordHash = await hash(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        name: dto.name,
        passwordHash,
      },
    });

    // Generate JWT token
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('This account was created with OAuth (Google/Facebook). Please sign in using that provider.');
    }

    // Verify password
    const passwordValid = await verify(user.passwordHash, dto.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
    };
  }

  async handleGoogleCallback(dto: GoogleOAuthCallbackDto) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Google OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) are not configured in the server environment.'
      );
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: dto.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: dto.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData: any = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new BadRequestException(
        tokenData.error_description || tokenData.error || 'Failed to exchange authorization code with Google'
      );
    }

    // Fetch user profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser: any = await userRes.json();

    if (!googleUser.email) {
      throw new BadRequestException('Failed to retrieve email address from Google profile');
    }

    return this.findOrCreateOAuthUser({
      provider: 'google',
      providerId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split('@')[0],
      avatar: googleUser.picture || null,
    });
  }

  async verifyGoogleIdToken(dto: GoogleVerifyTokenDto) {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${dto.idToken}`);
    const payload: any = await res.json();

    if (!res.ok || payload.error || !payload.email) {
      throw new UnauthorizedException(payload.error_description || 'Invalid or expired Google ID Token');
    }

    return this.findOrCreateOAuthUser({
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture || null,
    });
  }

  async handleFacebookCallback(dto: FacebookOAuthCallbackDto) {
    const appId = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';
    const appSecret = process.env.FACEBOOK_APP_SECRET || '';

    if (!appId || !appSecret) {
      throw new BadRequestException(
        'Facebook App credentials (FACEBOOK_APP_ID and FACEBOOK_APP_SECRET) are not configured in the server environment.'
      );
    }

    // Exchange authorization code for user access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', dto.redirectUri);
    tokenUrl.searchParams.set('code', dto.code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData: any = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new BadRequestException(
        tokenData.error?.message || 'Failed to exchange authorization code with Facebook'
      );
    }

    // Fetch user profile from Facebook Graph API
    const userUrl = new URL('https://graph.facebook.com/me');
    userUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
    userUrl.searchParams.set('access_token', tokenData.access_token);

    const userRes = await fetch(userUrl.toString());
    const fbUser: any = await userRes.json();

    const email = fbUser.email || `${fbUser.id}@facebook.user`;
    const avatar = fbUser.picture?.data?.url || null;

    return this.findOrCreateOAuthUser({
      provider: 'facebook',
      providerId: fbUser.id,
      email,
      name: fbUser.name || 'Facebook User',
      avatar,
    });
  }

  private async findOrCreateOAuthUser(data: {
    provider: 'google' | 'facebook' | 'apple';
    providerId: string;
    email: string;
    name: string;
    avatar: string | null;
  }) {
    const email = data.email.toLowerCase().trim();

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: data.name,
          avatar: data.avatar,
          googleId: data.provider === 'google' ? data.providerId : null,
          facebookId: data.provider === 'facebook' ? data.providerId : null,
          appleId: data.provider === 'apple' ? data.providerId : null,
        },
      });
    } else {
      const updateData: any = {};
      if (data.provider === 'google' && !user.googleId) {
        updateData.googleId = data.providerId;
      } else if (data.provider === 'facebook' && !user.facebookId) {
        updateData.facebookId = data.providerId;
      } else if (data.provider === 'apple' && !user.appleId) {
        updateData.appleId = data.providerId;
      }

      if (data.avatar) {
        updateData.avatar = data.avatar;
      }
      if (!user.name && data.name) {
        updateData.name = data.name;
      }

      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        googleId: user.googleId,
        facebookId: user.facebookId,
      },
      accessToken,
    };
  }

  async oauthLogin(dto: OAuthLoginDto) {
    const email = dto.email.toLowerCase().trim();
    const providerId = dto.providerId || `${dto.provider}_${Date.now()}`;

    return this.findOrCreateOAuthUser({
      provider: dto.provider,
      providerId,
      email,
      name: dto.name || email.split('@')[0],
      avatar: dto.avatar || null,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success response to prevent email enumeration
      return {
        message: 'If an account with that email exists, password reset instructions have been generated.',
      };
    }

    // Delete existing tokens for user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a secure reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      message: 'Password reset token generated successfully.',
      resetToken: token, // Sent so frontend dev / user can immediately paste/use or follow direct reset URL
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (new Date() > resetRecord.expiresAt) {
      await this.prisma.passwordResetToken.delete({
        where: { id: resetRecord.id },
      });
      throw new BadRequestException('Password reset token has expired. Please request a new one.');
    }

    // Hash new password
    const passwordHash = await hash(dto.password);

    // Update user password
    await this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    // Delete used reset token
    await this.prisma.passwordResetToken.delete({
      where: { id: resetRecord.id },
    });

    return {
      message: 'Password has been successfully reset. You may now log in with your new password.',
    };
  }

  async validateUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      googleId: user.googleId,
      facebookId: user.facebookId,
      createdAt: user.createdAt,
    };
  }
}
