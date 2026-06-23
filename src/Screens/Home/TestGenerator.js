import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Text as RNText,
} from 'react-native';
import {useTheme, ActivityIndicator, Card} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// App Custom Components
import {Screen} from '../../Components/Screen';
import {useDispatch} from 'react-redux';
import {triggerActivity} from '../../Redux/Slices/GamificationSlice';
import {Text, TextInput, Button} from '../../Components/Input';
import Dropdown from '../../Components/Input/Dropdown';
import {Confetti} from '../../Components/Screen/Confetti';

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

export default function TestGenerator() {
  const theme = useTheme();
  const dispatch = useDispatch();
  // Form State
  const [examName, setExamName] = useState('JEE');
  const [generationType, setGenerationType] = useState('Topic Wise');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState(
    'actual experience as in actual paper',
  );
  const [numQuestions, setNumQuestions] = useState('5');

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

  useEffect(() => {
    if (appState === 'results') {
      setDisplayedScore(0);
      const start = 0;
      const end = Number(scoreData.marks) || 0;
      const maxMarks = Number(scoreData.maxMarks) || 0;

      const duration = 1200; // 1.2 seconds
      const startTime = Date.now();

      let animationId;
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: easeOutQuad
        const easeProgress = progress * (2 - progress);
        let currentScore = start + (end - start) * easeProgress;
        if (isNaN(currentScore)) {
          currentScore = 0;
        }

        if (examName === 'GATE') {
          setDisplayedScore(parseFloat(currentScore.toFixed(2)));
        } else {
          setDisplayedScore(Math.floor(currentScore));
        }

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          setDisplayedScore(end);
          // Trigger confetti burst if user scored >= 80%
          if (end >= maxMarks * 0.8) {
            setShowConfetti(true);
          }
        }
      };

      animationId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationId);
    }
  }, [appState, scoreData.marks, scoreData.maxMarks, examName]);

  // Update subject dropdown choices when class/exam changes
  useEffect(() => {
    const list = getSubjectsList(examName);
    if (list.length > 0) {
      if (!list.some(s => s.value === subject)) {
        setSubject(list[0].value);
      }
    } else {
      setSubject('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examName, generationType]);

  const submitTest = useCallback(() => {
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

    setScoreData(calculatedScoreData);
    setAppState('results');
    setTimeLeft(null);
  }, [examName, questions, userAnswers]);

  // Handle countdown timer
  useEffect(() => {
    if (appState === 'testing' && timeLeft !== null && timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else if (appState === 'testing' && timeLeft === 0) {
      Alert.alert('Time Up!', 'Your time is up. Submitting the test.', [
        {text: 'OK', onPress: submitTest},
      ]);
      submitTest();
    }
  }, [timeLeft, appState, submitTest]);

  const handleFormChange = ({name, value}) => {
    if (name === 'examName') {
      setExamName(value);
    } else if (name === 'generationType') {
      setGenerationType(value);
    } else if (name === 'subject') {
      setSubject(value);
    } else if (name === 'difficulty') {
      setDifficulty(value);
    } else if (name === 'numQuestions') {
      setNumQuestions(value);
    }
  };

  const handleGenerate = async () => {
    setAppState('generating');
    setError('');
    setQuestions([]);
    setUserAnswers({});

    let finalNumQuestions = parseInt(numQuestions) || 5;
    if (finalNumQuestions > 50) {
      finalNumQuestions = 50;
    }
    if (finalNumQuestions < 1) {
      finalNumQuestions = 1;
    }

    let finalSubject = subject;
    if (generationType === 'Complete Paper') {
      finalSubject = 'Complete Syllabus';
      if (examName === 'JEE') {
        finalNumQuestions = 75;
      } else if (examName === 'NEET') {
        finalNumQuestions = 200;
      } else if (examName === 'CUET') {
        finalNumQuestions = 50;
      } else if (examName === 'GATE') {
        finalNumQuestions = 65;
      } else if (examName.startsWith('NCERT')) {
        finalNumQuestions = 40;
      }
    }

    // ── Exact same prompts as the working web API route ──
    const systemPrompt =
      'You are an expert academic test creator. Create high-quality MCQ questions.\n\n' +
      'RESPONSE FORMAT: Your ENTIRE response must be a valid JSON array. Nothing else. No markdown, no explanation, no code fences.\n\n' +
      'Each element must be: {"question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "string"}\n\n' +
      'CRITICAL RULES:\n' +
      '- Exactly ' +
      finalNumQuestions +
      ' question objects in the array.\n' +
      '- Exactly 4 options per question. Never 3, never 5.\n' +
      '- correctAnswer must exactly match one of the 4 options.\n' +
      '- DO NOT use LaTeX, backslashes, or math symbols. Write math in plain text (e.g. "x^2 + 3x + 2 = 0", "sqrt(3)/2").\n' +
      '- DO NOT wrap the response in code fences or markdown.\n' +
      '- Output ONLY the raw JSON array starting with [ and ending with ].';

    const userPrompt =
      'Create EXACTLY ' +
      finalNumQuestions +
      ' MCQ questions:\n' +
      '- Exam: ' +
      examName +
      '\n' +
      '- Type: ' +
      generationType +
      '\n' +
      '- Subject: ' +
      (finalSubject || 'General') +
      '\n' +
      '- Difficulty: ' +
      difficulty +
      '\n\n' +
      'Remember: plain text only, no LaTeX. Output raw JSON array only.';

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
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('OpenRouter API error: ' + errorText);
      }

      const data = await response.json();
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
          return q;
        });
      } catch (_e) {
        // Regex fallback — same as web app
        var questionRegex =
          /\{"question"\s*:\s*"([^"]*?)"\s*,\s*"options"\s*:\s*\[([^\]]*?)\]\s*,\s*"correctAnswer"\s*:\s*"([^"]*?)"\}/g;
        var m;
        while ((m = questionRegex.exec(content)) !== null) {
          var opts = m[2].split(',').map(function (s) {
            return s.trim().replace(/^"|"$/g, '');
          });
          parsedQuestions.push({
            question: m[1],
            options:
              opts.length >= 4
                ? opts.slice(0, 4)
                : opts.concat(Array(4 - opts.length).fill('None of the above')),
            correctAnswer: m[3],
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

  const resetGenerator = () => {
    setAppState('setup');
    setQuestions([]);
    setUserAnswers({});
    setTimeLeft(null);
  };

  // State setup render
  if (appState === 'setup') {
    return (
      <Screen style={{paddingBottom: 40}}>
        <Text
          style={[styles.title, {color: theme.colors.primary}]}
          size="large">
          AI Test Generator
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.onSurfaceVariant}]}>
          Configure your test options to generate a custom, AI-powered test
          based on your exam syllabus.
        </Text>

        <Card
          style={[
            styles.formCard,
            theme.dark && {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
            },
          ]}>
          <Card.Content>
            <View style={{marginTop: 15}}>
              <Dropdown
                label="Target Exam"
                name="examName"
                value={examName}
                updateFormValue={handleFormChange}
                list={classList}
              />
            </View>

            <View style={{marginTop: 15}}>
              <Dropdown
                label="Generation Type"
                name="generationType"
                value={generationType}
                updateFormValue={handleFormChange}
                list={generationTypeList}
              />
            </View>

            {generationType !== 'Complete Paper' && (
              <View style={{marginTop: 15}}>
                {generationType === 'Subject Wise' &&
                getSubjectsList(examName).length > 0 ? (
                  <Dropdown
                    label="Select Subject"
                    name="subject"
                    value={subject}
                    updateFormValue={({value}) => setSubject(value)}
                    list={getSubjectsList(examName)}
                  />
                ) : (
                  <TextInput
                    label={
                      generationType === 'Subject Wise'
                        ? 'Subject Focus'
                        : 'Topic Focus'
                    }
                    name="subject"
                    defaultValue={subject}
                    updateFormValue={handleFormChange}
                    placeholder="e.g. Kinematics, Algebra, Nutrition"
                  />
                )}
              </View>
            )}

            <View style={{marginTop: 15}}>
              <Dropdown
                label="Difficulty Level"
                name="difficulty"
                value={difficulty}
                updateFormValue={handleFormChange}
                list={difficultyList}
              />
            </View>

            {generationType !== 'Complete Paper' && (
              <View style={{marginTop: 15}}>
                <TextInput
                  label="Number of Questions"
                  name="numQuestions"
                  defaultValue={numQuestions}
                  updateFormValue={handleFormChange}
                  keyboard="numeric"
                  placeholder="5"
                />
              </View>
            )}
          </Card.Content>
        </Card>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Generation Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          name="Generate Live Test"
          onPress={handleGenerate}
          style={styles.actionButton}
        />
      </Screen>
    );
  }

  // Loading State
  if (appState === 'generating') {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size={60} color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, {color: theme.colors.primary}]}
          size="medium">
          Creating your bespoke test...
        </Text>
        <Text
          style={[styles.loadingSub, {color: theme.colors.onSurfaceVariant}]}>
          Connecting to OpenRouter to build exam-specific questions. This can
          take up to 20 seconds.
        </Text>
      </Screen>
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
      <Screen list style={{flex: 1, paddingBottom: 40}}>
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
                  </View>

                  <Text
                    style={[
                      styles.questionText,
                      {color: theme.colors.onSurface},
                    ]}
                    size="medium">
                    {q.question}
                  </Text>

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
        <Screen list style={{flex: 1, paddingBottom: 40}}>
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
  title: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
    color: '#007171',
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    elevation: 3,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
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
    marginTop: 10,
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
});
