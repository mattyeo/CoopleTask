export type DescriptionBlock =
  | { type: 'heading'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string };

export interface InlineSegment {
  text: string;
  bold: boolean;
}

const HEADING_PATTERN = /^\*\*(.+)\*\*$/;
const BULLET_PATTERN = /^[-*•]\s+(.*)$/;
const BOLD_PATTERN = /\*\*(.+?)\*\*/g;

/**
 * Splits the markdown-ish job description into blocks: a line that is entirely `**bold**` is a
 * heading, lines starting with "- " are bullets, everything else is a paragraph. Blank lines are
 * dropped (spacing is the renderer's job).
 */
export function parseDescription(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '') continue;

    const heading = HEADING_PATTERN.exec(line);
    if (heading?.[1] && !heading[1].includes('**')) {
      blocks.push({ type: 'heading', text: heading[1].trim() });
      continue;
    }

    const bullet = BULLET_PATTERN.exec(line);
    if (bullet?.[1]) {
      blocks.push({ type: 'bullet', text: bullet[1].trim() });
      continue;
    }

    blocks.push({ type: 'paragraph', text: line });
  }

  return blocks;
}

/** Splits a line into plain and `**bold**` segments, so no literal asterisks are shown. */
export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(BOLD_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ text: text.slice(cursor, start), bold: false });
    segments.push({ text: match[1] ?? '', bold: true });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), bold: false });

  return segments;
}
