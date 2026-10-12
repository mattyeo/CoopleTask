import { useLocalSearchParams } from 'expo-router';
import { JobDetailsScreen } from '@/features/jobs/screens/JobDetailsScreen';

export default function JobRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const jobId = Array.isArray(id) ? id[0] : id;

  return <JobDetailsScreen id={jobId ?? ''} />;
}
