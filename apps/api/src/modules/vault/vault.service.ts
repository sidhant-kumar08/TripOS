import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { UploadFileDto, UpdateFileDto } from './dtos/vault.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class VaultService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateVault(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    let vault = await this.prisma.tripVault.findUnique({
      where: { tripId },
    });

    if (!vault) {
      vault = await this.prisma.tripVault.create({
        data: {
          tripId,
        },
      });
    }

    return vault;
  }

  async uploadFile(tripId: string, userId: string, dto: UploadFileDto, fileBuffer?: Buffer) {
    await this.verifyTripMembership(tripId, userId);

    // Get or create vault
    const vault = await this.getOrCreateVault(tripId, userId);

    // Generate storage key (in real implementation, upload to S3)
    const storageKey = `vaults/${tripId}/files/${randomUUID()}`;

    // For now, we'll just store metadata
    // TODO: Integrate with S3-compatible storage
    
    const file = await this.prisma.vaultFile.create({
      data: {
        vaultId: vault.id,
        name: dto.name,
        mimeType: dto.mimeType,
        size: dto.size || (fileBuffer?.length || 0),
        storageKey,
      },
    });

    return this.formatFile(file);
  }

  async listFiles(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const vault = await this.prisma.tripVault.findUnique({
      where: { tripId },
      include: {
        files: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vault) {
      return [];
    }

    return vault.files.map((f: any) => this.formatFile(f));
  }

  async getFile(tripId: string, fileId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const vault = await this.prisma.tripVault.findUnique({
      where: { tripId },
    });

    if (!vault) {
      throw new NotFoundException('Trip vault not found');
    }

    const file = await this.prisma.vaultFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.vaultId !== vault.id) {
      throw new NotFoundException('File not found');
    }

    return this.formatFile(file);
  }

  async deleteFile(tripId: string, fileId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const vault = await this.prisma.tripVault.findUnique({
      where: { tripId },
    });

    if (!vault) {
      throw new NotFoundException('Trip vault not found');
    }

    const file = await this.prisma.vaultFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.vaultId !== vault.id) {
      throw new NotFoundException('File not found');
    }

    // TODO: Delete from S3
    
    await this.prisma.vaultFile.delete({
      where: { id: fileId },
    });

    return { success: true };
  }

  async updateFile(tripId: string, fileId: string, userId: string, dto: UpdateFileDto) {
    await this.verifyTripMembership(tripId, userId);

    const vault = await this.prisma.tripVault.findUnique({
      where: { tripId },
    });

    if (!vault) {
      throw new NotFoundException('Trip vault not found');
    }

    const file = await this.prisma.vaultFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.vaultId !== vault.id) {
      throw new NotFoundException('File not found');
    }

    const updated = await this.prisma.vaultFile.update({
      where: { id: fileId },
      data: {
        name: dto.name,
      },
    });

    return this.formatFile(updated);
  }

  private async verifyTripMembership(tripId: string, userId: string) {
    const membership = await this.prisma.tripRole.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this trip');
    }
  }

  private formatFile(file: any) {
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: file.createdAt,
    };
  }
}
