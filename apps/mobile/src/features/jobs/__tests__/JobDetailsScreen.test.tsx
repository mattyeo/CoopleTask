import { act, screen, userEvent } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { Linking } from 'react-native';
import { ApiError } from '@/shared/api/ApiError';
import { fetchJob } from '@/features/jobs/api/jobsApi';
import { ERROR_MESSAGES } from '@/shared/utils/errorMessages';
import { makeBareJobDetails, makeJob, makeJobDetails, makePage } from '@/test-utils/jobFactories';
import { createTestQueryClient, renderWithProviders } from '@/test-utils/renderWithProviders';
import { useBreakpoint, type Breakpoint } from '@/shared/theme/useBreakpoint';
import { useFavouritesStore } from '@/features/favourites/favouritesStore';
import { JobDetailsScreen } from '@/features/jobs/screens/JobDetailsScreen';
import { jobQueryKeys } from '@/features/jobs/api/jobQueryKeys';
import { PAGE_SIZE } from '@/features/jobs/hooks/useJobs';

jest.mock('@/features/jobs/api/jobsApi', () => ({ fetchJobs: jest.fn(), fetchJob: jest.fn() }));
jest.mock('@/shared/theme/useBreakpoint', () => ({
  ...jest.requireActual('@/shared/theme/useBreakpoint'),
  useBreakpoint: jest.fn(),
}));

const fetchJobMock = jest.mocked(fetchJob);
const offline = new ApiError('NETWORK_ERROR', 'offline', null);

const SECTION_TITLES = ['Pay', 'Schedule', 'Location', 'Dress code', 'Description'];

function setBreakpoint(breakpoint: Breakpoint): void {
  jest.mocked(useBreakpoint).mockReturnValue(breakpoint);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** The section headings on screen, in the order they appear. */
function sectionOrder(): string[] {
  return screen
    .getAllByRole('header')
    .map((heading) => String(heading.props.children))
    .filter((text) => SECTION_TITLES.includes(text));
}

async function renderJob(job = makeJobDetails()): Promise<void> {
  fetchJobMock.mockResolvedValue(job);
  await renderWithProviders(<JobDetailsScreen id={job.id} />);
  await screen.findByText(job.title);
}

beforeEach(() => {
  fetchJobMock.mockReset();
  setBreakpoint('compact');
  jest.mocked(router.canGoBack).mockReturnValue(false);
  useFavouritesStore.setState({ favouriteIds: {}, hasHydrated: true });
});

describe('loading', () => {
  it('shows a spinner until the job arrives', async () => {
    fetchJobMock.mockReturnValue(new Promise(() => undefined));

    await renderWithProviders(<JobDetailsScreen id="job-1" />);

    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });

  it('asks for the job with the id from the link', async () => {
    fetchJobMock.mockResolvedValue(makeJobDetails());

    await renderWithProviders(<JobDetailsScreen id="job-1" />);
    await screen.findByText('AllrounderIn / BetriebsmitarbeiterIn');

    expect(fetchJobMock.mock.calls[0]?.[0]).toBe('job-1');
  });
});

describe('a loaded job', () => {
  it('shows the title and the reference number', async () => {
    await renderJob();

    expect(screen.getByText('AllrounderIn / BetriebsmitarbeiterIn')).toBeOnTheScreen();
    expect(screen.getByText('Ref. 60261055776')).toBeOnTheScreen();
  });

  it('puts the job title in the page header', async () => {
    await renderJob();

    const calls = jest.mocked(Stack.Screen).mock.calls;
    const options = (calls[calls.length - 1]?.[0] as { options: { title: string } }).options;
    expect(options.title).toBe('AllrounderIn / BetriebsmitarbeiterIn');
  });

  it('shows the hourly wage and the total pay', async () => {
    await renderJob();

    // Currency and amount are separated by a no-break space.
    expect(screen.getByText(/^CHF.27\.00$/)).toBeOnTheScreen();
    expect(screen.getByText('per hour')).toBeOnTheScreen();
    expect(screen.getByText(/Total for this assignment: CHF.445\.50/)).toBeOnTheScreen();
  });

  it('shows the full address', async () => {
    await renderJob();

    expect(screen.getByText('Bahnhofstrasse 1, 6343 Rotkreuz ZG, CH')).toBeOnTheScreen();
  });

  it('shows the schedule in Swiss time', async () => {
    await renderJob();

    expect(screen.getByText('Starts')).toBeOnTheScreen();
    expect(screen.getByText('12.10.2026, 06:00')).toBeOnTheScreen();
    expect(screen.getByText('Ends')).toBeOnTheScreen();
    expect(screen.getByText('14.10.2026, 15:00')).toBeOnTheScreen();
    expect(screen.getByText('First shift ends')).toBeOnTheScreen();
    expect(screen.getByText('12.10.2026, 15:00')).toBeOnTheScreen();
    expect(screen.getByText('Shifts')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
    expect(screen.getByText('Total work time')).toBeOnTheScreen();
    expect(screen.getByText('16 h 30 min')).toBeOnTheScreen();
  });

  it('shows the dress code', async () => {
    await renderJob();

    expect(screen.getByText('T-Shirt und Schürze werden gestellt')).toBeOnTheScreen();
  });

  it('renders the description as headings, bullets and paragraphs, without markup characters', async () => {
    await renderJob();

    expect(screen.getByText('Die AG sucht einen Allrounder.')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Aufgaben:' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Fähigkeiten:' })).toBeOnTheScreen();
    expect(screen.getByText('Gemüse rüsten')).toBeOnTheScreen();
    expect(screen.getAllByText('•')).toHaveLength(3);
    expect(screen.queryByText(/\*\*/)).not.toBeOnTheScreen();
  });

  it('opens the job in the Coople app', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await renderJob();

    await userEvent.setup().press(screen.getByRole('button', { name: 'Open in Coople app' }));

    expect(openURL).toHaveBeenCalledWith('https://coople.app.link/DV6KNlsy46b');
  });

  it('keeps working when nothing on the device can open the link', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
    await renderJob();

    await userEvent.setup().press(screen.getByRole('button', { name: 'Open in Coople app' }));

    expect(screen.getByText('AllrounderIn / BetriebsmitarbeiterIn')).toBeOnTheScreen();
  });

  it('lets the user favourite the job from the page', async () => {
    await renderJob();

    await userEvent.setup().press(screen.getByRole('button', { name: 'Add to favourites' }));

    expect(screen.getByRole('button', { name: 'Remove from favourites' })).toBeOnTheScreen();
    expect(useFavouritesStore.getState().favouriteIds).toEqual({ 'job-1': true });
  });
});

