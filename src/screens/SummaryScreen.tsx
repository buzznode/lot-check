import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Share, Alert, ActivityIndicator,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useInspectionStore } from '../stores/inspectionStore';
import { usePurchaseStore } from '../stores/purchaseStore';
import { useChecklist } from '../hooks/useChecklist';
import { PdfExportService } from '../services/PdfExportService';
import { computeSummary, verdictLabel } from '../utils/verdict';
import { colors, spacing, radius, typography, card, navBar, verdictColor } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Summary'>;
type Route = RouteProp<RootStackParamList, 'Summary'>;

const VERDICT_EMOJI: Record<string, string> = {
  pass: '✅',
  caution: '⚠️',
  walk_away: '🚫',
};

export function SummaryScreen() {
  const navigation = useNavigation<Nav>();
  const { params: { inspectionId } } = useRoute<Route>();
  const { inspections, getItems } = useInspectionStore();
  const { itemMap, categories } = useChecklist();
  const { isUnlocked } = usePurchaseStore();
  const canExportPdf = isUnlocked || __DEV__;
  const [pdfLoading, setPdfLoading] = useState(false);

  const inspection = inspections.find(i => i.id === inspectionId);
  const storeItems = getItems(inspectionId);
  const summary = computeSummary(storeItems);
  const vColor = verdictColor(summary.verdict);

  const [walkAwayOpen, setWalkAwayOpen] = useState(true);
  const [negotiateOpen, setNegotiateOpen] = useState(true);

  function categoryForItem(templateItemId: string) {
    return categories.find(c => c.items.some(i => i.id === templateItemId));
  }

  function handleItemPress(templateItemId: string) {
    const cat = categoryForItem(templateItemId);
    if (!cat) return;
    navigation.navigate('Checklist', { inspectionId, categoryId: cat.id, scrollToItemId: templateItemId });
  }

  const flaggedItems = storeItems
    .filter(i => i.flagged)
    .map(i => ({ storeItem: i, template: itemMap[i.templateItemId] }))
    .filter((x): x is typeof x & { template: NonNullable<typeof x['template']> } => x.template != null);

  const walkAwayFlags = flaggedItems.filter(x => x.storeItem.severity === 'walk_away');
  const negotiateFlags = flaggedItems.filter(x => x.storeItem.severity === 'negotiate');

  const inspectionTitle = inspection
    ? `${inspection.year} ${inspection.make} ${inspection.model}`
    : 'Inspection';

  function buildShareText() {
    const lines = [
      `LotCheck Report — ${inspectionTitle}`,
      inspection?.askingPrice ? `Asking price: $${inspection.askingPrice.toLocaleString()}` : null,
      `Verdict: ${verdictLabel(summary.verdict).toUpperCase()}`,
      '',
      `Items checked: ${summary.totalChecked}/${summary.totalItems}`,
      `Walk away flags: ${summary.walkAwayCount}`,
      `Negotiate flags: ${summary.negotiateCount}`,
      `Passed: ${summary.passCount}`,
    ];

    if (walkAwayFlags.length > 0) {
      lines.push('', '🚫 Walk Away Issues:');
      walkAwayFlags.forEach(x => lines.push(`  • ${x.template.label}`));
    }

    if (negotiateFlags.length > 0) {
      lines.push('', '⚠️ Negotiate Issues:');
      negotiateFlags.forEach(x => {
        const note = x.storeItem.note ? ` — ${x.storeItem.note}` : '';
        lines.push(`  • ${x.template.label}${note}`);
      });
    }

    return lines.filter(l => l !== null).join('\n');
  }

  async function handleShare() {
    await Share.share({ message: buildShareText() });
  }

  async function handlePdfExport() {
    if (!canExportPdf) {
      Alert.alert(
        'Unlock PDF Export',
        'Export a full professional report as a PDF for $3.99 — one-time purchase.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Unlock — $3.99', onPress: () => Alert.alert('Coming Soon', 'In-app purchase will be available in the next update.') },
        ],
      );
      return;
    }
    if (!inspection) return;
    setPdfLoading(true);
    try {
      const html = await PdfExportService.buildHtml(inspection, storeItems, categories, { includeAllItems: true, includePhotos: true });
      const { uri } = await Print.printToFileAsync({ html });
      const now = new Date();
      const ts = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('') + '_' + [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join('');
      const base = `${inspection.year}_${inspection.make}_${inspection.model}`
        .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const dir = uri.substring(0, uri.lastIndexOf('/') + 1);
      const destUri = `${dir}${base}_${ts}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: destUri });
      await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (e) {
      Alert.alert('Export failed', 'Something went wrong generating the PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={navBar.bar}>
        <TouchableOpacity style={navBar.backBtn} onPress={() => navigation.goBack()}>
          <Text style={navBar.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={navBar.title} numberOfLines={1}>{inspectionTitle}</Text>
        <TouchableOpacity
          style={{ width: 60, alignItems: 'flex-end' }}
          onPress={() => navigation.popToTop()}
        >
          <Text style={[navBar.backText, { fontSize: 14 }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Verdict banner */}
        <View style={[s.verdictBanner, { backgroundColor: vColor }]}>
          <Text style={s.verdictEmoji}>{VERDICT_EMOJI[summary.verdict]}</Text>
          <Text style={s.verdictLabel}>{verdictLabel(summary.verdict)}</Text>
          <Text style={s.verdictSub}>
            {summary.totalChecked} of {summary.totalItems} items inspected
          </Text>
        </View>

        {/* Stats grid */}
        <View style={[card.base, s.statsGrid]}>
          <StatCell value={summary.walkAwayCount} label="Walk Away" color={colors.walkAway} />
          <View style={s.statDivider} />
          <StatCell value={summary.negotiateCount} label="Negotiate" color={colors.negotiate} />
          <View style={s.statDivider} />
          <StatCell value={summary.passCount} label="Passed" color={colors.pass} />
        </View>

        {/* Walk away flags */}
        {walkAwayFlags.length > 0 && (
          <View style={s.section}>
            <TouchableOpacity style={s.accordionHeader} onPress={() => setWalkAwayOpen(o => !o)} activeOpacity={0.7}>
              <Text style={s.sectionLabel}>🚫  Walk Away Issues ({walkAwayFlags.length})</Text>
              <Text style={s.chevron}>{walkAwayOpen ? '▾' : '›'}</Text>
            </TouchableOpacity>
            {walkAwayOpen && (
              <View style={card.base}>
                {walkAwayFlags.map(({ storeItem, template }, i) => (
                  <View key={storeItem.id}>
                    {i > 0 && <View style={s.itemDivider} />}
                    <FlagRow
                      label={template.label}
                      note={storeItem.note}
                      color={colors.walkAway}
                      onPress={() => handleItemPress(storeItem.templateItemId)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Negotiate flags */}
        {negotiateFlags.length > 0 && (
          <View style={s.section}>
            <TouchableOpacity style={s.accordionHeader} onPress={() => setNegotiateOpen(o => !o)} activeOpacity={0.7}>
              <Text style={s.sectionLabel}>⚠️  Negotiate Issues ({negotiateFlags.length})</Text>
              <Text style={s.chevron}>{negotiateOpen ? '▾' : '›'}</Text>
            </TouchableOpacity>
            {negotiateOpen && (
              <View style={card.base}>
                {negotiateFlags.map(({ storeItem, template }, i) => (
                  <View key={storeItem.id}>
                    {i > 0 && <View style={s.itemDivider} />}
                    <FlagRow
                      label={template.label}
                      note={storeItem.note}
                      color={colors.negotiate}
                      onPress={() => handleItemPress(storeItem.templateItemId)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {summary.walkAwayCount === 0 && summary.negotiateCount === 0 && summary.totalChecked > 0 && (
          <View style={[card.base, s.allClearCard]}>
            <Text style={s.allClearText}>No issues flagged — looks clean!</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Text style={[typography.h3, { color: colors.brand }]}>Share Summary</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.pdfBtn} onPress={handlePdfExport} activeOpacity={0.85} disabled={pdfLoading}>
            <View style={s.pdfBtnInner}>
              {pdfLoading
                ? <ActivityIndicator color={colors.textInverse} />
                : <>
                    <Text style={[typography.h3, { color: colors.textInverse }]}>Export PDF Report</Text>
                    {!canExportPdf && (
                      <View style={s.pdfLockBadge}>
                        <Text style={s.pdfLockText}>$3.99</Text>
                      </View>
                    )}
                  </>
              }
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={s.statCell}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

function FlagRow({ label, note, color, onPress }: { label: string; note?: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.flagRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.flagDot, { backgroundColor: color }]} />
      <View style={s.flagText}>
        <Text style={typography.body}>{label}</Text>
        {!!note && <Text style={[typography.caption, { marginTop: 2 }]}>{note}</Text>}
      </View>
      <Text style={s.flagChevron}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },

  verdictBanner: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  verdictEmoji: { fontSize: 40 },
  verdictLabel: { fontSize: 26, fontWeight: '800', color: colors.textInverse, letterSpacing: 0.3 },
  verdictSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  statsGrid: { flexDirection: 'row', padding: spacing.lg },
  statCell: { flex: 1, alignItems: 'center', gap: spacing.xs },
  statValue: { fontSize: 32, fontWeight: '800' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },

  section: { gap: spacing.sm },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginLeft: spacing.xs,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textInverse },
  chevron: { fontSize: 18, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  itemDivider: { height: 1, backgroundColor: colors.border },
  flagRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.sm },
  flagDot: { width: 10, height: 10, borderRadius: radius.full, marginTop: 5, flexShrink: 0 },
  flagText: { flex: 1 },
  flagChevron: { fontSize: 18, color: colors.textSecondary, alignSelf: 'center' },

  allClearCard: { alignItems: 'center', paddingVertical: spacing.xl },
  allClearText: { fontSize: 16, fontWeight: '600', color: colors.pass },

  actions: { gap: spacing.md },
  shareBtn: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand,
  },
  pdfBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: 16,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pdfBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  pdfLockBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  pdfLockText: { fontSize: 12, fontWeight: '700', color: colors.textInverse },
});
