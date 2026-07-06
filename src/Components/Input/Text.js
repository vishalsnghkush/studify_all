import {Text} from 'react-native-paper';
import React, {memo} from 'react';
import {StyleSheet} from 'react-native';
import {smallText, mediumText, bigText} from '../../Utils/Dimentions';
function TextFont({size = 'small', children, numberOfLines, style}) {
  let fontSize;
  if (size == 'small') {
    fontSize = smallText;
  } else if (size == 'medium') {
    fontSize = mediumText;
  } else if (size == 'large') {
    fontSize = bigText;
  }
  const flattenedStyle = StyleSheet.flatten(style);
  return (
    <Text
      style={{
        fontSize: fontSize,
        fontWeight: fontSize === bigText ? 'bold' : 'normal',
        ...flattenedStyle,
      }}
      numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export default memo(TextFont);
