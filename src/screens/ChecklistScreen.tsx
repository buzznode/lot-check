import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Image, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useInspectionStore } from '../stores/inspectionStore';
import { useChecklist } from '../hooks/useChecklist';
import { colors, spacing, radius, typography, navBar } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ChecklistTemplateItem, InspectionItem, Severity } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Checklist'>;
type Route = RouteProp<RootStackParamList, 'Checklist'>;

// ─── Item card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  inspectionId: string;
  templateItem: ChecklistTemplateItem;
  storeItem?: InspectionItem;
  onUpdate: (templateId: string, patch: Partial<InspectionItem>) => void;
}

const ChecklistItemCard = memo(function ChecklistItemCard({
  inspectionId: _inspectionId,
  templateItem,
  storeItem,
  onUpdate,
}: ItemCardProps) {
  const checked = storeItem?.checked ?? false;
  const flagged = storeItem?.flagged ?? false;
  const severity = storeItem?.severity;
  const note = storeItem?.note ?? '';
  const photoUris = storeItem?.photoUris ?? [];
  const [noteOpen, setNoteOpen] = useState(false);

  function activeSeverity(): 'pass' | Severity {
    if (!flagged) return 'pass';
    return severity ?? 'negotiate';
  }

  function circleColor() {
    if (!checked) return 'transparent';
    if (!flagged) return colors.pass;
    return severity === 'walk_away' ? colors.walkAway : colors.negotiate;
  }

  function handleToggleCheck() {
    if (!checked) {
      onUpdate(templateItem.id, { checked: true, flagged: false });
    } else {
      onUpdate(templateItem.id, { checked: false, flagged: false, severity: undefined });
    }
  }

  function handleSeverity(sel: 'pass' | Severity) {
    if (sel === 'pass') {
      onUpdate(templateItem.id, { checked: true, flagged: false, severity: undefined });
    } else {
      onUpdate(templateItem.id, { checked: true, flagged: true, severity: sel });
    }
  }

  async function handleAddPhoto() {
    Alert.alert('Add Photo', undefined, [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow camera access in Settings to take photos.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!result.canceled && result.assets[0]) {
            onUpdate(templateItem.id, { photoUris: [...photoUris, result.assets[0].uri] });
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo library access in Settings.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
          if (!result.canceled && result.assets[0]) {
            onUpdate(templateItem.id, { photoUris: [...photoUris, result.assets[0].uri] });
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleRemovePhoto(uri: string) {
    onUpdate(templateItem.id, { photoUris: photoUris.filter(u => u !== uri) });
  }

  const active = activeSeverity();

  return (
    <View style={s.item}>
      {/* Main row */}
      <View style={s.itemRow}>
        <TouchableOpacity
          style={[s.circle, { borderColor: circleColor() === 'transparent' ? colors.border : circleColor(), backgroundColor: circleColor() }]}
          onPress={handleToggleCheck}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {checked && <Text style={s.checkMark}>✓</Text>}
        </TouchableOpacity>

        <View style={s.itemText}>
          <Text style={[typography.body, checked && { color: colors.textSecondary }]}>
            {templateItem.label}
          </Text>
          <Text style={[typography.caption, s.hint]}>{templateItem.hint}</Text>
        </View>

        {checked && flagged && (
          <View style={[s.severityPill, { backgroundColor: severity === 'walk_away' ? colors.walkAway : colors.negotiate }]}>
            <Text style={[typography.tiny, { color: colors.textInverse }]}>
              {severity === 'walk_away' ? 'Walk Away' : 'Negotiate'}
            </Text>
          </View>
        )}
      </View>

      {/* Expanded controls when checked */}
      {checked && (
        <View style={s.controls}>
          {/* Severity segmented control */}
          <View style={s.segmented}>
            {(['pass', 'negotiate', 'walk_away'] as const).map(opt => {
              const isActive = active === opt;
              const optColor = opt === 'pass' ? colors.pass : opt === 'negotiate' ? colors.negotiate : colors.walkAway;
              const label = opt === 'pass' ? 'Pass' : opt === 'negotiate' ? 'Negotiate' : 'Walk Away';
              return (
                <TouchableOpacity
                  key={opt}
                  style={[s.segBtn, isActive && { backgroundColor: optColor, borderColor: optColor }]}
                  onPress={() => handleSeverity(opt)}
                >
                  <Text style={[s.segBtnText, isActive && { color: colors.textInverse }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={handleAddPhoto}>
              <Text style={s.actionBtnText}>📷  Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, (noteOpen || note) && s.actionBtnActive]}
              onPress={() => setNoteOpen(o => !o)}
            >
              <Text style={[s.actionBtnText, (noteOpen || note) && { color: colors.brand }]}>
                📝  Note{note ? ' ✓' : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Note input */}
          {(noteOpen || !!note) && (
            <TextInput
              style={s.noteInput}
              value={note}
              onChangeText={t => onUpdate(templateItem.id, { note: t })}
              placeholder="Add a note about this item…"
              placeholderTextColor={colors.textSecondary}
              multiline
              autoFocus={noteOpen && !note}
            />
          )}

          {/* Photo thumbnails */}
          {photoUris.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoScroll}>
              {photoUris.map(uri => (
                <TouchableOpacity
                  key={uri}
                  onLongPress={() => Alert.alert('Remove photo?', undefined, [
                    { text: 'Remove', style: 'destructive', onPress: () => handleRemovePhoto(uri) },
                    { text: 'Cancel', style: 'cancel' },
                  ])}
                >
                  <Image source={{ uri }} style={s.thumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ChecklistScreen() {
  const navigation = useNavigation<Nav>();
  const { params: { inspectionId, categoryId } } = useRoute<Route>();
  const { items: storeItems, updateItem } = useInspectionStore();
  const { categories } = useChecklist();

  const categoryIndex = categories.findIndex(c => c.id === categoryId);
  const category = categories[categoryIndex];
  const nextCategory = categories[categoryIndex + 1] ?? null;
  const inspItems = storeItems[inspectionId] ?? [];

  const checkedCount = category
    ? inspItems.filter(i => i.checked && category.items.some(t => t.id === i.templateItemId)).length
    : 0;
  const totalCount = category?.items.length ?? 0;

  const handleUpdate = useCallback(
    (templateId: string, patch: Partial<InspectionItem>) => {
      updateItem(inspectionId, templateId, patch);
    },
    [inspectionId, updateItem],
  );

  if (!category) return null;

  function renderItem({ item: templateItem }: { item: ChecklistTemplateItem }) {
    const storeItem = inspItems.find(i => i.templateItemId === templateItem.id);
    return (
      <ChecklistItemCard
        inspectionId={inspectionId}
        templateItem={templateItem}
        storeItem={storeItem}
        onUpdate={handleUpdate}
      />
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={navBar.bar}>
        <TouchableOpacity style={navBar.backBtn} onPress={() => navigation.goBack()}>
          <Text style={navBar.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={s.navCenter}>
          <Text style={navBar.title}>{category.label}</Text>
          <Text style={s.navProgress}>{checkedCount}/{totalCount}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={category.items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListFooterComponent={
          <TouchableOpacity
            style={[s.nextBtn, !nextCategory && s.nextBtnSummary]}
            onPress={() => nextCategory
              ? navigation.replace('Checklist', { inspectionId, categoryId: nextCategory.id })
              : navigation.navigate('Summary', { inspectionId })
            }
            activeOpacity={0.85}
          >
            <Text style={s.nextBtnText}>
              {nextCategory ? `Next: ${nextCategory.label} →` : 'View Summary →'}
            </Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  navCenter: { flex: 1, alignItems: 'center' },
  navProgress: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  list: {
    backgroundColor: colors.card,
    margin: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 56 },

  item: { backgroundColor: colors.card, padding: spacing.lg },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },

  circle: {
    width: 26, height: 26, borderRadius: radius.full,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkMark: { color: colors.textInverse, fontSize: 13, fontWeight: '700' },

  itemText: { flex: 1 },
  hint: { marginTop: 2, lineHeight: 18 },
  severityPill: {
    borderRadius: radius.full, paddingHorizontal: 8,
    paddingVertical: 3, flexShrink: 0,
  },

  controls: { marginTop: spacing.md, marginLeft: 38, gap: spacing.sm },

  segmented: { flexDirection: 'row', gap: spacing.xs },
  segBtn: {
    flex: 1, paddingVertical: 7, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  segBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1, paddingVertical: 8, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', backgroundColor: colors.bg,
  },
  actionBtnActive: { borderColor: colors.brand, backgroundColor: '#EAF4F1' },
  actionBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  noteInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 14, color: colors.text, backgroundColor: '#FAFAFA',
    minHeight: 72, textAlignVertical: 'top',
  },

  photoScroll: { marginTop: spacing.xs },
  thumb: {
    width: 72, height: 72, borderRadius: radius.sm,
    marginRight: spacing.sm, backgroundColor: colors.border,
  },
  nextBtn: {
    margin: spacing.lg,
    marginTop: 0,
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnSummary: {
    backgroundColor: colors.pass,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
