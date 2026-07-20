import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Dimensions, Animated, Easing} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const COLORS = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffeb3b',
  '#ffc107',
  '#ff9800',
  '#ff5722',
];

export const Confetti = ({active, count = 60, onComplete}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const confettiItems = useRef(
    Array.from({length: count}).map(() => {
      const xStart = Math.random() * SCREEN_WIDTH;
      const xEnd = xStart + (Math.random() * 120 - 60); // Drift offset
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const sizeWidth = Math.random() * 6 + 6;
      const sizeHeight = Math.random() * 12 + 8;
      const rotation = Math.random() * 360;
      const rotationEnd = rotation + 360 + Math.random() * 720;
      const rotateYEnd = 360 + Math.random() * 1080;
      const delay = Math.random() * 800; // Staggered drop (capped at 800ms)
      const duration = Math.random() * 1200 + 1500; // 1500ms to 2700ms (max delay+duration = 3500ms)

      return {
        color,
        sizeWidth,
        sizeHeight,
        rotation,
        rotationEnd,
        rotateYEnd,
        xStart,
        xEnd,
        delay,
        duration,
      };
    }),
  ).current;

  useEffect(() => {
    if (active) {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 3800, // Total sequence time (3.8s, strictly greater than 3.5s max animation duration)
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished && onComplete) {
          onComplete();
        }
      });
    }
  }, [active, animatedValue, onComplete]);

  if (!active) {
    return null;
  }

  return (
    <View style={styles.fullscreen} pointerEvents="none">
      {confettiItems.map((item, index) => {
        // Individual progress based on master value with delay and duration scaled
        const delayProgress = item.delay / 3800;
        const durationProgress = item.duration / 3800;
        const endProgress = delayProgress + durationProgress;

        const translateY = animatedValue.interpolate({
          inputRange: [0, delayProgress, endProgress, 1],
          outputRange: [-50, -50, SCREEN_HEIGHT + 50, SCREEN_HEIGHT + 50],
        });

        const translateX = animatedValue.interpolate({
          inputRange: [0, delayProgress, endProgress, 1],
          outputRange: [item.xStart, item.xStart, item.xEnd, item.xEnd],
        });

        const rotate = animatedValue.interpolate({
          inputRange: [0, delayProgress, endProgress, 1],
          outputRange: [
            `${item.rotation}deg`,
            `${item.rotation}deg`,
            `${item.rotationEnd}deg`,
            `${item.rotationEnd}deg`,
          ],
        });

        const rotateY = animatedValue.interpolate({
          inputRange: [0, delayProgress, endProgress, 1],
          outputRange: [
            '0deg',
            '0deg',
            `${item.rotateYEnd}deg`,
            `${item.rotateYEnd}deg`,
          ],
        });

        const opacity = animatedValue.interpolate({
          inputRange: [
            0,
            delayProgress,
            delayProgress + durationProgress * 0.8,
            endProgress,
            1,
          ],
          outputRange: [0, 1, 1, 0, 0],
        });

        return (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              width: item.sizeWidth,
              height: item.sizeHeight,
              backgroundColor: item.color,
              opacity,
              transform: [{translateX}, {translateY}, {rotate}, {rotateY}],
            }}
          />
        );
      })}
    </View>
  );
};

export const MiniBurst = ({active, onComplete}) => {
  const animVal = useRef(new Animated.Value(0)).current;

  // Stable particles definition so they don't regenerate/flicker on every frame
  const particles = useRef(
    Array.from({length: 12}).map((_, i) => {
      const angle = (i * 2 * Math.PI) / 12;
      const distance = 45 + Math.random() * 25; // Expands much further out (45px to 70px)
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const size = Math.random() * 6 + 6; // Bigger particle sizes (6px to 12px)
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];

      return {dx, dy, size, color};
    }),
  ).current;

  useEffect(() => {
    if (active) {
      animVal.setValue(0);
      Animated.timing(animVal, {
        toValue: 1,
        duration: 550, // Slightly longer duration for the larger burst
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished && onComplete) {
          onComplete();
        }
      });
    }
  }, [active, animVal, onComplete]);

  if (!active) {
    return null;
  }

  return (
    <View style={styles.burstContainer} pointerEvents="none">
      {particles.map((p, index) => {
        const translateX = animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dx],
        });

        const translateY = animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dy],
        });

        const scale = animVal.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0.1, 1.3, 0], // Scale up first, then fade/shrink out
        });

        const opacity = animVal.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0], // Fade out near the end
        });

        return (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity,
              transform: [{translateX}, {translateY}, {scale}],
            }}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
  burstContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    zIndex: 99999,
  },
});
