import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.location.findMany({ orderBy: [{ country: 'asc' }, { city: 'asc' }] });
  }
}
