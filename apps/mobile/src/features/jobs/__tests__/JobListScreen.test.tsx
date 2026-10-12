import { screen, userEvent } from '@testing-library/react-native';
import { ApiError } from '../../../api/ApiError';
import { fetchJobs } from '../../../api/jobsApi';
import { ERROR_MESSAGES } from '../../../lib/errorMessages';
import { makeJobs, makePage } from '../../../testing/jobFactories';
import { renderWithProviders } from '../../../testing/renderWithProviders';
import { useBreakpoint, type Breakpoint } from '../../../theme/useBreakpoint';
import { useFavouritesStore } from '../../favourites/favouritesStore';
import { JobListScreen } from '../JobListScreen';

jest.mock('../../../api/jobsApi', () => ({ fetchJobs: jest.fn(), fetchJob: jest.fn() }));
jest.mock('../../../theme/useBreakpoint', () => ({
  ...jest.requireActual('../../../theme/useBreakpoint'),
  useBreakpoint: jest.fn(),
}));

const fetchJobsMock = jest.mocked(fetchJobs);
const offline = new ApiError('NETWORK_ERROR', 'offline', null);

const END_OF_LIST = {
  y: 900,
  contentSize: { width: 390, height: 1000 },
  layoutMeasurement: { width: 390, height: 800 },
};

function setBreakpoint(breakpoint: Breakpoint): void {
  jest.mocked(useBreakpoint).mockReturnValue(breakpoint);
}

function pageOf(count: number, options: { total?: number; page?: number; prefix?: string } = {}) {
  const { total = count, page = 0, prefix = 'job' } = options;
  return makePage(page, makeJobs(count, prefix), { total, pageSize: 30 });
}

beforeEach(() => {
  fetchJobsMock.mockReset();
  setBreakpoint('compact');
  useFavouritesStore.setState({ favouriteIds: {}, hasHydrated: true });
});

describe('loading', () => {
  it('shows a spinner until the first page arrives', async () => {
    fetchJobsMock.mockReturnValue(new Promise(() => undefined));

    await renderWithProviders(<JobListScreen />);

    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
    expect(screen.queryByTestId('job-list')).not.toBeOnTheScreen();
  });

  it('asks for the first page of 30 jobs', async () => {
    fetchJobsMock.mockResolvedValue(pageOf(3));

    await renderWithProviders(<JobListScreen />);
    await screen.findByTestId('job-list');

    expect(fetchJobsMock.mock.calls[0]?.[0]).toEqual({ page: 0, pageSize: 30 });
  });
});

