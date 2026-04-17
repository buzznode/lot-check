import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Inspection, InspectionItem } from '../types';
import { generateId } from '../utils/uuid';
import { computeSummary } from '../utils/verdict';

interface InspectionStore {
  inspections: Inspection[];
  items: Record<string, InspectionItem[]>;
  createInspection: (year: number, make: string, model: string, askingPrice?: number) => Inspection;
  updateItem: (inspectionId: string, templateItemId: string, patch: Partial<InspectionItem>) => void;
  completeInspection: (inspectionId: string) => void;
  deleteInspection: (id: string) => void;
  getItems: (inspectionId: string) => InspectionItem[];
}

export const useInspectionStore = create<InspectionStore>()(
  persist(
    (set, get) => ({
      inspections: [],
      items: {},

      createInspection: (year, make, model, askingPrice) => {
        const inspection: Inspection = {
          id: generateId(), year, make, model, askingPrice,
          status: 'in_progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(s => ({ inspections: [inspection, ...s.inspections] }));
        return inspection;
      },

      updateItem: (inspectionId, templateItemId, patch) => {
        set(s => {
          const existing = s.items[inspectionId] ?? [];
          const idx = existing.findIndex(i => i.templateItemId === templateItemId);
          let updated: InspectionItem[];
          if (idx >= 0) {
            updated = existing.map((item, i) =>
              i === idx ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
            );
          } else {
            const newItem: InspectionItem = {
              id: generateId(), inspectionId, templateItemId,
              checked: false, flagged: false, photoUris: [],
              updatedAt: new Date().toISOString(), ...patch,
            };
            updated = [...existing, newItem];
          }
          return { items: { ...s.items, [inspectionId]: updated } };
        });
      },

      completeInspection: (inspectionId) => {
        const items = get().items[inspectionId] ?? [];
        const { verdict } = computeSummary(items);
        set(s => ({
          inspections: s.inspections.map(i =>
            i.id === inspectionId
              ? { ...i, status: 'complete', verdict, updatedAt: new Date().toISOString() }
              : i
          ),
        }));
      },

      deleteInspection: (id) => {
        set(s => {
          const { [id]: _, ...remainingItems } = s.items;
          return { inspections: s.inspections.filter(i => i.id !== id), items: remainingItems };
        });
      },

      getItems: (inspectionId) => get().items[inspectionId] ?? [],
    }),
    { name: 'lotcheck-inspections', storage: createJSONStorage(() => AsyncStorage) }
  )
);
