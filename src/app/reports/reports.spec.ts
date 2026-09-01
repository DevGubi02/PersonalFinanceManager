import { Reports } from './reports';

describe('Reports', () => {
  it('should format ISO timestamps to date-only values for the table', () => {
    const component = new Reports({} as any);

    expect(component.formatDateOnly('2026-09-01T12:30:00.000Z')).toBe('2026-09-01');
    expect(component.formatDateOnly('2026-09-01')).toBe('2026-09-01');
  });
});
