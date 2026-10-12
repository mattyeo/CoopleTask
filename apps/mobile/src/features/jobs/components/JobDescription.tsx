import { StyleSheet, Text, View } from 'react-native';
import {
  colors,
  fontSizes,
  fontWeights,
  lineHeights,
  maxWidths,
  spacing,
} from '@/shared/theme/tokens';
import { parseDescription, parseInline } from '@/features/jobs/utils/parseDescription';

interface JobDescriptionProps {
  text: string;
}

export function JobDescription({ text }: JobDescriptionProps) {
  const blocks = parseDescription(text);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        const key = `${index}-${block.type}`;

        if (block.type === 'heading') {
          return (
            <Text key={key} accessibilityRole="header" style={styles.heading}>
              {block.text}
            </Text>
          );
        }

        const content = parseInline(block.text).map((segment, segmentIndex) => (
          <Text key={segmentIndex} style={segment.bold ? styles.bold : undefined}>
            {segment.text}
          </Text>
        ));

        if (block.type === 'bullet') {
          return (
            <View key={key} style={styles.bulletRow}>
              <Text style={styles.bulletMark}>•</Text>
              <Text style={styles.bulletText}>{content}</Text>
            </View>
          );
        }

        return (
          <Text key={key} style={styles.paragraph}>
            {content}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    maxWidth: maxWidths.readableText,
  },
  heading: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.md,
    marginTop: spacing.md,
  },
  paragraph: {
    color: colors.text,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  bold: {
    fontWeight: fontWeights.semibold,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  bulletMark: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  bulletText: {
    color: colors.text,
    flex: 1,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
});
