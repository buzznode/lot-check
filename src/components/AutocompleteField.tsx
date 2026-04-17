import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { colors, spacing, radius } from '../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: string) => void;
  suggestions: string[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function AutocompleteField({
  value,
  onChangeText,
  onSelect,
  suggestions,
  loading = false,
  disabled = false,
  placeholder,
  hasError = false,
  autoCapitalize = 'words',
}: Props) {
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDropdown =
    focused &&
    value.length > 0 &&
    suggestions.length > 0 &&
    !suggestions.find(s => s.toLowerCase() === value.toLowerCase());

  function handleFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setFocused(true);
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => setFocused(false), 150);
  }

  function handleSelect(item: string) {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    onSelect(item);
    setFocused(false);
  }

  return (
    <View>
      <View style={s.inputRow}>
        <TextInput
          style={[s.input, hasError && s.inputError, disabled && s.inputDisabled]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.brand}
            style={s.spinner}
          />
        )}
      </View>

      {showDropdown && (
        <View style={s.dropdown}>
          <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
            {suggestions.map((item, i) => (
              <View key={item}>
                {i > 0 && <View style={s.separator} />}
                <TouchableOpacity style={s.row} onPress={() => handleSelect(item)}>
                  <Text style={s.rowText}>{item}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
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
  inputDisabled: { opacity: 0.4 },
  spinner: { position: 'absolute', right: spacing.md },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: '#fff',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  list: { maxHeight: 200 },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  rowText: { fontSize: 15, color: colors.text },
  separator: { height: 1, backgroundColor: colors.border },
});
