import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/request-user';
import { UploadService } from './upload.service';

@ApiBearerAuth()
@ApiTags('upload')
@UseGuards(AuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post('presign')
  presign(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.upload.presign(user.id, body);
  }
}
