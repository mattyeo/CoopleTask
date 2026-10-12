import { parseDescription, parseInline } from '@/features/jobs/utils/parseDescription';

describe('parseDescription', () => {
  it('turns a line that is entirely bold into a heading', () => {
    expect(parseDescription('**Aufgaben:**')).toEqual([{ type: 'heading', text: 'Aufgaben:' }]);
  });

  it('turns "- " lines into bullets', () => {
    expect(parseDescription('- Gemüse rüsten\n- Abwasch')).toEqual([
      { type: 'bullet', text: 'Gemüse rüsten' },
      { type: 'bullet', text: 'Abwasch' },
    ]);
  });

  it('accepts other common bullet markers', () => {
    expect(parseDescription('• One\n* Two')).toEqual([
      { type: 'bullet', text: 'One' },
      { type: 'bullet', text: 'Two' },
    ]);
  });

  it('keeps other lines as paragraphs', () => {
    expect(parseDescription('Die AG sucht einen Allrounder.')).toEqual([
      { type: 'paragraph', text: 'Die AG sucht einen Allrounder.' },
    ]);
  });

  it('drops blank lines and handles Windows line endings', () => {
    expect(parseDescription('Intro\r\n\r\n\r\n**Titel**\r\n- Punkt\r\n')).toEqual([
      { type: 'paragraph', text: 'Intro' },
      { type: 'heading', text: 'Titel' },
      { type: 'bullet', text: 'Punkt' },
    ]);
  });

  it('does not treat a line with bold text and more text as a heading', () => {
    expect(parseDescription('**Wichtig** bitte pünktlich')).toEqual([
      { type: 'paragraph', text: '**Wichtig** bitte pünktlich' },
    ]);
    expect(parseDescription('**A** und **B**')).toEqual([
      { type: 'paragraph', text: '**A** und **B**' },
    ]);
  });

  it('does not treat a lone dash or bold marker as a bullet or heading', () => {
    expect(parseDescription('-')).toEqual([{ type: 'paragraph', text: '-' }]);
    expect(parseDescription('****')).toEqual([{ type: 'paragraph', text: '****' }]);
  });

  it('returns nothing for empty input', () => {
    expect(parseDescription('')).toEqual([]);
    expect(parseDescription('  \n \n')).toEqual([]);
  });

  it('parses a realistic description', () => {
    const text = [
      'Die AG sucht einen Allrounder.',
      '**Aufgaben:**',
      '- Gemüse rüsten',
      '',
      '**Erforderliche Fähigkeiten:**',
      '- Zuverlässigkeit',
    ].join('\n');

    expect(parseDescription(text).map((block) => block.type)).toEqual([
      'paragraph',
      'heading',
      'bullet',
      'heading',
      'bullet',
    ]);
  });

  it('leaves HTML-looking text as plain text', () => {
    expect(parseDescription('<script>alert(1)</script>')).toEqual([
      { type: 'paragraph', text: '<script>alert(1)</script>' },
    ]);
  });
});

describe('parseInline', () => {
  it('returns one plain segment when there is no bold text', () => {
    expect(parseInline('plain text')).toEqual([{ text: 'plain text', bold: false }]);
  });

  it('splits bold segments out of a line', () => {
    expect(parseInline('Bitte **ID** mitbringen')).toEqual([
      { text: 'Bitte ', bold: false },
      { text: 'ID', bold: true },
      { text: ' mitbringen', bold: false },
    ]);
  });

  it('handles several bold segments and bold at the edges', () => {
    expect(parseInline('**A** und **B**')).toEqual([
      { text: 'A', bold: true },
      { text: ' und ', bold: false },
      { text: 'B', bold: true },
    ]);
  });

  it('leaves unmatched asterisks alone', () => {
    expect(parseInline('5 * 3 = 15 **offen')).toEqual([
      { text: '5 * 3 = 15 **offen', bold: false },
    ]);
  });

  it('returns nothing for an empty string', () => {
    expect(parseInline('')).toEqual([]);
  });
});
