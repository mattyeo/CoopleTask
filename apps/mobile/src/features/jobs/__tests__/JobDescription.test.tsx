import { render, screen } from '@testing-library/react-native';
import { JobDescription } from '@/features/jobs/components/JobDescription';

describe('JobDescription', () => {
  it('shows a bold line as a heading', async () => {
    await render(<JobDescription text={'**Aufgaben:**'} />);

    expect(screen.getByRole('header', { name: 'Aufgaben:' })).toBeOnTheScreen();
    expect(screen.queryByText(/\*/)).not.toBeOnTheScreen();
  });

  it('shows "- " lines as bullets', async () => {
    await render(<JobDescription text={'- Gemüse rüsten\n- Abwasch'} />);

    expect(screen.getAllByText('•')).toHaveLength(2);
    expect(screen.getByText('Gemüse rüsten')).toBeOnTheScreen();
    expect(screen.getByText('Abwasch')).toBeOnTheScreen();
    expect(screen.queryByText(/^- /)).not.toBeOnTheScreen();
  });

  it('shows other lines as plain paragraphs', async () => {
    await render(<JobDescription text={'Erste Zeile\nZweite Zeile'} />);

    expect(screen.getByText('Erste Zeile')).toBeOnTheScreen();
    expect(screen.getByText('Zweite Zeile')).toBeOnTheScreen();
    expect(screen.queryByText('•')).not.toBeOnTheScreen();
  });

  it('makes bold words inside a sentence bold, without the asterisks', async () => {
    await render(<JobDescription text={'Bitte **ID oder Führerschein** mitbringen'} />);

    expect(screen.getByText('ID oder Führerschein')).toHaveStyle({ fontWeight: '600' });
    expect(screen.getByText(/Bitte/)).not.toHaveStyle({ fontWeight: '600' });
    expect(screen.queryByText(/\*\*/)).not.toBeOnTheScreen();
  });

  it('does not make a heading out of a line with bold words and more text', async () => {
    await render(<JobDescription text={'**Wichtig** bitte pünktlich'} />);

    expect(screen.queryByRole('header')).not.toBeOnTheScreen();
    expect(screen.getByText(/pünktlich/)).toBeOnTheScreen();
  });

  it('shows every kind of line together in order', async () => {
    const text = 'Intro\n**Aufgaben:**\n- Eins\n\n**Fähigkeiten:**\n- Zwei';
    await render(<JobDescription text={text} />);

    expect(screen.getAllByRole('header').map((heading) => heading.props.children)).toEqual([
      'Aufgaben:',
      'Fähigkeiten:',
    ]);
    expect(screen.getAllByText('•')).toHaveLength(2);
    expect(screen.getByText('Intro')).toBeOnTheScreen();
  });

  it('copes with Windows line endings and blank lines', async () => {
    await render(<JobDescription text={'Eins\r\n\r\n\r\n- Zwei\r\n'} />);

    expect(screen.getByText('Eins')).toBeOnTheScreen();
    expect(screen.getByText('Zwei')).toBeOnTheScreen();
  });

  it('shows text that looks like HTML as plain text and never runs it', async () => {
    await render(<JobDescription text={'<script>alert(1)</script> <b>fett</b>'} />);

    expect(screen.getByText('<script>alert(1)</script> <b>fett</b>')).toBeOnTheScreen();
  });

  it('shows nothing for an empty description', async () => {
    await render(<JobDescription text={''} />);

    expect(screen.queryByText(/./)).not.toBeOnTheScreen();
  });
});
