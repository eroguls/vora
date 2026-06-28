import { HealthController } from '../src/modules/health/health.controller';

describe('HealthController', () => {
  it('returns ok status', () => {
    const result = new HealthController().health();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('vora-api');
  });
});
