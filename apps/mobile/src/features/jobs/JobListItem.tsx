import type { JobSummary } from '@coople-jobs/shared';
import { Link } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableCard } from '../../components/PressableCard';
import { formatDateTime, formatMoney } from '../../lib/format';
import {
  colors,
  fontSizes,
  fontWeights,
  lineHeights,
  radii,
  spacing,
  touchTarget,
} from '../../theme/tokens';
import { FavouriteButton } from '../favourites/FavouriteButton';

interface JobListItemProps {
  job: JobSummary;
}

export const JobListItem = memo(function JobListItem({ job }: JobListItemProps) {
  const startsAt = formatDateTime(job.startsAt);

  return (
    <View style={styles.container}>
      <Link href={`/job/${job.id}`} asChild>
        <PressableCard accessibilityRole="link" style={styles.card}>
          <View style={styles.top}>
            <Text style={styles.title} numberOfLines={2}>
              {job.title}
            </Text>
            <Text style={styles.location} numberOfLines={1}>
              {job.location.zip} {job.location.city}
            </Text>
          </View>

          <View style={styles.bottom}>
            <View style={styles.pay}>
              <Text style={styles.payText}>{formatMoney(job.hourlyWage)} / h</Text>
            </View>
            {startsAt ? <Text style={styles.date}>Starts {startsAt}</Text> : null}
          </View>
        </PressableCard>
      </Link>

      {/* A sibling of the card link, so tapping the star never opens the job. */}
      <View style={styles.favourite}>
        <FavouriteButton jobId={job.id} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  top: {
    gap: spacing.xs,
    // Keeps the title clear of the favourite star in the corner.
    paddingRight: touchTarget - spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.md,
  },
  location: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  bottom: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  pay: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  payText: {
    color: colors.onPrimarySoft,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.sm,
  },
  date: {
    color: colors.textSubtle,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  },
  favourite: {
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
  },
});
