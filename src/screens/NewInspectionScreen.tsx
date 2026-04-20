import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInspectionStore } from '../stores/inspectionStore';
import { useVehicleAutocomplete } from '../hooks/useVehicleAutocomplete';
import { AutocompleteField } from '../components/AutocompleteField';
import { colors, spacing, radius, typography, card, navBar } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'NewInspection'>;

export function NewInspectionScreen() {
  const navigation = useNavigation<Nav>();
  const createInspection = useInspectionStore(s => s.createInspection);
  const { makes, makesLoading, models, modelsLoading, fetchModelsForSelection } =
    useVehicleAutocomplete();

  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const yearInt = parseInt(year, 10);
  const yearValid = year.length === 4 && !isNaN(yearInt) && yearInt >= 1900;

  const filteredMakes = makes.filter(m =>
    m.toLowerCase().includes(make.toLowerCase())
  );
  const filteredModels = models.filter(m =>
    m.toLowerCase().includes(model.toLowerCase())
  );

  function handleYearChange(t: string) {
    setYear(t);
    setErrors(e => ({ ...e, year: '' }));
    const yr = parseInt(t, 10);
    if (t.length === 4 && !isNaN(yr) && yr >= 1900 && make) {
      fetchModelsForSelection(make, yr);
    }
  }

  function handleMakeSelect(selected: string) {
    setMake(selected);
    setModel('');
    setErrors(e => ({ ...e, make: '' }));
    if (yearValid) {
      fetchModelsForSelection(selected, yearInt);
    }
  }

  function handleMakeChange(t: string) {
    setMake(t);
    setModel('');
    setErrors(e => ({ ...e, make: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    const maxYear = new Date().getFullYear() + 1;
    if (!year || isNaN(yearInt) || yearInt < 1900 || yearInt > maxYear) {
      e.year = `Enter a year between 1900 and ${maxYear}`;
    }
    if (!make.trim()) e.make = 'Enter the make';
    if (!model.trim()) e.model = 'Enter the model';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleBegin() {
    if (!validate()) return;
    const askingPrice = price ? parseFloat(price.replace(/,/g, '')) : undefined;
    const inspection = createInspection(
      yearInt,
      make.trim(),
      model.trim(),
      askingPrice,
    );
    navigation.replace('Category', { inspectionId: inspection.id });
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={navBar.bar}>
          <TouchableOpacity style={navBar.backBtn} onPress={() => navigation.goBack()}>
            <Text style={navBar.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={navBar.title}>New Inspection</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.sectionLabel}>Vehicle Details</Text>

          <View style={card.base}>
            <Field label="Year" required error={errors.year}>
              <TextInput
                style={[s.input, errors.year ? s.inputError : null]}
                value={year}
                onChangeText={handleYearChange}
                placeholder="e.g. 2019"
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="next"
              />
            </Field>

            <View style={s.divider} />

            <Field label="Make" required error={errors.make}>
              <AutocompleteField
                value={make}
                onChangeText={handleMakeChange}
                onSelect={handleMakeSelect}
                suggestions={filteredMakes}
                loading={makesLoading}
                hasError={!!errors.make}
                placeholder="e.g. Toyota"
              />
            </Field>

            <View style={s.divider} />

            <Field label="Model" required error={errors.model}>
              <AutocompleteField
                value={model}
                onChangeText={t => { setModel(t); setErrors(e => ({ ...e, model: '' })); }}
                onSelect={m => { setModel(m); setErrors(e => ({ ...e, model: '' })); }}
                suggestions={filteredModels}
                loading={modelsLoading}
                disabled={!make || !yearValid}
                hasError={!!errors.model}
                placeholder={make && yearValid ? 'e.g. Camry' : 'Enter make & year first'}
              />
            </Field>

            <View style={s.divider} />

            <Field label="Asking Price" hint="Optional">
              <View style={s.priceRow}>
                <Text style={s.dollarSign}>$</Text>
                <TextInput
                  style={[s.input, s.priceInput]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0"
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
              </View>
            </Field>
          </View>

          <TouchableOpacity style={s.beginBtn} onPress={handleBegin} activeOpacity={0.85}>
            <Text style={[typography.h3, { color: colors.textInverse, fontSize: 17 }]}>
              Begin Inspection
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, required, hint, error, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.field}>
      <View style={s.fieldLabelRow}>
        <Text style={typography.label}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
        {hint && <Text style={typography.caption}>{hint}</Text>}
      </View>
      {children}
      {!!error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand },
  content: { padding: spacing.lg },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  field: { gap: spacing.xs },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FAFAFA',
  },
  inputError: { borderColor: colors.error },
  errorText: { fontSize: 12, color: colors.error },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dollarSign: { fontSize: 18, color: colors.textSecondary },
  priceInput: { flex: 1 },
  beginBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
