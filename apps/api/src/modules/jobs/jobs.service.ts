import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { loadEnv } from '@vora/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private readonly env = loadEnv();
  private readonly storage: Client;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    const endpoint = new URL(this.env.S3_ENDPOINT);
    this.storage = new Client({
      endPoint: endpoint.hostname,
      port: endpoint.port ? Number(endpoint.port) : endpoint.protocol === 'https:' ? 443 : 80,
      useSSL: endpoint.protocol === 'https:',
      accessKey: this.env.S3_ACCESS_KEY,
      secretKey: this.env.S3_SECRET_KEY,
      region: this.env.S3_REGION,
    });
  }

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.processPending().catch((error) => this.logger.error(error));
    }, 15_000);
  }

  list(userId: string) {
    return this.prisma.processingJob.findMany({ where: { content: { authorId: userId } }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async retry(userId: string, id: string) {
    await this.prisma.processingJob.updateMany({ where: { id, content: { authorId: userId } }, data: { status: 'PENDING', attempts: 0, error: null } });
    return { ok: true };
  }

  async processPending() {
    const jobs = await this.prisma.processingJob.findMany({
      where: { status: 'PENDING' },
      include: { content: true, media: true },
      take: 10,
      orderBy: { createdAt: 'asc' },
    });

    for (const job of jobs) {
      await this.prisma.processingJob.update({ where: { id: job.id }, data: { status: 'PROCESSING', attempts: { increment: 1 } } });
      try {
        if (job.mediaId) {
          await this.processMedia(job.mediaId);
        }
        if (job.contentId) {
          await this.prisma.content.update({ where: { id: job.contentId }, data: { metadata: { ...(job.content?.metadata as object), processingStatus: 'READY' } } });
        }
        await this.prisma.processingJob.update({ where: { id: job.id }, data: { status: 'READY', error: null } });
        if (job.content?.authorId) {
          await this.notifications.create({
            recipientId: job.content.authorId,
            contentId: job.contentId,
            type: 'MEDIA_PROCESSING_COMPLETED',
            title: 'Medya işleme tamamlandı',
            href: job.contentId ? `/content/${job.contentId}` : null,
          });
        }
      } catch (error) {
        await this.prisma.processingJob.update({ where: { id: job.id }, data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown processing error' } });
        if (job.content?.authorId) {
          await this.notifications.create({
            recipientId: job.content.authorId,
            contentId: job.contentId,
            type: 'MEDIA_PROCESSING_FAILED',
            title: 'Medya işleme başarısız',
            body: error instanceof Error ? error.message : 'Bilinmeyen hata',
            href: job.contentId ? `/content/${job.contentId}` : null,
          });
        }
      }
    }

    return { processed: jobs.length };
  }

  private async processMedia(mediaId: string) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return;

    if (media.mediaType !== 'IMAGE') {
      await this.prisma.media.update({
        where: { id: media.id },
        data: {
          processingStatus: 'READY',
          metadata: { ...(media.metadata as object), processingNote: 'Video/audio transcoding worker is not enabled in development.' },
        },
      });
      return;
    }

    const image = await this.readObject(media.storageKey);
    const pipeline = sharp(image).rotate();
    const metadata = await pipeline.metadata();
    const thumbnail = await sharp(image).rotate().resize({ width: 960, height: 960, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const thumbnailKey = `thumbnails/${media.ownerId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.webp`;
    await this.storage.putObject(this.env.S3_BUCKET, thumbnailKey, thumbnail, thumbnail.length, { 'Content-Type': 'image/webp' });

    await this.prisma.media.update({
      where: { id: media.id },
      data: {
        width: metadata.width ?? media.width,
        height: metadata.height ?? media.height,
        thumbnailUrl: `${this.env.PUBLIC_MEDIA_BASE_URL}/${thumbnailKey}`,
        processingStatus: 'READY',
        metadata: {
          ...(media.metadata as object),
          format: metadata.format,
          colorSpace: metadata.space,
          hasAlpha: metadata.hasAlpha,
          processedAt: new Date().toISOString(),
        },
      },
    });
  }

  private async readObject(storageKey: string) {
    const stream = await this.storage.getObject(this.env.S3_BUCKET, storageKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
  }
}
