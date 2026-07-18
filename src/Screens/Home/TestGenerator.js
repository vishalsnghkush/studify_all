import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Text as RNText,
  TextInput as RNTextInput,
  Image,
} from 'react-native';
import {useTheme, ActivityIndicator, Card} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// App Custom Components
import { PremiumLoader } from '../../Components/PremiumLoader';
import {Screen} from '../../Components/Screen';
import {useDispatch} from 'react-redux';
import {triggerActivity} from '../../Redux/Slices/GamificationSlice';
import {Text, TextInput, Button} from '../../Components/Input';
import {CurriculumSelector} from '../../Components/CurriculumSelector';
import {normalizeSubject, normalizeClass, normalizeStream} from '../../Utils/CurriculumConfig';
import GlassButton from '../../Components/Input/GlassButton';
import GlassDropdown from '../../Components/Input/GlassDropdown';
import GlassTextInput from '../../Components/Input/GlassTextInput';
import {useNavigation} from '@react-navigation/native';
import Dropdown from '../../Components/Input/Dropdown';
import {Confetti} from '../../Components/Screen/Confetti';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {trackEngagement, getTopEngagedSubjects, logStudySession} from '../../Utils/EngagementTracker';

// Handwritten notes mapping for the "Read Related Note" bridge feature (Idea 3)
// Handwritten notes mapping for the "Read Related Note" bridge feature (Idea 3)
const NOTE_FILES = [
  { title: 'Class 8 Science Chapter 4 (Materials: Metals and Non-Metals)', subject: 'Science', class: 8, url: 'https://raw.githubusercontent.com/aditi-malviya666/studify-notes/main/notes%20ss/class%208%20science%20ch%204%20part%201.pdf' },
  { title: 'Class 8 Science Chapter 5 (Coal and Petroleum)', subject: 'Science', class: 8, url: 'https://raw.githubusercontent.com/aditi-malviya666/studify-notes/main/notes%20ss/class%208%20science%20ch%205%20part%201.pdf' },
  { title: 'Class 9 Science Chapter 8 (Motion)', subject: 'Science', class: 9, url: 'https://raw.githubusercontent.com/aditi-malviya666/studify-notes/main/notes%20ss/class%209%20science%20ch%208%20part%201.pdf' },
  { title: 'Class 9 Mathematics Polynomials (Part 1)', subject: 'Mathematics', class: 9, url: 'https://raw.githubusercontent.com/aditi-malviya666/studify-notes/main/notes%20ss/class%209%20maths%20polynomials%20part%201.pdf' },
  { title: 'Class 10 Mathematics Real Numbers', subject: 'Mathematics', class: 10, url: 'https://raw.githubusercontent.com/aditi-malviya666/studify-notes/main/notes%20ss/class%2010%20maths%20ch%201%20part%201.pdf' },
  { title: 'Class 11 Physics Units and Measurements', subject: 'Physics', class: 11, url: 'https://raw.githubusercontent.com/aditi-malviya666/studify-notes/main/notes%20ss/class%2011%20science%20unit%201.pdf' },
  { title: 'Class 12 Economics Money and Banking', subject: 'Economics', class: 12, url: 'https://raw.githubusercontent.com/aditi-malviya666/studify-notes/main/notes%20ss/class%2012%20economics%20unit%202%20part%201.pdf' },
];

const getMatchingNoteForQuestion = (qText, sub, examName) => {
  const query = (qText + ' ' + (sub || '')).toLowerCase();
  
  // Extract class number from examName context (e.g. "NCERT Class 6" -> 6)
  let classNum = null;
  if (examName) {
    const match = examName.match(/Class\s+(\d+)/i);
    if (match) classNum = parseInt(match[1]);
  }

  // Filter candidates if class context matches
  let candidateNotes = NOTE_FILES;
  if (classNum) {
    const classNotes = NOTE_FILES.filter(n => n.class === classNum);
    if (classNotes.length > 0) {
      candidateNotes = classNotes;
    }
  }

  // Check matching words in candidates
  for (const note of candidateNotes) {
    const titleWords = note.title.toLowerCase().split(/[ :(),]+/);
    const matchesKeyword = titleWords.some(w => w.length > 3 && query.includes(w));
    if (matchesKeyword) return note;
  }
  
  // Fallback to first matching subject in candidates
  const subMatch = candidateNotes.find(n => n.subject.toLowerCase() === (sub || '').toLowerCase());
  if (subMatch) return subMatch;

  // Global subject fallback
  const globalSubMatch = NOTE_FILES.find(n => n.subject.toLowerCase() === (sub || '').toLowerCase());
  return globalSubMatch || NOTE_FILES[0];
};

// ── API Key ── hardcoded so it is always correct, never stale
const OPENROUTER_API_KEY =
  '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';

const isAnswerCorrect = (q, uA) => {
  if (!uA) {
    return false;
  }
  const cA = q.correctAnswer;
  if (!cA) {
    return false;
  }

  const cleanUA = uA.trim();
  const cleanCA = cA.trim();

  // 1. Exact match
  if (cleanUA === cleanCA) {
    return true;
  }

  // Find index of selected option in options array
  const uIndex = q.options
    ? q.options.findIndex(opt => opt.trim() === cleanUA)
    : -1;
  const cIndex = q.options
    ? q.options.findIndex(opt => opt.trim() === cleanCA)
    : -1;

  // If both exist in options and refer to the same index
  if (uIndex !== -1 && cIndex !== -1 && uIndex === cIndex) {
    return true;
  }

  // 2. Letter-based comparison
  const letters = ['A', 'B', 'C', 'D'];
  const uLetter = uIndex !== -1 ? letters[uIndex] : null;
  let cLetter = cIndex !== -1 ? letters[cIndex] : null;

  if (!cLetter) {
    const caUpper = cleanCA.toUpperCase();
    if (letters.includes(caUpper)) {
      cLetter = caUpper;
    } else if (caUpper.startsWith('OPTION ')) {
      const char = caUpper.replace('OPTION ', '').trim();
      if (char.length === 1 && letters.includes(char)) {
        cLetter = char;
      }
    } else {
      const firstChar = caUpper.charAt(0);
      if (letters.includes(firstChar)) {
        const secondChar = caUpper.charAt(1);
        if (!secondChar || [' ', '.', ':', ')', '-'].includes(secondChar)) {
          cLetter = firstChar;
        }
      }
    }
  }

  let uParsedLetter = uLetter;
  if (!uParsedLetter) {
    const uaUpper = cleanUA.toUpperCase();
    const firstChar = uaUpper.charAt(0);
    if (letters.includes(firstChar)) {
      const secondChar = uaUpper.charAt(1);
      if (!secondChar || [' ', '.', ':', ')', '-'].includes(secondChar)) {
        uParsedLetter = firstChar;
      }
    }
  }

  if (uParsedLetter && cLetter && uParsedLetter === cLetter) {
    return true;
  }

  // Fallback containment
  if (
    cleanUA.toLowerCase().includes(cleanCA.toLowerCase()) ||
    cleanCA.toLowerCase().includes(cleanUA.toLowerCase())
  ) {
    if (cleanCA.length > 2 && cleanUA.length > 2) {
      return true;
    }
  }

  return false;
};

// Data Lists
const classList = [
  {label: 'JEE', value: 'JEE'},
  {label: 'NEET', value: 'NEET'},
  {label: 'CUET', value: 'CUET'},
  {label: 'GATE', value: 'GATE'},
  {label: 'NCERT Class 6', value: 'NCERT Class 6'},
  {label: 'NCERT Class 7', value: 'NCERT Class 7'},
  {label: 'NCERT Class 8', value: 'NCERT Class 8'},
  {label: 'NCERT Class 9', value: 'NCERT Class 9'},
  {label: 'NCERT Class 10', value: 'NCERT Class 10'},
  {label: 'NCERT Class 11', value: 'NCERT Class 11'},
  {label: 'NCERT Class 12', value: 'NCERT Class 12'},
];

const generationTypeList = [
  {label: 'Topic Wise', value: 'Topic Wise'},
  {label: 'Subject Wise', value: 'Subject Wise'},
  {label: 'Complete Paper', value: 'Complete Paper'},
];

const difficultyList = [
  {label: 'Easier', value: 'easier'},
  {label: 'Actual Exam Level', value: 'actual experience as in actual paper'},
  {label: 'Harder', value: 'harder than an actual ques paper'},
];

const jeeSubjects = [
  {label: 'Physics', value: 'Physics'},
  {label: 'Chemistry', value: 'Chemistry'},
  {label: 'Mathematics', value: 'Mathematics'},
];

const neetSubjects = [
  {label: 'Physics', value: 'Physics'},
  {label: 'Chemistry', value: 'Chemistry'},
  {label: 'Biology', value: 'Biology'},
];

