import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.media.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
