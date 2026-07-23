import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput as RNTextInput,
  Image,
  Text as RNText,
} from 'react-native';
import {useTheme, ActivityIndicator, Card} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import { SvgXml } from 'react-native-svg';
import {trackEngagement, setRecentNote, getTopEngagedSubjects, logStudySession} from '../../../Utils/EngagementTracker';
import {normalizeSubject, normalizeClass, normalizeStream} from '../../../Utils/CurriculumConfig';

import { PremiumLoader } from '../../../Components/PremiumLoader';

// App components
import {Screen} from '../../../Components/Screen';
import {Text} from '../../../Components/Input';
import {CurriculumSelector} from '../../../Components/CurriculumSelector';
import GlassButton from '../../../Components/Input/GlassButton';

const BOARD_OPTIONS = [
  {label: 'CBSE Board', value: 'CBSE'},
  {label: 'ICSE / ISC', value: 'ICSE'},
  {label: 'State Board', value: 'State Board'},
  {label: 'Competitive (JEE/NEET/GATE/CUET)', value: 'Competitive'},
];

const CLASS_OPTIONS = [
  {label: 'Class 6', value: 'Class 6'},
  {label: 'Class 7', value: 'Class 7'},
  {label: 'Class 8', value: 'Class 8'},
  {label: 'Class 9', value: 'Class 9'},
  {label: 'Class 10', value: 'Class 10'},
  {label: 'Class 11', value: 'Class 11'},
  {label: 'Class 12', value: 'Class 12'},
];

const SUBJECT_OPTIONS = [
  {label: 'Physics', value: 'Physics'},
  {label: 'Chemistry', value: 'Chemistry'},
  {label: 'Mathematics', value: 'Mathematics'},
  {label: 'Biology', value: 'Biology'},
  {label: 'Accounts', value: 'Accounts'},
  {label: 'Economics', value: 'Economics'},
  {label: 'General Science', value: 'Science'},
  {label: 'English / Grammar', value: 'English'},
];

const OPENROUTER_API_KEY =
  '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';

// HTML content for WebView Speech Synthesis
const WEBVIEW_SPEECH_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script>
    let audioQueue = [];
    let currentAudioIndex = 0;
    let audioPlayer = null;

    window.onload = function() {
      try {
        audioPlayer = document.createElement('audio');
        audioPlayer.autoplay = true;
        document.body.appendChild(audioPlayer);

        audioPlayer.onplay = function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'start' }));
        };

        audioPlayer.onended = function() {
          if (currentAudioIndex < audioQueue.length - 1) {
            currentAudioIndex++;
            playCurrentQueueItem();
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end' }));
          }
        };

        audioPlayer.onerror = function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: 'Audio playback error' }));
          // Auto-end to avoid blocking slides
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end' }));
        };
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: err.message }));
      }
    };

    function splitTextIntoChunks(text, maxLength = 180) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const chunks = [];
      let currentChunk = "";

      for (let i = 0; i < sentences.length; i++) {
        let sentence = sentences[i].trim();
        if (!sentence) continue;
        
        if ((currentChunk + " " + sentence).length <= maxLength) {
          currentChunk = currentChunk ? (currentChunk + " " + sentence) : sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          if (sentence.length > maxLength) {
            let words = sentence.split(' ');
            let subChunk = "";
            for (let w of words) {
              if ((subChunk + " " + w).length <= maxLength) {
                subChunk = subChunk ? (subChunk + " " + w) : w;
              } else {
                if (subChunk) chunks.push(subChunk);
                subChunk = w;
              }
            }
            if (subChunk) currentChunk = subChunk;
          } else {
            currentChunk = sentence;
          }
        }
      }
      if (currentChunk) chunks.push(currentChunk);
      return chunks;
    }

    function speakText(text) {
      try {
        if (audioPlayer) {
          audioPlayer.pause();
        }
        
        const cleanText = text
          .replace(/\\\\/g, '')
          .replace(/\\^2/g, ' squared')
          .replace(/\\^3/g, ' cubed')
          .replace(/!=/g, ' is not equal to')
          .replace(/<=/g, ' is less than or equal to')
          .replace(/>=/g, ' is greater than or equal to');

        const chunks = splitTextIntoChunks(cleanText);
        audioQueue = chunks.map(chunk => {
          return "https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=" + encodeURIComponent(chunk);
        });

        currentAudioIndex = 0;
        playCurrentQueueItem();
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: e.message }));
      }
    }

    function playCurrentQueueItem() {
      if (audioQueue.length === 0 || !audioPlayer) return;
      try {
        const url = audioQueue[currentAudioIndex];
        audioPlayer.src = url;
        audioPlayer.load();
        audioPlayer.play().catch(err => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: err.message }));
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end' }));
        });
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: e.message }));
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end' }));
      }
    }

    function pauseSpeech() {
      try {
        if (audioPlayer) {
          audioPlayer.pause();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'paused' }));
        }
      } catch (e) {}
    }

    function resumeSpeech() {
      try {
        if (audioPlayer && audioPlayer.src) {
          audioPlayer.play().catch(err => {});
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'resumed' }));
        }
      } catch (e) {}
    }

    function stopSpeech() {
      try {
        if (audioPlayer) {
          audioPlayer.pause();
          audioPlayer.src = "";
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'stopped' }));
        }
      } catch (e) {}
    }

    // Trigger fake loaded voices event
    setTimeout(function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'voices_loaded' }));
    }, 200);
  </script>
