import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useInspectionStore } from '../stores/inspectionStore';
import { useChecklist } from '../hooks/useChecklist';
import { colors, spacing, radius, typography, navBar } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ChecklistCategory } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Category'>;
type Route = RouteProp<RootStackParamList, 'Category'>;

const CATEGORY_ICONS: Record<string, string> = {
  exterior: '🚗',
  interior: '🎛️',
  under_hood: '🔧',
  test_drive: '🛣️',
  documents: '📄',
};

export function CategoryScreen() {
  const navigation = useNavigation<Nav>();
  const {
    params: { inspectionId },
  } = useRoute<Route>();
  const { inspections, items: storeItems } = useInspectionStore();
  const { categories, allItems } = useChecklist();

  const inspection = inspections.find((i) => i.id === inspectionId);
  const inspItems = storeItems[inspectionId] ?? [];
  const totalChecked = inspItems.filter((i) => i.checked).length;
  const totalItems = allItems.length;
  const overallProgress = totalItems > 0 ? totalChecked / totalItems : 0;

  function categoryStats(cat: ChecklistCategory) {
    const catIds = new Set(cat.items.map((i) => i.id));
    const catItems = inspItems.filter((i) => catIds.has(i.templateItemId));
    return {
      checked: catItems.filter((i) => i.checked).length,
      total: cat.items.length,
      hasWalkAway: catItems.some(
        (i) => i.flagged && i.severity === 'walk_away',
      ),
      hasNegotiate: catItems.some(
        (i) => i.flagged && i.severity === 'negotiate',
      ),
    };
  }

  function renderRow({ item: cat }: { item: ChecklistCategory }) {
    const { checked, total, hasWalkAway, hasNegotiate } = categoryStats(cat);
    const progress = total > 0 ? checked / total : 0;
    const done = checked === total;

    return (
      <TouchableOpacity
        style={s.row}
        onPress={() =>
          navigation.navigate('Checklist', { inspectionId, categoryId: cat.id })
        }
        activeOpacity={0.75}
      >
        <Text style={s.icon}>{CATEGORY_ICONS[cat.id] ?? '📋'}</Text>
        <View style={s.rowBody}>
          <View style={s.rowTop}>
            <Text style={[typography.h3, { color: colors.brand }]}>
              {cat.label}
            </Text>
            <View style={s.dotRow}>
              {hasWalkAway && (
                <View style={[s.dot, { backgroundColor: colors.walkAway }]} />
              )}
              {hasNegotiate && (
                <View style={[s.dot, { backgroundColor: colors.negotiate }]} />
              )}
            </View>
          </View>
          <ProgressBar
            value={progress}
            color={done ? colors.pass : colors.brand}
          />
          <Text style={typography.caption}>
            {checked}/{total} items
          </Text>
        </View>
        <Text style={s.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  const inspectionTitle = inspection
    ? `${inspection.year} ${inspection.make} ${inspection.model}`
    : 'Inspection';

  return (
    <SafeAreaView style={s.root}>
      <View style={navBar.bar}>
        <TouchableOpacity
          style={navBar.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={navBar.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[navBar.title, s.navTitleText]} numberOfLines={1}>
          {inspectionTitle}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.overallWrap}>
        <View style={s.overallRow}>
          <Text style={typography.caption}>Overall progress</Text>
          <Text
            style={[
              typography.caption,
              { fontWeight: '600', color: colors.text },
            ]}
          >
            {totalChecked}/{totalItems}
          </Text>
        </View>
        <ProgressBar value={overallProgress} />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        renderItem={renderRow}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.separator} />}
      />

      {totalChecked > 0 && (
        <View style={s.footer}>
          <TouchableOpacity
            style={[
              s.summaryBtn,
              totalChecked < totalItems && s.summaryBtnPartial,
            ]}
            onPress={() => navigation.navigate('Summary', { inspectionId })}
            activeOpacity={0.85}
          >
            <Text style={[typography.h3, { color: colors.brand }]}>
              {totalChecked === totalItems
                ? 'View Summary'
                : `
              w${totalChecked}/${totalItems})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand },
  navTitleText: { flex: 1, textAlign: 'center' },
  overallWrap: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between' },
  list: {
    backgroundColor: colors.card,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 56 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    gap: spacing.md,
  },
  icon: { fontSize: 22, width: 28, textAlign: 'center' },
  rowBody: { flex: 1, gap: spacing.xs },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotRow: { flexDirection: 'row', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  chevron: { fontSize: 22, color: colors.textSecondary },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.brand,
  },
  summaryBtn: {
    backgroundColor: colors.textInverse,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryBtnPartial: {
    opacity: 0.6,
  },
});
