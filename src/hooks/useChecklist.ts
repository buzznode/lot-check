import { useMemo } from 'react';
import checklistData from '../data/checklist.json';
import type { ChecklistCategory, ChecklistTemplateItem } from '../types';

const categories = checklistData as ChecklistCategory[];

export function useChecklist() {
  const allItems = useMemo<ChecklistTemplateItem[]>(
    () => categories.flatMap(c => c.items), []
  );
  const itemMap = useMemo(
    () => Object.fromEntries(allItems.map(i => [i.id, i])), [allItems]
  );
  return { categories, allItems, itemMap };
}
