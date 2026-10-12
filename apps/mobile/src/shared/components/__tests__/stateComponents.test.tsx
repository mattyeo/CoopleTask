import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { ApiError } from '@/shared/api/ApiError';
import { ERROR_MESSAGES } from '@/shared/utils/errorMessages';
import { BackButton } from '@/shared/navigation/BackButton';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingState } from '@/shared/components/feedback/LoadingState';

describe('Button', () => {
  it('shows its label and calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(['primary', 'secondary'] as const)('renders the %s variant', async (variant) => {
    await render(<Button label="Go" variant={variant} onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Go' })).toBeOnTheScreen();
  });
});

describe('LoadingState', () => {
  it('announces that something is loading', async () => {
    await render(<LoadingState />);

    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });
});

describe('EmptyState', () => {
  it('shows the title and message', async () => {
    await render(<EmptyState title="Nothing here" message="Come back later" />);

    expect(screen.getByText('Nothing here')).toBeOnTheScreen();
    expect(screen.getByText('Come back later')).toBeOnTheScreen();
  });

  it('shows a button that runs the action', async () => {
    const onAction = jest.fn();
    await render(<EmptyState title="Nothing here" actionLabel="Retry" onAction={onAction} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Retry' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows no button without an action', async () => {
    await render(<EmptyState title="Nothing here" actionLabel="Retry" />);

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });
});

describe('ErrorState', () => {
  const offline = new ApiError('NETWORK_ERROR', 'offline', null);
  const notFound = new ApiError('JOB_NOT_FOUND', 'missing', 404);

  it('shows the friendly message for the error code, not the raw server text', async () => {
    await render(<ErrorState error={new ApiError('UPSTREAM_TIMEOUT', 'raw stack trace', 504)} />);

    expect(screen.getByText(ERROR_MESSAGES.UPSTREAM_TIMEOUT)).toBeOnTheScreen();
    expect(screen.queryByText(/raw stack trace/)).not.toBeOnTheScreen();
  });

  it('offers Retry for an error that a retry can fix', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState error={offline} onRetry={onRetry} onBack={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Back to jobs' })).not.toBeOnTheScreen();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('offers Back instead of Retry for an error that a retry cannot fix', async () => {
    const onBack = jest.fn();
    await render(<ErrorState error={notFound} onRetry={jest.fn()} onBack={onBack} />);

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeOnTheScreen();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Back to jobs' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows no button when the matching callback is missing', async () => {
    await render(<ErrorState error={notFound} onRetry={jest.fn()} />);

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('treats an error that is not an ApiError as an internal error', async () => {
    await render(<ErrorState error={new Error('bug')} />);

    expect(screen.getByText(ERROR_MESSAGES.INTERNAL_ERROR)).toBeOnTheScreen();
  });
});

describe('BackButton', () => {
  it('goes back when there is history', async () => {
    jest.mocked(router.canGoBack).mockReturnValue(true);
    await render(<BackButton />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Back to jobs' }));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('goes to the list when the page was opened directly from a link', async () => {
    jest.mocked(router.canGoBack).mockReturnValue(false);
    await render(<BackButton />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Back to jobs' }));

    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
  });
});
