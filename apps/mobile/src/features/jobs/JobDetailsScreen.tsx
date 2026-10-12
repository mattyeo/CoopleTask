import type { JobDetails } from '@coople-jobs/shared';
import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { formatDateTime, formatDuration, formatMoney } from '../../lib/format';
import { goBackToList } from '../../lib/navigation';
import { FavouriteButton } from '../favourites/FavouriteButton';
import { JobDescription } from './JobDescription';
import { useJob } from './useJob';

interface JobDetailsScreenProps {
  id: string;
}

interface DetailRow {
  label: string;
  value: string | null;
}

export function JobDetailsScreen({ id }: JobDetailsScreenProps) {
  const { data: job, isError, error, isPlaceholderData, refetch } = useJob(id);

  if (job === undefined) {
    return isError ? (
      <ErrorState error={error} onRetry={() => void refetch()} onBack={goBackToList} />
    ) : (
      <LoadingState />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{ title: job.title, headerRight: () => <FavouriteButton jobId={job.id} /> }}
      />

      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {job.title}
        </Text>
        <Text style={styles.reference}>Reference {job.referenceNumber}</Text>
      </View>

      <Section title="Pay">
        <Rows
          rows={[
            { label: 'Hourly wage', value: formatMoney(job.hourlyWage) },
            { label: 'Total pay', value: formatMoney(job.totalPay) },
          ]}
        />
      </Section>

      <Section title="Location">
        <Text style={styles.value}>{formatLocation(job)}</Text>
      </Section>

      {isPlaceholderData ? (
        <ActivityIndicator size="large" style={styles.bodySpinner} accessibilityLabel="Loading" />
      ) : (
        <>
          <Section title="Schedule">
            <Rows
              rows={[
                { label: 'Starts', value: formatDateTime(job.startsAt) },
                { label: 'Ends', value: formatDateTime(job.endsAt) },
                { label: 'First shift ends', value: formatDateTime(job.firstShiftEndsAt) },
                { label: 'Shifts', value: job.shiftCount === null ? null : String(job.shiftCount) },
                { label: 'Total work time', value: formatDuration(job.totalWorkMinutes) },
              ]}
            />
          </Section>

          {job.dressCode ? (
            <Section title="Dress code">
              <Text style={styles.value}>{job.dressCode}</Text>
            </Section>
          ) : null}

          {job.description ? (
            <Section title="Description">
              <JobDescription text={job.description} />
            </Section>
          ) : null}

          {job.appLink ? (
            <View style={styles.action}>
              <Button label="Open in Coople app" onPress={() => void openAppLink(job.appLink)} />
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Renders label/value pairs, skipping the ones without a value. */
function Rows({ rows }: { rows: DetailRow[] }) {
  return (
    <View style={styles.rows}>
      {rows.map((row) =>
        row.value === null ? null : (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 4,
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
  },
  reference: {
    color: '#6b7280',
    fontSize: 13,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rows: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: {
    color: '#4b5563',
    fontSize: 15,
  },
  value: {
    color: '#111827',
    fontSize: 15,
    flexShrink: 1,
    textAlign: 'right',
  },
  bodySpinner: {
    marginTop: 24,
  },
  action: {
    alignItems: 'flex-start',
  },
});
