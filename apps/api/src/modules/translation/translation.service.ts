import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { loadEnv } from '@vora/config';

export interface TranslationProvider {
  detectLanguage(text: string): Promise<string>;
  translate(text: string, targetLanguage: string): Promise<string>;
}

class MockTranslationProvider implements TranslationProvider {
  async detectLanguage(text: string) {
    return /[ığüşöçİĞÜŞÖÇ]/.test(text) ? 'tr' : 'en';
  }

  async translate(text: string, targetLanguage: string) {
    return `[${targetLanguage} development translation] ${text}`;
  }
}

@Injectable()
export class TranslationService {
  private readonly env = loadEnv();
  private readonly provider: TranslationProvider = new MockTranslationProvider();

  constructor(private readonly prisma: PrismaService) {}

  async translate(contentId: string, targetLanguage: string) {
    const existing = await this.prisma.translation.findUnique({ where: { contentId_language_provider: { contentId, language: targetLanguage, provider: this.env.TRANSLATION_PROVIDER } } });
    if (existing) return existing;
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Content not found.');
    const title = content.title ? await this.provider.translate(content.title, targetLanguage) : null;
    const body = content.body ? await this.provider.translate(content.body, targetLanguage) : null;
    return this.prisma.translation.create({ data: { contentId, language: targetLanguage, provider: this.env.TRANSLATION_PROVIDER, title, body } });
  }
}
