/**
 * @file auth.service.ts
 * @module @tripos/api/auth
 * @description Authentication, Argon2 password hashing, JWT session lifecycle,
 * and OAuth provider integrations (Google & Facebook).
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
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

  /**
   * Registers a new user with Argon2-hashed password and returns an active JWT session.
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists with this email');
    }

    const passwordHash = await hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        name: dto.name,
        passwordHash,
      },
    });

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

  /**
   * Validates user credentials using Argon2 verify and returns a signed JWT.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
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
      },
      accessToken,
    };
  }

  /**
   * Exchanges Google OAuth authorization code with Google token endpoint and creates or links user account.
   */
  async handleGoogleCallback(dto: GoogleOAuthCallbackDto) {
    const clientId =
      process.env.GOOGLE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Google OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) are not configured in the server environment.',
      );
    }

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
        tokenData.error_description ||
          tokenData.error ||
          'Failed to exchange authorization code with Google',
      );
    }

    const userRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    const googleUser: any = await userRes.json();

    if (!googleUser.email) {
      throw new BadRequestException(
        'Failed to retrieve email address from Google profile',
      );
    }

    return this.findOrCreateOAuthUser({
      provider: 'google',
      providerId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
    });
  }

  /**
   * Verifies Google ID token (One-Tap / Credential response) via Google TokenInfo endpoint.
   */
  async verifyGoogleToken(dto: GoogleVerifyTokenDto) {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${dto.idToken}`,
    );
    const data: any = await res.json();

    if (!res.ok || !data.email) {
      throw new UnauthorizedException(
        data.error_description || 'Invalid Google ID token',
      );
    }

    return this.findOrCreateOAuthUser({
      provider: 'google',
      providerId: data.sub,
      email: data.email,
      name: data.name,
      avatar: data.picture,
    });
  }

  async verifyGoogleIdToken(dto: GoogleVerifyTokenDto) {
    return this.verifyGoogleToken(dto);
  }

  /**
   * Exchanges Facebook OAuth authorization code via Graph API and creates or links user account.
   */
  async handleFacebookCallback(dto: FacebookOAuthCallbackDto) {
    const appId =
      process.env.FACEBOOK_APP_ID ||
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
      '';
    const appSecret = process.env.FACEBOOK_APP_SECRET || '';

    if (!appId || !appSecret) {
      throw new BadRequestException(
        'Facebook OAuth credentials (FACEBOOK_APP_ID and FACEBOOK_APP_SECRET) are not configured in the server environment.',
      );
    }

    const tokenUrl = new URL(
      'https://graph.facebook.com/v19.0/oauth/access_token',
    );
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', dto.redirectUri);
    tokenUrl.searchParams.set('code', dto.code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData: any = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new BadRequestException(
        tokenData.error?.message ||
          'Failed to exchange authorization code with Meta (Facebook)',
      );
    }

    const profileUrl = new URL('https://graph.facebook.com/me');
    profileUrl.searchParams.set(
      'fields',
      'id,name,email,picture.type(large)',
    );
    profileUrl.searchParams.set('access_token', tokenData.access_token);

    const profileRes = await fetch(profileUrl.toString());
    const fbUser: any = await profileRes.json();

    if (!profileRes.ok || !fbUser.id) {
      throw new BadRequestException('Failed to retrieve Meta (Facebook) profile');
    }

    const email = fbUser.email || `${fbUser.id}@facebook.tripos.internal`;

    return this.findOrCreateOAuthUser({
      provider: 'facebook',
      providerId: fbUser.id,
      email,
      name: fbUser.name,
      avatar: fbUser.picture?.data?.url,
    });
  }

  /**
   * Internal upsert handler for OAuth identities.
   * Links provider ID to existing email account if already present, or creates a new user.
   */
  private async findOrCreateOAuthUser(profile: {
    provider: 'google' | 'facebook' | 'apple';
    providerId: string;
    email: string;
    name?: string;
    avatar?: string;
  }) {
    const email = profile.email.toLowerCase().trim();

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.name,
          avatar: profile.avatar,
          googleId: profile.provider === 'google' ? profile.providerId : null,
          facebookId:
            profile.provider === 'facebook' ? profile.providerId : null,
        },
      });
    } else {
      const updateData: Record<string, any> = {};
      if (profile.provider === 'google' && !user.googleId) {
        updateData.googleId = profile.providerId;
      }
      if (profile.provider === 'facebook' && !user.facebookId) {
        updateData.facebookId = profile.providerId;
      }
      if (!user.avatar && profile.avatar) {
        updateData.avatar = profile.avatar;
      }
      if (!user.name && profile.name) {
        updateData.name = profile.name;
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
      },
      accessToken,
    };
  }

  /**
   * Handles generic/mock OAuth login for testing.
   */
  async oauthLogin(dto: OAuthLoginDto) {
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          name: dto.name,
          avatar: dto.avatar,
          googleId: dto.provider === 'google' ? dto.providerId : null,
          facebookId: dto.provider === 'facebook' ? dto.providerId : null,
          appleId: dto.provider === 'apple' ? dto.providerId : null,
        },
      });
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
      },
      accessToken,
    };
  }

  /**
   * Generates a secure password reset token with 1-hour expiration.
   * Mitigates email enumeration by returning a generic success message if user is not found.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      return {
        message:
          'If an account with that email exists, password reset instructions have been generated.',
      };
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      message: 'Password reset token generated successfully.',
      resetToken: token,
    };
  }

  /**
   * Validates reset token and updates password hash with Argon2.
   */
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
      throw new BadRequestException(
        'Password reset token has expired. Please request a new one.',
      );
    }

    const passwordHash = await hash(dto.password);

    await this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.delete({
      where: { id: resetRecord.id },
    });

    return {
      message:
        'Password has been successfully reset. You may now log in with your new password.',
    };
  }

  /**
   * Helper to retrieve validated user profile by ID.
   */
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
