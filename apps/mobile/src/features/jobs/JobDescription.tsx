import { StyleSheet, Text, View } from 'react-native';
import { parseDescription, parseInline } from './parseDescription';

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
    gap: 6,
  },
  heading: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  paragraph: {
    color: '#1f2937',
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  bulletMark: {
    color: '#1f2937',
    fontSize: 15,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    color: '#1f2937',
    fontSize: 15,
    lineHeight: 22,
  },
});
