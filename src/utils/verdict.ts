import type { InspectionItem, InspectionSummary, Verdict } from '../types';

export function computeSummary(items: InspectionItem[]): InspectionSummary {
  const checked = items.filter(i => i.checked);
  const walkAwayCount = checked.filter(i => i.flagged && i.severity === 'walk_away').length;
  const negotiateCount = checked.filter(i => i.flagged && i.severity === 'negotiate').length;
  const passCount = checked.filter(i => !i.flagged).length;

  let verdict: Verdict = 'pass';
  if (walkAwayCount > 0) verdict = 'walk_away';
  else if (negotiateCount > 0) verdict = 'caution';

  return { walkAwayCount, negotiateCount, passCount, totalChecked: checked.length, totalItems: items.length, verdict };
}

export function verdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case 'pass':      return 'Looks good';
    case 'caution':   return 'Proceed with caution';
    case 'walk_away': return 'Walk away';
  }
}
