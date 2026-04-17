import { StyleSheet } from 'react-native';

export const colors = {
  brand: '#0F6E56',
  walkAway: '#E24B4A',
  negotiate: '#EF9F27',
  pass: '#639922',

  bg: '#F5F5F5',
  card: '#FFFFFF',
  border: '#E5E7EB',

  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textInverse: '#FFFFFF',

  error: '#DC2626',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  full: 999,
};

export const typography = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: 0.3 },
  h2: { fontSize: 17, fontWeight: '700', color: colors.text },
  h3: { fontSize: 15, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textSecondary },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  tiny: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});

export const card = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
});

export const navBar = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand,
  },
  title: { fontSize: 17, fontWeight: '600', color: colors.textInverse },
  backBtn: { width: 60 },
  backText: { color: colors.textInverse, fontSize: 17 },
});

export function verdictColor(verdict?: string): string {
  if (verdict === 'walk_away') return colors.walkAway;
  if (verdict === 'caution') return colors.negotiate;
  if (verdict === 'pass') return colors.pass;
  return colors.brand;
}

export function verdictLabel(verdict?: string): string {
  if (verdict === 'walk_away') return 'Walk Away';
  if (verdict === 'caution') return 'Caution';
  if (verdict === 'pass') return 'Looks Good';
  return 'In Progress';
}
