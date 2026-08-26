import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MascotParticleTrail from './Screen/MascotParticleTrail';
// import MarkdownText from './MarkdownText';

const STUDENT_PHRASES = [
  'Generate Notes 📚',
  'Chapter Summary 🔍',
  'NCERT Solutions 💡',
  'Generate Questions ❓',
  'Generate Quizzes 📝',
  'Create Test ⚡',
  'Create Assignment 📋',
  'Doubts Solve 💬',
  'Mind Maps 🧠',
  'My Courses 🎓',
  'App Support 💬',
];

const INTERN_PHRASES = [
  'Submit EOD Report 📋',
  'Leave Requests 🗓️',
  'My Tasks 🎯',
  'Learning Modules 📚',
  'My Attendance 📅',
  'Weekly Goals 🎯',
  'App Support 💬',
  'HR Queries 👥',
];

const TL_PHRASES = [
  'Team Attendance 📊',
  'Assign New Task 📋',
  'Send Announcement 📢',
  'Intern Performance 🏆',
  'Schedule Meeting 📅',
  'Review EOD Reports 📝',
  'Team Overview 👥',
  'App Support 💬',
];

const AIChatbot = ({ role: initialRole, visible }) => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const { user } = useSelector(state => state.initial);

  const [showMascot, setShowMascot] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
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

  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateYAnim = useRef(new Animated.Value(0)).current;
  const starsAnim = useRef(new Animated.Value(0)).current;
  const cloudFloatAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const impactScale = useRef(new Animated.Value(0.4)).current;
  const impactOpacity = useRef(new Animated.Value(0.8)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const chatPan = useRef(new Animated.ValueXY()).current;

  // Dizzy animation values
  const dizzyAnim = useRef(new Animated.Value(0)).current;
  const dizzySpinAnim = useRef(new Animated.Value(0)).current;
  const knockedOutAnim = useRef(new Animated.Value(0)).current;
  const impactAnim = useRef(new Animated.Value(0)).current;
  const [isDizzy, setIsDizzy] = useState(false);
  const isAnimating = useRef(false);
  const chatFlatListRef = useRef(null);

  // Mascot phrases rotating
  const getRole = () => initialRole || ((user && user.is_tl) ? 'tl' : (user && user.is_intern) ? 'intern' : 'student');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [personalPhrases, setPersonalPhrases] = useState(() => {
    const r = getRole();
    return r === 'tl' ? TL_PHRASES : r === 'intern' ? INTERN_PHRASES : STUDENT_PHRASES;
  });

  // Dynamically update phrases whenever the user role changes
  useEffect(() => {
    const r = getRole();
    const phrases = r === 'tl' ? TL_PHRASES : r === 'intern' ? INTERN_PHRASES : STUDENT_PHRASES;
    setPersonalPhrases(phrases);
    setPhraseIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRole, user?.is_intern, user?.is_tl]);

  // Load visibility settings on screen focus
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('@studify_show_mascot').then(val => {
        if (val !== null) {
          setShowMascot(val === 'true');
        }
      });
    }, [])
  );

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

  // Start float animations on mount
  useEffect(() => {
    startFloat();
    startCloudFloat();
  }, [startFloat, startCloudFloat]);

  // Mascot Phrases Rotator
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAnimating.current) {
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setPhraseIndex(prev => (prev + 1) % personalPhrases.length);
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }).start();
        });
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [personalPhrases, textOpacity]);

  const triggerJump = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(jumpAnim, {
          toValue: -45,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(jumpAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimating.current = false;
    });
  };

  const triggerSpin = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    Animated.parallel([
      Animated.timing(rotateYAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(jumpAnim, {
          toValue: -20,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(jumpAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      rotateYAnim.setValue(0);
      isAnimating.current = false;
    });
  };

  const triggerDizzy = () => {
    if (isDizzy) return;
    setIsDizzy(true);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(dizzyAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(starsAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.timing(dizzySpinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        { iterations: 2 }
      ),
      Animated.parallel([
        Animated.timing(dizzyAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(starsAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      dizzySpinAnim.setValue(0);
      setIsDizzy(false);
    });
  };

  const logChatDebug = (type, msg, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { id: `${Date.now()}_${Math.random()}`, time: timestamp, type, message: msg, data: data ? JSON.stringify(data) : null };
    setChatDebugLogs(prev => [logEntry, ...prev].slice(0, 30));
    console.log(`[CHATBOT_DEBUG] [${type}] ${msg}`, data || '');
  };

  const handleSend = async (messageOverride = null) => {
    const userText = (typeof messageOverride === 'string' ? messageOverride : inputMessage).trim();
    if (!userText || chatLoading) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      time: timestamp,
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!messageOverride) {
      setInputMessage('');
    }
    setChatLoading(true);

    const userRole = initialRole || ((user && user.is_tl) ? 'tl' : (user && user.is_intern) ? 'intern' : 'student');
    const userEmail = (user && user.email) || 'guest';

    logChatDebug('INFO', 'Sending message to /chatbot/chat', { text: userText, role: userRole, email: userEmail });

    // Retrieve local AsyncStorage data for personalization
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
        sessionId: userEmail ? `session_${userEmail}` : 'guest_session',
        role: initialRole || ((user && user.is_tl) ? 'tl' : (user && user.is_intern) ? 'intern' : 'student'),
        email: userEmail,
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

      const endpoints = [
        'https://www.api.studifysuccess.com/chat',
      ];

      let lastErr = null;
      let resData = null;

      for (const url of endpoints) {
        try {
          logChatDebug('INFO', `Attempting endpoint: ${url}`);
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            resData = await response.json();
            logChatDebug('SUCCESS', `Response received from ${url}`, resData);
            break;
          } else {
            logChatDebug('WARN', `Endpoint ${url} returned HTTP ${response.status}`);
          }
        } catch (e) {
          logChatDebug('WARN', `Endpoint ${url} error: ${e.message}`);
          lastErr = e;
        }
      }

      if (!resData) {
        throw lastErr || new Error('All chatbot API endpoints failed');
      }

      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: resData.reply || 'No reply received from server.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, aiMsg]);
      setChatLoading(false);
    } catch (err) {
      logChatDebug('ERROR', 'Chatbot API request failed', (err && err.message) || err);
      const fallbackMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: '⚠️ Connection issue: I am unable to connect to the chatbot server right now. Please try again later!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, fallbackMsg]);
      setChatLoading(false);

      // Visible Error Alert popup
      Alert.alert(
        'Connection Unreachable',
        'Studify AI service is temporarily offline or your internet connection is weak. Please verify your connection and try again!',
        [{ text: 'OK' }]
      );
    }
  };

  const parseMarkdownText = (text) => {
    if (!text) return '';
    const parts = text.split('**');
    return parts.map((part, index) => {
      const isBold = index % 2 === 1;
      const subParts = part.split('*');
      return subParts.map((subPart, subIndex) => {
        const isItalic = subIndex % 2 === 1;
        let style = {};
        if (isBold) style.fontWeight = 'bold';
        if (isItalic) style.fontStyle = 'italic';
        return (
          <Text key={`${index}-${subIndex}`} style={style}>
            {subPart}
          </Text>
        );
      });
    });
  };

  const handleCloudPress = () => {
    setShowChatModal(true);
  };

  const getContextSuggestions = () => {
    const activeRole = initialRole || ((user && user.is_tl) ? 'tl' : (user && user.is_intern) ? 'intern' : 'student');
    if (activeRole === 'tl') {
      return [
        'Team stats overview 👑',
        'Active interns today 🙋‍♂️',
        'Pending tasks review 🛠️',
        'Latest department meetings 📅',
      ];
    } else if (activeRole === 'intern') {
      return [
        'My weekly goals 🎯',
        'My attendance summary 📊',
        'My recent leaves 📅',
      ];
    } else {
      return [
        'NCERT Solutions 💡',
        'Chapter Summary 🔍',
        'My study schedule today 📅',
        'Show my test history ⚡',
      ];
    }
  };

  const suggestionChips = getContextSuggestions();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const dx = Math.abs(gestureState.dx);
        const dy = Math.abs(gestureState.dy);
        return dx > 8 && dx > dy * 1.5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (evt, gestureState) => {
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const vx = gestureState.vx;
        const vy = gestureState.vy;

        const isSwipe = Math.abs(vx) > 0.25 || Math.abs(vy) > 0.25;

        if (isSwipe) {
          if (isAnimating.current && !isDizzy) {
            triggerDizzy();
          } else {
            triggerSpin();
          }

          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        } else {
          const isDrag = Math.abs(dx) > 20 || Math.abs(dy) > 20;

          if (isDrag) {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              bounciness: 14,
              speed: 10,
              useNativeDriver: true,
            }).start();
          } else {
            triggerJump();
            setShowChatModal(true);
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }).start();
          }
        }
      },
    }),
  ).current;

  const chatPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        chatPan.setOffset({
          x: chatPan.x._value,
          y: chatPan.y._value,
        });
        chatPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: chatPan.x, dy: chatPan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        chatPan.flattenOffset();
      },
    })
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

  const dizzyImageOpacity = Animated.add(dizzyAnim, knockedOutAnim);
  const normalImageOpacity = dizzyImageOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const isBotVisible = visible !== undefined ? visible : showMascot;
  if (!isBotVisible) return null;

  return (
    <View style={styles.botContainer} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.cloudBubble,
          dark && styles.cloudBubbleDark,
          {
            transform: [{ translateY: cloudFloatAnim }],
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
              { opacity: textOpacity },
            ]}>
            {personalPhrases[phraseIndex]}
          </Animated.Text>
        </TouchableOpacity>

        {/* Thought bubble pointers */}
        <View style={[styles.thoughtDotLarge, dark && styles.thoughtDotDark]} />
        <View style={[styles.thoughtDotSmall, dark && styles.thoughtDotDark]} />
      </Animated.View>

      {/* Sparkle Particles Trail */}
      <MascotParticleTrail pan={pan} rotateYAnim={rotateYAnim} />

      {/* Robot Button */}
      <Animated.View
        style={[
          styles.botImageContainer,
          {
            transform: [
              { translateX: pan.x },
              {
                translateY: Animated.add(
                  Animated.add(floatAnim, jumpAnim),
                  pan.y,
                ),
              },
              { scale: scaleAnim },
              { rotate: rotateInterpolate },
              { rotateY: rotateYInterpolate },
            ],
          },
        ]}
        {...panResponder.panHandlers}>
        {/* Normal Happy Robot */}
        <Animated.Image
          source={require('../Assets/Images/silver_robot.png')}
          style={[
            styles.botImage,
            {
              opacity: normalImageOpacity,
            },
          ]}
        />

        {/* Dizzy Robot */}
        <Animated.Image
          source={require('../Assets/Images/silver_robot_dizzy.png')}
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
              transform: [{ rotate: starsRotate }],
            },
          ]}>
          <Text style={styles.starText}>💫</Text>
        </Animated.View>
      </Animated.View>

      {/* Inline Chat Bot Floating Widget modal */}
      <Modal
        visible={showChatModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChatModal(false)}>
        {/* Backdrop overlay */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={() => setShowChatModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)' }} />
        </TouchableOpacity>

        {/* Floating Chat Box positioned absolutely */}
        <Animated.View
          style={[
            styles.floatingChatBox,
            {
              transform: [
                { translateX: chatPan.x },
                { translateY: chatPan.y }
              ]
            }
          ]}>
            {/* Header serves as the drag handle */}
            <Animated.View
              style={[styles.modalHeader, { backgroundColor: dark ? '#1c2626' : '#ffffff', borderBottomColor: dark ? 'rgba(255, 225, 235, 0.15)' : 'rgba(255, 225, 235, 0.9)' }]}
              {...chatPanResponder.panHandlers}
            >
              <Image
                source={require('../Assets/Images/silver_robot.png')}
                style={styles.modalMascotIcon}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.modalTitle, { color: dark ? '#e0e3e2' : '#1a2e2e' }]}>Studify AI Assistant</Text>
                <Text style={[styles.modalSubtitle, { color: dark ? '#399797' : '#007171' }]}>Drag header to move 🤖</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowChatDebug(prev => !prev)}
                style={[styles.modalCloseButton, { marginRight: 6, backgroundColor: showChatDebug ? 'rgba(171, 35, 70, 0.2)' : 'rgba(255, 225, 235, 0.6)' }]}
              >
                <Icon name="bug-outline" size={16} color="#ab2346" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowChatModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={16} color="#ab2346" />
              </TouchableOpacity>
            </Animated.View>

            {/* Native Chat View */}
            <View style={{ flex: 1, backgroundColor: dark ? '#191c1c' : '#fff8fa' }}>
              {showChatDebug ? (
                /* Live Debugger Console Drawer */
                <View style={{ flex: 1, padding: 10, backgroundColor: '#1e1e1e' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>🐛 Live Chat Console Debugger</Text>
                    <TouchableOpacity onPress={() => setChatDebugLogs([])}>
                      <Text style={{ color: '#ff5252', fontSize: 11, fontWeight: 'bold' }}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={{ flex: 1 }}>
                    {chatDebugLogs.length === 0 ? (
                      <Text style={{ color: '#888', fontSize: 11, fontStyle: 'italic' }}>No API debug logs captured yet.</Text>
                    ) : (
                      chatDebugLogs.map(log => (
                        <View key={log.id} style={{ marginBottom: 6, borderBottomWidth: 0.5, borderColor: '#444', paddingBottom: 4 }}>
                          <Text style={{ fontSize: 10, color: log.type === 'ERROR' ? '#ff5252' : log.type === 'SUCCESS' ? '#4caf50' : '#81d4fa' }}>
                            [{log.time}] [{log.type}] {log.message}
                          </Text>
                          {!!log.data && (
                            <Text style={{ fontSize: 10, color: '#b0bec5', marginTop: 2 }} numberOfLines={3}>{log.data}</Text>
                          )}
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              ) : (
                /* Native Chat Message Bubbles List */
                <FlatList
                  ref={chatFlatListRef}
                  data={chatMessages}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{ padding: 12, gap: 10 }}
                  onContentSizeChange={() => chatFlatListRef.current && chatFlatListRef.current.scrollToEnd({ animated: true })}
                  renderItem={({ item }) => {
                    const isUser = item.sender === 'user';
                    return (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: isUser ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end',
                          marginVertical: 2,
                        }}
                      >
                        {!isUser && (
                          <Image
                            source={require('../Assets/Images/silver_robot.png')}
                            style={{ width: 24, height: 24, resizeMode: 'contain', marginRight: 6, marginBottom: 2 }}
                          />
                        )}
                        <View
                          style={{
                            maxWidth: '78%',
                            paddingHorizontal: 12,
                            paddingVertical: 9,
                            borderRadius: 16,
                            borderBottomRightRadius: isUser ? 2 : 16,
                            borderBottomLeftRadius: !isUser ? 2 : 16,
                            backgroundColor: isUser
                              ? '#007171'
                              : item.isError
                                ? (dark ? 'rgba(211,47,47,0.2)' : '#FFEBEE')
                                : (dark ? '#252c2c' : '#ffffff'),
                            borderWidth: isUser ? 0 : 1,
                            borderColor: item.isError ? '#ff1744' : (dark ? '#3a4646' : '#ffe1eb'),
                          }}
                        >
                          {isUser ? (
                            <Text
                              style={{
                                fontSize: 13,
                                color: '#ffffff',
                                lineHeight: 18,
                              }}
                            >
                              {item.text}
                            </Text>
                          ) : (
                            <Text
                              style={{
                                fontSize: 13,
                                color: dark ? '#e0e3e2' : '#263238',
                                lineHeight: 18,
                              }}
                            >
                              {parseMarkdownText(item.text)}
                            </Text>
                          )}
                          <Text
                            style={{
                              fontSize: 9,
                              color: isUser ? 'rgba(255,255,255,0.7)' : (dark ? '#888' : '#999'),
                              marginTop: 4,
                              alignSelf: 'flex-end',
                            }}
                          >
                            {item.time}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                  ListFooterComponent={
                    chatLoading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                        <Image
                          source={require('../Assets/Images/silver_robot.png')}
                          style={{ width: 24, height: 24, resizeMode: 'contain', marginRight: 6 }}
                        />
                        <View style={{ backgroundColor: dark ? '#252c2c' : '#ffffff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderBottomLeftRadius: 2, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: dark ? '#3a4646' : '#ffe1eb' }}>
                          <ActivityIndicator size="small" color="#007171" />
                          <Text style={{ fontSize: 12, color: dark ? '#aaa' : '#666', fontStyle: 'italic' }}>AI is thinking...</Text>
                        </View>
                      </View>
                    ) : null
                  }
                />
              )}

              {/* Contextual Suggestion Chips (in normal flex flow) */}
              {suggestionChips && suggestionChips.length > 0 && (
                <View style={{
                  height: 44,
                  backgroundColor: dark ? '#1c2626' : '#fff8fa',
                  borderTopWidth: 1,
                  borderTopColor: dark ? 'rgba(255, 225, 235, 0.15)' : '#f5eaed',
                  justifyContent: 'center',
                }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center' }}>
                    {suggestionChips.map((chipText, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleSend(chipText)}
                        style={{
                          paddingHorizontal: 12,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: dark ? 'rgba(0, 113, 113, 0.2)' : 'rgba(0, 113, 113, 0.08)',
                          borderWidth: 1,
                          borderColor: '#007171',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginHorizontal: 4,
                        }}>
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: '#007171',
                        }}>{chipText}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Input Bar */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: dark ? '#1c2626' : '#ffffff',
                  borderTopWidth: 1,
                  borderTopColor: dark ? 'rgba(255, 225, 235, 0.15)' : 'rgba(255, 225, 235, 0.8)',
                }}
              >
                <TextInput
                  placeholder="Type your doubt or question..."
                  placeholderTextColor={dark ? '#888' : '#999'}
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: dark ? '#252c2c' : '#f0f4f4',
                    paddingHorizontal: 16,
                    color: dark ? '#e0e3e2' : '#263238',
                    fontSize: 13,
                  }}
                  onSubmitEditing={() => handleSend()}
                />
                <TouchableOpacity
                  onPress={() => handleSend()}
                  disabled={chatLoading}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#007171',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 8,
                    opacity: chatLoading ? 0.5 : 1
                  }}
                >
                  <Icon name="send" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  botContainer: {
    position: 'absolute',
    bottom: 80,
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
    backgroundColor: 'rgba(255, 225, 235, 0.75)',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#ab2346',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    width: 125,
    marginBottom: 10,
  },
  cloudBubbleDark: {
    backgroundColor: 'rgba(70, 35, 45, 0.75)',
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
    shadowOffset: { width: 0, height: 1 },
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
    shadowOffset: { width: 0, height: 1 },
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
    transform: [{ translateY: -22 }],
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
    shadowOffset: { width: 0, height: 8 },
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
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  chatMessageMascotIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: 6,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '75%',
  },
  bubbleUser: {
    backgroundColor: '#ab2346',
    borderBottomRightRadius: 2,
  },
  bubbleAi: {
    backgroundColor: '#eceff1',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextUser: {
    color: '#ffffff',
  },
  messageTextAi: {
    color: '#37474f',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'right',
  },
  messageTimeUser: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  messageTimeAi: {
    color: '#90a4ae',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 48,
    marginBottom: 10,
  },
  loaderText: {
    fontSize: 11,
    color: '#90a4ae',
    marginLeft: 6,
  },
  suggestionChipsContainer: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: '#fff8fa',
    borderTopWidth: 1,
    borderTopColor: '#f5eaed',
    justifyContent: 'center',
  },
  chipButton: {
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 225, 235, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(171, 35, 70, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ab2346',
  },
  bottomInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  chatInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#f5f5f5',
    borderRadius: 19,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#263238',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ab2346',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default AIChatbot;
