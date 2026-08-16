import React from 'react';
import { Text, View, Linking, StyleSheet } from 'react-native';

const parseBoldText = (rawText, style = {}) => {
  if (!rawText) return [];
  const parts = rawText.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <Text key={`bold-${index}`} style={[style, { fontWeight: 'bold' }]}>
          {part}
        </Text>
      );
    }
    return <Text key={`normal-${index}`} style={style}>{part}</Text>;
  });
};

const parseLinksAndBold = (inputText, textStyle) => {
  if (!inputText) return [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match;
  const elements = [];

  while ((match = linkRegex.exec(inputText)) !== null) {
    const precedingText = inputText.substring(lastIndex, match.index);
    if (precedingText) {
      elements.push(...parseBoldText(precedingText, textStyle));
    }

    const label = match[1];
    const url = match[2];
    elements.push(
      <Text
        key={`link-${match.index}`}
        style={[
          textStyle,
          {
            color: '#00838f',
            textDecorationLine: 'underline',
            fontWeight: '700',
          },
        ]}
        onPress={() => {
          Linking.openURL(url).catch(err =>
            console.error('Failed to open link:', err)
          );
        }}>
        {label}
      </Text>
    );

    lastIndex = linkRegex.lastIndex;
  }

  const remainingText = inputText.substring(lastIndex);
  if (remainingText) {
    elements.push(...parseBoldText(remainingText, textStyle));
  }

  return elements;
};

const MarkdownText = ({ text, style = {}, dark = false }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const textStyle = [
    styles.defaultText,
    dark ? styles.textDark : styles.textLight,
    style,
  ];

  return (
    <View style={styles.container}>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // 1. Headers Check
        if (trimmed.startsWith('#')) {
          let headerLevel = 0;
          while (trimmed.charAt(headerLevel) === '#') {
            headerLevel++;
          }
          const headerText = trimmed.substring(headerLevel).trim();
          const headerSize = headerLevel === 1 ? 18 : headerLevel === 2 ? 16 : 14;

          return (
            <Text
              key={index}
              style={[
                textStyle,
                {
                  fontSize: headerSize,
                  fontWeight: 'bold',
                  marginTop: 8,
                  marginBottom: 4,
                  color: dark ? '#ff8fa3' : '#ab2346',
                },
              ]}>
              {parseLinksAndBold(headerText, { fontSize: headerSize, fontWeight: 'bold' })}
            </Text>
          );
        }

        // 2. Bullet / List Item Check
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2).trim();
          return (
            <View key={index} style={styles.listRow}>
              <Text style={[textStyle, styles.bulletPoint]}>•</Text>
              <Text style={[textStyle, styles.listContent]}>
                {parseLinksAndBold(content, style)}
              </Text>
            </View>
          );
        }

        // 3. Blank line spacing
        if (trimmed === '') {
          return <View key={index} style={styles.blankLine} />;
        }

        // 4. Default Paragraph line
        return (
          <Text key={index} style={[textStyle, styles.paragraph]}>
            {parseLinksAndBold(line, style)}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  defaultText: {
    fontSize: 13,
    lineHeight: 18,
  },
  textLight: {
    color: '#37474f',
  },
  textDark: {
    color: '#eceff1',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingLeft: 4,
  },
  bulletPoint: {
    marginRight: 6,
    fontWeight: 'bold',
  },
  listContent: {
    flex: 1,
  },
  paragraph: {
    marginVertical: 2,
  },
  blankLine: {
    height: 6,
  },
});

export default MarkdownText;