</head>
<body></body>
</html>
`;

export default function AiLecturePlayer({ route }) {
  const theme = useTheme();
  const navigation = useNavigation();

  // Screen state: 'setup' | 'library' | 'playing' | 'generating'
  const [currentTab, setCurrentTab] = useState('generate'); // 'generate' | 'library'
  const [appState, setAppState] = useState('setup');

  // Input states
  const [board, setBoard] = useState('CBSE');
  const [studentClass, setStudentClass] = useState('Class 10');
  const [stream, setStream] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');

  // Generated lecture data
  const [lectureTitle, setLectureTitle] = useState('');
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeBulletIndex, setActiveBulletIndex] = useState(0);

  // Playback control states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechLoaded, setSpeechLoaded] = useState(false);

  // Saved library state
  const [savedLectures, setSavedLectures] = useState([]);
  const [topSubject, setTopSubject] = useState('');

  useEffect(() => {
    if (appState === 'playing') {
      const startTime = Date.now();
      return () => {
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        if (durationSeconds >= 2) {
          logStudySession(
            subject || 'General',
            topic || 'AI Lecture',
            'AI Lecture',
            durationSeconds
          );
        }
      };
    }
  }, [appState, subject, topic]);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const top = await getTopEngagedSubjects(1);
        if (top && top.length > 0) {
          setTopSubject(top[0]);
        }
      } catch (e) {
        console.log('Error loading recommendations in lecture generator', e);
      }
    };
    if (appState === 'setup') {
      fetchRecommendation();
    }
  }, [appState]);

  const webViewRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Load saved library on start
  useEffect(() => {
    loadSavedLectures();
  }, []);

  // Read navigation parameters (autofill)
  useEffect(() => {
    let normSub = '';
    let normClass = '';
    if (route?.params?.subject || route?.params?.topic) {
      normSub = normalizeSubject(route?.params?.subject, route?.params?.topic);
      setSubject(normSub);
    }
    if (route?.params?.studentClass || route?.params?.class || route?.params?.topic) {
      normClass = normalizeClass(route?.params?.studentClass || route?.params?.class, route?.params?.topic);
      setStudentClass(normClass);
    }
    if (normSub && normClass) {
      const normStream = normalizeStream(normSub, normClass);
      setStream(normStream);
    }
    if (route?.params?.topic) {
      setTopic(route.params.topic);
    }
  }, [route?.params]);

  // Cleanup speech synthesis when exiting screen
  useEffect(() => {
    return () => {
      stopTutorSpeech();
    };
  }, []);

  const loadSavedLectures = async () => {
    try {
      const stored = await AsyncStorage.getItem('@studify_saved_lectures');
      if (stored) {
        setSavedLectures(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed to load saved lectures', err);
    }
  };

  const handleSaveLecture = async () => {
    if (slides.length === 0) {
      return;
    }
    try {
      const newLecture = {
        id: 'lecture_' + Date.now(),
        title: lectureTitle || topic || 'AI Lecture',
        board,
        studentClass,
        subject,
        topic,
        subtopic,
        slides,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      };

      const updated = [newLecture, ...savedLectures];
      setSavedLectures(updated);
      await AsyncStorage.setItem(
        '@studify_saved_lectures',
        JSON.stringify(updated),
      );
      Alert.alert('Saved!', 'Lecture has been added to your offline library.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save lecture.');
    }
  };

  const handleDeleteLecture = async id => {
    Alert.alert('Delete Lecture', 'Remove this lecture from your saved list?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = savedLectures.filter(l => l.id !== id);
            setSavedLectures(updated);
            await AsyncStorage.setItem(
              '@studify_saved_lectures',
              JSON.stringify(updated),
            );
          } catch (_) {}
        },
      },
    ]);
  };

  const handleOpenSavedLecture = lec => {
    setBoard(lec.board || 'CBSE');
    setStudentClass(lec.studentClass || 'Class 10');
    setSubject(lec.subject);
    setTopic(lec.topic);
    setSubtopic(lec.subtopic || '');
    setLectureTitle(lec.title);
    setSlides(lec.slides);
    setCurrentSlideIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
    setAppState('playing');
  };

  // Speak current slide bullet script
  const speakCurrentBullet = (slideIdx, bulletIdx) => {
    if (slides.length === 0) {
      return;
    }
    const currentSlide = slides[slideIdx];
    if (!currentSlide) {
      return;
    }
    // Fallback to general script if bulletScripts is missing
    const currentScript =
      currentSlide.bulletScripts?.[bulletIdx] || currentSlide.script;
    if (currentScript) {
      const js = `speakText(${JSON.stringify(currentScript)});`;
      webViewRef.current?.injectJavaScript(js);
    }
  };

  const pauseTutorSpeech = () => {
    webViewRef.current?.injectJavaScript('pauseSpeech();');
  };

  const resumeTutorSpeech = () => {
    webViewRef.current?.injectJavaScript('resumeSpeech();');
  };

  const stopTutorSpeech = () => {
    webViewRef.current?.injectJavaScript('stopSpeech();');
  };

  // Playback Control Button Functions
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTutorSpeech();
    } else if (isPaused) {
      resumeTutorSpeech();
    } else {
      // If we are at the end, reset
      const currentBulletsCount =
        slides[currentSlideIndex]?.bullets?.length || 0;
      if (activeBulletIndex >= currentBulletsCount) {
        setActiveBulletIndex(0);
      }
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      stopTutorSpeech();
      setIsPlaying(false);
      setIsPaused(false);
      setActiveBulletIndex(0);
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handleAutoAdvanceSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      stopTutorSpeech();
      setActiveBulletIndex(0);
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      stopTutorSpeech();
      setIsPlaying(false);
      setIsPaused(false);
      setActiveBulletIndex(0);
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleReplaySlide = () => {
    stopTutorSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setTimeout(() => {
      setIsPlaying(true);
    }, 150);
  };

  // Auto-speak slide bullet when active bullet index changes while playing
  useEffect(() => {
    if (appState === 'playing' && slides.length > 0 && isPlaying && !isPaused) {
      const timeout = setTimeout(() => {
        speakCurrentBullet(currentSlideIndex, activeBulletIndex);
      }, 350);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlideIndex, activeBulletIndex, isPlaying, isPaused, appState]);

  // Handle messages from TTS WebView
  const handleWebViewMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('TTS Message:', data.type);
      if (data.type === 'start') {
        setIsPlaying(true);
        setIsPaused(false);
      } else if (data.type === 'end') {
        if (isPlaying) {
          const currentSlide = slides[currentSlideIndex];
          const bulletsCount = currentSlide?.bullets?.length || 0;

          if (activeBulletIndex < bulletsCount - 1) {
            // Speak next bullet on same slide
            setActiveBulletIndex(prev => prev + 1);
          } else {
            // All bullets read, transition to next slide if possible
            if (currentSlideIndex < slides.length - 1) {
              setTimeout(() => {
                handleAutoAdvanceSlide();
              }, 1200);
            } else {
              // Last slide completed
              setIsPlaying(false);
              setIsPaused(false);
            }
          }
        }
      } else if (data.type === 'paused') {
        setIsPlaying(false);
        setIsPaused(true);
      } else if (data.type === 'resumed') {
        setIsPlaying(true);
        setIsPaused(false);
      } else if (data.type === 'stopped') {
        setIsPlaying(false);
        setIsPaused(false);
      } else if (data.type === 'voices_loaded') {
        setSpeechLoaded(true);
      } else if (data.type === 'error') {
        console.warn('TTS Engine Error:', data.error);
      }
    } catch (_) {}
  };

  const triggerGeneration = async () => {
    if (!topic.trim()) {
      Alert.alert('Topic Required', 'Please type in a study topic.');
      return;
    }

    setAppState('generating');
    setSlides([]);
    setCurrentSlideIndex(0);

    // Track local engagement
    trackEngagement(subject || 'General', 'lecture');
    setRecentNote({
      name: topic.trim(),
      subject: subject,
      type: 'lecture',
      screen: 'AiLecturePlayer',
      board: board,
      class: studentClass,
      subtopic: subtopic.trim() || ''
    });


    const systemPrompt =
      'You are an expert audio-visual academic content generator.\n' +
      "Convert the user's study topic into a structured, engaging slide lecture package.\n\n" +
      'RESPONSE FORMAT: You MUST return ONLY a valid JSON object. Do not wrap in markdown or code blocks. Nothing else.\n' +
      'Format structure:\n' +
      '{\n' +
      '  "title": "Title of the Lecture",\n' +
      '  "slides": [\n' +
      '    {\n' +
      '      "slideNo": 1,\n' +
      '      "title": "Slide Title Header",\n' +
      '      "imageKeywords": "3-5 descriptive visual keywords for this slide topic, e.g. electric circuit resistor battery current flow",\n' +
      '      "bullets": [\n' +
      '        "High-quality detailed academic concept bullet 1",\n' +
      '        "High-quality detailed academic concept bullet 2",\n' +
      '        "High-quality detailed academic concept bullet 3"\n' +
      '      ],\n' +
      '      "bulletScripts": [\n' +
      '        "Conversational spoken narrative explaining bullet 1. Keep it detailed, engaging, and clear.",\n' +
      '        "Conversational spoken narrative explaining bullet 2. Keep it detailed, engaging, and clear.",\n' +
      '        "Conversational spoken narrative explaining bullet 3. Keep it detailed, engaging, and clear."\n' +
      '      ],\n' +
      '      "diagramSvg": "<svg viewBox=\\"0 0 300 150\\" xmlns=\\"http://www.w3.org/2000/svg\\">...chalkboard-style SVG with visible white/colored strokes on dark bg...</svg>"\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'CRITICAL RULES:\n' +
      '- NO INTRODUCTORY FLUFF / HISTORICAL STORIES: Do NOT include historical anecdotes, stories (like Newton and the apple tree), or conversational fluff. Dive directly into core technical and academic concepts right from Slide 1. Every bullet point must be ready-to-study, exam-oriented, and academic.\n' +
      '- HIGH LEVEL & HARD DIFFICULTY: The content must be highly challenging and suitable for revision. Each slide must contain definitions, equations, derivations, or analytical concepts, not basic descriptions.\n' +
      '- Create exactly 5 to 7 slides mapping the topic.\n' +
      '- HIGH QUALITY CONTENT: Each slide must have 3 to 5 comprehensive bullet points. Do not write short 1-line summaries; make them detailed, educational, and high-quality containing definitions, equations, or key facts.\n' +
      '- IMAGE KEYWORDS: For EVERY slide, provide 3-5 specific visual keywords in the "imageKeywords" field describing what an illustration for this slide should depict. Be specific and academic (e.g. "mitochondria cell membrane ATP energy" NOT just "biology").\n' +
      '- DIAGRAMS / VISUAL ILLUSTRATIONS: For technical subjects (Chemistry molecules, Physics circuits/forces, Math graphs, Biology anatomy), provide a clean chalkboard-style inline SVG in "diagramSvg". IMPORTANT SVG RULES: Always include xmlns="http://www.w3.org/2000/svg" in the svg tag. Use viewBox="0 0 300 150". Use ONLY white (#ffffff), lime (#a3e635), sky-blue (#60a5fa), pink (#f472b6), yellow (#f59e0b) as stroke/fill colors. Set stroke-width to at least 2. Use <text> with fill="white" and font-size="12". Do NOT use black or dark colors. If the topic is non-technical or you cannot make a meaningful diagram, set diagramSvg to empty string "".\n' +
      '- SEQUENTIAL SCRIPTS: You MUST provide a matching array in "bulletScripts" with exactly the same length as "bullets". Each entry in "bulletScripts" represents the script spoken by the teacher when that specific bullet point is revealed.\n' +
      '- The spoken scripts must be plain text. Do not use LaTeX, backslashes, or formulas. Speak math/symbols in words (e.g. "x squared plus three", "delta t", "integral from zero to infinity").';

    const userPrompt =
      'Create an interactive slide lecture package with progressive difficulty for:\n' +
      `- Board/Exam: ${board}\n` +
      `- Class Level: ${studentClass}\n` +
      `- Subject: ${subject}\n` +
      `- Lecture Topic: ${topic.trim()}\n` +
      `- Subtopic Focus: ${subtopic.trim() || 'General overview'}\n` +
      'Generate slide details, inline chalkboard SVG vector illustrations, and matching sequential oral scripts. Output ONLY raw JSON matching the requested structure.';

    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + OPENROUTER_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openrouter/free',
            messages: [
              {role: 'system', content: systemPrompt},
              {role: 'user', content: userPrompt},
            ],
            temperature: 0.2,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const resJson = await response.json();
      let rawText = resJson.choices?.[0]?.message?.content || '{}';
      rawText = rawText.trim();

      // Clean markdown code fences if LLM included them
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      }
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      rawText = rawText.trim();

      // Extract JSON object
      const match = rawText.match(/\{[\s\S]*\}/);
      const cleanJson = match ? match[0] : '{}';

      const parsed = JSON.parse(cleanJson);
      if (!parsed.slides || parsed.slides.length === 0) {
        throw new Error('No slides found in response');
      }

      setLectureTitle(parsed.title || topic);
      setSlides(parsed.slides);
      setCurrentSlideIndex(0);
      setAppState('playing');
    } catch (err) {
      console.warn(err);
      Alert.alert(
        'Generation Failed',
        'AI lecture generation failed. Please try again.',
      );
      setAppState('setup');
    }
  };

  const handleBackToSetup = () => {
    stopTutorSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setAppState('setup');
  };

  return (
    <Screen NoHeader style={{backgroundColor: theme.colors.background}}>
      {/* Hidden Speech Webview helper */}
      <View
        style={{
          height: 10,
          width: 10,
          opacity: 0.01,
          position: 'absolute',
          bottom: 10,
          right: 10,
        }}>
        <WebView
          ref={webViewRef}
          source={{html: WEBVIEW_SPEECH_HTML}}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
        />
      </View>

      {/* Dynamic Header (Hidden in setup since navigation header already says "AI Lecture Generator") */}
      {appState !== 'setup' && (
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.outlineVariant,
            },
          ]}>
          <TouchableOpacity
            onPress={() => {
              if (appState === 'playing') {
                handleBackToSetup();
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {appState === 'playing' ? 'Lecture Board' : 'Lecture Generator'}
          </Text>
          <View style={{width: 40}} />
        </View>
      )}

      {appState === 'setup' && (
        <View style={{flex: 1}}>
          {/* Back button for setup state — header is hidden so this is the only way back */}
          <TouchableOpacity
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            style={{padding: 12, flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
          </TouchableOpacity>
          {/* Tab Selection */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setCurrentTab('generate')}
              style={[
                styles.tabBtn,
                currentTab === 'generate' && [
                  styles.activeTabBtn,
                  {borderBottomColor: theme.colors.primary},
                ],
              ]}>
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      currentTab === 'generate' ? theme.colors.primary : '#888',
                  },
                ]}>
                Generate Lecture
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setCurrentTab('library');
                loadSavedLectures();
              }}
              style={[
                styles.tabBtn,
                currentTab === 'library' && [
                  styles.activeTabBtn,
                  {borderBottomColor: theme.colors.primary},
                ],
              ]}>
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      currentTab === 'library' ? theme.colors.primary : '#888',
                  },
                ]}>
                Saved Lectures ({savedLectures.length})
              </Text>
            </TouchableOpacity>
          </View>

          {currentTab === 'generate' ? (
            <ScrollView
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled">
              <Card
                style={[
                  styles.heroCard,
                  {backgroundColor: theme.colors.surface},
                ]}>
                <Card.Content style={styles.heroRow}>
                  <View
                    style={[
                      styles.heroIconCircle,
                      {backgroundColor: '#d946ef'},
                    ]}>
                    <Icon name="play-circle-outline" size={26} color="white" />
                  </View>
                  <View style={{flex: 1, marginLeft: 14}}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 15,
                        color: theme.colors.onSurface,
                      }}>
                      Interactive Audio Lectures 🎧
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: theme.colors.outline,
                        marginTop: 2,
                        lineHeight: 15,
                      }}>
                      Convert any topic into standard slides. The AI Tutor reads
                      the lecture script while slides auto-advance. Completely
                      offline and free!
                    </Text>
                  </View>
                </Card.Content>
              </Card>



              {/* Form Input Fields */}
              <CurriculumSelector
                board={board} setBoard={setBoard}
                studentClass={studentClass} setStudentClass={setStudentClass}
                stream={stream} setStream={setStream}
                subject={subject} setSubject={setSubject}
                topic={topic} setTopic={setTopic}
                subtopic={subtopic} setSubtopic={setSubtopic}
              />

              <GlassButton
                label="Generate AI Lecture"
                icon="sparkles"
                color="#d946ef"
                onPress={triggerGeneration}
                disabled={!topic || !subject || !board || !studentClass}
              />
            </ScrollView>
          ) : (
            /* Saved Library tab list */
            <ScrollView contentContainerStyle={styles.libraryContainer}>
              {savedLectures.length === 0 ? (
                <View style={styles.emptyLibrary}>
                  <Icon name="play-box-outline" size={60} color="#bbb" />
                  <Text style={{fontSize: 14, color: '#888', marginTop: 12}}>
                    Your lecture library is empty.
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#aaa',
                      marginTop: 4,
                      textAlign: 'center',
                      paddingHorizontal: 40,
                    }}>
                    Generated lectures that you save will appear here for
                    playing offline anytime.
                  </Text>
                </View>
              ) : (
                savedLectures.map(item => (
                  <Card
                    key={item.id}
                    style={[
                      styles.noteLibraryCard,
                      {backgroundColor: theme.colors.surface},
                    ]}>
                    <TouchableOpacity
                      onPress={() => handleOpenSavedLecture(item)}
                      style={styles.libraryCardPress}>
                      <View style={styles.libraryCardLeft}>
                        <View
                          style={[
                            styles.libraryIconWrap,
                            {backgroundColor: '#fdf4ff'},
                          ]}>
                          <Icon
                            name="video-play-outline"
                            size={24}
                            color="#d946ef"
                          />
                        </View>
                        <View style={{flex: 1, marginLeft: 12}}>
                          <Text
                            style={{
                              fontWeight: 'bold',
                              fontSize: 14,
                              color: theme.colors.onSurface,
                            }}
                            numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.colors.outline,
                              marginTop: 2,
                            }}>
                            {item.subject} • {item.slides.length} slides •{' '}
                            {item.date}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteLecture(item.id)}
                        style={styles.libraryDeleteBtn}>
                        <Icon
                          name="trash-can-outline"
                          size={20}
                          color="#e53935"
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </Card>
                ))
              )}
            </ScrollView>
          )}
        </View>
      )}

      {appState === 'generating' && (
        <PremiumLoader 
           title="AI is creating your slides & script..." 
           accentColor="#d946ef" 
           tips={[
             "Formatting content boards and structure...",
             "Writing engaging oral narratives...",
             "Generating mathematical diagrams...",
             "Syncing audio cues with bullet points..."
           ]}
        />
      )}

      {appState === 'playing' && slides.length > 0 && (
        <View style={styles.playerContainer}>
          {/* Lecture Info Top Card */}
          <View
            style={[
              styles.lectureHeaderCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}>
            <View>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 15,
                  color: theme.colors.onSurface,
                }}
                numberOfLines={1}>
                {lectureTitle}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.outline,
                  marginTop: 2,
                }}>
                Subject: {subject} • Slide {currentSlideIndex + 1} of{' '}
                {slides.length}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSaveLecture}
              style={styles.saveBtn}>
              <Icon
                name="bookmark-outline"
                size={22}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Slide Board (School Blackboard Style) */}
          <View
            style={[
              styles.slideBoard,
              {
                backgroundColor: theme.dark ? '#0c1410' : '#1e3328',
                borderColor: theme.dark ? '#1a2b22' : '#14221a',
              },
            ]}>
            <ScrollView
              contentContainerStyle={styles.slideContent}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.slideTitleText}>
                {slides[currentSlideIndex]?.title}
              </Text>
              <View style={styles.slideDivider} />

              {(() => {
                const currentSlide = slides[currentSlideIndex];
                if (!currentSlide) return null;

                // ── Step 1: Try SVG diagram first ──
                let rawSvgText = (currentSlide.diagramSvg || '').trim();
                let svgText = '';
                const svgMatch = rawSvgText.match(/<svg[\s\S]*?<\/svg>/i);
                if (svgMatch) {
                  svgText = svgMatch[0];
                }

                const hasSvgTag = svgText.length > 0;
                const hasDrawingElements =
                  svgText.includes('<line') ||
                  svgText.includes('<circle') ||
                  svgText.includes('<rect') ||
                  svgText.includes('<path') ||
                  svgText.includes('<polygon') ||
                  svgText.includes('<ellipse') ||
                  svgText.includes('<text');

                const svgIsValid = hasSvgTag && hasDrawingElements;

                if (svgIsValid) {
                  // Chalkboard color normalization
                  let cleanSvg = svgText
                    .replace(/stroke\s*=\s*["']black["']/gi, 'stroke="white"')
                    .replace(/stroke\s*=\s*["']#000000["']/gi, 'stroke="white"')
                    .replace(/stroke\s*=\s*["']#000["']/gi, 'stroke="white"')
                    .replace(/fill\s*=\s*["']black["']/gi, 'fill="none"')
                    .replace(/fill\s*=\s*["']#000000["']/gi, 'fill="none"')
                    .replace(/fill\s*=\s*["']#333["']/gi, 'fill="none"')
                    .replace(/stroke\s*=\s*["']#333["']/gi, 'stroke="#60a5fa"');
                    
                  // Auto-fix LLM SVG syntax errors without overriding valid viewBoxes
                  cleanSvg = cleanSvg.replace(/viewBox\s*=\s*["']\s*0\s*=\s*(\d+)\s*(\d+)\s*["']/gi, 'viewBox="0 0 $1 $2"');
                  if (!/viewBox\s*=/i.test(cleanSvg)) {
                    cleanSvg = cleanSvg.replace(/<svg/i, '<svg viewBox="0 0 300 300"');
                  }
                  
                  // Strip out any background rectangles the AI might have drawn
                  cleanSvg = cleanSvg.replace(/<rect[^>]*width=["']300["'][^>]*fill=["']#(1a1a1a|000000|222222|333333)["'][^>]*\/?>/gi, '');

                  return (
                    <View
                      style={[
                        styles.diagramContainer,
                        {
                          height: Math.round(require('react-native').Dimensions.get('window').width * 0.65),
                          backgroundColor: '#0f172a',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 6,
                        },
                      ]}>
                      <SvgXml 
                        xml={cleanSvg} 
                        width="100%" 
                        height="100%" 
                        onError={(e) => console.log('SVG Parse Error:', e)}
                        fallback={
                          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Icon name="image-broken-variant" size={40} color="rgba(255,255,255,0.2)" />
                            <RNText style={{color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8}}>
                              Diagram generation failed
                            </RNText>
                          </View>
                        }
                      />
                    </View>
                  );
                }

                return null;
              })()}

              {(() => {
                const currentSlide = slides[currentSlideIndex];
                if (!currentSlide) {
                  return null;
                }
                // If playing, progressively reveal bullets up to activeBulletIndex. If paused/stopped, show all bullets.
                const bulletsToRender = isPlaying
                  ? currentSlide.bullets?.slice(0, activeBulletIndex + 1) || []
                  : currentSlide.bullets || [];

                return bulletsToRender.map((bullet, idx) => {
                  const isCurrentSpeech =
                    isPlaying && idx === activeBulletIndex;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.slideBulletRow,
                        isCurrentSpeech && {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: 6,
                          paddingVertical: 4,
                          paddingHorizontal: 6,
                        },
                      ]}>
                      <Text style={styles.slideBulletDot}>⭐</Text>
                      <Text
                        style={[
                          styles.slideBulletText,
                          isCurrentSpeech && {
                            color: '#ffffff',
                            fontWeight: 'bold',
                          },
                        ]}>
                        {bullet}
                      </Text>
                    </View>
                  );
                });
              })()}
            </ScrollView>
          </View>

          {/* Transcript/Tutor Script Box */}
          <Card
            style={[
              styles.tutorBoxCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}>
            <View style={styles.tutorHeaderRow}>
              <Icon name="account-tie-voice" size={20} color="#d946ef" />
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 12,
                  color: '#d946ef',
                  marginLeft: 6,
                }}>
                AI Tutor Script Narration
              </Text>
            </View>
            <ScrollView
              contentContainerStyle={{paddingVertical: 4}}
              nestedScrollEnabled={true}>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  color: theme.colors.onSurfaceVariant,
                }}>
                {slides[currentSlideIndex]?.bulletScripts?.[
                  activeBulletIndex
                ] ||
                  slides[currentSlideIndex]?.script ||
                  'No narration text.'}
              </Text>
            </ScrollView>
          </Card>

          {/* Audio Lecture Control Bar */}
          <View
            style={[
              styles.controlBarCard,
              {backgroundColor: theme.colors.surface},
            ]}>
            {/* Playback Controls Row */}
            <View style={styles.controlsRow}>
              <TouchableOpacity
                onPress={handlePrevSlide}
                disabled={currentSlideIndex === 0}
                style={[
                  styles.controlBtn,
                  currentSlideIndex === 0 && styles.disabledBtn,
                ]}>
                <Icon
                  name="skip-previous"
                  size={32}
                  color={
                    currentSlideIndex === 0 ? '#bbb' : theme.colors.onSurface
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayPause}
                style={[styles.playPauseBtn, {backgroundColor: '#d946ef'}]}>
                <Icon
                  name={isPlaying ? 'pause' : 'play'}
                  size={34}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReplaySlide}
                style={styles.controlBtn}>
                <Icon name="replay" size={28} color={theme.colors.onSurface} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextSlide}
                disabled={currentSlideIndex === slides.length - 1}
                style={[
                  styles.controlBtn,
                  currentSlideIndex === slides.length - 1 && styles.disabledBtn,
                ]}>
                <Icon
                  name="skip-next"
                  size={32}
                  color={
                    currentSlideIndex === slides.length - 1
                      ? '#bbb'
                      : theme.colors.onSurface
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Slider Progress Bar */}
            <View style={styles.progressBarWrapper}>
              <View
                style={[
                  styles.progressBarBackground,
                  {backgroundColor: theme.dark ? '#333' : '#eee'},
                ]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${
                        ((currentSlideIndex + 1) / slides.length) * 100
                      }%`,
                      backgroundColor: '#d946ef',
                    },
                  ]}
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: theme.colors.outline,
                  marginTop: 4,
                  textAlign: 'center',
                }}>
                Lecture coverage:{' '}
                {Math.round(((currentSlideIndex + 1) / slides.length) * 100)}%
              </Text>
            </View>
            
            {/* Automated "Infinite Loop" CTA (Phase 1) */}
            {currentSlideIndex === slides.length - 1 && (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('TestGenerator', { 
                    subject: subject || 'General', 
                    topic: topic || 'Review',
                    studentClass: studentClass,
                    board: board,
                    stream: stream,
                  });
                }}
                style={{
                  backgroundColor: '#673ab7',
                  marginHorizontal: 10,
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 2,
                }}>
                <Icon name="brain" size={20} color="white" />
                <Text style={{color: 'white', fontWeight: 'bold', marginLeft: 8}}>Test your Knowledge (AI Quiz)</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    elevation: 2,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBtn: {
    borderBottomWidth: 3,
  },
  tabBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    elevation: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 14,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 13,
    marginBottom: 10,
  },
  generateBtn: {
    marginTop: 24,
    borderRadius: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingTitle: {
    fontWeight: 'bold',
    marginTop: 18,
  },
  libraryContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyLibrary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  noteLibraryCard: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  libraryCardPress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  libraryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  libraryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryDeleteBtn: {
    padding: 6,
  },
  playerContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  lectureHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  saveBtn: {
    padding: 6,
  },
  slideBoard: {
    flex: 1.5,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  slideContent: {
    paddingBottom: 20,
  },
  slideTitleText: {
    color: '#fff176',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'serif',
  },
  slideDivider: {
    height: 1.5,
    backgroundColor: '#fff176',
    width: '100%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  slideBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
    paddingRight: 10,
  },
  slideBulletDot: {
    fontSize: 14,
    marginRight: 10,
    marginTop: 2,
  },
  slideBulletText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'sans-serif',
  },
  tutorBoxCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    maxHeight: 120,
  },
  tutorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 6,
    marginBottom: 6,
  },
  controlBarCard: {
    padding: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  controlBtn: {
    padding: 6,
  },
  disabledBtn: {
    opacity: 0.3,
  },
  playPauseBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  progressBarWrapper: {
    width: '100%',
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  diagramContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 6,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    marginTop: 4,
    gap: 3,
  },
  fallbackBadgeText: {
    fontSize: 9,
    color: '#a3e635',
    fontWeight: 'bold',
  },
  diagramText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#a3e635',
    lineHeight: 16,
  },
});
