import { screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchJob } from '@/features/jobs/api/jobsApi';
import { renderWithProviders } from '@/test-utils/renderWithProviders';
import JobRoute from '@/app/job/[id]';

jest.mock('@/features/jobs/api/jobsApi', () => ({ fetchJobs: jest.fn(), fetchJob: jest.fn() }));

const fetchJobMock = jest.mocked(fetchJob);
const paramsMock = jest.mocked(useLocalSearchParams);

beforeEach(() => {
  fetchJobMock.mockReset();
  fetchJobMock.mockReturnValue(new Promise(() => undefined));
});

describe('the /job/:id route', () => {
  it('shows the job whose id is in the link', async () => {
    paramsMock.mockReturnValue({ id: '2c92cf2f-5073-4842-bedd-580e3a8feea9' });

    await renderWithProviders(<JobRoute />);

    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
    expect(fetchJobMock.mock.calls[0]?.[0]).toBe('2c92cf2f-5073-4842-bedd-580e3a8feea9');
  });

  it('uses the first value when the router hands over a list of ids', async () => {
    paramsMock.mockReturnValue({ id: ['first-id', 'second-id'] });

    await renderWithProviders(<JobRoute />);

    expect(fetchJobMock.mock.calls[0]?.[0]).toBe('first-id');
  });
});
