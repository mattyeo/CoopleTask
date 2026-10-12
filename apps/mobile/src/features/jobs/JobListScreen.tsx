import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { JobListItem } from './JobListItem';
import { useJobs } from './useJobs';

export function JobListScreen() {
  const { data, isError, refetch, error, isRefetching } = useJobs();

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
      data={data.items}
      keyExtractor={(job) => job.id}
      renderItem={({ item }) => <JobListItem job={item} />}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={
        isError ? (
          <Text style={styles.banner}>Could not refresh. Showing the last loaded jobs.</Text>
        ) : null
      }
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1d5db',
  },
  banner: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: 12,
    textAlign: 'center',
  },
});