const ncertSubjectsLower = [
  {label: 'Mathematics', value: 'Mathematics'},
  {label: 'Science', value: 'Science'},
  {label: 'Social Science', value: 'Social Science'},
  {label: 'English', value: 'English'},
  {label: 'Hindi', value: 'Hindi'},
];

const ncertSubjectsUpper = [
  {label: 'Physics', value: 'Physics'},
  {label: 'Chemistry', value: 'Chemistry'},
  {label: 'Mathematics', value: 'Mathematics'},
  {label: 'Biology', value: 'Biology'},
  {label: 'History', value: 'History'},
  {label: 'Geography', value: 'Geography'},
  {label: 'Political Science', value: 'Political Science'},
  {label: 'Economics', value: 'Economics'},
  {label: 'English', value: 'English'},
];

const getSubjectsList = exam => {
  if (exam === 'JEE') {
    return jeeSubjects;
  }
  if (exam === 'NEET') {
    return neetSubjects;
  }
  if (
    [
      'NCERT Class 6',
      'NCERT Class 7',
      'NCERT Class 8',
      'NCERT Class 9',
      'NCERT Class 10',
    ].includes(exam)
  ) {
    return ncertSubjectsLower;
  }
  if (['NCERT Class 11', 'NCERT Class 12'].includes(exam)) {
    return ncertSubjectsUpper;
  }
  return [];
};

