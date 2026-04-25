import * as FileSystem from 'expo-file-system';
import type {
  Inspection,
  InspectionItem,
  ChecklistCategory,
  PdfExportOptions,
} from '../types';
import { computeSummary, verdictLabel } from '../utils/verdict';

const BRAND = '#1A3A5C';

async function toDataUri(uri: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

export class PdfExportService {
  static async buildHtml(
    inspection: Inspection,
    items: InspectionItem[],
    categories: ChecklistCategory[],
    options: PdfExportOptions
  ): Promise<string> {
    const summary = computeSummary(items);
    const date = new Date(inspection.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const storeItemMap = Object.fromEntries(items.map(i => [i.templateItemId, i]));
    const vehicleTitle = `${inspection.year} ${inspection.make} ${inspection.model}`;

    const verdictBg =
      summary.verdict === 'walk_away' ? '#FCEBEB'
      : summary.verdict === 'caution' ? '#FEF3E2'
      : '#EAF3DE';
    const verdictFg =
      summary.verdict === 'walk_away' ? '#E24B4A'
      : summary.verdict === 'caution' ? '#C47D00'
      : '#4E7A1A';
    const verdictIcon =
      summary.verdict === 'walk_away' ? '🚫'
      : summary.verdict === 'caution' ? '⚠️'
      : '✅';

    const categoryPages = await Promise.all(categories.map(async (category, catIdx) => {
      let rowIdx = 0;

      const filteredItems = category.items
        .filter(t => options.includeAllItems || (storeItemMap[t.id]?.flagged ?? false));

      const rows = await Promise.all(filteredItems.map(async t => {
        const si = storeItemMap[t.id];
        const isChecked = si?.checked ?? false;
        const isFlagged = si?.flagged ?? false;
        const flagClass = !isChecked ? 'u' : isFlagged ? (si?.severity === 'walk_away' ? 'r' : 'a') : 'p';
        const flagLabel = !isChecked ? 'Not reviewed' : isFlagged ? (si?.severity === 'walk_away' ? 'Walk away' : 'Negotiate') : 'Pass';
        const rowBg = rowIdx++ % 2 === 0 ? '#fafaf8' : '#ffffff';

        const photoUris = (isFlagged && si?.photoUris?.length) ? si.photoUris : [];
        const dataUris = await Promise.all(photoUris.map(toDataUri));
        const validPhotos = dataUris.filter((d): d is string => d !== null);

        const photoRow = validPhotos.length > 0 ? `
          <tr style="background:${rowBg}">
            <td colspan="3" style="padding:4px 8px 10px;border-bottom:1px solid #f0efe8;">
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${validPhotos.map(d => `<img src="${d}" style="height:150px;width:auto;border-radius:4px;object-fit:cover;" />`).join('')}
              </div>
            </td>
          </tr>` : '';

        return `<tr style="background:${rowBg}">
            <td style="padding:7px 8px;border-bottom:${validPhotos.length ? 'none' : '1px solid #f0efe8'};font-size:11px;">${t.label}</td>
            <td style="padding:7px 8px;border-bottom:${validPhotos.length ? 'none' : '1px solid #f0efe8'};">
              <span class="flag ${flagClass}">${flagLabel}</span>
            </td>
            <td style="padding:7px 8px;border-bottom:${validPhotos.length ? 'none' : '1px solid #f0efe8'};font-size:11px;">
              ${si?.note ? `<div style="font-style:italic;color:#555;">${si.note}</div>` : '—'}
            </td>
          </tr>${photoRow}`;
      }));

      const pageBreak = catIdx > 0 ? 'page-break-before:always;' : '';

      return `
<div style="${pageBreak}padding-top:${catIdx > 0 ? '24px' : '16px'};">
  ${catIdx > 0 ? `<div style="background:${BRAND};padding:10px 32px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
    <div style="color:#fff;font-size:13px;font-weight:600;">${vehicleTitle}</div>
    <div style="color:rgba(255,255,255,0.8);font-size:11px;">${date}</div>
  </div>` : ''}
  <div style="padding:0 32px 8px;">
    <div style="font-size:15px;font-weight:700;color:${BRAND};padding-bottom:8px;border-bottom:2px solid ${BRAND};">
      ${category.label}
    </div>
  </div>
  <div style="padding:0 32px 32px;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.05em;padding:4px 8px;border-bottom:1px solid #e0dfd8;width:45%;">Item</th>
          <th style="text-align:left;font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.05em;padding:4px 8px;border-bottom:1px solid #e0dfd8;width:15%;">Status</th>
          <th style="text-align:left;font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.05em;padding:4px 8px;border-bottom:1px solid #e0dfd8;">Notes</th>
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  </div>
</div>`;
    }));

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, Helvetica Neue, sans-serif; margin: 0; color: #1a1a1a; }
  .flag { display:inline-block;font-size:9px;padding:2px 7px;border-radius:6px;font-weight:600; }
  .flag.r { background:#FCEBEB;color:#E24B4A; }
  .flag.a { background:#FAEEDA;color:#C47D00; }
  .flag.p { background:#EAF3DE;color:#4E7A1A; }
  .flag.u { background:#F3F3F3;color:#777; }
</style>
</head>
<body>

<div style="background:${BRAND};padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;">
  <div>
    <div style="color:#9FE1CB;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">LotCheck</div>
    <div style="color:#ffffff;font-size:20px;font-weight:700;margin-bottom:2px;">${vehicleTitle}</div>
    <div style="color:rgba(255,255,255,0.8);font-size:12px;">Pre-purchase inspection report</div>
  </div>
  <div style="background:${verdictBg};color:${verdictFg};padding:8px 16px;border-radius:8px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;">
    <span style="font-size:18px;">${verdictIcon}</span>
    <span>${verdictLabel(summary.verdict)}</span>
  </div>
</div>

<div style="border-bottom:1px solid #e0dfd8;padding:12px 32px;display:flex;gap:32px;">
  <div>
    <div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Date</div>
    <div style="font-size:12px;font-weight:600;color:#1a1a1a;">${date}</div>
  </div>
  ${inspection.askingPrice ? `<div>
    <div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Asking price</div>
    <div style="font-size:12px;font-weight:600;color:#1a1a1a;">$${inspection.askingPrice.toLocaleString()}</div>
  </div>` : ''}
  <div>
    <div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Items checked</div>
    <div style="font-size:12px;font-weight:600;color:#1a1a1a;">${summary.totalChecked} of ${summary.totalItems}</div>
  </div>
</div>

<div style="padding:16px 32px 16px;border-bottom:1px solid #e0dfd8;display:flex;gap:12px;">
  <div style="flex:1;background:#FCEBEB;border-radius:6px;padding:10px;text-align:center;">
    <div style="font-size:22px;font-weight:700;color:#E24B4A;">${summary.walkAwayCount}</div>
    <div style="font-size:10px;color:#E24B4A;">Walk away risks</div>
  </div>
  <div style="flex:1;background:#FAEEDA;border-radius:6px;padding:10px;text-align:center;">
    <div style="font-size:22px;font-weight:700;color:#C47D00;">${summary.negotiateCount}</div>
    <div style="font-size:10px;color:#C47D00;">Negotiate / repair</div>
  </div>
  <div style="flex:1;background:#EAF3DE;border-radius:6px;padding:10px;text-align:center;">
    <div style="font-size:22px;font-weight:700;color:#4E7A1A;">${summary.passCount}</div>
    <div style="font-size:10px;color:#4E7A1A;">Passed</div>
  </div>
</div>

${categoryPages.join('')}

<div style="border-top:1px solid #e0dfd8;padding:10px 32px;margin-top:16px;">
  <span style="font-size:10px;color:#888;">Generated by LotCheck</span>
</div>

</body>
</html>`;
  }
}
