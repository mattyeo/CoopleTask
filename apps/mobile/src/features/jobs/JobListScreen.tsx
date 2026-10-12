import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import {
  colors,
  fontSizes,
  fontWeights,
  lineHeights,
  maxWidths,
  radii,
  spacing,
} from '../../theme/tokens';
import { getColumnCount, useBreakpoint } from '../../theme/useBreakpoint';
import { useContainerStyle } from '../../theme/useContainerStyle';
import { JobListItem } from './JobListItem';
import { toListEntries, type ListEntry } from './listLayout';
import { useJobs } from './useJobs';

export function JobListScreen() {
  const { data, isError, refetch, error, isRefetching } = useJobs();
  const columns = getColumnCount(useBreakpoint());
  const containerStyle = useContainerStyle(maxWidths.list);
  const insets = useSafeAreaInsets();

  if (data === undefined) {
    return isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : <LoadingState />;
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        title="No jobs available right now"
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <FlatList
      // numColumns cannot change on a mounted list, so a new column count remounts it.
      key={columns}
      data={toListEntries(data.items, columns)}
      numColumns={columns}
      keyExtractor={(entry) => entry.key}
      renderItem={({ item }) => <ListCell entry={item} />}
      ItemSeparatorComponent={RowSeparator}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      contentContainerStyle={[
        containerStyle,
        { paddingTop: spacing.lg, paddingBottom: spacing.xxl + insets.bottom },
      ]}
      ListHeaderComponent={
        <View style={styles.header}>
          {isError ? (
            <Text style={styles.banner}>Could not refresh. Showing the last loaded jobs.</Text>
          ) : null}
          <Text style={styles.count}>{data.total} jobs available</Text>
        </View>
      }
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
    />
  );
}

function ListCell({ entry }: { entry: ListEntry }) {
  if (entry.kind === 'filler') {
    return <View style={styles.filler} importantForAccessibility="no-hide-descendants" />;
  }
  return <JobListItem job={entry.job} />;
}

function RowSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  count: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.sm,
  },
  banner: {
    backgroundColor: colors.warningSurface,
    borderRadius: radii.md,
    color: colors.onWarningSurface,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    padding: spacing.md,
    textAlign: 'center',
  },
  row: {
    gap: spacing.lg,
  },
  separator: {
    height: spacing.lg,
  },
  filler: {
    flex: 1,
  },
});
