import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, lineHeights, spacing } from '@/shared/theme/tokens';

export interface DetailRow {
  label: string;
  value: string | null;
}

interface DetailRowsProps {
  rows: DetailRow[];
}

/** Label / value pairs separated by hairlines. Rows without a value are skipped. */
export function DetailRows({ rows }: DetailRowsProps) {
  const visibleRows = rows.filter(
    (row): row is DetailRow & { value: string } => row.value !== null,
  );

  return (
    <View>
      {visibleRows.map((row, index) => (
        <View key={row.label} style={[styles.row, index > 0 && styles.divider]}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  divider: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  label: {
    color: colors.textMuted,
    flexShrink: 0,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  value: {
    color: colors.text,
    flexShrink: 1,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    textAlign: 'right',
  },
});
