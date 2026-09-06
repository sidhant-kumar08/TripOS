import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { hash, verify } from 'argon2';
import { PrismaService } from '@/common/services/prisma.service';
import { MemoryCacheService } from '@/common/services/memory-cache.service';
import { SupabaseStorageService } from '@/common/services/supabase-storage.service';
import { UpdateProfileDto, ChangePasswordDto } from './dtos/users.dto';

const AVATARS_BUCKET = process.env.SUPABASE_AVATARS_BUCKET || 'avatars';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
    private readonly cache: MemoryCacheService,
  ) {}

  async getProfile(userId: string) {
    const cacheKey = `user:${userId}:profile`;
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        googleId: true,
        facebookId: true,
        appleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.cache.set(cacheKey, user, 60);
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let finalAvatar = dto.avatar !== undefined ? dto.avatar.trim() || null : user.avatar;

    // If a base64 data URL was provided, upload to Supabase avatars bucket
    if (finalAvatar && finalAvatar.startsWith('data:image/')) {
      try {
        const matches = finalAvatar.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const ext = contentType.split('/')[1] || 'png';
          const storagePath = `avatars/${userId}-${Date.now()}.${ext}`;

          await this.storage.uploadFile(AVATARS_BUCKET, storagePath, buffer, contentType);
          const publicUrl = this.storage.getPublicUrl(AVATARS_BUCKET, storagePath);
          if (publicUrl) {
            finalAvatar = publicUrl;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed uploading base64 avatar to Supabase: ${err.message}`);
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(finalAvatar !== undefined && { avatar: finalAvatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        googleId: true,
        facebookId: true,
        appleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.cache.invalidateUser(userId);
    return updated;
  }

  async uploadAvatarFile(userId: string, fileBuffer: Buffer, mimeType: string, originalName?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ext = mimeType.split('/')[1] || originalName?.split('.').pop() || 'png';
    const storagePath = `avatars/${userId}-${Date.now()}.${ext}`;

    await this.storage.uploadFile(AVATARS_BUCKET, storagePath, fileBuffer, mimeType);
    const publicUrl = this.storage.getPublicUrl(AVATARS_BUCKET, storagePath) || storagePath;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: publicUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    this.cache.invalidateUser(userId);
    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.passwordHash) {
      const isValid = await verify(user.passwordHash, dto.currentPassword);
      if (!isValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const newPasswordHash = await hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    this.cache.invalidateUser(userId);

    return {
      message: 'Password updated successfully',
    };
  }
}
