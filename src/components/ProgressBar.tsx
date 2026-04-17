import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  value: number; // 0–1
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color = colors.brand, height = 5 }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={[s.track, { height }]}>
      {clamped > 0 && (
        <View style={[s.fill, { flex: clamped, backgroundColor: color, height }]} />
      )}
      {clamped < 1 && (
        <View style={{ flex: 1 - clamped, height }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 3,
  },
});