describe('error', () => {
  it('shows the message and Retry when the first page cannot be loaded', async () => {
    fetchJobsMock.mockRejectedValue(offline);

    await renderWithProviders(<JobListScreen />);

    expect(await screen.findByText(ERROR_MESSAGES.NETWORK_ERROR)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
  });

  it('recovers when Retry is pressed and the request works the second time', async () => {
    fetchJobsMock.mockRejectedValueOnce(offline).mockResolvedValueOnce(pageOf(3));
    await renderWithProviders(<JobListScreen />);

    await userEvent.setup().press(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Job job-0')).toBeOnTheScreen();
    expect(screen.queryByText(ERROR_MESSAGES.NETWORK_ERROR)).not.toBeOnTheScreen();
    expect(fetchJobsMock).toHaveBeenCalledTimes(2);
  });

  it('offers no Retry for an error that retrying cannot fix', async () => {
    fetchJobsMock.mockRejectedValue(new ApiError('INVALID_REQUEST', 'bad', 400));

    await renderWithProviders(<JobListScreen />);

    expect(await screen.findByText(ERROR_MESSAGES.INVALID_REQUEST)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeOnTheScreen();
  });
});

describe('empty', () => {
  it('says that there are no jobs and offers Retry', async () => {
    fetchJobsMock.mockResolvedValue(pageOf(0));

    await renderWithProviders(<JobListScreen />);

    expect(await screen.findByText('No jobs available right now')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
  });

  it('loads again when Retry is pressed', async () => {
    fetchJobsMock.mockResolvedValueOnce(pageOf(0)).mockResolvedValueOnce(pageOf(2));
    await renderWithProviders(<JobListScreen />);

    await userEvent.setup().press(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Job job-1')).toBeOnTheScreen();
    expect(screen.queryByText('No jobs available right now')).not.toBeOnTheScreen();
  });
});

describe('success', () => {
  it('shows every job with its title, place, hourly wage and start time', async () => {
    fetchJobsMock.mockResolvedValue(pageOf(3));

    await renderWithProviders(<JobListScreen />);

    expect(await screen.findByText('Job job-0')).toBeOnTheScreen();
    expect(screen.getByText('Job job-1')).toBeOnTheScreen();
    expect(screen.getByText('Job job-2')).toBeOnTheScreen();
    expect(screen.getAllByText('8000 Zürich')).toHaveLength(3);
    // Currency and amount are separated by a no-break space.
    expect(screen.getAllByText(/CHF.25\.00 \/ h/)).toHaveLength(3);
    expect(screen.getAllByText(/Starts 12\.10\.2026, 06:00/)).toHaveLength(3);
  });

  it('shows how many jobs exist in total, not only how many are loaded', async () => {
    fetchJobsMock.mockResolvedValue(pageOf(30, { total: 650 }));

    await renderWithProviders(<JobListScreen />);

    expect(await screen.findByText('650 jobs available')).toBeOnTheScreen();
  });

  it('turns every job into a link to its details page', async () => {
    fetchJobsMock.mockResolvedValue(pageOf(2));

    await renderWithProviders(<JobListScreen />);
    const links = await screen.findAllByRole('link');

    expect(links.map((link) => link.props.href)).toEqual(['/job/job-0', '/job/job-1']);
  });

  it('shows a star on every job', async () => {
    fetchJobsMock.mockResolvedValue(pageOf(2));

    await renderWithProviders(<JobListScreen />);

    expect(await screen.findAllByRole('button', { name: 'Add to favourites' })).toHaveLength(2);
  });
});

describe('grid', () => {
  async function fillersFor(breakpoint: Breakpoint, jobs: number): Promise<number> {
    setBreakpoint(breakpoint);
    fetchJobsMock.mockResolvedValue(pageOf(jobs));
    await renderWithProviders(<JobListScreen />);
    await screen.findByText('Job job-0');
    return screen.queryAllByTestId('list-filler', { includeHiddenElements: true }).length;
  }

  it('needs no filler in a single column', async () => {
    expect(await fillersFor('compact', 5)).toBe(0);
  });

  it('pads an incomplete last row so every card keeps the same width', async () => {
    expect(await fillersFor('medium', 5)).toBe(1);
  });

  it('pads up to three columns on wide screens', async () => {
    expect(await fillersFor('expanded', 4)).toBe(2);
  });

  it('adds no filler when the last row is full', async () => {
    expect(await fillersFor('expanded', 6)).toBe(0);
  });

  it('shows all jobs at every width', async () => {
    for (const breakpoint of ['compact', 'medium', 'expanded'] as const) {
      fetchJobsMock.mockResolvedValue(pageOf(3));
      setBreakpoint(breakpoint);
      await renderWithProviders(<JobListScreen />);
      expect(await screen.findByText('Job job-2')).toBeOnTheScreen();
    }
  });
});

describe('loading further pages', () => {
  // Under Jest rows have no measured height, so a list only knows it reached the end when every
  // row is part of its first render batch (10 rows). Eight jobs fit; `total` says 90 exist.
  async function renderFirstPageOfMany(): Promise<void> {
    fetchJobsMock.mockResolvedValueOnce(pageOf(8, { total: 90 }));
    await renderWithProviders(<JobListScreen />);
    await screen.findByText('Job job-0');
  }

  it('asks for the next page when the end of the list is reached', async () => {
    await renderFirstPageOfMany();
    fetchJobsMock.mockResolvedValueOnce(pageOf(8, { total: 90, page: 1, prefix: 'next' }));

    await userEvent.setup().scrollTo(screen.getByTestId('job-list'), END_OF_LIST);

    expect(fetchJobsMock).toHaveBeenCalledTimes(2);
    expect(fetchJobsMock.mock.calls[1]?.[0]).toEqual({ page: 1, pageSize: 30 });
  });

  it('does not ask again while a page is still loading', async () => {
    await renderFirstPageOfMany();
    fetchJobsMock.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    const list = screen.getByTestId('job-list');

    await user.scrollTo(list, END_OF_LIST);
    await user.scrollTo(list, {
      ...END_OF_LIST,
      y: 1000,
      contentSize: { width: 390, height: 1100 },
    });

    expect(fetchJobsMock).toHaveBeenCalledTimes(2);
  });

  it('shows a spinner at the bottom while the next page loads', async () => {
    await renderFirstPageOfMany();
    fetchJobsMock.mockReturnValue(new Promise(() => undefined));

    await userEvent.setup().scrollTo(screen.getByTestId('job-list'), END_OF_LIST);

    expect(await screen.findByLabelText('Loading more jobs')).toBeOnTheScreen();
  });

  it('shows no end-of-list note while more pages remain', async () => {
    await renderFirstPageOfMany();

    expect(screen.queryByText('You have reached the end of the list.')).not.toBeOnTheScreen();
  });

  it('tells the user when the last page is loaded', async () => {
    fetchJobsMock.mockResolvedValueOnce(pageOf(30, { total: 30 }));

    await renderWithProviders(<JobListScreen />);

    expect(await screen.findByText('You have reached the end of the list.')).toBeOnTheScreen();
  });

  it('keeps the loaded jobs and offers Retry when the next page fails', async () => {
    await renderFirstPageOfMany();
    fetchJobsMock.mockRejectedValueOnce(offline);

    await userEvent.setup().scrollTo(screen.getByTestId('job-list'), END_OF_LIST);

    expect(await screen.findByText('Could not load more jobs.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
    expect(screen.getByText('Job job-0')).toBeOnTheScreen();
    // A failed page is not a failed refresh.
    expect(screen.queryByText(/Could not refresh/)).not.toBeOnTheScreen();
  });

  it('does not keep asking for the failed page just because the list is scrolled again', async () => {
    await renderFirstPageOfMany();
    fetchJobsMock.mockRejectedValueOnce(offline);
    const user = userEvent.setup();
    const list = screen.getByTestId('job-list');
    await user.scrollTo(list, END_OF_LIST);
    await screen.findByText('Could not load more jobs.');

    await user.scrollTo(list, {
      ...END_OF_LIST,
      y: 1000,
      contentSize: { width: 390, height: 1100 },
    });

    expect(fetchJobsMock).toHaveBeenCalledTimes(2);
  });

  it('tries the failed page again when Retry is pressed', async () => {
    await renderFirstPageOfMany();
    fetchJobsMock
      .mockRejectedValueOnce(offline)
      .mockResolvedValueOnce(pageOf(8, { total: 90, page: 1, prefix: 'next' }));
    const user = userEvent.setup();
    await user.scrollTo(screen.getByTestId('job-list'), END_OF_LIST);

    await user.press(await screen.findByRole('button', { name: 'Retry' }));

    expect(fetchJobsMock).toHaveBeenCalledTimes(3);
    expect(fetchJobsMock.mock.calls[2]?.[0]).toEqual({ page: 1, pageSize: 30 });
    await screen.findByText('Job job-0');
    expect(screen.queryByText('Could not load more jobs.')).not.toBeOnTheScreen();
  });
});

describe('refreshing', () => {
  it('loads the list again when the user pulls to refresh', async () => {
    fetchJobsMock.mockResolvedValue(pageOf(3));
    await renderWithProviders(<JobListScreen />);
    await screen.findByText('Job job-0');

    await userEvent.setup().pullToRefresh(screen.getByTestId('job-list'));

    expect(fetchJobsMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the jobs on screen and says so when a refresh fails', async () => {
    fetchJobsMock.mockResolvedValueOnce(pageOf(3)).mockRejectedValueOnce(offline);
    await renderWithProviders(<JobListScreen />);
    await screen.findByText('Job job-0');

    await userEvent.setup().pullToRefresh(screen.getByTestId('job-list'));

    expect(
      await screen.findByText('Could not refresh. Showing the last loaded jobs.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Job job-0')).toBeOnTheScreen();
    expect(screen.queryByText(ERROR_MESSAGES.NETWORK_ERROR)).not.toBeOnTheScreen();
  });

  it('removes the refresh message once a later refresh works', async () => {
    fetchJobsMock
      .mockResolvedValueOnce(pageOf(3))
      .mockRejectedValueOnce(offline)
      .mockResolvedValueOnce(pageOf(3));
    await renderWithProviders(<JobListScreen />);
    await screen.findByText('Job job-0');
    const user = userEvent.setup();
    await user.pullToRefresh(screen.getByTestId('job-list'));
    await screen.findByText(/Could not refresh/);

    await user.pullToRefresh(screen.getByTestId('job-list'));

    expect(screen.queryByText(/Could not refresh/)).not.toBeOnTheScreen();
  });
});
