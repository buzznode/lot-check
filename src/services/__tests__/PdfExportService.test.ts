import { PdfExportService } from '../PdfExportService';
import type { Inspection, InspectionItem, ChecklistCategory } from '../../types';

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64encodedphoto'),
}));

const mockInspection: Inspection = {
  id: 'insp-1',
  year: 2021,
  make: 'DODGE',
  model: 'Charger',
  askingPrice: 22000,
  status: 'complete',
  createdAt: '2026-04-20T12:00:00Z',
  updatedAt: '2026-04-20T12:00:00Z',
};

const mockCategories: ChecklistCategory[] = [
  {
    id: 'exterior' as any,
    label: 'Exterior',
    icon: '🚗',
    items: [
      { id: 'ext-1', label: 'Frame or unibody damage', hint: 'Check for bends', severity: 'walk_away' },
      { id: 'ext-2', label: 'Panel gaps & alignment', hint: 'Check gaps', severity: 'negotiate' },
      { id: 'ext-3', label: 'Paint color matching', hint: 'Check color', severity: 'negotiate' },
    ],
  },
  {
    id: 'interior' as any,
    label: 'Interior',
    icon: '🎛️',
    items: [
      { id: 'int-1', label: 'Seat condition', hint: 'Check seats', severity: 'negotiate' },
    ],
  },
];

function makeItem(overrides: Partial<InspectionItem>): InspectionItem {
  return {
    id: 'item-' + Math.random(),
    inspectionId: 'insp-1',
    templateItemId: 'ext-1',
    checked: true,
    flagged: false,
    createdAt: '2026-04-20T12:00:00Z',
    updatedAt: '2026-04-20T12:00:00Z',
    photoUris: [],
    ...overrides,
  };
}

describe('PdfExportService.buildHtml', () => {
  it('includes vehicle title in output', async () => {
    const html = await PdfExportService.buildHtml(mockInspection, [], mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('2021 DODGE Charger');
  });

  it('includes asking price when provided', async () => {
    const html = await PdfExportService.buildHtml(mockInspection, [], mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('22,000');
  });

  it('omits asking price when not provided', async () => {
    const noPrice = { ...mockInspection, askingPrice: undefined };
    const html = await PdfExportService.buildHtml(noPrice, [], mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).not.toContain('Asking price');
  });

  it('renders all category labels without emoji prefixes', async () => {
    const html = await PdfExportService.buildHtml(mockInspection, [], mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('Exterior');
    expect(html).toContain('Interior');
    expect(html).not.toContain('🚗  Exterior');
    expect(html).not.toContain('🎛️  Interior');
  });

  it('shows all items in template order when includeAllItems is true', async () => {
    const html = await PdfExportService.buildHtml(mockInspection, [], mockCategories, { includeAllItems: true, includePhotos: true });
    const frameIdx = html.indexOf('Frame or unibody damage');
    const panelIdx = html.indexOf('Panel gaps &amp; alignment') || html.indexOf('Panel gaps & alignment');
    const paintIdx = html.indexOf('Paint color matching');
    expect(frameIdx).toBeLessThan(panelIdx > -1 ? panelIdx : paintIdx);
  });

  it('shows Not reviewed for unchecked items', async () => {
    const html = await PdfExportService.buildHtml(mockInspection, [], mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('Not reviewed');
  });

  it('shows Pass badge for checked non-flagged items', async () => {
    const items = [makeItem({ templateItemId: 'ext-1', checked: true, flagged: false })];
    const html = await PdfExportService.buildHtml(mockInspection, items, mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('>Pass<');
  });

  it('shows Walk away badge for walk_away flagged items', async () => {
    const items = [makeItem({ templateItemId: 'ext-1', checked: true, flagged: true, severity: 'walk_away' })];
    const html = await PdfExportService.buildHtml(mockInspection, items, mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('>Walk away<');
  });

  it('shows Negotiate badge for negotiate flagged items', async () => {
    const items = [makeItem({ templateItemId: 'ext-1', checked: true, flagged: true, severity: 'negotiate' })];
    const html = await PdfExportService.buildHtml(mockInspection, items, mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('>Negotiate<');
  });

  it('only shows flagged items when includeAllItems is false', async () => {
    const items = [
      makeItem({ templateItemId: 'ext-1', checked: true, flagged: true, severity: 'walk_away' }),
      makeItem({ templateItemId: 'ext-2', checked: true, flagged: false }),
    ];
    const html = await PdfExportService.buildHtml(mockInspection, items, mockCategories, { includeAllItems: false, includePhotos: true });
    expect(html).toContain('Frame or unibody damage');
    expect(html).not.toContain('Panel gaps');
  });

  it('embeds photos as base64 data URIs for flagged items', async () => {
    const items = [makeItem({
      templateItemId: 'ext-1',
      checked: true,
      flagged: true,
      severity: 'walk_away',
      photoUris: ['file:///photos/test.jpg'],
    })];
    const html = await PdfExportService.buildHtml(mockInspection, items, mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('data:image/jpeg;base64,base64encodedphoto');
  });

  it('does not embed photos for non-flagged items', async () => {
    const items = [makeItem({
      templateItemId: 'ext-1',
      checked: true,
      flagged: false,
      photoUris: ['file:///photos/test.jpg'],
    })];
    const html = await PdfExportService.buildHtml(mockInspection, items, mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).not.toContain('data:image/jpeg;base64');
  });

  it('includes note text for items with notes', async () => {
    const items = [makeItem({ templateItemId: 'ext-1', checked: true, flagged: true, severity: 'negotiate', note: 'Cracked bumper' })];
    const html = await PdfExportService.buildHtml(mockInspection, items, mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('Cracked bumper');
  });

  it('uses second category page break for categories after the first', async () => {
    const html = await PdfExportService.buildHtml(mockInspection, [], mockCategories, { includeAllItems: true, includePhotos: true });
    expect(html).toContain('page-break-before:always');
  });

  it('does not apply page break to the first category', async () => {
    const html = await PdfExportService.buildHtml(mockInspection, [], mockCategories, { includeAllItems: true, includePhotos: true });
    const firstBreakIdx = html.indexOf('page-break-before:always');
    const exteriorIdx = html.indexOf('Exterior');
    expect(exteriorIdx).toBeLessThan(firstBreakIdx);
  });
});
