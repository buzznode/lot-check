import React from 'react';
import { version } from '../../package.json';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInspectionStore } from '../stores/inspectionStore';
import { useChecklist } from '../hooks/useChecklist';
import { colors, spacing, radius, typography, card, navBar, verdictColor, verdictLabel } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Inspection } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { inspections, items } = useInspectionStore();
  const { allItems } = useChecklist();
  const totalItems = allItems.length;

  function cardData(inspection: Inspection) {
    const storeItems = items[inspection.id] ?? [];
    const checked = storeItems.filter(i => i.checked).length;
    const walkAway = storeItems.filter(i => i.flagged && i.severity === 'walk_away').length;
    const negotiate = storeItems.filter(i => i.flagged && i.severity === 'negotiate').length;
    return { checked, walkAway, negotiate };
  }

  function renderCard({ item }: { item: Inspection }) {
    const { checked, walkAway, negotiate } = cardData(item);
    const progress = totalItems > 0 ? checked / totalItems : 0;

    return (
      <TouchableOpacity
        style={card.base}
        onPress={() => navigation.navigate('Category', { inspectionId: item.id })}
        activeOpacity={0.75}
      >
        <View style={s.cardTop}>
          <Text style={[typography.h2, s.carName]}>{item.year} {item.make} {item.model}</Text>
          <View style={[s.verdictBadge, { backgroundColor: verdictColor(item.verdict) }]}>
            <Text style={[typography.tiny, { color: colors.textInverse }]}>
              {verdictLabel(item.verdict)}
            </Text>
          </View>
        </View>
        {item.askingPrice != null && (
          <Text style={[typography.caption, { marginBottom: spacing.sm }]}>
            ${item.askingPrice.toLocaleString()}
          </Text>
        )}
        <ProgressBar value={progress} />
        <View style={s.cardBottom}>
          <Text style={[typography.caption, { marginTop: spacing.sm }]}>
            {checked} of {totalItems} items checked
          </Text>
          <View style={s.flagRow}>
            {walkAway > 0 && (
              <View style={[s.flagBadge, { backgroundColor: colors.walkAway }]}>
                <Text style={[typography.tiny, { color: colors.textInverse }]}>
                  {walkAway} walk away
                </Text>
              </View>
            )}
            {negotiate > 0 && (
              <View style={[s.flagBadge, { backgroundColor: colors.negotiate }]}>
                <Text style={[typography.tiny, { color: colors.textInverse }]}>
                  {negotiate} negotiate
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={navBar.bar}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={[typography.h1, { color: colors.textInverse }]}>LotCheck</Text>
          <Text style={{ fontSize: 12, color: colors.textInverse, opacity: 0.6, fontWeight: '500' }}>v{version}</Text>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('NewInspection')}>
          <Text style={[typography.label, { color: colors.textInverse }]}>+ New</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={inspections}
        keyExtractor={i => i.id}
        renderItem={renderCard}
        contentContainerStyle={inspections.length === 0 ? s.emptyWrap : s.listPad}
        ListEmptyComponent={
          <View style={s.emptyCenter}>
            <Text style={[typography.h2, { marginBottom: spacing.sm }]}>No inspections yet</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl }]}>
              Tap "+ New" to inspect a car before you buy
            </Text>
            <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('NewInspection')}>
              <Text style={[typography.h3, { color: colors.textInverse }]}>Start Inspection</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  newBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  listPad: { padding: spacing.lg, gap: spacing.md },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  emptyCenter: { alignItems: 'center' },
  ctaBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing.xs,
  },
  carName: { flex: 1, marginRight: spacing.sm },
  verdictBadge: { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flagRow: { flexDirection: 'row', gap: spacing.sm },
  flagBadge: { borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 2 },
});
