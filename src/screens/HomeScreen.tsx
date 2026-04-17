import React from 'react';
import { version } from '../../package.json';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useInspectionStore } from '../stores/inspectionStore';
import { useChecklist } from '../hooks/useChecklist';
import { colors, spacing, radius, typography, card, navBar, verdictColor, verdictLabel } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Inspection } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const SCREEN_W = Dimensions.get('window').width;
const DELETE_BTN_W = 88;
const FULL_SWIPE_PX = SCREEN_W * 0.45;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { inspections, items, deleteInspection } = useInspectionStore();
  const { allItems } = useChecklist();
  const totalItems = allItems.length;

  function renderItem({ item }: { item: Inspection }) {
    const storeItems = items[item.id] ?? [];
    const checked = storeItems.filter(i => i.checked).length;
    const walkAway = storeItems.filter(i => i.flagged && i.severity === 'walk_away').length;
    const negotiate = storeItems.filter(i => i.flagged && i.severity === 'negotiate').length;
    const progress = totalItems > 0 ? checked / totalItems : 0;

    return (
      <TouchableOpacity
        style={card.base}
        onPress={() => navigation.navigate('Category', { inspectionId: item.id })}
        activeOpacity={0.75}
      >
        <View style={s.cardTop}>
          <Text style={[typography.h2, s.carName]}>
            {item.year} {item.make} {item.model}
          </Text>
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

  function renderHiddenItem({ item }: { item: Inspection }) {
    return (
      <View style={s.hiddenRow}>
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() => deleteInspection(item.id)}
          activeOpacity={0.85}
        >
          <Text style={s.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function onSwipeValueChange({ key, value }: { key: string; value: number }) {
    // value is negative when swiping left; auto-delete past threshold
    if (value < -FULL_SWIPE_PX) {
      deleteInspection(key);
    }
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

      <SwipeListView
        data={inspections}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-DELETE_BTN_W}
        disableRightSwipe
        closeOnScroll
        closeOnRowPress
        closeOnRowBeginSwipe
        onSwipeValueChange={onSwipeValueChange}
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
  hiddenRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  deleteBtn: {
    width: DELETE_BTN_W,
    height: '100%',
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
