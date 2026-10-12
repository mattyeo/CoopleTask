import type { JobDetails } from '@coople-jobs/shared';
import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { formatDateTime, formatDuration, formatMoney } from '../../lib/format';
import { goBackToList } from '../../lib/navigation';
import {
  colors,
  fontSizes,
  fontWeights,
  lineHeights,
  maxWidths,
  radii,
  sidebarWidth,
  spacing,
} from '../../theme/tokens';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { useContainerStyle } from '../../theme/useContainerStyle';
import { FavouriteButton } from '../favourites/FavouriteButton';
import { DetailRows, type DetailRow } from './DetailRows';
import { DetailSection } from './DetailSection';
import { JobDescription } from './JobDescription';
import { useJob } from './useJob';

interface JobDetailsScreenProps {
  id: string;
}

export function JobDetailsScreen({ id }: JobDetailsScreenProps) {
  const { data: job, isError, error, isPlaceholderData, refetch } = useJob(id);
  const isExpanded = useBreakpoint() === 'expanded';
  const containerStyle = useContainerStyle(isExpanded ? maxWidths.details : maxWidths.narrow);
  const insets = useSafeAreaInsets();

  if (job === undefined) {
    return isError ? (
      <ErrorState error={error} onRetry={() => void refetch()} onBack={goBackToList} />
    ) : (
      <LoadingState />
    );
  }

  // While only the list summary is known (`isPlaceholderData`), the sections that need the full
  // details are replaced by one spinner; everything else is already real data.
  const hasFullDetails = !isPlaceholderData;

  const scheduleRows: DetailRow[] = [
    { label: 'Starts', value: formatDateTime(job.startsAt) },
    { label: 'Ends', value: formatDateTime(job.endsAt) },
    { label: 'First shift ends', value: formatDateTime(job.firstShiftEndsAt) },
    { label: 'Shifts', value: job.shiftCount === null ? null : String(job.shiftCount) },
    { label: 'Total work time', value: formatDuration(job.totalWorkMinutes) },
  ];

  const pay = (
    <DetailSection title="Pay">
      <View>
        <View style={styles.hourlyRow}>
          <Text style={styles.hourlyAmount}>{formatMoney(job.hourlyWage)}</Text>
          <Text style={styles.hourlyUnit}>per hour</Text>
        </View>
        <Text style={styles.totalPay}>Total for this assignment: {formatMoney(job.totalPay)}</Text>
      </View>
    </DetailSection>
  );

  const location = (
    <DetailSection title="Location">
      <Text style={styles.body}>{formatLocation(job)}</Text>
    </DetailSection>
  );

  const schedule =
    hasFullDetails && scheduleRows.some((row) => row.value !== null) ? (
      <DetailSection title="Schedule">
        <DetailRows rows={scheduleRows} />
      </DetailSection>
    ) : null;

  const dressCode =
    hasFullDetails && job.dressCode ? (
      <DetailSection title="Dress code">
        <Text style={styles.body}>{job.dressCode}</Text>
      </DetailSection>
    ) : null;

  const description =
    hasFullDetails && job.description ? (
      <DetailSection title="Description">
        <JobDescription text={job.description} />
      </DetailSection>
    ) : null;

  const appLink =
    hasFullDetails && job.appLink ? (
      <Button label="Open in Coople app" onPress={() => void openAppLink(job.appLink)} />
    ) : null;

  const loading = hasFullDetails ? null : (
    <Card style={styles.loadingCard}>
      <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
    </Card>
  );

  const header = <HeaderCard job={job} isLarge={isExpanded} />;

  return (
    <ScrollView
      contentContainerStyle={[
        containerStyle,
        styles.page,
        { paddingBottom: spacing.xxl + insets.bottom },
      ]}
    >
      <Stack.Screen options={{ title: job.title }} />
      {header}

      {isExpanded ? (
        <ExpandedBody
          main={[
            loading,
            description && <Card>{description}</Card>,
            dressCode && <Card>{dressCode}</Card>,
          ]}
          side={[pay, schedule, location]}
          action={appLink}
        />
      ) : (
        <>
          <Card>{pay}</Card>
          {loading}
          {schedule ? <Card>{schedule}</Card> : null}
          <Card>{location}</Card>
          {dressCode ? <Card>{dressCode}</Card> : null}
          {description ? <Card>{description}</Card> : null}
          {appLink}
        </>
      )}
    </ScrollView>
  );
}

function HeaderCard({ job, isLarge }: { job: JobDetails; isLarge: boolean }) {
  return (
    <Card style={styles.headerCard}>
      <View style={styles.headerText}>
        <Text style={[styles.title, isLarge && styles.titleLarge]} accessibilityRole="header">
          {job.title}
        </Text>
        <View style={styles.reference}>
          <Text style={styles.referenceText}>Ref. {job.referenceNumber}</Text>
        </View>
      </View>
      <FavouriteButton jobId={job.id} />
    </Card>
  );
}

interface ExpandedBodyProps {
  main: ReactNode[];
  side: ReactNode[];
  action: ReactNode;
}

/** Two columns: long text on the left, a card with the key facts on the right. */
function ExpandedBody({ main, side, action }: ExpandedBodyProps) {
  const mainItems = main.filter(Boolean);
  const sideItems = side.filter(Boolean);

  const sideCard = (
    <Card style={styles.sideCard}>
      {sideItems.map((item, index) => (
        <View key={index} style={index > 0 && styles.sideDivided}>
          {item}
        </View>
      ))}
      {action}
    </Card>
  );

  // Nothing to put in the main column (no description or dress code): do not leave it empty.
  if (mainItems.length === 0) return sideCard;

  return (
    <View style={styles.columns}>
      <View style={styles.mainColumn}>
        {mainItems.map((item, index) => (
          <View key={index}>{item}</View>
        ))}
      </View>
      <View style={styles.sideColumn}>{sideCard}</View>
    </View>
  );
}

function formatLocation(job: JobDetails): string {
  const { street, zip, city, countryCode } = job.location;
  const cityLine = [zip, city].filter(Boolean).join(' ');
  return [street, cityLine, countryCode].filter(Boolean).join(', ');
}

async function openAppLink(url: string | null): Promise<void> {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {
    // Nothing can handle the link on this device; there is nothing useful to show.
  }
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerCard: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.xl,
  },
  titleLarge: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
  },
  reference: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  referenceText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  },
  hourlyRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hourlyAmount: {
    color: colors.onPrimarySoft,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.xxl,
  },
  hourlyUnit: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  totalPay: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginTop: spacing.xs,
  },
  body: {
    color: colors.text,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  columns: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  mainColumn: {
    flex: 1,
    gap: spacing.lg,
    minWidth: 0,
  },
  sideColumn: {
    flexShrink: 0,
    width: sidebarWidth,
  },
  sideCard: {
    gap: spacing.lg,
  },
  sideDivided: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },
});
