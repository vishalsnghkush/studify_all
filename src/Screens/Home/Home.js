import React, {useState, useCallback, useRef, useEffect, useMemo} from 'react';
import {
  Screen,
  BouncyButton,
  MascotParticleTrail,
} from '../../Components/Screen';
import HomeHeader from '../../Components/Screen/HomeHeader';
import Banner from '../../Components/Screen/Banner';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Image,
  Animated,
  PanResponder,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import useApi from '../../Components/Api/Api';
import {Text} from '../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {checkStreak} from '../../Redux/Slices/GamificationSlice';
import {syncGamificationToFirebase} from '../../Utils/GamificationSync';
import {getRecentNote, getTopEngagedSubjects, openRecentItem} from '../../Utils/EngagementTracker';
import {formatSubjectForBoard} from '../../Utils/CurriculumConfig';
import Notifee, { TriggerType, RepeatFrequency } from '@notifee/react-native';
import {CopilotProvider, CopilotStep, walkthroughable, useCopilot} from 'react-native-copilot';
import AIChatbot from '../../Components/AIChatbot';

const CopilotView = walkthroughable(View);
const copilotStartRef = {current: null};
const TourStarter = () => {
  const {start} = useCopilot();
  copilotStartRef.current = start;
  return null;
};

// Defined OUTSIDE component — static constant, never recreated on re-renders
const STATIC_PHRASES = [
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

const Home = () => {
  const navigation = useNavigation();
  const {colors, dark} = useTheme();
  const {user} = useSelector(state => state.initial);
  const dispatch = useDispatch();
  const gamificationState = useSelector(state => state.gamification);

  // Debounced Firebase sync ref to avoid firing on every small gamification state change
  const syncDebounceRef = useRef(null);
  useEffect(() => {
    if (user && user.email && gamificationState) {
      // Debounce: only sync if no new changes arrive within 3 seconds
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = setTimeout(() => {
        syncGamificationToFirebase(user, gamificationState);
      }, 3000);
    }
    return () => {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    };
  }, [
    gamificationState && gamificationState.xp,
    gamificationState && gamificationState.streak,
    gamificationState && gamificationState.badges && gamificationState.badges.length,
    user && user.email
  ]);

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

  const [personalPhrases, setPersonalPhrases] = useState(STATIC_PHRASES);
  const [recentNote, setRecentNoteState] = useState(null);

  // Dynamic Mascot phrases based on top subject and time
  const loadMascotPhrases = async () => {
    try {
      const top = await getTopEngagedSubjects(1);
      const hours = new Date().getHours();
      let timeGreet = 'Study time!';
      if (hours >= 5 && hours < 12) timeGreet = 'Morning focus!';
      else if (hours >= 12 && hours < 17) timeGreet = 'Afternoon study!';
      else if (hours >= 17 && hours < 22) timeGreet = 'Evening review!';
      else timeGreet = 'Night quiz!';

      let subName = '';
      if (top && top.length > 0) {
        subName = top[0].charAt(0).toUpperCase() + top[0].slice(1);
      }

      const defaultPhrases = [
        'Generate Notes 📚',
        'Chapter Summary 🔍',
        'NCERT Solutions 💡',
        'Generate Questions ❓',
        'Create Test ⚡',
      ];

      const newPhrases = [...defaultPhrases];
      if (subName) {
        newPhrases.unshift(`Revise ${subName}! 🧠`);
        newPhrases.unshift(`Let's study ${subName}! 📖`);
      }
      newPhrases.unshift(`${timeGreet} 🕒`);

      setPersonalPhrases(newPhrases);
    } catch (e) {
      console.log('Error loading mascot phrases', e);
    }
  };


  // Dizzy & Expression animation refs and state
  const dizzyAnim = useRef(new Animated.Value(0)).current;
  const dizzySpinAnim = useRef(new Animated.Value(0)).current;
  const knockedOutAnim = useRef(new Animated.Value(0)).current;
  const starsAnim = useRef(new Animated.Value(0)).current;
  const impactAnim = useRef(new Animated.Value(0)).current;

  const [isDizzy, setIsDizzy] = useState(false);
  const isAnimating = useRef(false);

  // Mascot visibility toggle — persisted in AsyncStorage (OFF by default)
  const [showMascot, setShowMascot] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Native Chatbot State & Messaging API Integration
  const { post: chatPost } = useApi();
  const flatListRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome_1',
      sender: 'ai',
      text: '👋 Hello! Welcome to StudifySuccess. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatDebugLogs, setChatDebugLogs] = useState([]);
  const [showChatDebug, setShowChatDebug] = useState(false);

  const logChatDebug = (type, msg, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { id: `${Date.now()}_${Math.random()}`, time: timestamp, type, message: msg, data: data ? JSON.stringify(data) : null };
    setChatDebugLogs(prev => [logEntry, ...prev].slice(0, 30));
    console.log(`[CHATBOT_DEBUG] [${type}] ${msg}`, data || '');
  };

  const handleSendNativeMessage = async () => {
    const userText = inputMessage.trim();
    if (!userText || chatLoading) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      time: timestamp,
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setChatLoading(true);

    logChatDebug('INFO', 'Sending message to /chatbot/chat', { text: userText, role: (user && user.role) || 'student', email: (user && user.email) || 'guest' });

    // Retrieve local AsyncStorage data for student personalization
    let recentNote = null;
    let subjectEngagement = null;
    let featureUsage = null;
    let pinnedSubject = null;
    let notebooks = null;
    let savedNotes = null;
    let testHistory = null;
    let studyPlannerSlots = null;
    let savedLectures = null;
    let studySessionsHistory = null;
    let notesReadHistory = null;
    let examTarget = null;
    let totalNotesPages = 0;
    let weakTopic = null;
    let weeklyGoals = null;
    try {
      const rawNote = await AsyncStorage.getItem('@studify_recent_note');
      recentNote = rawNote ? JSON.parse(rawNote) : null;
      
      const rawEngage = await AsyncStorage.getItem('@studify_subject_engagement');
      subjectEngagement = rawEngage ? JSON.parse(rawEngage) : null;

      const rawFeature = await AsyncStorage.getItem('@studify_feature_usage');
      featureUsage = rawFeature ? JSON.parse(rawFeature) : null;

      pinnedSubject = await AsyncStorage.getItem('@studify_pinned_subject');

      const rawNotebooks = await AsyncStorage.getItem('@voice_notebooks');
      notebooks = rawNotebooks ? JSON.parse(rawNotebooks) : null;

      if (notebooks && Array.isArray(notebooks)) {
        for (const notebook of notebooks) {
          const pagesData = await AsyncStorage.getItem(`@voice_notebook_pages_${notebook.id}`);
          if (pagesData) {
            totalNotesPages += JSON.parse(pagesData).length;
          }
        }
      }

      const rawSavedNotes = await AsyncStorage.getItem('@studify_saved_notes');
      savedNotes = rawSavedNotes ? JSON.parse(rawSavedNotes) : null;

      const rawTestHistory = await AsyncStorage.getItem('@studify_test_history');
      testHistory = rawTestHistory ? JSON.parse(rawTestHistory) : null;

      const rawSlots = await AsyncStorage.getItem('studify_slots');
      studyPlannerSlots = rawSlots ? JSON.parse(rawSlots) : null;

      const rawLectures = await AsyncStorage.getItem('@studify_saved_lectures');
      savedLectures = rawLectures ? JSON.parse(rawLectures) : null;

      const rawSessions = await AsyncStorage.getItem('@studify_study_sessions_history');
      studySessionsHistory = rawSessions ? JSON.parse(rawSessions) : null;

      const rawNotesRead = await AsyncStorage.getItem('@studify_notes_read_history');
      notesReadHistory = rawNotesRead ? JSON.parse(rawNotesRead) : null;

      const rawTarget = await AsyncStorage.getItem('@studify_exam_target');
      examTarget = rawTarget ? JSON.parse(rawTarget) : null;

      const rawFailed = await AsyncStorage.getItem('@studify_last_failed_topic');
      weakTopic = rawFailed ? JSON.parse(rawFailed) : null;

      const rawGoals = await AsyncStorage.getItem('@studify_intern_weekly_goals');
      weeklyGoals = rawGoals ? JSON.parse(rawGoals) : null;
    } catch (err) {
      logChatDebug('WARN', 'Failed to read AsyncStorage: ' + err.message);
    }

    try {
      const payload = {
        message: userText,
        sessionId: (user && user.email) ? `session_${user.email}` : 'guest_session',
        role: (user && user.role) || 'student',
        email: (user && user.email) || '',
        recentNote,
        subjectEngagement,
        featureUsage,
        pinnedSubject,
        notebooks,
        savedNotes,
        testHistory,
        studyPlannerSlots,
        savedLectures,
        studySessionsHistory,
        notesReadHistory,
        examTarget,
        totalNotesPages,
        weakTopic,
        weeklyGoals,
      };

      let resData = null;
      const endpoints = [
        'http://192.168.1.3:3000/chat',
        'http://192.168.1.3:3000/api/chat',
        'http://192.168.1.3:3000/chatbot/chat',
        'http://10.0.2.2:3000/chat',
        'https://www.api.studifysuccess.com/chat',
        'https://www.api.studifysuccess.com/api/chat',
        'https://www.api.studifysuccess.com/chatbot/chat',
      ];

      let lastErr = null;

      for (const url of endpoints) {
        try {
          logChatDebug('INFO', `Attempting endpoint: ${url}`);
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            resData = data;
            logChatDebug('SUCCESS', `Response received from ${url}`, resData);
            break;
          } else {
            logChatDebug('WARN', `Endpoint ${url} returned HTTP ${response.status}`);
          }
        } catch (e) {
          lastErr = e;
          logChatDebug('WARN', `Endpoint ${url} error: ${e.message}`);
        }
      }

      if (!resData) {
        throw lastErr || new Error('All chatbot API endpoints failed');
      }

      const aiReplyText = (resData && resData.reply) || (resData && resData.data && resData.data.reply) || "I'm here to assist you! Please ask any question regarding courses, fees, or attendance.";

      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      logChatDebug('ERROR', 'Chatbot API request failed', (err && err.message) || err);
      const fallbackMsg = {
        id: `ai_err_${Date.now()}`,
        sender: 'ai',
        text: '⚠️ Unable to connect to assistant backend. Please check network connection.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setChatMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem('@studify_show_mascot').then(val => {
      if (val !== null) setShowMascot(val === 'true');
    });
  }, []);

  const handleToggleMascot = async (val) => {
    setShowMascot(val);
    await AsyncStorage.setItem('@studify_show_mascot', val ? 'true' : 'false');
  };

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
    const interval = setInterval(() => {
      // Fade out current phrase
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        // Change phrase and fade in
        setPhraseIndex(prev => (prev + 1) % personalPhrases.length);
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });
    }, 4000); // changes every 4 seconds

    return () => clearInterval(interval);
  }, [textOpacity, personalPhrases.length]);


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

  const chatPan = useRef(new Animated.ValueXY()).current;
  const chatPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        chatPan.setOffset({
          x: chatPan.x._value,
          y: chatPan.y._value,
        });
        chatPan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event(
        [null, {dx: chatPan.x, dy: chatPan.y}],
        {useNativeDriver: false}
      ),
      onPanResponderRelease: () => {
        chatPan.flattenOffset();
      },
    })
  ).current;

  const handleCloudPress = () => {
    chatPan.setValue({x: 0, y: 0});
    setShowChatModal(true);
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

  // Tasks & Notebook state
  const [tasks, setTasks] = useState([]);
  const [plannerCount, setPlannerCount] = useState(0);
  const [notebooksCount, setNotebooksCount] = useState(1);
  const [weakTopic, setWeakTopic] = useState(null);

  const formatDateKey = date => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const todayKey = formatDateKey(new Date());
      // Run all AsyncStorage reads in parallel — 60-80% faster than sequential awaits
      const [storedSlots, savedNotebooks, failedTop, note] = await Promise.all([
        AsyncStorage.getItem('studify_slots'),
        AsyncStorage.getItem('@voice_notebooks'),
        AsyncStorage.getItem('@studify_last_failed_topic'),
        getRecentNote(),
      ]);

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

      // Load notebooks count
      if (savedNotebooks) {
        setNotebooksCount(JSON.parse(savedNotebooks).length);
      } else {
        setNotebooksCount(1); // default Manual notebook
      }

      // Load weak topic
      if (failedTop) {
        setWeakTopic(JSON.parse(failedTop));
      } else {
        setWeakTopic(null);
      }

      // Set recent note & personalize mascot phrases (non-blocking)
      setRecentNoteState(note);
      loadMascotPhrases();
    } catch (e) {
      console.warn('Error loading dashboard data:', e);
    }
  }, []);

  // Schedule Daily Trivia Notification
  useEffect(() => {
    const scheduleTrivia = async () => {
      try {
        const top = await getTopEngagedSubjects(1);
        let subjName = top && top.length > 0 ? top[0] : 'your subjects';

        const trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: new Date().setHours(18, 0, 0, 0), // 6:00 PM today
          repeatFrequency: RepeatFrequency.DAILY,
        };
        
        if (trigger.timestamp < Date.now()) {
          trigger.timestamp += 86400000;
        }

        await Notifee.createTriggerNotification(
          {
            id: 'daily_trivia',
            title: `🧠 Daily Trivia Time!`,
            body: `Can you answer today's question in ${subjName}? Tap to test your knowledge!`,
            android: {
              channelId: 'default',
              smallIcon: 'ic_launcher',
            },
          },
          trigger
        );
      } catch (e) {
        console.log('Failed to schedule trivia', e);
      }
    };
    scheduleTrivia();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      dispatch(checkStreak());
    }, [loadDashboardData, dispatch]),
  );

  // Stats Calculations — memoized so they don't re-run on every unrelated render
  const totalTasks = tasks.length;
  const completedTasks = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);

  return (
    <CopilotProvider overlay="view" tooltipStyle={{borderRadius: 17}}>
      <TourStarter />
      <TouchableOpacity
        onPress={() => {
          copilotStartRef.current && copilotStartRef.current();
        }}
        style={[
          styles.helpButton,
          dark && {backgroundColor: colors.surface, borderColor: colors.outlineVariant},
        ]}>
        <Icon name="help-circle-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
      <View style={[styles.mainContainer, {backgroundColor: colors.background}]}>
      <Screen NoHeader style={styles.screenContainer}>
        {/* 1. Header component */}
        <HomeHeader />

        {/* Dynamic Weakness Targeting Widget */}
        {weakTopic && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AiNotesGenerator', { 
              subject: weakTopic.subject, 
              topic: weakTopic.topic,
              studentClass: weakTopic.studentClass,
              board: weakTopic.board,
              stream: weakTopic.stream
            })}
            style={{
              marginHorizontal: 15,
              marginTop: 10,
              marginBottom: 14,
              backgroundColor: dark ? 'rgba(255, 152, 0, 0.15)' : '#fff3e0',
              borderLeftWidth: 4,
              borderLeftColor: '#ff9800',
              padding: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Icon name="target-account" size={28} color="#ff9800" style={{marginRight: 14}} />
            <View style={{flex: 1}}>
              <Text style={{fontWeight: 'bold', fontSize: 14, color: '#ff9800', marginBottom: 2}}>Focus Area Identified</Text>
              <Text style={{fontSize: 12, color: colors.onSurface, lineHeight: 18}}>
                Improve your score in <Text style={{fontWeight: 'bold'}}>{weakTopic.topic}</Text>. Generate a custom AI study guide now!
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color="#ff9800" />
          </TouchableOpacity>
        )}

        {/* 2. Interactive Quick Stats Dashboard */}
        <CopilotStep text="🔥 Your progress lives here. Keep that streak alive!" order={3} name="statsRow">
        <CopilotView style={styles.statsRow}>
          <BouncyButton
            onPress={() => navigation.navigate('PersonalizedLearning')}
            style={[
              styles.statBox,
              {backgroundColor: '#e0f7fa', borderColor: '#b2ebf2'},
              dark && {
                backgroundColor: 'rgba(0,188,212,0.1)',
                borderColor: 'rgba(0,188,212,0.3)',
              },
            ]}>
            <View
              style={[styles.statIconWrapper, {backgroundColor: '#b2ebf2'}]}>
              <Icon name="clipboard-check" size={15} color="#00838f" />
            </View>
            <View style={styles.statTextContainer}>
              <Text
                style={[
                  styles.statVal,
                  {color: '#006064'},
                  dark && {color: colors.onSurface},
                ]}>
                {completedTasks}/{totalTasks}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {color: '#00838f'},
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                Tasks
              </Text>
            </View>
          </BouncyButton>

          <BouncyButton
            onPress={() => navigation.navigate('VoiceNotebook')}
            style={[
              styles.statBox,
              {backgroundColor: '#ede7f6', borderColor: '#d1c4e9'},
              dark && {
                backgroundColor: 'rgba(103,58,183,0.1)',
                borderColor: 'rgba(103,58,183,0.3)',
              },
            ]}>
            <View
              style={[
                styles.statIconWrapper,
                {backgroundColor: '#d1c4e9', position: 'relative'},
              ]}>
              <Icon name="notebook-outline" size={16} color="#512da8" />
              <View
                style={{
                  position: 'absolute',
                  bottom: -3,
                  right: -3,
                  backgroundColor: dark ? '#201630' : '#ede7f6',
                  borderRadius: 6,
                  padding: 1,
                  borderWidth: 1,
                  borderColor: '#d1c4e9',
                }}>
                <Icon name="microphone" size={9} color="#512da8" />
              </View>
            </View>
            <View style={styles.statTextContainer}>
              <Text
                style={[
                  styles.statVal,
                  {color: '#311b92'},
                  dark && {color: colors.onSurface},
                ]}>
                {notebooksCount}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {color: '#512da8'},
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                Notebooks
              </Text>
            </View>
          </BouncyButton>

          <BouncyButton
            onPress={() => navigation.navigate('GamificationDashboard')}
            style={[
              styles.statBox,
              {backgroundColor: '#fff3e0', borderColor: '#ffe0b2'},
              dark && {
                backgroundColor: 'rgba(255,152,0,0.1)',
                borderColor: 'rgba(255,152,0,0.3)',
              },
            ]}>
            <View
              style={[styles.statIconWrapper, {backgroundColor: '#ffe0b2'}]}>
              <Icon name="fire" size={15} color="#e65100" />
            </View>
            <View style={styles.statTextContainer}>
              <Text
                style={[
                  styles.statVal,
                  {color: '#e65100'},
                  dark && {color: colors.onSurface},
                ]}>
                {`${(gamificationState && gamificationState.streak) || 1}d`}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {color: '#e65100'},
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                Streak
              </Text>
            </View>
          </BouncyButton>
        </CopilotView>
        </CopilotStep>

        {recentNote && (
          <BouncyButton
            onPress={() => openRecentItem(navigation, recentNote)}
            style={[
              styles.recentCard,
              { backgroundColor: colors.surface, borderColor: colors.outlineVariant }
            ]}
          >
            <View style={styles.recentRow}>
              <View style={styles.recentIconBox}>
                <Icon name={recentNote.type === 'note' ? 'file-pdf-box' : 'play-circle'} size={24} color="#e53935" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase' }}>
                  Jump Back In
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: 'bold', color: colors.onSurface }}>
                  {recentNote.name}
                </Text>
                <Text style={{ fontSize: 11, color: colors.outline, textTransform: 'capitalize' }}>
                  Subject: {formatSubjectForBoard(recentNote.subject, recentNote.board)} • {recentNote.type}
                </Text>
              </View>
              <Icon name="arrow-right-circle" size={24} color={colors.primary} />
            </View>
          </BouncyButton>
        )}



        {/* Personalized Learning Banner Card */}
        <CopilotStep text="🎯 For all your study planner & targets." order={4} name="studyHub">
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
        </CopilotStep>

        {/* AI Flashcards Banner Card */}
        <BouncyButton
          onPress={() => navigation.navigate('AiFlashcards', { subject: weakTopic ? weakTopic.subject : ((recentNote && recentNote.subject) || 'Physics'), topic: weakTopic ? weakTopic.topic : 'General Revision' })}
          style={[
            styles.personalBanner,
            { backgroundColor: '#e8eaf6', borderColor: '#c5cae9' },
            dark && { backgroundColor: 'rgba(63, 81, 181, 0.1)', borderColor: 'rgba(63, 81, 181, 0.3)' }
          ]}>
          <View style={styles.personalTextContainer}>
            <Text style={[styles.personalSubtitle, { color: '#3f51b5' }]}>Spaced Repetition</Text>
            <Text style={[styles.personalTitle, dark && {color: colors.onSurface}]}>AI Flashcards</Text>
            <View style={[styles.personalBtn, { backgroundColor: '#3f51b5' }]}>
              <Text style={styles.personalBtnText}>Start Review</Text>
              <Icon name="chevron-right" size={13} color="#ffffff" style={styles.chevronIcon} />
            </View>
          </View>
          <Icon name="cards-playing-outline" size={80} color="#3f51b5" style={{ opacity: 0.2, position: 'absolute', right: -10, bottom: -10 }} />
        </BouncyButton>

        {/* Offline Coaching Banner Card */}
        <BouncyButton
          onPress={() => navigation.navigate('OfflineTuitions')}
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



        {/* Careers Banner Card */}
        <BouncyButton
          onPress={() => navigation.navigate('Careers')}
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
          onPress={() => navigation.navigate('Activities')}
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
              style={[
                styles.activitiesTitle,
                dark && {color: colors.onSurface},
              ]}>
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
              onPress={() =>
                navigation.navigate('WebView', {
                  url: 'https://support.studifysuccess.com/',
                  title: 'Support Portal',
                })
              }
              style={styles.supportIconCol}>
              <View
                style={[
                  styles.supportIconCircle,
                  dark && {backgroundColor: '#1c2d2d'},
                ]}>
                <Icon name="web" size={22} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.supportIconText,
                  dark && {color: colors.onSurfaceVariant},
                ]}>
                Web Support
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

        {/* ✨ Mascot Toggle Card — at the very bottom */}
        <View style={styles.mascotToggleCard}>
          {/* Gradient-like layered background */}
          <View style={[
            styles.mascotToggleBg,
            dark && {backgroundColor: '#1a1a2e', borderColor: '#7c3aed44'}
          ]}>
            {/* Styled Toggle — LEFT side so mascot doesn't cover it */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleToggleMascot(!showMascot)}
              style={[
                styles.mascotToggleTrack,
                showMascot
                  ? {backgroundColor: colors.primary}
                  : {backgroundColor: dark ? '#3a3a50' : '#d1d5db'},
                {marginRight: 14},
              ]}>
              <Animated.View
                style={[
                  styles.mascotToggleThumb,
                  {
                    transform: [{
                      translateX: showMascot ? 24 : 2,
                    }],
                  },
                ]}
              />
            </TouchableOpacity>

            <View style={styles.mascotToggleLeft}>
              <Text style={styles.mascotToggleEmoji}>🤖</Text>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={[
                  styles.mascotToggleTitle,
                  dark && {color: '#e0d7ff'}
                ]}>
                  Your Study Buddy
                </Text>
                <Text style={[
                  styles.mascotToggleSubtitle,
                  dark && {color: '#a78bfa'}
                ]}>
                  {showMascot
                    ? '✨ Buddy is here! Drag me around 🎉'
                    : '💤 Call your buddy to play!'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tagline below */}
          <Text style={[
            styles.mascotToggleTagline,
            dark && {color: '#a78bfa'}
          ]}>
            {showMascot
              ? '🌟 Your buddy is watching you study — keep going!'
              : '👋 Toggle on to summon your mascot companion!'}
          </Text>
        </View>

      </Screen>

      <AIChatbot role="student" />
    </View>
    </CopilotProvider>
  );
};

