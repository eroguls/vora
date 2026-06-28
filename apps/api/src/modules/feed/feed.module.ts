import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [ContentModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
