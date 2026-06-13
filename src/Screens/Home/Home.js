import React, {useState, useCallback, useRef, useEffect} from 'react';
import {Screen, BouncyButton, MascotParticleTrail} from '../../Components/Screen';
import HomeHeader from '../../Components/Screen/HomeHeader';
import Banner from '../../Components/Screen/Banner';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Image,
  Animated,
  PanResponder,
} from 'react-native';
import {Text} from '../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from 'react-native-paper';
import notifee, {AndroidImportance} from '@notifee/react-native';

const Home = () => {
  const navigation = useNavigation();
  const {colors, dark} = useTheme();

  // Animations for AI Bot
  const floatAnim = useRef(new Animated.Value(0)).current;
  const cloudFloatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateYAnim = useRef(new Animated.Value(0)).current;
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const streakAnim = useRef(new Animated.Value(1)).current;

  // Text Rotation inside Cloud
  const [phraseIndex, setPhraseIndex] = useState(0);
  const textOpacity = useRef(new Animated.Value(1)).current;

  const phrases = [
    'Generate Notes 📚',
    'Chapter Summary 🔍',
    'NCERT Solutions 💡',
    'Generate Questions ❓',
    'Generate Quizzes 📝',
    'Create Test ⚡',
    'Create Assignment 📋',
    'Doubts Solve 💬',
    'Mind Maps 🧠',
  ];

  // Dizzy & Expression animation refs and state
  const dizzyAnim = useRef(new Animated.Value(0)).current;
  const dizzySpinAnim = useRef(new Animated.Value(0)).current;
  const knockedOutAnim = useRef(new Animated.Value(0)).current;
  const starsAnim = useRef(new Animated.Value(0)).current;
  const impactAnim = useRef(new Animated.Value(0)).current;

  const [isDizzy, setIsDizzy] = useState(false);
  const isAnimating = useRef(false);
  
  const spinCount = useRef(0);

  const startFloat = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  const startCloudFloat = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudFloatAnim, {
          toValue: -4,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(cloudFloatAnim, {
          toValue: 2,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [cloudFloatAnim]);

  useEffect(() => {
    startFloat();
    startCloudFloat();
  }, [startFloat, startCloudFloat]);

  const startStreakPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakAnim, {
          toValue: 1.25,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(streakAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [streakAnim]);

  useEffect(() => {
    startFloat();
    startCloudFloat();
    startStreakPulse();
  }, [startFloat, startCloudFloat, startStreakPulse]);

  useEffect(() => {
    const triggerNotification = async () => {
      try {
        const channelId = await notifee.createChannel({
          id: 'test-channel',
          name: 'Test Channel',
          importance: AndroidImportance.HIGH,
        });
        await notifee.displayNotification({
          title: 'Test Notification',
          body: 'Studifysuccess local notification is working correctly!',
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
          },
        });
      } catch (err) {
        console.log('Error showing test notification', err);
      }
    };
    triggerNotification();

    const interval = setInterval(() => {
      // Fade out current phrase
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        // Change phrase and fade in
        setPhraseIndex(prev => (prev + 1) % phrases.length);
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });
    }, 4000); // changes every 4 seconds

    return () => clearInterval(interval);
  }, [textOpacity, phrases.length]);



  const triggerSpin = () => {
    if (isAnimating.current || isDizzy) {
      return;
    }
    isAnimating.current = true;
    spinCount.current = 1;
    rotateYAnim.setValue(0);
    Animated.timing(rotateYAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      isAnimating.current = false;
      // Reset spin count if no further spin after 1.2s
      setTimeout(() => {
        if (!isDizzy) {
          spinCount.current = 0;
        }
      }, 1200);
    });
  };

  const triggerDizzy = () => {
    if (isDizzy) {
      return;
    }
    setIsDizzy(true);
    isAnimating.current = true;

    // Start eye/star spin loop
    dizzySpinAnim.setValue(0);
    const spinLoop = Animated.loop(
      Animated.timing(dizzySpinAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    );
    spinLoop.start();

    // Reset impact ring
    impactAnim.setValue(0);

    // Play dizzy falling sequence
    Animated.parallel([
      // Fade in dizzy eyes & stars
      Animated.timing(dizzyAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(starsAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      // Fall down past baseline
      Animated.timing(jumpAnim, {
        toValue: 40,
        duration: 250,
        useNativeDriver: true,
      }),
      // Tilt sideways
      Animated.timing(rotateAnim, {
        toValue: 0.25, // ~90 degrees tilt
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Trigger impact wave when falling down dizzy
      Animated.timing(impactAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Stay dizzy for 1.8 seconds, then get back up
      setTimeout(() => {
        Animated.parallel([
          // Fade out dizzy eyes & stars
          Animated.timing(dizzyAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(starsAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          // Get up (spring back to normal)
          Animated.spring(jumpAnim, {
            toValue: 0,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(rotateAnim, {
            toValue: 0,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start(() => {
          spinLoop.stop();
          setIsDizzy(false);
          spinCount.current = 0;
          isAnimating.current = false;
        });
      }, 1800);
    });
  };

  const triggerJump = () => {
    if (isAnimating.current || isDizzy) {
      return;
    }
    isAnimating.current = true;

    // Reset impact ring
    impactAnim.setValue(0);

    Animated.sequence([
      // 1. Jump up high (no scale squish)
      Animated.timing(jumpAnim, {
        toValue: -95,
        duration: 250,
        useNativeDriver: true,
      }),
      // 2. Fall down hard past baseline and tilt sideways (fell down!)
      Animated.parallel([
        Animated.timing(jumpAnim, {
          toValue: 35,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0.18, // ~65 degrees tilt
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      // 3. Hit the ground! Show impact ring, knocked-out eyes, and stars
      Animated.parallel([
        Animated.timing(impactAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(knockedOutAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(starsAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        // Spin the stars during the grounded dazed phase
        Animated.timing(dizzySpinAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      // 4. Stay down dazed
      Animated.delay(100),
      // 5. Get back up (spring back to normal, fade out eyes and stars)
      Animated.parallel([
        Animated.timing(knockedOutAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(starsAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(jumpAnim, {
          toValue: 0,
          friction: 4.5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          friction: 4.5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      isAnimating.current = false;
    });
  };

  const handleCloudPress = () => {
    navigation.navigate('WebView', {
      url: 'https://ai.studifysuccess.com/',
    });
  };

  // Pan responder to support drag-to-toss and spring back
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const dx = Math.abs(gestureState.dx);
        const dy = Math.abs(gestureState.dy);
        // Predominantly horizontal swipes/drags activate the responder
        return dx > 8 && dx > dy * 1.5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({x: 0, y: 0});
        pan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (evt, gestureState) => {
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const vx = gestureState.vx;
        const vy = gestureState.vy;

        // 1. Swipe/Flick check (high velocity gesture)
        const isSwipe = Math.abs(vx) > 0.25 || Math.abs(vy) > 0.25;

        if (isSwipe) {
          if (isAnimating.current && !isDizzy) {
            triggerDizzy();
          } else {
            triggerSpin();
          }

          // Spring back smoothly after a swipe
          Animated.spring(pan, {
            toValue: {x: 0, y: 0},
            useNativeDriver: true,
          }).start();
        } else {
          // 2. Drag/Toss vs Tap check (low velocity gesture)
          const isDrag = Math.abs(dx) > 20 || Math.abs(dy) > 20;

          if (isDrag) {
            // Dragged/Tossed: Snap back with a bouncy spring (physics wobble)
            Animated.spring(pan, {
              toValue: {x: 0, y: 0},
              bounciness: 14,
              speed: 10,
              useNativeDriver: true,
            }).start();
          } else {
            // Tap: trigger jump
            triggerJump();

            // Spring back in case there was tiny offset
            Animated.spring(pan, {
              toValue: {x: 0, y: 0},
              useNativeDriver: true,
            }).start();
          }
        }
      },
    }),
  ).current;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  const rotateYInterpolate = rotateYAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const starsRotate = dizzySpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const impactScale = impactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.8],
  });

  const impactOpacity = impactAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.8, 0.8, 0],
  });

  const dizzyImageOpacity = Animated.add(dizzyAnim, knockedOutAnim);

  const normalImageOpacity = dizzyImageOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  // Layer 1: Outer red-orange glow
  const glowScale1 = streakAnim.interpolate({
    inputRange: [1, 1.25],
    outputRange: [1, 2.2],
  });
  const glowOpacity1 = streakAnim.interpolate({
    inputRange: [1, 1.25],
    outputRange: [0.35, 0],
  });

  // Layer 2: Middle orange-yellow glow
  const glowScale2 = streakAnim.interpolate({
    inputRange: [1, 1.25],
    outputRange: [1, 1.6],
  });
  const glowOpacity2 = streakAnim.interpolate({
    inputRange: [1, 1.25],
    outputRange: [0.6, 0],
  });

  // Layer 3: Inner yellow-gold glow
  const glowScale3 = streakAnim.interpolate({
    inputRange: [1, 1.25],
    outputRange: [0.95, 1.2],
  });
  const glowOpacity3 = streakAnim.interpolate({
    inputRange: [1, 1.25],
    outputRange: [0.85, 0.25],
  });

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [plannerCount, setPlannerCount] = useState(0);

  const formatDateKey = date => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const todayKey = formatDateKey(new Date());
      const storedSlots = await AsyncStorage.getItem('studify_slots');
      if (storedSlots) {
        const parsed = JSON.parse(storedSlots);
        const todaySlots = parsed.filter(
          s => (s.date || todayKey) === todayKey,
        );
        setTasks(todaySlots);
        setPlannerCount(todaySlots.length);
      } else {
        setTasks([]);
        setPlannerCount(0);
      }
    } catch (e) {
      console.log('Failed to load dashboard data', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData]),
  );

  // Stats Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <View style={[styles.mainContainer, {backgroundColor: colors.background}]}>
      <Screen NoHeader style={styles.screenContainer}>
        {/* 1. Header component */}
        <HomeHeader />

        {/* 2. Interactive Quick Stats Dashboard */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statBox,
              dark && {
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
              },
            ]}>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: 28,
                height: 28,
              }}>
              {/* Outer red-orange glow wave */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 69, 0, 0.35)',
                  transform: [{scale: glowScale1}],
                  opacity: glowOpacity1,
                }}
              />
              {/* Middle orange-yellow glow wave */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 165, 0, 0.5)',
                  transform: [{scale: glowScale2}],
                  opacity: glowOpacity2,
                }}
              />
              {/* Inner yellow-gold glow wave */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 215, 0, 0.7)',
                  transform: [{scale: glowScale3}],
                  opacity: glowOpacity3,
                }}
              />
              {/* Inner Flame Icon */}
              <Animated.View style={{transform: [{scale: streakAnim}]}}>
                <Icon name="fire" size={24} color="#ff9500" />
              </Animated.View>
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statVal, dark && {color: colors.onSurface}]}>
                5 Days
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                Study Streak
              </Text>
            </View>
          </View>

          <BouncyButton
            onPress={() => navigation.navigate('PersonalizedLearning')}
            style={[
              styles.statBox,
              dark && {
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
              },
            ]}>
            <Icon name="clipboard-check" size={22} color="#007171" />
            <View style={styles.statTextContainer}>
              <Text style={[styles.statVal, dark && {color: colors.onSurface}]}>
                {completedTasks}/{totalTasks}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                Tasks Done
              </Text>
            </View>
          </BouncyButton>

          <BouncyButton
            onPress={() => navigation.navigate('StudyPlanner')}
            style={[
              styles.statBox,
              dark && {
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
              },
            ]}>
            <Icon name="calendar-multiselect" size={22} color="#5c6bc0" />
            <View style={styles.statTextContainer}>
              <Text style={[styles.statVal, dark && {color: colors.onSurface}]}>
                {plannerCount} Slots
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                Scheduled
              </Text>
            </View>
          </BouncyButton>
        </View>

        {/* 3. Promo Banner Slides */}
        <Banner />

        {/* Personalized Learning Banner Card */}
        <BouncyButton
          onPress={() => navigation.navigate('PersonalizedLearning')}
          style={[
            styles.personalBanner,
            dark && {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <View style={styles.personalTextContainer}>
            <Text
              style={[
                styles.personalSubtitle,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              <Text
                style={[
                  styles.subtitleBoldText,
                  dark && {color: colors.primary},
                ]}>
                My
              </Text>{' '}
              study planner & targets
            </Text>
            <Text
              style={[styles.personalTitle, dark && {color: colors.onSurface}]}>
              Personalized Learning
            </Text>
            <View
              style={[
                styles.personalBtn,
                dark && {backgroundColor: colors.primary},
              ]}>
              <Text style={styles.personalBtnText}>Open Study Hub</Text>
              <Icon
                name="chevron-right"
                size={13}
                color="#ffffff"
                style={styles.chevronIcon}
              />
            </View>
          </View>
          <Image
            source={require('../../Assets/Images/personalized_learning.png')}
            style={styles.personalImage}
          />
        </BouncyButton>

        {/* Offline Coaching Banner Card */}
        <BouncyButton
          onPress={() =>
            navigation.navigate('WebView', {
              url: 'https://www.studifysuccess.com/pre-registration-offline-tuition',
            })
          }
          style={[
            styles.offlineBanner,
            dark && {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <View style={styles.offlineTextContainer}>
            <Text
              style={[
                styles.offlineSubtitle,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              <Text
                style={[
                  styles.subtitleBoldOffline,
                  dark && {color: colors.primary},
                ]}>
                Want
              </Text>{' '}
              to study{' '}
              <Text
                style={[
                  styles.subtitleBoldOfflineHighlight,
                  dark && {color: colors.secondary},
                ]}>
                offline
              </Text>
              ?
            </Text>
            <Text
              style={[styles.offlineTitle, dark && {color: colors.onSurface}]}>
              Offline Coaching
            </Text>
            <View
              style={[
                styles.offlineBtn,
                dark && {backgroundColor: colors.primary},
              ]}>
              <Text style={styles.offlineBtnText}>Register Now</Text>
              <Icon
                name="open-in-new"
                size={13}
                color="#ffffff"
                style={styles.openInNewIcon}
              />
            </View>
          </View>
          <Image
            source={require('../../Assets/Images/offline_coaching.png')}
            style={styles.offlineImage}
          />
        </BouncyButton>

        {/* Study Notes Banner Card */}
        <BouncyButton
          onPress={() => navigation.navigate('ClassNotesSelector')}
          style={[
            styles.notesBanner,
            dark && {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <View style={styles.notesTextContainer}>
            <Text
              style={[
                styles.notesSubtitle,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              <Text
                style={[
                  styles.subtitleBoldNotes,
                  dark && {color: colors.primary},
                ]}>
                Free
              </Text>{' '}
              study materials!
            </Text>
            <Text
              style={[styles.notesTitle, dark && {color: colors.onSurface}]}>
              Download Notes
            </Text>
            <View
              style={[
                styles.notesBtn,
                dark && {backgroundColor: colors.primary},
              ]}>
              <Text style={styles.notesBtnText}>Select Class</Text>
              <Icon
                name="chevron-right"
                size={13}
                color="#ffffff"
                style={styles.chevronIcon}
              />
            </View>
          </View>
          <Image
            source={require('../../Assets/Images/study_notes.png')}
            style={styles.notesImage}
          />
        </BouncyButton>

        {/* Careers Banner Card */}
        <BouncyButton
          onPress={() =>
            navigation.navigate('WebView', {
              url: 'https://careers.studifysuccess.com/',
            })
          }
          style={[
            styles.careersBanner,
            dark && {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <View style={styles.careersTextContainer}>
            <Text
              style={[
                styles.careersSubtitle,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              <Text
                style={[
                  styles.subtitleBoldCareers,
                  dark && {color: colors.primary},
                ]}>
                Build
              </Text>{' '}
              the future with us
            </Text>
            <Text
              style={[styles.careersTitle, dark && {color: colors.onSurface}]}>
              Careers
            </Text>
            <View
              style={[
                styles.careersBtn,
                dark && {backgroundColor: colors.primary},
              ]}>
              <Text style={styles.careersBtnText}>Join Our Team</Text>
              <Icon
                name="chevron-right"
                size={13}
                color="#ffffff"
                style={styles.chevronIcon}
              />
            </View>
          </View>
          <Image
            source={require('../../Assets/Images/careers.png')}
            style={styles.careersImage}
          />
        </BouncyButton>

        {/* Activities Banner Card */}
        <BouncyButton
          onPress={() =>
            navigation.navigate('WebView', {
              url: 'https://activities.studifysuccess.com/',
            })
          }
          style={[
            styles.activitiesBanner,
            dark && {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <View style={styles.activitiesTextContainer}>
            <Text
              style={[
                styles.activitiesSubtitle,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              <Text
                style={[
                  styles.subtitleBoldActivities,
                  dark && {color: colors.primary},
                ]}>
                Explore
              </Text>{' '}
              extracurricular events
            </Text>
            <Text
              style={[styles.activitiesTitle, dark && {color: colors.onSurface}]}>
              Activities
            </Text>
            <View
              style={[
                styles.activitiesBtn,
                dark && {backgroundColor: colors.primary},
              ]}>
              <Text style={styles.activitiesBtnText}>View Activities</Text>
              <Icon
                name="chevron-right"
                size={13}
                color="#ffffff"
                style={styles.chevronIcon}
              />
            </View>
          </View>
          <Image
            source={require('../../Assets/Images/activities.jpg')}
            style={styles.activitiesImage}
          />
        </BouncyButton>

        {/* Internship Banner */}
        <BouncyButton
          onPress={() => navigation.navigate('Internship')}
          style={[
            styles.internshipBanner,
            dark && {
              backgroundColor: 'rgba(55, 71, 79, 0.4)',
              borderColor: '#546e7a',
              borderWidth: 1,
            },
          ]}>
          <View style={styles.internshipTextContainer}>
            <Text style={styles.internshipTitle}>
              Gain Professional Experience
            </Text>
            <Text
              style={[
                styles.internshipSubtitle,
                {color: dark ? '#b0bec5' : '#cfd8dc'},
              ]}>
              Apply for the Studify Internship Program. Learn, grow, and build
              together!
            </Text>
          </View>
          <Icon name="briefcase-check-outline" size={32} color="#ffffff" />
        </BouncyButton>

        {/* 9. Support & Feedback Hub */}
        <View
          style={[
            styles.supportHub,
            dark && {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <Text
            style={[styles.supportHubTitle, dark && {color: colors.onSurface}]}>
            Need Academic or Tech Support?
          </Text>
          <View style={styles.supportIconsRow}>
            <BouncyButton
              onPress={() => navigation.navigate('HelpCenter')}
              style={styles.supportIconCol}>
              <View
                style={[
                  styles.supportIconCircle,
                  dark && {backgroundColor: '#1c2d2d'},
                ]}>
                <Icon name="help-circle" size={22} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.supportIconText,
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                FAQ Center
              </Text>
            </BouncyButton>

            <BouncyButton
              onPress={() => navigation.navigate('CustomerService')}
              style={styles.supportIconCol}>
              <View
                style={[
                  styles.supportIconCircle,
                  dark && {backgroundColor: '#1c2d2d'},
                ]}>
                <Icon name="phone" size={22} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.supportIconText,
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                Call Support
              </Text>
            </BouncyButton>

            <BouncyButton
              onPress={() => navigation.navigate('Appreport')}
              style={styles.supportIconCol}>
              <View
                style={[
                  styles.supportIconCircle,
                  dark && {backgroundColor: '#1c2d2d'},
                ]}>
                <Icon name="bug-outline" size={22} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.supportIconText,
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                Report Bug
              </Text>
            </BouncyButton>
          </View>
        </View>
      </Screen>

      {/* Floating AI Bot Assistant */}
      <View style={styles.botContainer} pointerEvents="box-none">
        {/* Cloud/Bubble for Chat with AI */}
        <Animated.View
          style={[
            styles.cloudBubble,
            dark && styles.cloudBubbleDark,
            {
              transform: [{translateY: cloudFloatAnim}],
            },
          ]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCloudPress}
            style={styles.cloudButton}>
            <Animated.Text
              style={[
                styles.cloudText,
                dark && styles.cloudTextDark,
                {opacity: textOpacity},
              ]}>
              {phrases[phraseIndex]}
            </Animated.Text>
          </TouchableOpacity>

          {/* Thought bubble pointers */}
          <View
            style={[styles.thoughtDotLarge, dark && styles.thoughtDotDark]}
          />
          <View
            style={[styles.thoughtDotSmall, dark && styles.thoughtDotDark]}
          />
        </Animated.View>

        {/* Impact Ring */}
        <Animated.View
          style={[
            styles.impactRing,
            dark && styles.impactRingDark,
            {
              transform: [{scale: impactScale}],
              opacity: impactOpacity,
            },
          ]}
        />

        {/* Sparkle Particles Trail */}
        <MascotParticleTrail pan={pan} rotateYAnim={rotateYAnim} />

        {/* Robot Button */}
        <Animated.View
          style={[
            styles.botImageContainer,
            {
              transform: [
                {translateX: pan.x},
                {
                  translateY: Animated.add(
                    Animated.add(floatAnim, jumpAnim),
                    pan.y,
                  ),
                },
                {scale: scaleAnim},
                {rotate: rotateInterpolate},
                {rotateY: rotateYInterpolate},
              ],
            },
          ]}
          {...panResponder.panHandlers}>
          {/* Normal Happy Robot */}
          <Animated.Image
            source={require('../../Assets/Images/silver_robot.png')}
            style={[
              styles.botImage,
              {
                opacity: normalImageOpacity,
              },
            ]}
          />

          {/* Dizzy Robot */}
          <Animated.Image
            source={require('../../Assets/Images/silver_robot_dizzy.png')}
            style={[
              styles.botImage,
              {
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: dizzyImageOpacity,
              },
            ]}
          />

          {/* Dizzy Stars overlay */}
          <Animated.View
            style={[
              styles.starsContainer,
              {
                opacity: starsAnim,
                transform: [{rotate: starsRotate}],
              },
            ]}>
            <Text style={styles.starText}>💫</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  screenContainer: {
    marginBottom: 80,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginVertical: 10,
    gap: 8,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eceff1',
  },
  statTextContainer: {
    marginLeft: 4,
    flex: 1,
    flexShrink: 1,
  },
  statVal: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#263238',
  },
  statLabel: {
    fontSize: 9,
    color: '#78909c',
    marginTop: 1,
    flexWrap: 'wrap',
  },
  chevronIcon: {
    marginLeft: 2,
  },
  openInNewIcon: {
    marginLeft: 4,
  },
  subtitleBoldText: {
    fontWeight: 'bold',
    color: '#006064',
  },
  subtitleBoldOffline: {
    fontWeight: 'bold',
    color: '#b23b3b',
  },
  subtitleBoldOfflineHighlight: {
    fontWeight: 'bold',
    color: '#007171',
  },
  subtitleBoldNotes: {
    fontWeight: 'bold',
    color: '#007171',
  },
  subtitleBoldCareers: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  internshipTextContainer: {
    flex: 1,
  },
  internshipBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#37474f',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    gap: 10,
  },
  internshipTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  internshipSubtitle: {
    color: '#cfd8dc',
    fontSize: 11,
    lineHeight: 16,
  },

  supportHub: {
    marginHorizontal: 15,
    marginVertical: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eceff1',
    elevation: 2,
    alignItems: 'center',
  },
  supportHubTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 12,
  },
  supportIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  supportIconCol: {
    alignItems: 'center',
    flex: 1,
  },
  supportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef6f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  supportIconText: {
    fontSize: 10,
    color: '#546e7a',
    fontWeight: 'bold',
  },
  offlineBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffe0e0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  offlineTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  offlineSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  offlineBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  offlineBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  offlineImage: {
    flex: 0.8,
    height: 90,
    width: 90,
    resizeMode: 'contain',
  },
  notesBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#eef9f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d5ebeb',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  notesTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  notesSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  notesBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  notesBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  notesImage: {
    flex: 0.8,
    height: 90,
    width: 90,
    resizeMode: 'contain',
  },
  careersBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e0ff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  careersTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  careersSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  careersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  careersBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  careersBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  careersImage: {
    flex: 0.8,
    height: 90,
    width: 90,
    resizeMode: 'contain',
  },
  activitiesBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  activitiesTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  activitiesSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  activitiesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  activitiesBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  activitiesBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activitiesImage: {
    flex: 0.8,
    height: 90,
    width: 90,
    resizeMode: 'contain',
  },
  subtitleBoldActivities: {
    fontWeight: 'bold',
  },
  personalBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#b2ebf2',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  personalTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  personalSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  personalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  personalBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  personalBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  personalImage: {
    flex: 0.8,
    height: 90,
    width: 90,
    resizeMode: 'contain',
  },
  botContainer: {
    position: 'absolute',
    bottom: 10,
    right: 5,
    alignItems: 'center',
    zIndex: 999,
  },

  botImageContainer: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botImage: {
    width: 170,
    height: 170,
    resizeMode: 'contain',
  },
  cloudBubble: {
    backgroundColor: 'rgba(255, 225, 235, 0.75)', // Light, pinkish, and transparent pinkish
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#ab2346',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    width: 125,
    marginBottom: 10,
  },
  cloudBubbleDark: {
    backgroundColor: 'rgba(70, 35, 45, 0.75)', // Transparent dark berry
    shadowColor: '#ff8fa3',
  },
  cloudButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cloudText: {
    color: '#ab2346',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cloudTextDark: {
    color: '#ff8fa3',
  },
  thoughtDotLarge: {
    position: 'absolute',
    bottom: -8,
    left: 45,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 225, 235, 0.75)',
    shadowColor: '#ab2346',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  thoughtDotSmall: {
    position: 'absolute',
    bottom: -14,
    left: 38,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 225, 235, 0.75)',
    shadowColor: '#ab2346',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 0.5,
    elevation: 1,
  },
  thoughtDotDark: {
    backgroundColor: 'rgba(70, 35, 45, 0.75)',
    shadowColor: '#ff8fa3',
  },

  starsContainer: {
    position: 'absolute',
    top: 5,
    left: 50,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  starText: {
    fontSize: 22,
    transform: [{translateY: -22}],
  },
  impactRing: {
    position: 'absolute',
    bottom: 0,
    width: 60,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#007171',
    backgroundColor: 'transparent',
    alignSelf: 'center',
    pointerEvents: 'none',
  },
  impactRingDark: {
    borderColor: '#00b4b4',
  },
});

export default Home;
