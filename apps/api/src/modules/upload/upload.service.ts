import { BadRequestException, Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { randomUUID } from 'node:crypto';
import { uploadRequestSchema } from '@vora/validation';
import { loadEnv } from '@vora/config';

const blockedExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.msi', '.ps1', '.sh'];

@Injectable()
export class UploadService {
  private readonly env = loadEnv();
  private readonly client: Client;
  private bucketReady = false;
  private bucketReadyPromise?: Promise<void>;

  constructor() {
    const endpoint = new URL(this.env.S3_ENDPOINT);
    this.client = new Client({
      endPoint: endpoint.hostname,
      port: endpoint.port ? Number(endpoint.port) : endpoint.protocol === 'https:' ? 443 : 80,
      useSSL: endpoint.protocol === 'https:',
      accessKey: this.env.S3_ACCESS_KEY,
      secretKey: this.env.S3_SECRET_KEY,
      region: this.env.S3_REGION,
    });
  }

  async presign(userId: string, body: unknown) {
    const input = uploadRequestSchema.parse(body);
    if (!this.allowedMime(input.contentType)) throw new BadRequestException('Unsupported file type.');
    if (blockedExtensions.some((ext) => input.fileName.toLowerCase().endsWith(ext))) throw new BadRequestException('Blocked file extension.');
    await this.ensureBucket();
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
    const storageKey = `uploads/${userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
    const uploadUrl = await this.client.presignedPutObject(this.env.S3_BUCKET, storageKey, 60 * 15);
    return {
      uploadUrl,
      storageKey,
      publicUrl: `${this.env.PUBLIC_MEDIA_BASE_URL}/${storageKey}`,
      mediaType: this.mediaType(input.contentType),
      expiresIn: 900,
    };
  }

  private async ensureBucket() {
    if (this.bucketReady) return;
    this.bucketReadyPromise ??= this.createBucketIfNeeded();
    await this.bucketReadyPromise;
  }

  private async createBucketIfNeeded() {
    try {
      const exists = await this.client.bucketExists(this.env.S3_BUCKET).catch(() => false);
      if (!exists) await this.client.makeBucket(this.env.S3_BUCKET, this.env.S3_REGION);
      this.bucketReady = true;
    } catch (error) {
      if (this.isBucketAlreadyOwnedError(error)) {
        this.bucketReady = true;
        return;
      }
      this.bucketReadyPromise = undefined;
      throw error;
    }
  }

  private isBucketAlreadyOwnedError(error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
    const message = error instanceof Error ? error.message : '';
    return code === 'BucketAlreadyOwnedByYou' || code === 'BucketAlreadyExists' || /already own it|already exists/i.test(message);
  }

  private allowedMime(mime: string) {
    return /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp4|wav|ogg))$/.test(mime);
  }

  private mediaType(mime: string) {
    if (mime.startsWith('image/')) return 'IMAGE';
    if (mime.startsWith('video/')) return 'VIDEO';
    if (mime.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  }
}
