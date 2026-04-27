import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

const ENTITLEMENT_ID = 'pdf_export';

interface PurchaseStore {
  isUnlocked: boolean;
  checkEntitlement: () => Promise<void>;
  fetchAndPurchase: () => Promise<{ success: boolean; userCancelled: boolean; error?: string }>;
  restorePurchases: () => Promise<boolean>;
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    (set) => ({
      isUnlocked: false,

      checkEntitlement: async () => {
        try {
          const info = await Purchases.getCustomerInfo();
          const unlocked = ENTITLEMENT_ID in info.entitlements.active;
          set({ isUnlocked: unlocked });
        } catch {
          // keep cached value if network unavailable
        }
      },

      fetchAndPurchase: async () => {
        try {
          const offerings = await Purchases.getOfferings();
          const pkg: PurchasesPackage | undefined =
            offerings.current?.availablePackages[0];
          if (!pkg) {
            return { success: false, userCancelled: false, error: 'Product unavailable. Try again later.' };
          }
          const { customerInfo } = await Purchases.purchasePackage(pkg);
          const unlocked = ENTITLEMENT_ID in customerInfo.entitlements.active;
          set({ isUnlocked: unlocked });
          return { success: unlocked, userCancelled: false };
        } catch (e: any) {
          if (e?.userCancelled) return { success: false, userCancelled: true };
          return { success: false, userCancelled: false, error: 'Purchase failed. Please try again.' };
        }
      },

      restorePurchases: async () => {
        try {
          const info = await Purchases.restorePurchases();
          const unlocked = ENTITLEMENT_ID in info.entitlements.active;
          set({ isUnlocked: unlocked });
          return unlocked;
        } catch {
          return false;
        }
      },
    }),
    { name: 'lotcheck-purchases', storage: createJSONStorage(() => AsyncStorage) }
  )
);
