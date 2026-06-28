import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TranslationService } from './translation.service';

@ApiTags('translation')
@Controller('translation')
export class TranslationController {
  constructor(private readonly translation: TranslationService) {}

  @Post('content/:id')
  translate(@Param('id') id: string, @Body() body: { targetLanguage: string }) {
    return this.translation.translate(id, body.targetLanguage);
  }
}
