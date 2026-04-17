import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PurchaseRecord } from '../types';

interface PurchaseStore {
  purchases: PurchaseRecord[];
  isUnlocked: boolean;
  addPurchase: (record: PurchaseRecord) => void;
  restorePurchases: () => Promise<void>;
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    (set, get) => ({
      purchases: [],
      isUnlocked: false,
      addPurchase: (record) => {
        set(s => ({ purchases: [...s.purchases, record], isUnlocked: true }));
      },
      restorePurchases: async () => {
        const { purchases } = get();
        set({ isUnlocked: purchases.some(p => p.verified) });
      },
    }),
    { name: 'lotcheck-purchases', storage: createJSONStorage(() => AsyncStorage) }
  )
);
