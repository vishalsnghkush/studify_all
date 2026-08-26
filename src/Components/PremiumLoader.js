import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Svg, Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

const AnimatedGroup = Animated.createAnimatedComponent(G);

const defaultTips = [
  "Structuring your syllabus logically...",
  "Formatting rich educational content...",
  "Applying pedagogical best practices...",
  "Almost ready! Just finalizing the layout...",
];

export const PremiumLoader = ({ accentColor = '#0d9488', title = "Creating your content...", tips = defaultTips, subTitle }) => {
  const theme = useTheme();
  const rotation1 = useRef(new Animated.Value(0)).current;
  const rotation2 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.3)).current;
  const [tipIndex, setTipIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Background mesh animation
  const bgFloat = useRef(new Animated.Value(0)).current;

  // Skeleton shimmer
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spinner Rotations
    Animated.loop(
      Animated.timing(rotation1, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(rotation2, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse Effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Background float
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgFloat, { toValue: 1, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(bgFloat, { toValue: 0, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    // Shimmer
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    // Text Carousel
    if (!subTitle) {
      const interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          setTipIndex((prev) => (prev + 1) % tips.length);
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        });
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [tips.length, fadeAnim, subTitle]);

  const spin1 = rotation1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2 = rotation2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  const bgTranslateY = bgFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const bgTranslateX = bgFloat.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  
  const shimmerTranslateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });

  const bgColor = theme.dark ? '#0c1410' : '#ffffff';
  const textColor = theme.dark ? '#ffffff' : '#1e293b';
  const subTextColor = theme.dark ? '#94a3b8' : '#64748b';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Ambient SVG Background */}
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%" style={{ opacity: 0.08 }}>
          <AnimatedGroup style={{ transform: [{ translateY: bgTranslateY }, { translateX: bgTranslateX }] }}>
             <Circle cx="10%" cy="10%" r="150" fill={accentColor} />
             <Circle cx="90%" cy="40%" r="200" fill={accentColor} />
             <Circle cx="50%" cy="90%" r="180" fill={accentColor} />
          </AnimatedGroup>
        </Svg>
      </View>

      {/* Main Loader Header */}
      <View style={styles.header}>
        <View style={styles.spinnerContainer}>
           <Svg height="80" width="80" viewBox="0 0 100 100">
             {/* Outer Ring */}
             <AnimatedGroup style={{ transform: [{ rotate: spin1 }, { scale: pulse }], transformOrigin: '50, 50' }}>
               <Circle cx="50" cy="50" r="40" stroke={accentColor} strokeWidth="4" fill="none" strokeDasharray="180 80" strokeLinecap="round" />
             </AnimatedGroup>
             {/* Inner Ring */}
             <AnimatedGroup style={{ transform: [{ rotate: spin2 }], transformOrigin: '50, 50' }}>
               <Circle cx="50" cy="50" r="28" stroke={accentColor} strokeWidth="6" fill="none" strokeDasharray="90 40" strokeLinecap="round" opacity="0.6" />
             </AnimatedGroup>
             {/* Center Dot */}
             <Circle cx="50" cy="50" r="8" fill={accentColor} />
           </Svg>
        </View>

        <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
        {subTitle ? (
          <Text style={[styles.tipText, { color: subTextColor, lineHeight: 20 }]}>{subTitle}</Text>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={[styles.tipText, { color: subTextColor }]}>{tips[tipIndex]}</Text>
          </Animated.View>
        )}
      </View>

      {/* Skeletons */}
      <View style={styles.skeletonContainer}>
        {[1, 2, 3].map((_, idx) => (
           <View key={idx} style={[styles.skeletonBlock, { backgroundColor: theme.dark ? '#1e293b' : '#f1f5f9' }]}>
             <Animated.View 
               style={[
                 styles.shimmer, 
                 { 
                   backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',
                   transform: [{ translateX: shimmerTranslateX }]
                 }
               ]} 
             />
           </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  spinnerContainer: {
    height: 80,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
    fontWeight: '500',
  },
  skeletonContainer: {
    width: '100%',
    flex: 1,
  },
  skeletonBlock: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
});
