import type { JobSummary } from '@coople-jobs/shared';
import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDateTime, formatMoney } from '../../lib/format';

interface JobListItemProps {
  job: JobSummary;
}

export const JobListItem = memo(function JobListItem({ job }: JobListItemProps) {
  const startsAt = formatDateTime(job.startsAt);

  return (
    <View style={styles.row}>
      <Link href={`/job/${job.id}`} asChild>
        <Pressable accessibilityRole="link" style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.detail}>
            {job.location.zip} {job.location.city}
          </Text>
          <Text style={styles.detail}>{formatMoney(job.hourlyWage)}/h</Text>
          {startsAt ? <Text style={styles.detail}>Starts {startsAt}</Text> : null}
        </Pressable>
      </Link>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '600',
  },
  detail: {
    color: '#4b5563',
    fontSize: 14,
  },
});
