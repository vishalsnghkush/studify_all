import React, {useState, useEffect, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';

const MascotParticleTrail = ({pan, rotateYAnim}) => {
  const [particles, setParticles] = useState([]);
  const lastEmitTime = useRef(0);

  const spawnDragParticle = (spawnX, spawnY) => {
    const now = Date.now();
    if (now - lastEmitTime.current < 45) {
      return;
    }
    lastEmitTime.current = now;

    const colors = [
      '#00E5FF',
      '#FF007F',
      '#FFEA00',
      '#7FFF00',
      '#B5179E',
      '#7209B7',
      '#4CC9F0',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomSize = Math.floor(Math.random() * 6) + 4; // 4 to 9px

    const newParticle = {
      id: Math.random().toString(),
      x: spawnX,
      y: spawnY,
      color: randomColor,
      size: randomSize,
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0.2),
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15 + 10,
    };

    setParticles(prev => [...prev.slice(-15), newParticle]);

    Animated.parallel([
      Animated.timing(newParticle.opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(newParticle.scale, {
        toValue: 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    });
  };

  const spawnRotationParticle = (offsetX, offsetY, vx, vy) => {
    const now = Date.now();
    if (now - lastEmitTime.current < 35) {
      return;
    }
    lastEmitTime.current = now;

    const colors = [
      '#00E5FF',
      '#FF007F',
      '#FFEA00',
      '#7FFF00',
      '#B5179E',
      '#7209B7',
      '#4CC9F0',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomSize = Math.floor(Math.random() * 5) + 3; // 3 to 8px

    const newParticle = {
      id: Math.random().toString(),
      x: 85 + offsetX,
      y: 85 + offsetY,
      color: randomColor,
      size: randomSize,
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0.3),
      vx: vx,
      vy: vy,
    };

    setParticles(prev => [...prev.slice(-15), newParticle]);

    Animated.parallel([
      Animated.timing(newParticle.opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(newParticle.scale, {
        toValue: 1.1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    });
  };

  useEffect(() => {
    const listenerId = pan.addListener(({x, y}) => {
      if (Math.abs(x) > 3 || Math.abs(y) > 3) {
        const offsetX = (Math.random() - 0.5) * 15;
        const offsetY = 50 + (Math.random() - 0.5) * 10;
        spawnDragParticle(85 + x + offsetX, 85 + y + offsetY);
      }
    });
    return () => {
      pan.removeListener(listenerId);
    };
  }, [pan]);

  useEffect(() => {
    const listenerId = rotateYAnim.addListener(({value}) => {
      if (value > 0.05 && value < 0.95) {
        const angle = value * Math.PI * 2;
        const radius = 50;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius - 20;
        spawnRotationParticle(x, y, Math.cos(angle) * 8, Math.sin(angle) * 8);
      }
    });
    return () => {
      rotateYAnim.removeListener(listenerId);
    };
  }, [rotateYAnim]);

  return (
    <>
      {particles.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x - particle.size / 2,
              top: particle.y - particle.size / 2,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [
                {scale: particle.scale},
                {
                  translateX: particle.scale.interpolate({
                    inputRange: [0.2, 1.2],
                    outputRange: [0, particle.vx],
                  }),
                },
                {
                  translateY: particle.scale.interpolate({
                    inputRange: [0.2, 1.2],
                    outputRange: [0, particle.vy],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});

export default MascotParticleTrail;
