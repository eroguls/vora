import { Module } from '@nestjs/common';
import { SocialGraphController } from './social-graph.controller';
import { SocialGraphService } from './social-graph.service';

@Module({
  controllers: [SocialGraphController],
  providers: [SocialGraphService],
})
export class SocialGraphModule {}
