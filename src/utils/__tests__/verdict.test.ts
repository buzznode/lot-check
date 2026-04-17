import { computeSummary, verdictLabel } from '../verdict';
import type { InspectionItem } from '../../types';

function makeItem(overrides: Partial<InspectionItem> = {}): InspectionItem {
  return {
    id: 'item-1',
    inspectionId: 'insp-1',
    templateItemId: 'tmpl-1',
    checked: false,
    flagged: false,
    photoUris: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('computeSummary', () => {
  it('returns pass verdict when no items are checked', () => {
    const result = computeSummary([makeItem(), makeItem({ id: 'item-2', templateItemId: 'tmpl-2' })]);
    expect(result.verdict).toBe('pass');
    expect(result.totalChecked).toBe(0);
    expect(result.passCount).toBe(0);
  });

  it('returns pass verdict when checked items have no flags', () => {
    const result = computeSummary([makeItem({ checked: true }), makeItem({ id: 'item-2', templateItemId: 'tmpl-2', checked: true })]);
    expect(result.verdict).toBe('pass');
    expect(result.passCount).toBe(2);
    expect(result.walkAwayCount).toBe(0);
    expect(result.negotiateCount).toBe(0);
  });

  it('returns caution verdict when a negotiate flag is present', () => {
    const result = computeSummary([
      makeItem({ checked: true, flagged: true, severity: 'negotiate' }),
      makeItem({ id: 'item-2', templateItemId: 'tmpl-2', checked: true }),
    ]);
    expect(result.verdict).toBe('caution');
    expect(result.negotiateCount).toBe(1);
    expect(result.passCount).toBe(1);
  });

  it('returns walk_away verdict when a walk_away flag is present', () => {
    const result = computeSummary([
      makeItem({ checked: true, flagged: true, severity: 'walk_away' }),
    ]);
    expect(result.verdict).toBe('walk_away');
    expect(result.walkAwayCount).toBe(1);
  });

  it('walk_away takes priority over negotiate', () => {
    const result = computeSummary([
      makeItem({ checked: true, flagged: true, severity: 'walk_away' }),
      makeItem({ id: 'item-2', templateItemId: 'tmpl-2', checked: true, flagged: true, severity: 'negotiate' }),
    ]);
    expect(result.verdict).toBe('walk_away');
    expect(result.walkAwayCount).toBe(1);
    expect(result.negotiateCount).toBe(1);
  });

  it('counts are accurate across mixed items', () => {
    const items = [
      makeItem({ id: 'a', templateItemId: 'ta', checked: true, flagged: true, severity: 'walk_away' }),
      makeItem({ id: 'b', templateItemId: 'tb', checked: true, flagged: true, severity: 'negotiate' }),
      makeItem({ id: 'c', templateItemId: 'tc', checked: true, flagged: true, severity: 'negotiate' }),
      makeItem({ id: 'd', templateItemId: 'td', checked: true }),
      makeItem({ id: 'e', templateItemId: 'te' }),
    ];
    const result = computeSummary(items);
    expect(result.walkAwayCount).toBe(1);
    expect(result.negotiateCount).toBe(2);
    expect(result.passCount).toBe(1);
    expect(result.totalChecked).toBe(4);
    expect(result.totalItems).toBe(5);
  });
});

describe('verdictLabel', () => {
  it('returns "Looks good" for pass', () => {
    expect(verdictLabel('pass')).toBe('Looks good');
  });

  it('returns "Proceed with caution" for caution', () => {
    expect(verdictLabel('caution')).toBe('Proceed with caution');
  });

  it('returns "Walk away" for walk_away', () => {
    expect(verdictLabel('walk_away')).toBe('Walk away');
  });
});
