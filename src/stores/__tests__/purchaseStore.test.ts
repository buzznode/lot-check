import { usePurchaseStore } from '../purchaseStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

function store() {
  return usePurchaseStore.getState();
}

beforeEach(() => {
  usePurchaseStore.setState({ purchases: [], isUnlocked: false });
});

describe('addPurchase', () => {
  it('adds the record to purchases', () => {
    store().addPurchase({ id: 'p1', platform: 'ios' as const, productId: 'pdf_export', transactionId: 'txn-1', purchasedAt: '2026-04-17', verified: true });
    expect(store().purchases).toHaveLength(1);
    expect(store().purchases[0].id).toBe('p1');
  });

  it('sets isUnlocked to true', () => {
    store().addPurchase({ id: 'p1', platform: 'ios' as const, productId: 'pdf_export', transactionId: 'txn-1', purchasedAt: '2026-04-17', verified: true });
    expect(store().isUnlocked).toBe(true);
  });
});

describe('restorePurchases', () => {
  it('sets isUnlocked true when a verified purchase exists', async () => {
    usePurchaseStore.setState({
      purchases: [{ id: 'p1', platform: 'ios' as const, productId: 'pdf_export', transactionId: 'txn-1', purchasedAt: '2026-04-17', verified: true }],
      isUnlocked: false,
    });
    await store().restorePurchases();
    expect(store().isUnlocked).toBe(true);
  });

  it('sets isUnlocked false when no purchases are verified', async () => {
    usePurchaseStore.setState({
      purchases: [{ id: 'p1', platform: 'ios' as const, productId: 'pdf_export', transactionId: 'txn-1', purchasedAt: '2026-04-17', verified: false }],
      isUnlocked: true,
    });
    await store().restorePurchases();
    expect(store().isUnlocked).toBe(false);
  });

  it('sets isUnlocked false when purchases list is empty', async () => {
    usePurchaseStore.setState({ purchases: [], isUnlocked: true });
    await store().restorePurchases();
    expect(store().isUnlocked).toBe(false);
  });
});