export default function TestGenerator({ route }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  // Form State
  const [board, setBoard] = useState('CBSE');
  const [studentClass, setStudentClass] = useState('Class 10');
  const [stream, setStream] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  
  const [generationType, setGenerationType] = useState('Topic Wise');
  const [difficulty, setDifficulty] = useState(
    'actual experience as in actual paper',
  );
  const [numQuestions, setNumQuestions] = useState('5');

  const examName = board === 'Competitive' ? 'JEE/NEET' : `${board} ${studentClass}`;

  // App Lifecycle States: 'setup' | 'generating' | 'ready' | 'testing' | 'results'
  const [appState, setAppState] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [scoreData, setScoreData] = useState({
    marks: 0,
    correct: 0,
    incorrect: 0,
    unattempted: 0,
    maxMarks: 0,
  });

  const [displayedScore, setDisplayedScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Advanced Practical Features States (Ideas 1, 2, 4)
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});
  const [lastActiveIdx, setLastActiveIdx] = useState(0);
  const [weakestSubject, setWeakestSubject] = useState('');
  const [weakestTopic, setWeakestTopic] = useState('');

  // Subjective / Written Evaluator States
  const [testFormat, setTestFormat] = useState('Objective'); // 'Objective' | 'Subjective'
  const [userSubjectiveTexts, setUserSubjectiveTexts] = useState({});
  const [userSubjectiveImages, setUserSubjectiveImages] = useState({});
  const [gradedAnswers, setGradedAnswers] = useState({});
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    if (appState === 'testing') {
      const startTime = Date.now();
      return () => {
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        if (durationSeconds >= 2) {
          logStudySession(
            subject || 'General',
            topic || 'AI Test',
            'Mock Test',
            durationSeconds
          );
        }
      };
    }
  }, [appState, subject, topic]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (appState === 'results') {
      setDisplayedScore(0);
      const end = Number(scoreData.marks) || 0;
      const maxMarks = Number(scoreData.maxMarks) || 0;
      const duration = 1200;
      const startTime = Date.now();
      let cancelled = false; // ← prevents setState after reset
      let animationId;

      const animate = () => {
        if (cancelled) return; // ← stop immediately on reset
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress * (2 - progress);
        let currentScore = (end) * easeProgress;
        if (isNaN(currentScore)) currentScore = 0;

        if (examName === 'GATE') {
          setDisplayedScore(parseFloat(currentScore.toFixed(2)));
        } else {
          setDisplayedScore(Math.floor(currentScore));
        }

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          setDisplayedScore(end);
          if (end >= maxMarks * 0.8) {
            setShowConfetti(true);
          }
        }
      };

      animationId = requestAnimationFrame(animate);
      return () => {
        cancelled = true; // ← cancel animation on cleanup
        cancelAnimationFrame(animationId);
      };
    }
  }, [appState, scoreData.marks, scoreData.maxMarks, examName]);



  const [topSubject, setTopSubject] = useState('');

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const top = await getTopEngagedSubjects(1);
        if (top && top.length > 0) {
          setTopSubject(top[0]);
        }
      } catch (e) {
        console.log('Error loading recommendations in quiz generator', e);
      }
    };
    if (appState === 'setup') {
      fetchRecommendation();
    }
  }, [appState]);

  useEffect(() => {
    let normSub = '';
    let normClass = '';
    if (route?.params?.subject) {
      normSub = normalizeSubject(route.params.subject);
      setSubject(normSub);
      setGenerationType('Subject Wise');
    }
    if (route?.params?.studentClass || route?.params?.class) {
      normClass = normalizeClass(route?.params?.studentClass || route?.params?.class);
      setStudentClass(normClass);
    }
    if (normSub && normClass) {
      const normStream = normalizeStream(normSub, normClass);
      setStream(normStream);
    }
    if (route?.params?.board) {
      setBoard(route.params.board);
    }
    if (route?.params?.topic) {
      setTopic(route.params.topic);
    }
    if (route?.params?.subtopic) {
      setSubtopic(route.params.subtopic);
    }
  }, [route?.params]);

  const submitSubjectiveTest = async () => {
    setIsGrading(true);
    setAppState('generating');

    try {
      const gradingPromises = questions.map(async (q, idx) => {
        const studentText = userSubjectiveTexts[idx] || 'None';
        const studentImage = userSubjectiveImages[idx]?.base64;

        const systemPrompt = 
          'You are an expert academic examiner. Grade the student\'s subjective written response.\n\n' +
          'RESPONSE FORMAT: You MUST return ONLY a valid JSON object. Do not wrap in markdown or code blocks. Nothing else.\n' +
          'Format: {"marksAwarded": number, "corrections": "string details of errors/correct steps", "feedback": "overall brief comment"}\n\n' +
          'CRITICAL RULES:\n' +
          '- Evaluate correctness, diagram labels, or derivations strictly.\n' +
          '- marksAwarded must be a number between 0 and ' + (q.maxMarks || 10) + '.\n' +
          '- Output raw JSON starting with { and ending with }';

        const userPrompt = 
          'Question: ' + q.question + '\n' +
          'Max Marks: ' + (q.maxMarks || 10) + '\n' +
          'Ideal Solution: ' + (q.idealAnswer || '') + '\n' +
          'Grading Rubric: ' + (q.rubric || '') + '\n\n' +
          'Student\'s Typed Response: ' + studentText + '\n\n' +
          'Evaluate this work. If there is an uploaded image, check it for diagram labels, mathematical steps, and derivations.';

        const messages = [
          { role: 'user', content: [
            { type: 'text', text: userPrompt }
          ]}
        ];

        if (studentImage) {
          messages[0].content.push({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${studentImage}`
            }
          });
        }

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + OPENROUTER_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openrouter/free',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ],
            temperature: 0.1
          })
        });

        if (!res.ok) throw new Error('API failed');
        const json = await res.json();
        const rawText = json.choices?.[0]?.message?.content || '{}';
        
        // Robust regex to extract JSON object between the outer braces
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const cleanJsonText = jsonMatch ? jsonMatch[0] : '{}';
        return JSON.parse(cleanJsonText);
      });

      const results = await Promise.all(gradingPromises);
      
      let totalMarks = 0;
      let maxPossibleMarks = 0;
      const gradesMap = {};

      results.forEach((res, idx) => {
        const q = questions[idx];
        const max = q.maxMarks || 10;
        
        // Sanitize scoreVal to prevent NaN from breaking animation intervals
        const scoreRaw = res ? parseFloat(res.marksAwarded) : 0;
        const scoreVal = isNaN(scoreRaw) ? 0 : scoreRaw;
        
        totalMarks += scoreVal;
        maxPossibleMarks += max;

        gradesMap[idx] = {
          marksAwarded: scoreVal,
          maxMarks: max,
          corrections: (res && res.corrections) || 'No specific errors found.',
          feedback: (res && res.feedback) || 'Good attempt.'
        };
      });

      setGradedAnswers(gradesMap);

      const calculatedScoreData = {
        marks: totalMarks,
        correct: results.filter(r => {
          const m = r ? parseFloat(r.marksAwarded) : 0;
          return (isNaN(m) ? 0 : m) >= (questions[0]?.maxMarks || 10) * 0.75;
        }).length,
        incorrect: results.filter(r => {
          const m = r ? parseFloat(r.marksAwarded) : 0;
          return (isNaN(m) ? 0 : m) < (questions[0]?.maxMarks || 10) * 0.75;
        }).length,
        unattempted: 0,
        maxMarks: maxPossibleMarks,
      };

      setScoreData(calculatedScoreData);

      // Find weak subjective topics
      const wrongSubjectiveList = results.map((r, idx) => ({ ...r, idx })).filter(item => {
        const m = item ? parseFloat(item.marksAwarded) : 0;
        return (isNaN(m) ? 0 : m) < (questions[item.idx]?.maxMarks || 10) * 0.75;
      });
      if (calculatedScoreData.incorrect > 0 && wrongSubjectiveList.length > 0) {
        const weakSub = questions[wrongSubjectiveList[0].idx]?.subject || subject;
        const weakTop = questions[wrongSubjectiveList[0].idx]?.topic || questions[0]?.topic || topic || '';
        setWeakestSubject(weakSub);
        setWeakestTopic(weakTop);
        
        // Save failed topic for Context-Aware AI Tutor
        if (weakTop) {
          AsyncStorage.setItem('@studify_last_failed_topic', JSON.stringify({ 
            subject: weakSub, 
            topic: weakTop,
            studentClass: studentClass,
            board: board,
            stream: stream
          }));
        }
      } else {
        setWeakestSubject('');
        setWeakestTopic('');
      }

      // Save to local test history
      try {
        const existing = await AsyncStorage.getItem('@studify_test_history');
        let history = existing ? JSON.parse(existing) : [];
        const newRecord = {
          id: 'Session-' + (100 + history.length + 1),
          exam: examName,
          type: 'Subjective AI Test',
          subject: subject || 'General',
          score: `${totalMarks}/${maxPossibleMarks}`,
          rawScore: totalMarks,
          maxMarks: maxPossibleMarks,
          accuracy: maxPossibleMarks > 0 ? Math.round((totalMarks / maxPossibleMarks) * 100) : 0,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: 'Subjective Attempt',
          timestamp: Date.now(),
          questionTimes: questionTimes
        };
        history.unshift(newRecord);
        await AsyncStorage.setItem('@studify_test_history', JSON.stringify(history));
      } catch (_) {}

      setIsGrading(false);
      setAppState('results');
    } catch (e) {
      console.warn('Failed subjective grading', e);
      Alert.alert('Grading Error', 'AI Examiner failed to parse your written work. Please retry.');
      setIsGrading(false);
      setAppState('testing');
    }
  };

  const submitTest = useCallback(() => {
    if (testFormat === 'Subjective') {
      submitSubjectiveTest();
      return;
    }
    console.log('ST_DEBUG: submitTest called');
    console.log('ST_DEBUG: questions count:', questions.length);
    console.log('ST_DEBUG: userAnswers:', JSON.stringify(userAnswers));
    let marks = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    let correctMark = 4;
    let incorrectMark = 1;

    if (examName === 'CUET') {
      correctMark = 5;
      incorrectMark = 1;
    } else if (examName === 'GATE') {
      correctMark = 1;
      incorrectMark = 0.33;
    }

    questions.forEach((q, idx) => {
      const uA = userAnswers[idx];
      const isCorrect = isAnswerCorrect(q, uA);
      console.log(
        `ST_DEBUG: Q${idx} userAnswer: "${uA}", correctAnswer: "${q.correctAnswer}", isCorrect: ${isCorrect}`,
      );

      if (!uA) {
        unattempted++;
      } else if (isCorrect) {
        correct++;
        marks += correctMark;
      } else {
        incorrect++;
        marks -= incorrectMark;
      }
    });

    if (examName === 'GATE') {
      marks = parseFloat(marks.toFixed(2));
    }

    const calculatedScoreData = {
      marks,
      correct,
      incorrect,
      unattempted,
      maxMarks: questions.length * correctMark,
    };
    console.log(
      'ST_DEBUG: Calculated score data:',
      JSON.stringify(calculatedScoreData),
    );

    // Save test result to AsyncStorage for real-time Analysis tracking
    try {
      AsyncStorage.getItem('@studify_test_history').then(existingHistory => {
        let history = [];
        if (existingHistory) {
          try {
            history = JSON.parse(existingHistory);
          } catch (_) {}
        }
        const totalDuration = Object.values(questionTimes).reduce((a, b) => a + b, 0);
        const minutes = Math.floor(totalDuration / 60);
        const seconds = totalDuration % 60;
        const durationStr = `${minutes}m ${seconds}s`;

        const newRecord = {
          id: 'Session-' + (100 + history.length + 1),
          exam: examName,
          type: 'AI Test',
          subject: subject || 'General',
          score: `${marks}/${questions.length * correctMark}`,
          rawScore: marks,
          maxMarks: questions.length * correctMark,
          accuracy: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: durationStr,
          timestamp: Date.now(),
          questionTimes: questionTimes
        };
        history.unshift(newRecord);
        AsyncStorage.setItem('@studify_test_history', JSON.stringify(history));
      });
    } catch (e) {
      console.warn('Failed to save score to history', e);
    }

    // Find weak objective topics
    const wrongObjectiveList = questions.map((q, idx) => ({ q, idx })).filter(item => {
      const uA = userAnswers[item.idx];
      return uA !== undefined && uA !== null && uA !== '' && !isAnswerCorrect(item.q, uA);
    });

    if (calculatedScoreData.incorrect > 0 && wrongObjectiveList.length > 0) {
      const weakSub = wrongObjectiveList[0].q.subject || subject;
      const weakTop = wrongObjectiveList[0].q.topic || topic || '';
      setWeakestSubject(weakSub);
      setWeakestTopic(weakTop);
      
      // Save failed topic for Context-Aware AI Tutor
      if (weakTop) {
        AsyncStorage.setItem('@studify_last_failed_topic', JSON.stringify({ 
          subject: weakSub, 
          topic: weakTop,
          studentClass: studentClass,
          board: board,
          stream: stream
        }));
      }
    } else {
      setWeakestSubject('');
      setWeakestTopic('');
    }

    setScoreData(calculatedScoreData);
    setAppState('results');
    setTimeLeft(null);
  }, [examName, questions, userAnswers, subject]);

  // Handle countdown timer & time per question analytics
  useEffect(() => {
    if (appState === 'testing' && timeLeft !== null && timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);

        // Pacing Tracker: Track seconds spent on the last active question
        setQuestionTimes(prev => ({
          ...prev,
          [lastActiveIdx]: (prev[lastActiveIdx] || 0) + 1
        }));
      }, 1000);
      return () => clearTimeout(timerId);
    } else if (appState === 'testing' && timeLeft === 0) {
      Alert.alert('Time Up!', 'Your time is up. Submitting the test.', [
        {text: 'OK', onPress: submitTest},
      ]);
      submitTest();
    }
  }, [timeLeft, appState, submitTest, lastActiveIdx]);

  const handleFormChange = ({name, value}) => {
    if (name === 'generationType') {
      setGenerationType(value);
    } else if (name === 'subject') {
      setSubject(value);
    } else if (name === 'difficulty') {
      setDifficulty(value);
    } else if (name === 'numQuestions') {
      setNumQuestions(value);
    }
  };

  const handleGenerate = async (overrideParams = null) => {
    setAppState('generating');
    setError('');
    setQuestions([]);
    setUserAnswers({});

    let activeNumQuestions = overrideParams ? overrideParams.numQuestions : (parseInt(numQuestions) || 5);
    let activeSubject = overrideParams ? overrideParams.subject : subject;
    trackEngagement(activeSubject || 'General', 'quiz');

    let activeGenerationType = overrideParams ? overrideParams.generationType : generationType;
    let activeExamName = overrideParams ? overrideParams.examName : (board === 'Competitive' ? 'JEE/NEET' : `${board} ${studentClass}`);
    let activeTestFormat = overrideParams ? overrideParams.testFormat : testFormat;

    let finalNumQuestions = activeNumQuestions;
    let blueprintInstruction = '';

    if (overrideParams && overrideParams.blueprintList && overrideParams.blueprintList.length > 0 && activeGenerationType !== 'Complete Paper') {
      finalNumQuestions = overrideParams.blueprintList.reduce((acc, bp) => acc + bp.count, 0);
      blueprintInstruction = '\n- Custom Topic Blueprint Weightage: ' + 
        overrideParams.blueprintList.map(bp => `Generate exactly ${bp.count} questions on the specific topic/chapter "${bp.chapter}"`).join(', ') + '.';
    }

    if (finalNumQuestions > 50) {
      finalNumQuestions = 50;
    }
    if (finalNumQuestions < 1) {
      finalNumQuestions = 1;
    }

    let finalSubject = activeSubject;
    if (activeGenerationType === 'Complete Paper') {
      finalSubject = 'Complete Syllabus';
      finalNumQuestions = 30; // default for complete paper if custom logic isn't used
    }

    // ── Optimized prompts to support next level questions, paragraph passages, and explanations ──
    const systemPrompt = activeTestFormat === 'Subjective'
      ? 'You are an expert academic test creator. Create high-quality Subjective (Written/Derivation/Diagram) questions.\n\n' +
        'RESPONSE FORMAT: Your ENTIRE response must be a valid JSON array. Nothing else. No markdown, no code fences.\n\n' +
        'Each element must be: {"question": "string", "idealAnswer": "string", "maxMarks": number, "rubric": "string", "topic": "string"}\n\n' +
        'CRITICAL RULES:\n' +
        '- Exactly ' + finalNumQuestions + ' question objects in the array.\n' +
        '- maxMarks should be a reasonable integer (e.g. 5 or 10) depending on complexity.\n' +
        '- idealAnswer must provide a detailed step-by-step textbook standard correct derivation, numerical steps, or diagram description.\n' +
        '- rubric must detail exactly how to award marks (e.g. "3 marks for thylakoid diagram, 2 marks for labels").\n' +
        '- topic must specify the clean chapter or sub-topic name (e.g., "Cell Membrane", "Quadratic Equations").\n' +
        '- For exams that contain paragraph/passage-based questions (like reading comprehension in English/CUET, or passage-based problems in JEE/NEET/GATE), prepend the paragraph passage to the question string. Format it exactly as: "Passage: [Common Passage Text]\\n\\nQuestion: [Specific question based on the passage]". This ensures it renders correctly.\n' +
        '- DO NOT use LaTeX, backslashes, or math symbols. Write math in plain text (e.g. "x^2 + 3x + 2 = 0", "sqrt(3)/2").\n' +
        '- Output ONLY the raw JSON array starting with [ and ending with ].'
      : 'You are an expert academic test creator. Create high-quality MCQ questions.\n\n' +
        'RESPONSE FORMAT: Your ENTIRE response must be a valid JSON array. Nothing else. No markdown, no explanation, no code fences.\n\n' +
        'Each element must be: {"question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "string", "explanation": "string", "topic": "string"}\n\n' +
        'CRITICAL RULES:\n' +
        '- Exactly ' + finalNumQuestions + ' question objects in the array.\n' +
        '- Exactly 4 options per question. Never 3, never 5.\n' +
        '- correctAnswer must exactly match one of the 4 options.\n' +
        '- explanation must provide a detailed step-by-step reasoning explaining why the correctAnswer is correct and how to solve it.\n' +
        '- topic must specify the clean chapter or sub-topic name (e.g., "Cell Membrane", "Quadratic Equations").\n' +
        '- For exams that contain paragraph/passage-based questions (like reading comprehension in English/CUET, or passage-based problems in JEE/NEET/GATE), prepend the paragraph passage to the question string. Format it exactly as: "Passage: [Common Passage Text]\\n\\nQuestion: [Specific question based on the passage]". This ensures it renders correctly.\n' +
        '- DO NOT use LaTeX, backslashes, or math symbols. Write math in plain text (e.g. "x^2 + 3x + 2 = 0", "sqrt(3)/2").\n' +
        '- DO NOT wrap the response in code fences or markdown.\n' +
        '- Output ONLY the raw JSON array starting with [ and ending with ].';

    let topicInstruction = '';
    if (topic && typeof topic === 'string' && topic.trim()) {
      const safeSubtopic = Array.isArray(subtopic)
        ? subtopic.join(', ')
        : (typeof subtopic === 'string' ? subtopic.trim() : '');

      topicInstruction = '\n- Specific Topic/Chapter: "' + topic.trim() + '"' + 
        (safeSubtopic ? ' (Subtopic: "' + safeSubtopic + '")' : '') + 
        '. Ensure all questions are strictly focused on this topic.';
    }

    const userPrompt = activeTestFormat === 'Subjective'
      ? 'Create EXACTLY ' + finalNumQuestions + ' Subjective written/derivation/diagram questions:\n' +
        '- Exam: ' + activeExamName + '\n' +
        '- Type: ' + activeGenerationType + '\n' +
        '- Subject: ' + (finalSubject || 'General') + '\n' +
        topicInstruction + '\n' +
        '- Difficulty: ' + difficulty + '\n' +
        blueprintInstruction + '\n\n' +
        'Remember: Include complex subjective problems, derivations, drawing/sketching requests, or paragraph analyses matching the exam syllabus. Output raw JSON array only.'
      : 'Create EXACTLY ' + finalNumQuestions + ' MCQ questions:\n' +
        '- Exam: ' + activeExamName + '\n' +
        '- Type: ' + activeGenerationType + '\n' +
        '- Subject: ' + (finalSubject || 'General') + '\n' +
        topicInstruction + '\n' +
        '- Difficulty: ' + difficulty + '\n' +
        blueprintInstruction + '\n\n' +
        'Remember: Make the questions highly academic, rigorous, and matching next-level expectations for prestigious exams like JEE Advanced, NEET, GATE, and CUET. Plain text only, no LaTeX. Output raw JSON array only.';

    try {
      const models = [
        'openrouter/free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-2.0-flash-lite-001',
        'qwen/qwen-2.5-coder-32b-instruct:free',
      ];

      let data = null;
      for (const modelName of models) {
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
                model: modelName,
                messages: [
                  {role: 'system', content: systemPrompt},
                  {role: 'user', content: userPrompt},
                ],
              }),
            },
          );

          if (response.ok) {
            const json = await response.json();
            if (json?.choices?.[0]?.message?.content) {
              data = json;
              break;
            }
          }
        } catch (err) {
          console.log(`Model ${modelName} failed in TestGenerator, trying next...`, err);
        }
      }

      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('All AI test generation models were unable to respond. Please try again.');
      }

      let content =
        (data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content) ||
        '[]';
      content = content.trim();

      // Strip markdown code fences
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      }
      if (content.startsWith('```')) {
        content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      content = content.trim();

      // Extract just the JSON array
      var arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        content = arrayMatch[0];
      }

      // Replace LaTeX patterns with plain text (matches web app exactly)
      content = content.replace(/\\\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)');
      content = content.replace(/\\\\dfrac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)');
      content = content.replace(/\\\\sqrt\{([^}]*)\}/g, 'sqrt($1)');
      content = content.replace(/\\\\vec\{([^}]*)\}/g, 'vec($1)');
      content = content.replace(/\\\\text\{([^}]*)\}/g, '$1');
      content = content.replace(/\\\\left/g, '');
      content = content.replace(/\\\\right/g, '');
      content = content.replace(/\\\\times/g, 'x');
      content = content.replace(/\\\\div/g, '/');
      content = content.replace(/\\\\pm/g, '+/-');
      content = content.replace(/\\\\alpha/g, 'alpha');
      content = content.replace(/\\\\beta/g, 'beta');
      content = content.replace(/\\\\gamma/g, 'gamma');
      content = content.replace(/\\\\theta/g, 'theta');
      content = content.replace(/\\\\pi/g, 'pi');
      content = content.replace(/\\\\infty/g, 'infinity');
      content = content.replace(/\\\\geq/g, '>=');
      content = content.replace(/\\\\leq/g, '<=');
      content = content.replace(/\\\\neq/g, '!=');
      content = content.replace(/\\\\\(/g, '');
      content = content.replace(/\\\\\)/g, '');
      content = content.replace(/\\\\\[/g, '');
      content = content.replace(/\\\\\]/g, '');
      content = content.replace(/\\([^"\\\/bfnrtu\n])/g, '$1');

      var parsedQuestions = [];
      try {
        parsedQuestions = JSON.parse(content);
        parsedQuestions = parsedQuestions.map(function (q) {
          if (activeTestFormat !== 'Subjective') {
            if (!Array.isArray(q.options)) {
              q.options = ['Option A', 'Option B', 'Option C', 'Option D'];
            }
            while (q.options.length < 4) {
              q.options.push('None of the above');
            }
            if (q.options.length > 4) {
              q.options = q.options.slice(0, 4);
              if (!q.options.includes(q.correctAnswer)) {
                q.correctAnswer = q.options[0];
              }
            }
            if (!q.correctAnswer) {
              q.correctAnswer = q.options[0];
            }
          } else {
            // Ensure subjective fields are initialized
            if (!q.maxMarks) q.maxMarks = 10;
            if (!q.idealAnswer) {
              q.idealAnswer = q.ideal_answer || q.solution || q.answer || '';
            }
            if (!q.rubric) {
              q.rubric = q.marking_scheme || q.markingScheme || '';
            }
          }
          return q;
        });
      } catch (_e) {
        var objectBlocks = content.match(/\{[\s\S]*?\}/g) || [];
        
        if (activeTestFormat === 'Subjective') {
          objectBlocks.forEach(function (block) {
            var qMatch = block.match(/"question"\s*:\s*"([^"]*?)"/);
            if (qMatch) {
              var aMatch = block.match(/"(?:idealAnswer|ideal_answer|solution|answer)"\s*:\s*"([^"]*?)"/);
              var mMatch = block.match(/"maxMarks"\s*:\s*(\d+)/);
              var rMatch = block.match(/"(?:rubric|marking_scheme|markingScheme)"\s*:\s*"([^"]*?)"/);
              
              parsedQuestions.push({
                question: qMatch[1],
                idealAnswer: aMatch ? aMatch[1] : 'Solution details not available.',
                maxMarks: mMatch ? parseInt(mMatch[1]) : 10,
                rubric: rMatch ? rMatch[1] : 'Marking scheme not available.'
              });
            }
          });
        } else {
          objectBlocks.forEach(function (block) {
            var qMatch = block.match(/"question"\s*:\s*"([^"]*?)"/);
            if (qMatch) {
              var optMatch = block.match(/"options"\s*:\s*\[([^\]]*?)\]/);
              var opts = [];
              if (optMatch) {
                opts = optMatch[1].split(',').map(function (s) {
                  return s.trim().replace(/^"|"$/g, '');
                });
              }
              var cMatch = block.match(/"correctAnswer"\s*:\s*"([^"]*?)"/);
              var eMatch = block.match(/"explanation"\s*:\s*"([^"]*?)"/);
              
              parsedQuestions.push({
                question: qMatch[1],
                options: opts.length >= 4 ? opts.slice(0, 4) : opts.concat(Array(4 - opts.length).fill('None of the above')),
                correctAnswer: cMatch ? cMatch[1] : (opts[0] || ''),
                explanation: eMatch ? eMatch[1] : 'Explanation not available.'
              });
            }
          });
        }
        
        if (parsedQuestions.length === 0) {
          throw new Error('AI returned malformed content. Please try again.');
        }
      }

      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error('No questions were generated. Please try again.');
      }

      setQuestions(parsedQuestions);
      setAppState('ready');
      dispatch(triggerActivity('test_generated'));
    } catch (err) {
      console.log('Test generation error', err);
      setError(err.message || 'Failed to generate test. Please try again.');
      setAppState('setup');
    }
  };

  const hasAutoStartedRef = useRef(false);

  // Handle autoStart parameters passed from AI Study Notes Generator
  useEffect(() => {
    if (route?.params?.autoStart && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      const { board, subject: paramSub, topic, subtopic } = route.params;
      
      let matchedExamName = 'NCERT Class 12';
      if (board) {
        const boardLower = String(board).toLowerCase();
        if (boardLower.includes('jee')) matchedExamName = 'JEE';
        else if (boardLower.includes('neet')) matchedExamName = 'NEET';
        else if (boardLower.includes('cuet')) matchedExamName = 'CUET';
        else if (boardLower.includes('gate')) matchedExamName = 'GATE';
        else if (boardLower.includes('10')) matchedExamName = 'NCERT Class 10';
        else if (boardLower.includes('11')) matchedExamName = 'NCERT Class 11';
        else if (boardLower.includes('9')) matchedExamName = 'NCERT Class 9';
        else if (boardLower.includes('8')) matchedExamName = 'NCERT Class 8';
        else if (boardLower.includes('7')) matchedExamName = 'NCERT Class 7';
        else if (boardLower.includes('6')) matchedExamName = 'NCERT Class 6';
      }

      setGenerationType('Topic Wise');

      let finalSub = normalizeSubject(paramSub, topic);
      setSubject(finalSub);

      const subStr = Array.isArray(subtopic) ? subtopic.join(', ') : (typeof subtopic === 'string' ? subtopic : '');
      const chapterName = subStr ? `${topic || ''} - ${subStr}` : (topic || 'General');
      const countVal = 5;
      const bpList = [{ chapter: chapterName, count: countVal }];

      setNumQuestions('5');
      setTestFormat('Objective'); // Notes quick quiz is MCQ by default

      handleGenerate({
        examName: matchedExamName,
        subject: finalSub,
        generationType: 'Topic Wise',
        blueprintList: bpList,
        numQuestions: 5,
        testFormat: 'Objective'
      });
    }
  }, [route?.params]);

  const startTest = () => {
    setAppState('testing');
    setUserAnswers({});

    // Allocate time per question: proportional to total exam duration divided by max exam size
    let totalSeconds = 0;
    const qCount = questions.length;

    if (examName === 'JEE') {
      totalSeconds = Math.floor(qCount * ((180 * 60) / 75));
    } else if (examName === 'NEET') {
      totalSeconds = Math.floor(qCount * ((200 * 60) / 200));
    } else if (examName === 'CUET') {
      totalSeconds = Math.floor(qCount * ((60 * 60) / 50));
    } else if (examName === 'GATE') {
      totalSeconds = Math.floor(qCount * ((180 * 60) / 65));
    } else if (examName.startsWith('NCERT')) {
      totalSeconds = qCount * 90; // 1.5 mins per question for NCERT
    } else {
      totalSeconds = qCount * 120; // fallback 2 mins per question
    }

    setTimeLeft(totalSeconds);
  };

  const handleSelectOption = (qIndex, optionValue) => {
    setUserAnswers(prev => ({...prev, [qIndex]: optionValue}));
    setLastActiveIdx(qIndex);
  };

  const toggleFlag = idx => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const formatTime = seconds => {
    if (seconds === null) {
      return '';
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (h > 0) {
      parts.push(h < 10 ? '0' + h : h);
    }
    parts.push(m < 10 ? '0' + m : m);
    parts.push(s < 10 ? '0' + s : s);
    return parts.join(':');
  };

  const handleTypeSubjective = (idx, text) => {
    setUserSubjectiveTexts(prev => ({
      ...prev,
      [idx]: text
    }));
    setLastActiveIdx(idx);
  };

  const handleSelectImage = (idx, method) => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.5,
      maxWidth: 1024,
      maxHeight: 1024,
    };
    const callback = (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to select image');
        return;
      }
      const asset = response.assets?.[0];
      if (asset) {
        setUserSubjectiveImages(prev => ({
          ...prev,
          [idx]: {
            uri: asset.uri,
            base64: asset.base64
          }
        }));
        setLastActiveIdx(idx);
      }
    };
    if (method === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const resetGenerator = () => {
    // Reset appState LAST so render switches only after all state is clean
    setQuestions([]);
    setUserAnswers({});
    setTimeLeft(null);
    setFlaggedQuestions({});
    setQuestionTimes({});
    setLastActiveIdx(0);
    setBlueprintList([]);
    setBlueprintChapter('');
    setBlueprintCount('');
    setUserSubjectiveTexts({});
    setUserSubjectiveImages({});
    setGradedAnswers({});
    setIsGrading(false);
    setScoreData({marks: 0, correct: 0, incorrect: 0, unattempted: 0, maxMarks: 0});
    setDisplayedScore(0);
    setShowConfetti(false);
    setWeakestSubject('');
    setWeakestTopic('');
    setError('');
    // Switch state last — ensures all data is clean before setup screen renders
    setAppState('setup');
  };

  // State setup render
  if (appState === 'setup') {
    return (
      <Screen style={{paddingBottom: 40}}>
        <View style={styles.headerBanner}>
          <Icon name="robot-excited-outline" size={48} color={theme.colors.primary} style={{alignSelf: 'center', marginBottom: 8}} />

          <Text style={[styles.subtitle, {color: theme.colors.onSurfaceVariant, textAlign: 'center'}]}>
            Configure your test options to generate a custom, AI-powered test
            based on your exam syllabus.
          </Text>
        </View>

        {(() => {
          const displaySub = subject || (topSubject && topSubject.toLowerCase() !== 'general' ? topSubject : '');
          const formattedSub = displaySub ? (displaySub.charAt(0).toUpperCase() + displaySub.slice(1)) : '';
          const classInfo = studentClass ? ` (${studentClass})` : '';

          return (
            <View style={{gap: 12, marginBottom: 16}}>
              <Card
                onPress={() => {
                  if (formattedSub) {
                    setSubject(formattedSub);
                    setGenerationType('Subject Wise');
                  }
                }}
                style={{
                  marginHorizontal: 16,
                  backgroundColor: theme.dark ? 'rgba(0, 113, 113, 0.15)' : '#e0f2f1',
                  borderWidth: 1.5,
                  borderColor: theme.dark ? '#007171' : '#007171',
                  borderRadius: 12,
                  elevation: 1,
                }}>
                <Card.Content style={{flexDirection: 'row', alignItems: 'center', padding: 12}}>
                  <Icon name="brain" size={26} color={theme.dark ? '#a3e635' : '#007171'} style={{marginRight: 12}} />
                  <View style={{flex: 1}}>
                    <Text style={{fontWeight: 'bold', fontSize: 13, color: theme.dark ? 'white' : '#004d40'}}>
                      💡 Suggested Quiz: {formattedSub ? `${formattedSub}${classInfo}` : 'NCERT Syllabus Test'}
                    </Text>
                    <Text style={{fontSize: 11, color: theme.dark ? '#cccccc' : '#007171', marginTop: 2}}>
                      {formattedSub 
                        ? `Practice custom AI test questions tailored for ${formattedSub}${classInfo}!`
                        : 'Select your class and subject below to generate a tailored NCERT test!'}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={theme.dark ? 'white' : '#004d40'} />
                </Card.Content>
              </Card>

              <Card
                onPress={() => {
                  navigation.navigate('Notes');
                }}
                style={{
                  marginHorizontal: 16,
                  backgroundColor: theme.dark ? 'rgba(103, 58, 183, 0.15)' : '#f3e5f5',
                  borderWidth: 1.2,
                  borderColor: theme.dark ? '#673ab7' : '#d1c4e9',
                  borderRadius: 12,
                  elevation: 1,
                }}>
                <Card.Content style={{flexDirection: 'row', alignItems: 'center', padding: 12}}>
                  <Icon name="book-open-page-variant" size={24} color={theme.dark ? '#d946ef' : '#673ab7'} style={{marginRight: 12}} />
                  <View style={{flex: 1}}>
                    <Text style={{fontWeight: 'bold', fontSize: 13, color: theme.dark ? 'white' : '#4a148c'}}>
                      📚 Review notes before the test!
                    </Text>
                    <Text style={{fontSize: 11, color: theme.dark ? '#cccccc' : '#7b1fa2', marginTop: 2}}>
                      {formattedSub 
                        ? `Read handwritten summary PDFs and NCERT Solutions for ${formattedSub} first.`
                        : 'Read handwritten summary PDFs and NCERT Solutions for your syllabus first.'}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={theme.dark ? 'white' : '#673ab7'} />
                </Card.Content>
              </Card>
            </View>
          );
        })()}
        <View style={styles.formContainer}>
          <CurriculumSelector
            board={board} setBoard={setBoard}
            studentClass={studentClass} setStudentClass={setStudentClass}
            stream={stream} setStream={setStream}
            subject={subject} setSubject={setSubject}
            topic={topic} setTopic={setTopic}
            subtopic={subtopic} setSubtopic={setSubtopic}
          />

          <View style={{
            backgroundColor: theme.dark ? '#064e3b' : '#eefbf6',
            borderRadius: 20,
            padding: 16,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}>
            <RNText style={{
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 16,
              color: theme.dark ? '#ecfdf5' : '#064e3b'
            }}>Test Configuration</RNText>

            <GlassDropdown
              label="Test Format"
              value={testFormat}
              options={[
                {label: 'Objective (MCQs)', value: 'Objective'},
                {label: 'Subjective (Written / Diagrams) — Paid', value: 'Subjective', disabled: true}
              ]}
              onSelect={setTestFormat}
            />

            <View style={{marginTop: 5}} />
            <GlassDropdown
              label="Generation Type"
              value={generationType}
              options={generationTypeList}
              onSelect={(val) => handleFormChange({name: 'generationType', value: val})}
            />

            <View style={{marginTop: 5}} />
            <GlassDropdown
              label="Difficulty Level"
              value={difficulty}
              options={difficultyList}
              onSelect={(val) => handleFormChange({name: 'difficulty', value: val})}
            />

            {generationType !== 'Complete Paper' && (
              <View style={{marginTop: 5}}>
                <GlassTextInput
                  label="Number of Questions"
                  value={numQuestions}
                  onChangeText={(val) => handleFormChange({name: 'numQuestions', value: val})}
                  keyboardType="numeric"
                  placeholder="5"
                />
              </View>
            )}
          </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Generation Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <GlassButton
          label="Generate Live Test"
          icon="flash"
          color="#3b82f6"
          onPress={() => handleGenerate()}
          disabled={!board || !studentClass}
        />
        </View>
      </Screen>
    );
  }

  // Loading State
  if (appState === 'generating') {
    return (
      <PremiumLoader 
         title="Creating your bespoke test..." 
         accentColor={theme.colors.primary} 
         tips={[
           "Connecting to OpenRouter AI...",
           "Building exam-specific questions...",
           "Generating difficulty curve...",
           "Finalizing multiple-choice options..."
         ]}
      />
    );
  }

  // Ready State
  if (appState === 'ready') {
    return (
      <Screen style={styles.centered}>
        <View style={styles.successCircle}>
          <Icon name="check-bold" size={50} color="white" />
        </View>
        <Text
          style={[styles.readyTitle, {color: theme.colors.primary}]}
          size="large">
          Test Ready!
        </Text>
        <Text style={[styles.readySub, {color: theme.colors.onSurfaceVariant}]}>
          Generated exactly {questions.length} questions for {examName}.
        </Text>

        <View style={styles.readyButtonRow}>
          <TouchableOpacity
            onPress={resetGenerator}
            style={styles.secondaryButton}>
            <Text
              style={{color: theme.colors.primary, fontWeight: 'bold'}}
              size="medium">
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={startTest} style={styles.primaryButton}>
            <Text style={{color: 'white', fontWeight: 'bold'}} size="medium">
              Start Test
            </Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  // Testing State
  if (appState === 'testing') {
    return (
      <Screen list NoHeader style={{flex: 1, paddingBottom: 40}}>
        {/* Sticky Timer Header */}
        <View
          style={[
            styles.stickyTimerHeader,
            theme.dark && {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary,
            },
          ]}>
          <Icon name="clock-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.timerText, {color: theme.colors.primary}]}>
            {formatTime(timeLeft)}
          </Text>
        </View>

        <ScrollView style={{flex: 1, marginTop: 45}} nestedScrollEnabled={true}>
          {questions.map((q, idx) => {
            const uAnswer = userAnswers[idx];

            return (
              <Card
                key={idx}
                style={[
                  styles.questionCard,
                  theme.dark && {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outlineVariant,
                    borderWidth: 1,
                  },
                ]}>
                <Card.Content>
                  <View style={styles.questionMetaHeader}>
                    <View style={styles.badgeContainer}>
                      <Text
                        style={[
                          styles.questionBadge,
                          {backgroundColor: theme.colors.primary},
                        ]}>
                        Q{idx + 1}
                      </Text>
                      <Text
                        style={[
                          styles.typeBadge,
                          theme.dark && {
                            backgroundColor: theme.colors.elevation.level3,
                            color: theme.colors.onSurfaceVariant,
                          },
                        ]}>
                        MCQ
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleFlag(idx)} style={{padding: 4}}>
                      <Icon
                        name={flaggedQuestions[idx] ? 'bookmark' : 'bookmark-outline'}
                        size={24}
                        color={flaggedQuestions[idx] ? '#ff9800' : '#888'}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.questionText,
                      {color: theme.colors.onSurface},
                    ]}
                    size="medium">
                    {q.question}
                  </Text>

                  {testFormat === 'Subjective' ? (
                    <View style={{marginTop: 15, gap: 12}}>
                      <Text style={{fontWeight: 'bold', fontSize: 13, color: theme.colors.onSurfaceVariant}}>
                        Your Written Work (Max Marks: {q.maxMarks || 10})
                      </Text>

                      {/* Multiline TextInput for subjective typing */}
                      <RNTextInput
                        multiline
                        numberOfLines={4}
                        placeholder="Type your explanation, numerical steps, or derivation summary..."
                        value={userSubjectiveTexts[idx] || ''}
                        onChangeText={(text) => handleTypeSubjective(idx, text)}
                        placeholderTextColor="#999"
                        style={{
                          minHeight: 100,
                          borderColor: '#ccc',
                          borderWidth: 1,
                          borderRadius: 10,
                          padding: 12,
                          textAlignVertical: 'top',
                          color: theme.colors.onSurface,
                          backgroundColor: theme.dark ? theme.colors.elevation.level1 : '#fafafa'
                        }}
                      />

                      {/* Photo uploads row */}
                      <View style={{flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 5}}>
                        <TouchableOpacity
                          onPress={() => handleSelectImage(idx, 'camera')}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#eef6f5',
                            paddingVertical: 10,
                            borderRadius: 8,
                            borderColor: '#007171',
                            borderWidth: 1,
                            gap: 6
                          }}>
                          <Icon name="camera-outline" size={18} color="#007171" />
                          <Text style={{color: '#007171', fontWeight: 'bold', fontSize: 11}}>Camera Work</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleSelectImage(idx, 'gallery')}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#eef6f5',
                            paddingVertical: 10,
                            borderRadius: 8,
                            borderColor: '#007171',
                            borderWidth: 1,
                            gap: 6
                          }}>
                          <Icon name="image-outline" size={18} color="#007171" />
                          <Text style={{color: '#007171', fontWeight: 'bold', fontSize: 11}}>Upload Work</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Uploaded photo thumbnail preview */}
                      {userSubjectiveImages[idx]?.uri && (
                        <View style={{marginTop: 10, position: 'relative', width: 100, height: 100}}>
                          <Image
                            source={{uri: userSubjectiveImages[idx].uri}}
                            style={{width: 100, height: 100, borderRadius: 8, resizeMode: 'cover'}}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              setUserSubjectiveImages(prev => {
                                const updated = {...prev};
                                delete updated[idx];
                                return updated;
                              });
                            }}
                            style={{
                              position: 'absolute',
                              top: -5,
                              right: -5,
                              backgroundColor: '#c62828',
                              borderRadius: 10,
                              width: 20,
                              height: 20,
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Icon name="close" size={14} color="white" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                  ) : (
                    <View style={styles.optionsList}>
                      {q.options?.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isSelected = uAnswer === opt;

                        return (
                          <TouchableOpacity
                            key={optIdx}
                            onPress={() => handleSelectOption(idx, opt)}
                            style={[
                              styles.optionButton,
                              theme.dark && {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.outlineVariant,
                              },
                              isSelected && {
                                borderColor: theme.colors.primary,
                                backgroundColor: theme.dark
                                  ? 'rgba(0, 113, 113, 0.15)'
                                  : '#e0f2f1',
                              },
                            ]}>
                            <View style={styles.optionContent}>
                              <View
                                style={[
                                  styles.letterCircle,
                                  theme.dark && {
                                    backgroundColor:
                                      theme.colors.elevation.level3,
                                  },
                                  isSelected && {
                                    backgroundColor: theme.colors.primary,
                                  },
                                ]}>
                                <Text
                                  style={{
                                    color: isSelected
                                      ? 'white'
                                      : theme.colors.onSurfaceVariant,
                                    fontWeight: 'bold',
                                  }}>
                                  {letter}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.optionText,
                                  {color: theme.colors.onSurface},
                                ]}>
                                {opt}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </ScrollView>

        <Button
          name="Submit Test & View Results"
          onPress={submitTest}
          style={styles.actionButton}
        />
      </Screen>
    );
  }

  // Results State
  if (appState === 'results') {
    try {
      console.log(
        'ST_DEBUG: rendering results screen, scoreData:',
        JSON.stringify(scoreData),
        'displayedScore:',
        displayedScore,
        'showConfetti:',
        showConfetti,
      );
      return (
        <Screen list NoHeader style={{flex: 1, paddingBottom: 40}}>
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{paddingBottom: 40}}
            keyboardShouldPersistTaps="handled">
            <Text
              style={[styles.title, {color: theme.colors.onBackground}]}
              size="large">
              Test Completed
            </Text>

            <Card
              style={[
                styles.scoreCard,
                theme.dark && {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  borderWidth: 1,
                },
              ]}>
              <Card.Content style={styles.scoreContent}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                  }}>
                  <RNText
                    style={[
                      styles.scoreMarksText,
                      {color: theme.colors.primary},
                    ]}>
                    {displayedScore}
                  </RNText>
                  <RNText
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 24,
                      fontWeight: 'bold',
                      marginLeft: 6,
                      marginBottom: 8,
                    }}>
                    / {scoreData.maxMarks}
                  </RNText>
                </View>
                <Text
                  style={[
                    styles.scoreSubTitle,
                    {color: theme.colors.onSurfaceVariant},
                  ]}>
                  Total Marks Scored
                </Text>

                <View style={styles.scoreGrid}>
                  <View
                    style={[
                      styles.gridCell,
                      {
                        backgroundColor: theme.dark
                          ? 'rgba(46, 125, 50, 0.15)'
                          : '#e8f5e9',
                        borderColor: '#2e7d32',
                        borderWidth: theme.dark ? 1 : 0,
                      },
                    ]}>
                    <Text style={{color: '#2e7d32', fontWeight: 'bold'}}>
                      Correct
                    </Text>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#2e7d32',
                      }}>
                      {scoreData.correct}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gridCell,
                      {
                        backgroundColor: theme.dark
                          ? 'rgba(198, 40, 40, 0.15)'
                          : '#ffebee',
                        borderColor: '#c62828',
                        borderWidth: theme.dark ? 1 : 0,
                      },
                    ]}>
                    <Text style={{color: '#c62828', fontWeight: 'bold'}}>
                      Incorrect
                    </Text>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#c62828',
                      }}>
                      {scoreData.incorrect}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gridCell,
                      {
                        backgroundColor: theme.dark
                          ? 'rgba(55, 71, 79, 0.15)'
                          : '#eceff1',
                        borderColor: '#37474f',
                        borderWidth: theme.dark ? 1 : 0,
                      },
                    ]}>
                    <Text
                      style={{
                        color: theme.dark ? '#cfd8dc' : '#37474f',
                        fontWeight: 'bold',
                      }}>
                      Skipped
                    </Text>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: theme.dark ? '#cfd8dc' : '#37474f',
                      }}>
                      {scoreData.unattempted}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={resetGenerator}
                  style={styles.scoreResetButton}>
                  <Text style={{color: 'white', fontWeight: 'bold'}}>
                    Generate New Test
                  </Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>

            {weakestSubject || weakestTopic ? (
              <Card
                style={{
                  marginHorizontal: 16,
                  marginTop: 16,
                  backgroundColor: theme.dark ? 'rgba(198, 40, 40, 0.12)' : '#fff3e0',
                  borderWidth: 1.2,
                  borderColor: theme.dark ? '#c62828' : '#ff9800',
                  borderRadius: 12,
                  elevation: 1,
                }}>
                <Card.Content>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                    <Icon name="bullseye-arrow" size={24} color={theme.dark ? '#ef5350' : '#e65100'} style={{marginRight: 10}} />
                    <View style={{flex: 1}}>
                      <Text style={{fontWeight: 'bold', fontSize: 13, color: theme.dark ? 'white' : '#e65100'}}>
                        ⚠️ Focus Booster: Weak Topic Detected
                      </Text>
                      <Text style={{fontSize: 11, color: theme.dark ? '#cccccc' : '#5d4037', marginTop: 2, lineHeight: 16}}>
                        You got questions wrong in {weakestTopic || weakestSubject}. Study these recommended modules next!
                      </Text>
                    </View>
                  </View>

                  <View style={{gap: 8, marginTop: 4}}>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('AiNotesGenerator', {
                          subject: weakestSubject,
                          topic: weakestTopic,
                          studentClass: studentClass,
                          board: board,
                          stream: stream,
                        });
                      }}
                      style={{
                        backgroundColor: theme.colors.primary,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6,
                      }}>
                      <Icon name="book-open-page-variant" size={14} color="white" />
                      <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11}}>
                        Generate AI Notes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('AiLecturePlayer', {
                          subject: weakestSubject,
                          topic: weakestTopic,
                          studentClass: studentClass,
                          board: board,
                          stream: stream,
                        });
                      }}
                      style={{
                        backgroundColor: '#007171',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6,
                      }}>
                      <Icon name="play-circle-outline" size={14} color="white" />
                      <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11}}>
                        Listen to AI Lecture
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('FreeNotes', {
                          subject: weakestSubject,
                        });
                      }}
                      style={{
                        borderColor: theme.colors.primary,
                        borderWidth: 1.2,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6,
                      }}>
                      <Icon name="file-document-outline" size={14} color={theme.colors.primary} />
                      <Text style={{color: theme.colors.primary, fontWeight: 'bold', fontSize: 11}}>
                        Study Handwritten Notes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            ) : null}

            <Text
              style={[styles.reviewHeader, {color: theme.colors.onBackground}]}
              size="medium">
              Detailed Answer Review
            </Text>

            {questions.map((q, idx) => {
              const uA = userAnswers[idx];
              const isCorrect = isAnswerCorrect(q, uA);

              return (
                <Card
                  key={idx}
                  style={[
                    styles.questionCard,
                    {
                      borderColor: isCorrect ? '#81c784' : '#e57373',
                      borderWidth: 2,
                      backgroundColor: theme.dark
                        ? theme.colors.surface
                        : 'white',
                    },
                  ]}>
                  <Card.Content>
                    <View style={styles.questionMetaHeader}>
                      <View style={styles.badgeContainer}>
                        <Text
                          style={[
                            styles.questionBadge,
                            {backgroundColor: theme.colors.primary},
                          ]}>
                          Q{idx + 1}
                        </Text>
                        <Text
                          style={[
                            styles.typeBadge,
                            theme.dark && {
                              backgroundColor: theme.colors.elevation.level3,
                              color: theme.colors.onSurfaceVariant,
                            },
                          ]}>
                          MCQ
                        </Text>
                        <Text
                          style={[
                            styles.typeBadge,
                            {
                              backgroundColor: '#e0f2f1',
                              color: '#007171',
                              fontWeight: 'bold',
                              marginLeft: 6
                            },
                          ]}>
                          ⏱️ {questionTimes[idx] || 0}s
                        </Text>
                        {flaggedQuestions[idx] && (
                          <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3e0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6, gap: 2}}>
                            <Icon name="bookmark" size={10} color="#ff9800" />
                            <Text style={{color: '#ff9800', fontSize: 9, fontWeight: 'bold'}}>For Revision</Text>
                          </View>
                        )}
                      </View>
                      <Icon
                        name={isCorrect ? 'check-circle' : 'close-circle'}
                        size={26}
                        color={isCorrect ? '#2e7d32' : '#c62828'}
                      />
                    </View>

                    <Text
                      style={[
                        styles.questionText,
                        {color: theme.colors.onSurface},
                      ]}
                      size="medium">
                      {q.question}
                    </Text>

                    {testFormat === 'Subjective' ? (
                      <View style={{marginTop: 10, gap: 10}}>
                        
                        {/* Student response summary */}
                        <View style={{backgroundColor: theme.colors.elevation.level1, padding: 10, borderRadius: 8}}>
                          <Text style={{fontWeight: 'bold', fontSize: 12, color: theme.colors.onSurfaceVariant}}>
                            Your Submitted Response:
                          </Text>
                          <Text style={{fontSize: 13, marginTop: 4, color: theme.colors.onSurface}}>
                            {userSubjectiveTexts[idx] || "No text answer typed."}
                          </Text>
                          {userSubjectiveImages[idx]?.uri && (
                            <Image
                              source={{uri: userSubjectiveImages[idx].uri}}
                              style={{width: '100%', height: 180, borderRadius: 8, marginTop: 8, resizeMode: 'contain'}}
                            />
                          )}
                        </View>

                        {/* AI grading report */}
                        <View style={{borderColor: '#007171', borderWidth: 1, padding: 12, borderRadius: 8, backgroundColor: theme.dark ? 'rgba(0,113,113,0.1)' : '#f0fbfb', gap: 6}}>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={{fontWeight: 'bold', fontSize: 13, color: '#007171'}}>AI Examiner Evaluation:</Text>
                            <Text style={{fontWeight: 'bold', fontSize: 14, color: '#007171'}}>
                              Marks: {gradedAnswers[idx]?.marksAwarded || 0} / {gradedAnswers[idx]?.maxMarks || 10}
                            </Text>
                          </View>
                          <Text style={{fontSize: 12, fontWeight: 'bold', color: theme.colors.onSurface, marginTop: 4}}>
                            Comments:
                          </Text>
                          <Text style={{fontSize: 12, color: theme.colors.onSurfaceVariant}}>
                            {gradedAnswers[idx]?.feedback || 'No comments provided.'}
                          </Text>
                          <Text style={{fontSize: 12, fontWeight: 'bold', color: theme.colors.onSurface, marginTop: 4}}>
                            Correction details:
                          </Text>
                          <Text style={{fontSize: 12, color: theme.colors.onSurfaceVariant}}>
                            {gradedAnswers[idx]?.corrections || 'No specific errors noted.'}
                          </Text>
                        </View>

                        {/* Ideal textbook standard response */}
                        <View style={{backgroundColor: '#e8f5e9', padding: 12, borderRadius: 8, borderColor: '#2e7d32', borderWidth: 1, gap: 4}}>
                          <Text style={{fontWeight: 'bold', fontSize: 12, color: '#2e7d32'}}>Model Textbook Solution:</Text>
                          <Text style={{fontSize: 12, color: '#1b5e20'}}>{q.idealAnswer || 'No solution provided.'}</Text>
                          {q.rubric && (
                            <>
                              <Text style={{fontWeight: 'bold', fontSize: 11, color: '#2e7d32', marginTop: 4}}>Marking Scheme Rubric:</Text>
                              <Text style={{fontSize: 11, color: '#1b5e20'}}>{q.rubric}</Text>
                            </>
                          )}
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.optionsList}>
                          {q.options?.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isSelected = uA === opt;
                            const isActualCorrect = isAnswerCorrect(q, opt);

                            let borderClr = theme.dark
                              ? theme.colors.outlineVariant
                              : '#ccc';
                            let bgClr = theme.dark ? theme.colors.surface : '#fff';

                            if (isActualCorrect) {
                              borderClr = '#2e7d32';
                              bgClr = theme.dark
                                ? 'rgba(46, 125, 50, 0.15)'
                                : '#e8f5e9';
                            } else if (isSelected && !isCorrect) {
                              borderClr = '#c62828';
                              bgClr = theme.dark
                                ? 'rgba(198, 40, 40, 0.15)'
                                : '#ffebee';
                            }

                            return (
                              <View
                                key={optIdx}
                                style={[
                                  styles.optionButton,
                                  {borderColor: borderClr, backgroundColor: bgClr},
                                ]}>
                                <View style={styles.optionContent}>
                                  <View
                                    style={[
                                      styles.letterCircle,
                                      theme.dark && {
                                        backgroundColor:
                                          theme.colors.elevation.level3,
                                      },
                                      isActualCorrect
                                        ? {backgroundColor: '#2e7d32'}
                                        : isSelected
                                        ? {backgroundColor: '#c62828'}
                                        : {},
                                    ]}>
                                    <Text
                                      style={{
                                        color:
                                          isActualCorrect || isSelected
                                            ? 'white'
                                            : theme.colors.onSurfaceVariant,
                                        fontWeight: 'bold',
                                      }}>
                                      {letter}
                                    </Text>
                                  </View>
                                  <Text
                                    style={[
                                      styles.optionText,
                                      {color: theme.colors.onSurface},
                                      isActualCorrect && {
                                        color: theme.dark ? '#81c784' : '#1b5e20',
                                        fontWeight: 'bold',
                                      },
                                      isSelected &&
                                        !isCorrect && {
                                          color: theme.dark ? '#e57373' : '#b71c1c',
                                          textDecorationLine: 'line-through',
                                        },
                                    ]}>
                                    {opt}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                        {q.explanation && (
                          <View style={[
                            styles.explanationContainer,
                            {
                              backgroundColor: theme.dark
                                ? 'rgba(0, 113, 113, 0.08)'
                                : '#f0fbfb',
                              borderColor: theme.dark
                                ? 'rgba(0, 113, 113, 0.25)'
                                : '#b2dfdf',
                            }
                          ]}>
                            <View style={styles.explanationHeader}>
                              <Icon name="information-outline" size={16} color={theme.dark ? '#80cbc4' : '#007171'} />
                              <Text style={[styles.explanationTitle, {color: theme.dark ? '#80cbc4' : '#007171'}]}>
                                Explanation:
                              </Text>
                            </View>
                            <Text style={[styles.explanationText, {color: theme.colors.onSurface}]}>
                              {q.explanation}
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Review Related Notes button removed as requested */}
                  </Card.Content>
                </Card>
              );
            })}

            <Button
              name="Back to Setup"
              onPress={resetGenerator}
              style={styles.actionButton}
            />
          </ScrollView>
          <Confetti
            active={showConfetti}
            onComplete={() => setShowConfetti(false)}
          />
        </Screen>
      );
    } catch (e) {
      console.error('ST_DEBUG: Error rendering results screen:', e);
      return (
        <Screen style={{paddingBottom: 40}}>
          <Text
            style={{color: 'red', fontWeight: 'bold', marginBottom: 10}}
            size="large">
            Rendering Error: {e.message}
          </Text>
          <RNText
            style={{color: 'gray', fontSize: 12, fontFamily: 'monospace'}}>
            {e.stack}
          </RNText>
          <Button
            name="Back to Setup"
            onPress={resetGenerator}
            style={styles.actionButton}
          />
        </Screen>
      );
    }
  }
}

