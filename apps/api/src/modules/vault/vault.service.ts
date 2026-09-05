import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { SupabaseStorageService } from '@/common/services/supabase-storage.service';
import { UploadFileDto, UpdateFileDto } from './dtos/vault.dto';
import { randomUUID } from 'crypto';

const VAULT_BUCKET = process.env.SUPABASE_VAULT_BUCKET || 'trip-vault';

@Injectable()
export class VaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

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

    // Sanitize file name
    const sanitizedName = dto.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageKey = `vaults/${tripId}/${randomUUID()}-${sanitizedName}`;

    let bufferToUpload = fileBuffer;
    if (!bufferToUpload && dto.fileData) {
      try {
        // Strip data url header if present (e.g. data:application/pdf;base64,...)
        const base64Data = dto.fileData.includes(',')
          ? dto.fileData.split(',')[1]
          : dto.fileData;
        bufferToUpload = Buffer.from(base64Data, 'base64');
      } catch {
        bufferToUpload = undefined;
      }
    }

    const calculatedSize = dto.size || (bufferToUpload?.length || 0);

    // Upload to Supabase Storage if buffer is available and storage is enabled
    if (bufferToUpload) {
      await this.storage.uploadFile(
        VAULT_BUCKET,
        storageKey,
        bufferToUpload,
        dto.mimeType || 'application/octet-stream',
      );
    }

    const file = await this.prisma.vaultFile.create({
      data: {
        vaultId: vault.id,
        name: dto.name,
        mimeType: dto.mimeType,
        size: calculatedSize,
        storageKey,
      },
    });

    const downloadUrl = await this.storage.getSignedUrl(VAULT_BUCKET, storageKey);

    return this.formatFile(file, downloadUrl);
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

    return Promise.all(
      vault.files.map(async (f: any) => {
        const downloadUrl = await this.storage.getSignedUrl(VAULT_BUCKET, f.storageKey);
        return this.formatFile(f, downloadUrl);
      }),
    );
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

    const downloadUrl = await this.storage.getSignedUrl(VAULT_BUCKET, file.storageKey);

    return this.formatFile(file, downloadUrl);
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

    // Delete from Supabase Storage
    if (file.storageKey) {
      await this.storage.deleteFile(VAULT_BUCKET, file.storageKey);
    }

    // Delete from Prisma Database
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

    const downloadUrl = await this.storage.getSignedUrl(VAULT_BUCKET, updated.storageKey);

    return this.formatFile(updated, downloadUrl);
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

  private formatFile(file: any, downloadUrl?: string | null) {
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      storageKey: file.storageKey,
      downloadUrl: downloadUrl || null,
      createdAt: file.createdAt,
    };
  }
}
