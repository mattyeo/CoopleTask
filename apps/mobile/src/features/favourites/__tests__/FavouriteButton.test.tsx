import { act, render, screen, userEvent } from '@testing-library/react-native';
import { FavouriteButton } from '@/features/favourites/FavouriteButton';
import { useFavouritesStore } from '@/features/favourites/favouritesStore';

beforeEach(() => {
  useFavouritesStore.setState({ favouriteIds: {}, hasHydrated: true });
});

describe('before the stored favourites are loaded', () => {
  beforeEach(() => {
    useFavouritesStore.setState({ hasHydrated: false });
  });

  it('shows no star, because it cannot know the real state yet', async () => {
    await render(<FavouriteButton jobId="job-1" />);

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
    expect(screen.queryByText('☆')).not.toBeOnTheScreen();
    expect(screen.queryByText('★')).not.toBeOnTheScreen();
  });

  it('shows the star as soon as they are loaded', async () => {
    await render(<FavouriteButton jobId="job-1" />);

    await act(async () => useFavouritesStore.getState().markHydrated());

    expect(screen.getByRole('button', { name: 'Add to favourites' })).toBeOnTheScreen();
  });

  it('shows the right star straight away, with no flicker from empty to full', async () => {
    useFavouritesStore.setState({ favouriteIds: { 'job-1': true } });
    await render(<FavouriteButton jobId="job-1" />);
    expect(screen.queryByText('☆')).not.toBeOnTheScreen();

    await act(async () => useFavouritesStore.getState().markHydrated());

    expect(screen.getByText('★')).toBeOnTheScreen();
    expect(screen.queryByText('☆')).not.toBeOnTheScreen();
  });
});

describe('after they are loaded', () => {
  it('offers to add a job that is not a favourite', async () => {
    await render(<FavouriteButton jobId="job-1" />);

    const button = screen.getByRole('button', { name: 'Add to favourites' });
    expect(button).toBeOnTheScreen();
    expect(button).not.toBeSelected();
    expect(screen.getByText('☆')).toBeOnTheScreen();
  });

  it('offers to remove a job that is a favourite', async () => {
    useFavouritesStore.setState({ favouriteIds: { 'job-1': true } });
    await render(<FavouriteButton jobId="job-1" />);

    const button = screen.getByRole('button', { name: 'Remove from favourites' });
    expect(button).toBeSelected();
    expect(screen.getByText('★')).toBeOnTheScreen();
  });

  it('adds the job when pressed, and removes it when pressed again', async () => {
    const user = userEvent.setup();
    await render(<FavouriteButton jobId="job-1" />);

    await user.press(screen.getByRole('button', { name: 'Add to favourites' }));
    expect(screen.getByRole('button', { name: 'Remove from favourites' })).toBeSelected();
    expect(useFavouritesStore.getState().favouriteIds).toEqual({ 'job-1': true });

    await user.press(screen.getByRole('button', { name: 'Remove from favourites' }));
    expect(screen.getByRole('button', { name: 'Add to favourites' })).not.toBeSelected();
    expect(useFavouritesStore.getState().favouriteIds).toEqual({});
  });

  it('keeps every star for the same job in step, as on the list and the details page', async () => {
    await render(
      <>
        <FavouriteButton jobId="job-1" />
        <FavouriteButton jobId="job-1" />
      </>,
    );

    await userEvent.setup().press(screen.getAllByRole('button')[0]!);

    expect(screen.getAllByRole('button', { name: 'Remove from favourites' })).toHaveLength(2);
  });

  it('does not touch the stars of other jobs', async () => {
    await render(
      <>
        <FavouriteButton jobId="job-1" />
        <FavouriteButton jobId="job-2" />
      </>,
    );

    await userEvent.setup().press(screen.getAllByRole('button')[0]!);

    expect(screen.getAllByRole('button', { name: 'Remove from favourites' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Add to favourites' })).toHaveLength(1);
  });

  it('updates when the favourite is changed somewhere else', async () => {
    await render(<FavouriteButton jobId="job-1" />);

    await act(async () => useFavouritesStore.getState().toggleFavourite('job-1'));

    expect(screen.getByRole('button', { name: 'Remove from favourites' })).toBeOnTheScreen();
  });
});