describe('a job without optional details', () => {
  beforeEach(async () => {
    await renderJob(makeBareJobDetails());
  });

  it('shows what is known and nothing in its place for the rest', async () => {
    expect(screen.getByText('Pay')).toBeOnTheScreen();
    expect(screen.getByText('Schedule')).toBeOnTheScreen();
    expect(screen.getByText('6343 Rotkreuz ZG')).toBeOnTheScreen();
    expect(screen.getByText('Starts')).toBeOnTheScreen();
  });

  it('hides the sections that have no content', async () => {
    expect(screen.queryByText('Dress code')).not.toBeOnTheScreen();
    expect(screen.queryByText('Description')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Open in Coople app' })).not.toBeOnTheScreen();
  });

  it('hides the schedule rows that have no value', async () => {
    for (const label of ['Ends', 'First shift ends', 'Shifts', 'Total work time']) {
      expect(screen.queryByText(label)).not.toBeOnTheScreen();
    }
  });

  it('never shows a placeholder for missing values', async () => {
    for (const bad of [/null/, /undefined/, /NaN/, /Invalid Date/]) {
      expect(screen.queryByText(bad)).not.toBeOnTheScreen();
    }
  });
});

describe('errors', () => {
  it('tells the user a job that no longer exists is gone, and offers the way back, not Retry', async () => {
    fetchJobMock.mockRejectedValue(new ApiError('JOB_NOT_FOUND', 'missing', 404));

    await renderWithProviders(<JobDetailsScreen id="gone" />);

    expect(await screen.findByText(ERROR_MESSAGES.JOB_NOT_FOUND)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeOnTheScreen();

    await userEvent.setup().press(screen.getByRole('button', { name: 'Back to jobs' }));
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('tells the user a link that is not valid is not valid', async () => {
    fetchJobMock.mockRejectedValue(new ApiError('INVALID_JOB_ID', 'bad id', 400));

    await renderWithProviders(<JobDetailsScreen id="not-a-uuid" />);

    expect(await screen.findByText(ERROR_MESSAGES.INVALID_JOB_ID)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Back to jobs' })).toBeOnTheScreen();
  });

  it('goes back in the history when there is one', async () => {
    jest.mocked(router.canGoBack).mockReturnValue(true);
    fetchJobMock.mockRejectedValue(new ApiError('JOB_NOT_FOUND', 'missing', 404));
    await renderWithProviders(<JobDetailsScreen id="gone" />);

    await userEvent.setup().press(await screen.findByRole('button', { name: 'Back to jobs' }));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('offers Retry for a network problem and shows the job once it works', async () => {
    fetchJobMock.mockRejectedValueOnce(offline).mockResolvedValueOnce(makeJobDetails());
    await renderWithProviders(<JobDetailsScreen id="job-1" />);

    expect(await screen.findByText(ERROR_MESSAGES.NETWORK_ERROR)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Back to jobs' })).not.toBeOnTheScreen();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('AllrounderIn / BetriebsmitarbeiterIn')).toBeOnTheScreen();
  });
});

describe('opened from the list', () => {
  function cachedList() {
    const client = createTestQueryClient();
    client.setQueryData(jobQueryKeys.list(PAGE_SIZE), {
      pages: [makePage(0, [{ ...makeJob('job-1'), title: 'Cached title' }], { total: 1 })],
      pageParams: [0],
    });
    return client;
  }

  it('shows what the list already knew while the rest loads', async () => {
    const details = deferred<ReturnType<typeof makeJobDetails>>();
    fetchJobMock.mockReturnValue(details.promise);

    await renderWithProviders(<JobDetailsScreen id="job-1" />, cachedList());

    expect(screen.getByText('Cached title')).toBeOnTheScreen();
    expect(screen.getByText(/^CHF.25\.00$/)).toBeOnTheScreen();
    expect(screen.getByText('8000 Zürich, CH')).toBeOnTheScreen();
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });

  it('does not show details it does not have yet as if they were empty', async () => {
    fetchJobMock.mockReturnValue(new Promise(() => undefined));

    await renderWithProviders(<JobDetailsScreen id="job-1" />, cachedList());

    for (const hidden of ['Schedule', 'Dress code', 'Description']) {
      expect(screen.queryByText(hidden)).not.toBeOnTheScreen();
    }
    expect(screen.queryByRole('button', { name: 'Open in Coople app' })).not.toBeOnTheScreen();
  });

  it('replaces the spinner with the real details when they arrive', async () => {
    const details = deferred<ReturnType<typeof makeJobDetails>>();
    fetchJobMock.mockReturnValue(details.promise);
    await renderWithProviders(<JobDetailsScreen id="job-1" />, cachedList());

    await act(async () => details.resolve(makeJobDetails()));

    expect(await screen.findByText('Description')).toBeOnTheScreen();
    expect(screen.getByText('Schedule')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Loading')).not.toBeOnTheScreen();
    expect(screen.getByText('AllrounderIn / BetriebsmitarbeiterIn')).toBeOnTheScreen();
  });

  it('shows the error when the details cannot be loaded, not the placeholder', async () => {
    fetchJobMock.mockRejectedValue(offline);

    await renderWithProviders(<JobDetailsScreen id="job-1" />, cachedList());

    expect(await screen.findByText(ERROR_MESSAGES.NETWORK_ERROR)).toBeOnTheScreen();
    expect(screen.queryByText('Cached title')).not.toBeOnTheScreen();
  });
});

describe('layout by screen width', () => {
  it.each(['compact', 'medium'] as const)(
    'stacks the sections in one column on a %s screen',
    async (breakpoint) => {
      setBreakpoint(breakpoint);
      await renderJob();

      expect(sectionOrder()).toEqual(['Pay', 'Schedule', 'Location', 'Dress code', 'Description']);
    },
  );

  it('puts the long text first and the key facts in a side card on a wide screen', async () => {
    setBreakpoint('expanded');
    await renderJob();

    expect(sectionOrder()).toEqual(['Description', 'Dress code', 'Pay', 'Schedule', 'Location']);
  });

  it('shows every section exactly once at every width', async () => {
    for (const breakpoint of ['compact', 'medium', 'expanded'] as const) {
      setBreakpoint(breakpoint);
      await renderJob();

      expect(sectionOrder().sort()).toEqual([...SECTION_TITLES].sort());
      expect(screen.getAllByRole('button', { name: 'Open in Coople app' })).toHaveLength(1);
    }
  });

  it('still shows the key facts when a wide screen has no long text', async () => {
    setBreakpoint('expanded');
    await renderJob(makeBareJobDetails({ appLink: 'https://coople.app.link/x' }));

    expect(sectionOrder()).toEqual(['Pay', 'Schedule', 'Location']);
    expect(screen.getByRole('button', { name: 'Open in Coople app' })).toBeOnTheScreen();
  });
});
