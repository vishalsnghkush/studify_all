import React, {useRef, useMemo} from 'react';
import {Pressable, Animated, StyleSheet} from 'react-native';

const BouncyButton = ({
  children,
  onPress,
  style,
  disabled = false,
  activeScale = 0.96,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: activeScale,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  // Memoize style extraction to prevent style flattening overhead on every render tick
  const {layoutStyle, innerStyle} = useMemo(() => {
    const flattened = StyleSheet.flatten(style) || {};
    const extractedLayout = {};
    const extractedInner = {...flattened};

    const layoutKeys = [
      'flex',
      'flexGrow',
      'flexShrink',
      'flexBasis',
      'margin',
      'marginHorizontal',
      'marginVertical',
      'marginTop',
      'marginBottom',
      'marginLeft',
      'marginRight',
      'width',
      'height',
      'alignSelf',
      'position',
      'top',
      'bottom',
      'left',
      'right',
      'zIndex',
    ];

    layoutKeys.forEach(key => {
      if (flattened[key] !== undefined) {
        extractedLayout[key] = flattened[key];
        // Remove layout, positioning, and margin keys from inner Animated.View to prevent duplicate styling or collapse
        if (
          [
            'flex',
            'position',
            'top',
            'bottom',
            'left',
            'right',
            'margin',
            'marginHorizontal',
            'marginVertical',
            'marginTop',
            'marginBottom',
            'marginLeft',
            'marginRight',
          ].includes(key)
        ) {
          delete extractedInner[key];
        }
      }
    });

    return {layoutStyle: extractedLayout, innerStyle: extractedInner};
  }, [style]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={({pressed}) => [
        {alignItems: 'stretch'},
        layoutStyle,
        {
          opacity: disabled ? 0.6 : 1,
        },
      ]}>
      <Animated.View
        style={[
          /* eslint-disable-next-line react-native/no-inline-styles */
          {
            transform: [{scale: scaleValue}],
            flex: layoutStyle.flex ? 1 : undefined,
            width: layoutStyle.flex || layoutStyle.width ? '100%' : undefined,
          },
          innerStyle,
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default BouncyButton;
