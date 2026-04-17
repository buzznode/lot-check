import type {
  Inspection,
  InspectionItem,
  ChecklistTemplateItem,
  PdfExportOptions,
} from '../types';
import { computeSummary, verdictLabel } from '../utils/verdict';

export class PdfExportService {
  static buildHtml(
    inspection: Inspection,
    items: InspectionItem[],
    template: ChecklistTemplateItem[],
    options: PdfExportOptions
  ): string {
    const summary = computeSummary(items);
    const date = new Date(inspection.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const templateMap = Object.fromEntries(template.map(t => [t.id, t]));
    const itemsToShow = options.includeAllItems ? items : items.filter(i => i.flagged);

    const verdictBg =
      summary.verdict === 'walk_away' ? '#FCEBEB'
      : summary.verdict === 'caution' ? 'rgba(239,159,39,0.3)'
      : 'rgba(29,158,117,0.3)';

    const verdictFg =
      summary.verdict === 'walk_away' ? '#791F1F'
      : summary.verdict === 'caution' ? '#FAC775'
      : '#E1F5EE';

    const rows = itemsToShow
      .map((item, idx) => {
        const t = templateMap[item.templateItemId];
        if (!t) return '';
        const flagClass =
          item.severity === 'walk_away' ? 'r'
          : item.severity === 'negotiate' ? 'a'
          : 'p';
        const flagLabel =
          item.severity === 'walk_away' ? 'Walk away'
          : item.severity === 'negotiate' ? 'Negotiate'
          : 'Pass';
        const rowBg = idx % 2 === 0 ? '#fafaf8' : '#ffffff';

        return `<tr style="background:${rowBg}">
          <td style="padding:7px 8px;border-bottom:1px solid #f0efe8;font-size:11px;">${t.label}</td>
          <td style="padding:7px 8px;border-bottom:1px solid #f0efe8;">
            <span class="flag ${flagClass}">${flagLabel}</span>
          </td>
          <td style="padding:7px 8px;border-bottom:1px solid #f0efe8;font-size:11px;">
            ${item.note ? `<div style="font-style:italic;color:#555;">${item.note}</div>` : '—'}
          </td>
        </tr>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: -apple-system, Helvetica Neue, sans-serif; margin: 0; color: #1a1a1a; }
  .flag { display:inline-block;font-size:9px;padding:2px 7px;border-radius:6px;font-weight:600; }
  .flag.r { background:#FCEBEB;color:#791F1F; }
  .flag.a { background:#FAEEDA;color:#854F0B; }
  .flag.p { background:#EAF3DE;color:#3B6D11; }
</style>
</head>
<body>

<div style="background:#0F6E56;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;">
  <div>
    <div style="color:#9FE1CB;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">LotCheck</div>
    <div style="color:#fff;font-size:20px;font-weight:600;margin-bottom:2px;">${inspection.year} ${inspection.make} ${inspection.model}</div>
    <div style="color:#5DCAA5;font-size:12px;">Pre-purchase inspection report</div>
  </div>
  <div style="background:${verdictBg};color:${verdictFg};padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;">
    ${verdictLabel(summary.verdict)}
  </div>
</div>

<div style="background:#f7f7f5;border-bottom:1px solid #e0dfd8;padding:10px 32px;display:flex;gap:32px;">
  <div>
    <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.06em;">Date</div>
    <div style="font-size:12px;font-weight:600;">${date}</div>
  </div>
  ${inspection.askingPrice ? `<div>
    <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.06em;">Asking price</div>
    <div style="font-size:12px;font-weight:600;">$${inspection.askingPrice.toLocaleString()}</div>
  </div>` : ''}
  <div>
    <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.06em;">Items checked</div>
    <div style="font-size:12px;font-weight:600;">${summary.totalChecked} of ${summary.totalItems}</div>
  </div>
</div>

<div style="padding:16px 32px;border-bottom:1px solid #e0dfd8;display:flex;gap:12px;">
  <div style="flex:1;background:#FCEBEB;border-radius:6px;padding:10px;text-align:center;">
    <div style="font-size:22px;font-weight:700;color:#A32D2D;">${summary.walkAwayCount}</div>
    <div style="font-size:10px;color:#791F1F;">Walk away risks</div>
  </div>
  <div style="flex:1;background:#FAEEDA;border-radius:6px;padding:10px;text-align:center;">
    <div style="font-size:22px;font-weight:700;color:#633806;">${summary.negotiateCount}</div>
    <div style="font-size:10px;color:#854F0B;">Negotiate / repair</div>
  </div>
  <div style="flex:1;background:#EAF3DE;border-radius:6px;padding:10px;text-align:center;">
    <div style="font-size:22px;font-weight:700;color:#27500A;">${summary.passCount}</div>
    <div style="font-size:10px;color:#3B6D11;">Passed</div>
  </div>
</div>

<div style="padding:16px 32px;">
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr>
        <th style="text-align:left;font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.05em;padding:4px 8px;border-bottom:1px solid #e0dfd8;width:45%;">Item</th>
        <th style="text-align:left;font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.05em;padding:4px 8px;border-bottom:1px solid #e0dfd8;width:15%;">Status</th>
        <th style="text-align:left;font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.05em;padding:4px 8px;border-bottom:1px solid #e0dfd8;">Notes</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>

<div style="background:#f7f7f5;border-top:1px solid #e0dfd8;padding:10px 32px;display:flex;justify-content:space-between;margin-top:16px;">
  <span style="font-size:10px;color:#888;">Generated by LotCheck</span>
  <span style="font-size:10px;color:#b4b2a9;">Page 1</span>
</div>

</body>
</html>`;
  }
}