const styles = StyleSheet.create({
  headerBanner: {
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#007171',
    marginBottom: 6,
  },
  subtitle: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 4,
  },
  hint: {
    fontSize: 11,
    color: '#888',
    marginTop: -8,
    marginBottom: 10,
    lineHeight: 15,
  },
  actionButton: {
    backgroundColor: '#007171',
    marginTop: 15,
    borderRadius: 28,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#007171',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 3},
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontWeight: 'bold',
    color: '#007171',
    marginTop: 20,
    marginBottom: 10,
  },
  loadingSub: {
    color: '#777',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  readyTitle: {
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  readySub: {
    color: '#555',
    marginBottom: 30,
  },
  readyButtonRow: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007171',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  secondaryButton: {
    borderColor: '#007171',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  stickyTimerHeader: {
    position: 'absolute',
    top: 5,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007171',
    gap: 8,
    elevation: 5,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#007171',
  },
  questionCard: {
    elevation: 2,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
  },
  questionMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  questionBadge: {
    backgroundColor: '#007171',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  typeBadge: {
    backgroundColor: '#eceff1',
    color: '#455a64',
    fontSize: 11,
    fontWeight: 'bold',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  questionText: {
    color: '#333',
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 15,
  },
  optionsList: {
    gap: 10,
  },
  optionButton: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'white',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  letterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  scoreCard: {
    elevation: 3,
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 25,
  },
  scoreContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scoreMarksText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007171',
  },
  scoreSubTitle: {
    color: '#777',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  scoreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  gridCell: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 1,
  },
  scoreResetButton: {
    backgroundColor: '#007171',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 2,
  },
  reviewHeader: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  errorTitle: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
    lineHeight: 16,
  },
  explanationContainer: {
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explanationTitle: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
