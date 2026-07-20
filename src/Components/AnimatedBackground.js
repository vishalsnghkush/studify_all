import React, {useRef, useEffect} from 'react';
import {View, StyleSheet, Dimensions, Animated, Easing} from 'react-native';

const {width, height} = Dimensions.get('window');

const FloatingBlob = ({size, color, initialX, initialY, duration, delay}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateY = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -60, duration: duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 60, duration: duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const animateX = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: 40, duration: duration * 1.2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -40, duration: duration * 1.2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: duration * 1.2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const animateScale = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.1, duration: duration * 0.8, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: duration * 0.8, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: duration * 0.8, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    setTimeout(() => {
      animateY.start();
      animateX.start();
      animateScale.start();
    }, delay);

    return () => {
      animateY.stop();
      animateX.stop();
      animateScale.stop();
    };
  }, [duration, translateY, translateX, scale, delay]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top: initialY,
          left: initialX,
          opacity: 0.3,
          transform: [{translateY}, {translateX}, {scale}],
        },
      ]}
    />
  );
};

const AnimatedBackground = () => {
  return (
    <View style={styles.background}>
      <FloatingBlob size={width * 1.2} color="#FFB6C1" initialX={-width * 0.4} initialY={-height * 0.2} duration={8000} delay={0} />
      <FloatingBlob size={width} color="#FFC0CB" initialX={width * 0.3} initialY={height * 0.4} duration={7000} delay={1000} />
      <FloatingBlob size={width * 1.1} color="#FFE4E1" initialX={-width * 0.2} initialY={height * 0.6} duration={9000} delay={500} />
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF5F7', // Very bright pinkish-white base
    overflow: 'hidden',
  },
});

export default AnimatedBackground;
