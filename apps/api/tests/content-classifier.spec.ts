import { RuleBasedContentClassifier } from '@vora/content-engine';

describe('content classifier integration contract', () => {
  const classifier = new RuleBasedContentClassifier();

  it('returns SHORT_TEXT for short text', () => {
    expect(classifier.classify({ body: 'Kısa bir not', media: [] }).contentType).toBe('SHORT_TEXT');
  });

  it('returns LONG_VIDEO for long video', () => {
    expect(
      classifier.classify({
        title: 'Uzun video',
        body: 'Açıklama',
        media: [{ mediaType: 'VIDEO', duration: 1200, width: 1920, height: 1080 }],
      }).contentType,
    ).toBe('LONG_VIDEO');
  });
});
