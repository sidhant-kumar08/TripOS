import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { hash, verify } from 'argon2';
import { PrismaService } from '@/common/services/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './dtos/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
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

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar.trim() || null }),
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

    return {
      message: 'Password updated successfully',
    };
  }
}