const styles = StyleSheet.create({
  mascotToggleCard: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 30,
  },
  mascotToggleBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3E8FF',
    borderWidth: 1.5,
    borderColor: '#D8B4FE',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mascotToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  mascotToggleEmoji: {
    fontSize: 28,
  },
  mascotToggleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#581C87',
  },
  mascotToggleSubtitle: {
    fontSize: 12,
    color: '#7E22CE',
    marginTop: 2,
    fontWeight: '500',
  },
  mascotToggleTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  mascotToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mascotToggleTagline: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    color: '#6B21A8',
    fontWeight: '600',
  },
  recentCard: {
    marginHorizontal: 15,
    marginTop: 0,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
  },
  helpButton: {
    position: 'absolute',
    top: 55,
    right: 16,
    zIndex: 99999,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  screenContainer: {
    marginBottom: 80,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 14,
    gap: 10,
  },
  statBox: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  statIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statTextContainer: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
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
  counselingBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#f3e5f5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1bee7',
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
  counselingTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  counselingSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  counselingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  counselingBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  counselingBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  counselingIcon: {
    marginRight: 10,
  },
  subtitleBoldCounseling: {
    fontWeight: 'bold',
  },
  focusBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#ede7f6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1c4e9',
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
  focusTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  focusSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  focusBtn: {
    backgroundColor: '#673ab8',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  focusBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  focusIcon: {
    marginRight: 10,
  },
  subtitleBoldFocus: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingBottom: 110,
  },
  floatingChatBox: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    width: 320,
    height: 500,
    backgroundColor: '#fff8fa',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 225, 235, 0.9)',
    elevation: 20,
    shadowColor: '#ab2346',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 225, 235, 0.9)',
  },
  modalMascotIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2e2e',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#007171',
    fontWeight: '600',
    marginTop: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 225, 235, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(171, 35, 70, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Home;
