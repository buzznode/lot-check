import AsyncStorage from '@react-native-async-storage/async-storage';
import { useInspectionStore } from '../inspectionStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

function store() {
  return useInspectionStore.getState();
}

beforeEach(() => {
  useInspectionStore.setState({ inspections: [], items: {} });
  (AsyncStorage.clear as jest.Mock).mockClear();
});

describe('createInspection', () => {
  it('adds the inspection to the list', () => {
    store().createInspection(2019, 'Toyota', 'Camry');
    expect(store().inspections).toHaveLength(1);
    const insp = store().inspections[0];
    expect(insp.year).toBe(2019);
    expect(insp.make).toBe('Toyota');
    expect(insp.model).toBe('Camry');
  });

  it('sets status to in_progress', () => {
    store().createInspection(2020, 'Honda', 'Civic');
    expect(store().inspections[0].status).toBe('in_progress');
  });

  it('stores askingPrice when provided', () => {
    store().createInspection(2021, 'Ford', 'F-150', 32000);
    expect(store().inspections[0].askingPrice).toBe(32000);
  });

  it('askingPrice is undefined when omitted', () => {
    store().createInspection(2021, 'Ford', 'F-150');
    expect(store().inspections[0].askingPrice).toBeUndefined();
  });

  it('prepends new inspections so newest is first', () => {
    store().createInspection(2019, 'Toyota', 'Camry');
    store().createInspection(2022, 'Tesla', 'Model 3');
    expect(store().inspections[0].make).toBe('Tesla');
  });
});

describe('updateItem', () => {
  it('creates a new item when none exists for that templateId', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().updateItem(insp.id, 'tmpl-1', { checked: true });
    const items = store().getItems(insp.id);
    expect(items).toHaveLength(1);
    expect(items[0].templateItemId).toBe('tmpl-1');
    expect(items[0].checked).toBe(true);
  });

  it('merges patch onto existing item without clobbering other fields', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().updateItem(insp.id, 'tmpl-1', { checked: true, note: 'original note' });
    store().updateItem(insp.id, 'tmpl-1', { flagged: true, severity: 'negotiate' });
    const item = store().getItems(insp.id)[0];
    expect(item.checked).toBe(true);
    expect(item.note).toBe('original note');
    expect(item.flagged).toBe(true);
    expect(item.severity).toBe('negotiate');
  });

  it('can update note on an existing item', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().updateItem(insp.id, 'tmpl-1', { checked: true });
    store().updateItem(insp.id, 'tmpl-1', { note: 'crack in windshield' });
    expect(store().getItems(insp.id)[0].note).toBe('crack in windshield');
  });
});

describe('completeInspection', () => {
  it('sets status to complete', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().completeInspection(insp.id);
    const updated = store().inspections.find(i => i.id === insp.id);
    expect(updated?.status).toBe('complete');
  });

  it('attaches pass verdict when no flags', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().updateItem(insp.id, 'tmpl-1', { checked: true });
    store().completeInspection(insp.id);
    expect(store().inspections.find(i => i.id === insp.id)?.verdict).toBe('pass');
  });

  it('attaches caution verdict when negotiate flag present', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().updateItem(insp.id, 'tmpl-1', { checked: true, flagged: true, severity: 'negotiate' });
    store().completeInspection(insp.id);
    expect(store().inspections.find(i => i.id === insp.id)?.verdict).toBe('caution');
  });

  it('attaches walk_away verdict when walk_away flag present', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().updateItem(insp.id, 'tmpl-1', { checked: true, flagged: true, severity: 'walk_away' });
    store().completeInspection(insp.id);
    expect(store().inspections.find(i => i.id === insp.id)?.verdict).toBe('walk_away');
  });
});

describe('deleteInspection', () => {
  it('removes the inspection from the list', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().deleteInspection(insp.id);
    expect(store().inspections).toHaveLength(0);
  });

  it('removes its items from the items map', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().updateItem(insp.id, 'tmpl-1', { checked: true });
    store().deleteInspection(insp.id);
    expect(store().items[insp.id]).toBeUndefined();
  });

  it('leaves other inspections intact', () => {
    const a = store().createInspection(2019, 'Toyota', 'Camry');
    const b = store().createInspection(2022, 'Tesla', 'Model 3');
    store().deleteInspection(a.id);
    expect(store().inspections.find(i => i.id === b.id)).toBeDefined();
  });
});

describe('getItems', () => {
  it('returns empty array for unknown inspectionId', () => {
    expect(store().getItems('does-not-exist')).toEqual([]);
  });

  it('returns items for a known inspectionId', () => {
    const insp = store().createInspection(2020, 'Honda', 'Civic');
    store().updateItem(insp.id, 'tmpl-1', { checked: true });
    store().updateItem(insp.id, 'tmpl-2', { checked: true });
    expect(store().getItems(insp.id)).toHaveLength(2);
  });
});
