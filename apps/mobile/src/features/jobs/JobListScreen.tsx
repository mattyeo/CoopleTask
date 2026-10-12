import { useMemo } from 'react';
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
import { JobListFooter } from './JobListFooter';
import { JobListItem } from './JobListItem';
import { toListEntries, type ListEntry } from './listLayout';
import { mergePages } from './pagination';
import { useJobs } from './useJobs';

/** How close to the end of the list (in screen heights) the next page starts loading. */
const END_REACHED_THRESHOLD = 0.5;

export function JobListScreen() {
  const {
    data,
    isError,
    error,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useJobs();
  const columns = getColumnCount(useBreakpoint());
  const containerStyle = useContainerStyle(maxWidths.list);
  const insets = useSafeAreaInsets();

  const jobs = useMemo(() => mergePages(data?.pages ?? []), [data?.pages]);
  const entries = useMemo(() => toListEntries(jobs, columns), [jobs, columns]);

  if (data === undefined) {
    return isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : <LoadingState />;
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No jobs available right now"
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    );
  }

  const total = data.pages[data.pages.length - 1]?.total ?? jobs.length;

  // After a failed page request the list keeps asking for the same page every time it is scrolled
  // to the end; stop until the user taps Retry in the footer.
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  };

  return (
    <FlatList
      // numColumns cannot change on a mounted list, so a new column count remounts it.
      key={columns}
      data={entries}
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
          {isError && !isFetchNextPageError ? (
            <Text style={styles.banner}>Could not refresh. Showing the last loaded jobs.</Text>
          ) : null}
          <Text style={styles.count}>{total} jobs available</Text>
        </View>
      }
      ListFooterComponent={
        <JobListFooter
          isLoadingMore={isFetchingNextPage}
          hasLoadMoreError={isFetchNextPageError}
          hasMore={hasNextPage}
          onRetry={() => void fetchNextPage()}
        />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={END_REACHED_THRESHOLD}
      // `isRefetching` is also true while a further page loads; that is not a pull-to-refresh.
      refreshing={isRefetching && !isFetchingNextPage}
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
