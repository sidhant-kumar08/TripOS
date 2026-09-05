import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabase: SupabaseClient | null = null;
  private readonly isEnabled: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY');

    if (url && key) {
      this.supabase = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.isEnabled = true;
      this.logger.log('Supabase Storage client initialized successfully', 'Storage');
    } else {
      this.logger.warn(
        'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined. File uploads will run in metadata-only mode.',
        'Storage',
      );
    }
  }

  get isConfigured(): boolean {
    return this.isEnabled && this.supabase !== null;
  }

  /**
   * Uploads a file buffer to a specified Supabase bucket
   */
  async uploadFile(
    bucket: string,
    storagePath: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ path: string; fullPath?: string } | null> {
    if (!this.isConfigured || !this.supabase) {
      this.logger.warn(`Supabase not configured. Skipping physical upload for: ${storagePath}`);
      return { path: storagePath };
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Failed to upload ${storagePath} to bucket "${bucket}": ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Generates a temporary signed URL for private bucket file access
   */
  async getSignedUrl(
    bucket: string,
    storagePath: string,
    expiresInSeconds = 3600,
  ): Promise<string | null> {
    if (!this.isConfigured || !this.supabase) {
      return null;
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      this.logger.error(
        `Failed to generate signed URL for ${storagePath} in bucket "${bucket}": ${error.message}`,
      );
      return null;
    }

    return data?.signedUrl || null;
  }

  /**
   * Gets a public URL for public bucket files (e.g. avatars)
   */
  getPublicUrl(bucket: string, storagePath: string): string | null {
    if (!this.isConfigured || !this.supabase) {
      return null;
    }

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(storagePath);
    return data?.publicUrl || null;
  }

  /**
   * Deletes a file from a specified Supabase bucket
   */
  async deleteFile(bucket: string, storagePath: string): Promise<boolean> {
    if (!this.isConfigured || !this.supabase) {
      return true;
    }

    const { error } = await this.supabase.storage.from(bucket).remove([storagePath]);

    if (error) {
      this.logger.error(
        `Failed to delete ${storagePath} from bucket "${bucket}": ${error.message}`,
      );
      return false;
    }

    return true;
  }

  /**
   * Downloads a file buffer from Supabase storage
   */
  async downloadFile(bucket: string, storagePath: string): Promise<Buffer | null> {
    if (!this.isConfigured || !this.supabase) {
      return null;
    }

    const { data, error } = await this.supabase.storage.from(bucket).download(storagePath);

    if (error || !data) {
      this.logger.error(`Failed to download ${storagePath}: ${error?.message}`);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
