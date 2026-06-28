import { describe, expect, it } from 'vitest';
import { RuleBasedContentClassifier } from '../src';

const classifier = new RuleBasedContentClassifier();

describe('RuleBasedContentClassifier', () => {
  it('classifies short text without media', () => {
    const result = classifier.classify({ body: 'Kyoto sabahları sessiz ve çok düzenli.', media: [] });
    expect(result.contentType).toBe('SHORT_TEXT');
  });

  it('classifies a single image as photo', () => {
    const result = classifier.classify({
      body: 'İstanbulda gün doğumu.',
      media: [{ mediaType: 'IMAGE', width: 1200, height: 900 }],
    });
    expect(result.contentType).toBe('PHOTO');
  });

  it('classifies multiple images as gallery', () => {
    const result = classifier.classify({
      media: [
        { mediaType: 'IMAGE', width: 1200, height: 900 },
        { mediaType: 'IMAGE', width: 1200, height: 900 },
      ],
    });
    expect(result.contentType).toBe('GALLERY');
  });

  it('classifies long horizontal video as long video', () => {
    const result = classifier.classify({
      title: 'Amerikada ikinci el araç almak',
      body: 'Deneyimlerimi anlattım.',
      media: [{ mediaType: 'VIDEO', duration: 2100, width: 1920, height: 1080 }],
    });
    expect(result.contentType).toBe('LONG_VIDEO');
  });

  it('classifies titled long text as article', () => {
    const body = Array.from({ length: 260 }, (_, index) => `kelime${index}`).join(' ');
    const result = classifier.classify({ title: 'Almanyada öğrenci olmak', body, media: [] });
    expect(result.contentType).toBe('ARTICLE');
  });
});
