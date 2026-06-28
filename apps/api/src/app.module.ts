import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ContentModule } from './modules/content/content.module';
import { FeedModule } from './modules/feed/feed.module';
import { SearchModule } from './modules/search/search.module';
import { InteractionModule } from './modules/interaction/interaction.module';
import { CommentsModule } from './modules/comments/comments.module';
import { SocialGraphModule } from './modules/social-graph/social-graph.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { TranslationModule } from './modules/translation/translation.module';
import { LocationsModule } from './modules/locations/locations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MediaModule } from './modules/media/media.module';
import { HealthModule } from './modules/health/health.module';
import { RequestLoggerMiddleware } from './common/http/request-logger.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.register({}),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ContentModule,
    FeedModule,
    SearchModule,
    InteractionModule,
    CommentsModule,
    SocialGraphModule,
    NotificationsModule,
    UploadModule,
    MediaModule,
    AdminModule,
    ModerationModule,
    MessagingModule,
    TranslationModule,
    LocationsModule,
    AnalyticsModule,
    JobsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
