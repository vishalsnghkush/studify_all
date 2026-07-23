import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Text,
  Vibration,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme, Card} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Confetti} from '../../../Components/Screen/Confetti';
import {
  completeDailyGame,
  getLocalDateString,
} from '../../../Redux/Slices/GamificationSlice';

const {width, height} = Dimensions.get('window');

// Math Quest Helper Functions
const generateQuestion = () => {
  const types = [
    'addition',
    'subtraction',
    'modulo',
    'sum_squares',
    'hcf',
    'lcm',
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  let questionStr = '';
  let answer = 0;

  switch (type) {
    case 'addition': {
      const a = Math.floor(Math.random() * 80) + 15; // 15 to 94
      const b = Math.floor(Math.random() * 80) + 15;
      questionStr = `${a} + ${b}`;
      answer = a + b;
      break;
    }
    case 'subtraction': {
      const a = Math.floor(Math.random() * 80) + 15;
      const b = Math.floor(Math.random() * 80) + 15;
      questionStr = `${a} - ${b}`;
      answer = a - b;
      break;
    }
    case 'modulo': {
      const b = Math.floor(Math.random() * 8) + 2; // 2 to 9
      const a = Math.floor(Math.random() * 60) + 10; // 10 to 69
      questionStr = `${a} % ${b}`;
      answer = a % b;
      break;
    }
    case 'sum_squares': {
      const a = Math.floor(Math.random() * 18) + 3; // 3 to 20
      const b = Math.floor(Math.random() * 18) + 3; // 3 to 20
      questionStr = `x² + y² = ${a * a + b * b}`;
      answer = a * a + b * b;
      break;
    }
    case 'hcf': {
      const g = Math.floor(Math.random() * 11) + 3;
      const coprimes = [
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 3],
        [2, 5],
        [3, 4],
        [3, 5],
        [4, 5],
      ];
      const pair = coprimes[Math.floor(Math.random() * coprimes.length)];
      const a = g * pair[0];
      const b = g * pair[1];
      questionStr = `HCF of ${a} & ${b}`;
      answer = g;
      break;
    }
    case 'lcm': {
      const lcmPairs = [
        [4, 6, 12],
        [6, 8, 24],
        [8, 12, 24],
        [6, 9, 18],
        [4, 10, 20],
        [9, 12, 36],
        [10, 15, 30],
        [12, 15, 60],
        [8, 10, 40],
        [6, 10, 30],
      ];
      const selected = lcmPairs[Math.floor(Math.random() * lcmPairs.length)];
      questionStr = `LCM of ${selected[0]} & ${selected[1]}`;
      answer = selected[2];
      break;
    }
  }

  return {questionStr, answer, type};
};

export default function BrainGym() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const {colors} = theme;

  const {lastBrainGymDates} = useSelector(
    state => state.gamification || {lastBrainGymDates: {}},
  );

  const isPlayedToday = useCallback(
    gameId => {
      return (
        lastBrainGymDates && lastBrainGymDates[gameId] === getLocalDateString()
      );
    },
    [lastBrainGymDates],
  );

  // Screen modes: 'hub' | 'math_intro' | 'math_play' | 'math_summary'
  //             | 'zip_intro' | 'zip_play' | 'zip_summary'
  //             | 'patches_intro' | 'patches_play' | 'patches_summary'
  //             | 'sudoku_intro' | 'sudoku_play' | 'sudoku_summary'
  const [screenMode, setScreenMode] = useState('hub');

  // Math Quest State
  const [timeLeft, setLeftTime] = useState(60);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionStr: '',
    answer: 0,
    type: '',
  });
  const [userInput, setUserInput] = useState('');
  const [borderFlash, setBorderFlash] = useState(null);
  const timerRef = useRef(null);

  // Constellation Path (Zip) State (3x3 grid)
  const zipCorrectPath = [0, 1, 2, 5, 4, 3, 6, 7, 8]; // Grid order mapping to 1-9
  const zipLabels = ['1', '2', '3', '6', '5', '4', '7', '8', '9']; // Cell numbers
  const [zipVisited, setZipVisited] = useState([]); // indices
  const [zipErrorIndex, setZipErrorIndex] = useState(null);

  // Crystal Fitter (Patches) State (4x4 grid)
  // Divide grid into four 2x2 quadrants. Clue is the size '4' placed in the top-left cell of each quadrant.
  const patchesClues = {
    0: 4, // Quad 1 top-left
    2: 4, // Quad 2 top-left
    8: 4, // Quad 3 top-left
    10: 4, // Quad 4 top-left
  };
  // Grid cell groups: 0 (none), 1 (Red), 2 (Blue), 3 (Green), 4 (Yellow)
  const [patchesGrid, setPatchesGrid] = useState(Array(16).fill(0));

  // Futuristic Sudoku State (4x4 grid)
  // Prefilled puzzle grid: 0 means empty
  const sudokuInitial = [1, 0, 0, 4, 0, 4, 1, 0, 0, 1, 4, 0, 4, 0, 0, 1];
  const sudokuSolution = [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1];
  const [sudokuGrid, setSudokuGrid] = useState([...sudokuInitial]);

  // Animations
  const borderFlashAnim = useRef(new Animated.Value(0)).current;

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const triggerBorderFlash = type => {
    setBorderFlash(type);
    Animated.sequence([
      Animated.timing(borderFlashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(borderFlashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => setBorderFlash(null));
  };

  // ==========================================
  // MATH QUEST LOGIC
  // ==========================================
  const startMathQuest = () => {
    setScore(0);
    setAttempted(0);
    setLeftTime(60);
    setUserInput('');
    setCurrentQuestion(generateQuestion());
    setScreenMode('math_play');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setLeftTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setScreenMode('math_summary');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const verifySumOfSquares = (inputText, target) => {
    const parts = inputText.split(',').map(p => p.trim());
    if (parts.length !== 2) {
      return false;
    }
    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    if (isNaN(x) || isNaN(y)) {
      return false;
    }
    return x * x + y * y === target;
  };

  const submitAnswer = () => {
    if (userInput.trim() === '') {
      return;
    }

    let isCorrect = false;
    if (currentQuestion.type === 'sum_squares') {
      isCorrect = verifySumOfSquares(userInput, currentQuestion.answer);
    } else {
      const numericAnswer = parseInt(userInput, 10);
      isCorrect = numericAnswer === currentQuestion.answer;
    }

    setAttempted(prev => prev + 1);
    if (isCorrect) {
      setScore(prev => prev + 1);
      triggerBorderFlash('correct');
    } else {
      triggerBorderFlash('incorrect');
      Vibration.vibrate(200);
    }

    setUserInput('');
    setCurrentQuestion(generateQuestion());
  };

  const handleKeyPress = val => {
    if (val === 'DEL') {
      setUserInput(prev => prev.slice(0, -1));
    } else if (val === '-') {
      setUserInput(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
    } else if (val === ',') {
      // Allow only one comma in sum of squares
      if (currentQuestion.type === 'sum_squares' && !userInput.includes(',')) {
        setUserInput(prev => prev + ',');
      }
    } else {
      if (userInput.length < 8) {
        setUserInput(prev => prev + val);
      }
    }
  };

  // ==========================================
  // ZIP (CONSTELLATION PATH) LOGIC
  // ==========================================
  const startZipGame = () => {
    setZipVisited([0]); // Start at index 0 (value 1)
    setZipErrorIndex(null);
    setScreenMode('zip_play');
  };

  const handleZipCellPress = index => {
    const expectedValue = zipVisited.length + 1; // 2, 3, etc.
    const actualValue = parseInt(zipLabels[index], 10);

    if (actualValue === expectedValue) {
      // Check adjacency to the last visited cell
      const lastIndex = zipVisited[zipVisited.length - 1];
      const row1 = Math.floor(lastIndex / 3);
      const col1 = lastIndex % 3;
      const row2 = Math.floor(index / 3);
      const col2 = index % 3;
      const isAdjacent = Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;

      if (isAdjacent) {
        const nextVisited = [...zipVisited, index];
        setZipVisited(nextVisited);
        setZipErrorIndex(null);

        if (nextVisited.length === 9) {
          Vibration.vibrate([0, 100, 50, 100]);
          setScreenMode('zip_summary');
        }
      } else {
        // Not adjacent
        setZipErrorIndex(index);
        Vibration.vibrate(150);
        setTimeout(() => setZipErrorIndex(null), 500);
      }
    } else {
      // Wrong number clicked
      setZipErrorIndex(index);
      Vibration.vibrate(150);
      setTimeout(() => setZipErrorIndex(null), 500);
    }
  };

  // ==========================================
  // PATCHES (CRYSTAL FITTER) LOGIC
  // ==========================================
  const startPatchesGame = () => {
    setPatchesGrid(Array(16).fill(0));
    setScreenMode('patches_play');
  };

  const handlePatchesCellPress = index => {
    setPatchesGrid(prev => {
      const next = [...prev];
      // Cycle through group colors: 0 -> 1 -> 2 -> 3 -> 4 -> 0
      next[index] = (next[index] + 1) % 5;
      return next;
    });
  };

  const verifyPatchesSolution = () => {
    // Check Quadrant 1 (Indices 0, 1, 4, 5) must be all color 1, and no other cells color 1
    // Quadrant 2 (Indices 2, 3, 6, 7) must be all color 2
    // Quadrant 3 (Indices 8, 9, 12, 13) must be all color 3
    // Quadrant 4 (Indices 10, 11, 14, 15) must be all color 4
    const q1 = [0, 1, 4, 5];
    const q2 = [2, 3, 6, 7];
    const q3 = [8, 9, 12, 13];
    const q4 = [10, 11, 14, 15];

    const checkQuad = (indices, colorCode) => {
      return indices.every(idx => patchesGrid[idx] === colorCode);
    };

    if (
      checkQuad(q1, 1) &&
      checkQuad(q2, 2) &&
      checkQuad(q3, 3) &&
      checkQuad(q4, 4)
    ) {
      Vibration.vibrate([0, 100, 50, 100]);
      setScreenMode('patches_summary');
    } else {
      Vibration.vibrate(200);
      triggerBorderFlash('incorrect');
    }
  };

  // ==========================================
  // SUDOKU LOGIC
  // ==========================================
  const startSudokuGame = () => {
    setSudokuGrid([...sudokuInitial]);
    setScreenMode('sudoku_play');
  };

  const handleSudokuCellPress = index => {
    // If prefilled, do nothing
    if (sudokuInitial[index] !== 0) {
      return;
    }

    setSudokuGrid(prev => {
      const next = [...prev];
      // Cycle through values: 0 (empty) -> 1 -> 2 -> 3 -> 4 -> 0
      next[index] = (next[index] + 1) % 5;
      return next;
    });
  };

  const verifySudokuSolution = () => {
    const isCorrect = sudokuGrid.every(
      (val, idx) => val === sudokuSolution[idx],
    );
    if (isCorrect) {
      Vibration.vibrate([0, 100, 50, 100]);
      setScreenMode('sudoku_summary');
    } else {
      Vibration.vibrate(200);
      triggerBorderFlash('incorrect');
    }
  };

  // ==========================================
  // DISPATCH COMPLETE LOGIC
  // ==========================================
  const finishGameSession = gameId => {
    dispatch(completeDailyGame(gameId));
    setScreenMode('hub');
  };

  // ==========================================
  // RENDER GAME CARD
  // ==========================================
  const renderGameCard = (
    gameId,
    title,
    subtitle,
    icon,
    color,
    active,
    onPress,
  ) => {
    const played = isPlayedToday(gameId);
    return (
      <TouchableOpacity
        disabled={!active || played}
        onPress={onPress}
        style={[
          styles.gameCard,
          {
            backgroundColor: theme.dark ? '#1e293b' : '#ffffff',
            borderColor:
              active && !played ? color : played ? '#10b981' : '#e2e8f0',
          },
          !active ? {opacity: 0.6} : null,
        ]}>
        <View
          style={[
            styles.gameCardIconContainer,
            {backgroundColor: played ? 'rgba(16,185,129,0.1)' : color + '15'},
          ]}>
          <Micon
            name={played ? 'check-circle' : icon}
            size={32}
            color={played ? '#10b981' : color}
          />
        </View>
        <View style={styles.gameCardDetails}>
          <Text
            style={[
              styles.gameCardTitle,
              {color: theme.dark ? '#ffffff' : '#1e293b'},
            ]}>
            {title}
          </Text>
          <Text
            style={[
              styles.gameCardSubtitle,
              {color: theme.dark ? '#94a3b8' : '#64748b'},
            ]}>
            {played ? 'Completed today! +5 XP earned.' : subtitle}
          </Text>
        </View>
        <View style={styles.gameCardStatus}>
          {played ? (
            <Micon
              name="checkbox-marked-circle-outline"
              size={24}
              color="#10b981"
            />
          ) : active ? (
            <Micon name="chevron-right" size={24} color={color} />
          ) : (
            <View style={styles.comingSoonTag}>
              <Text style={styles.comingSoonText}>LOCKED</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const borderFlashColor = borderFlashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.dark ? '#1e293b' : '#e2e8f0',
      borderFlash === 'correct' ? '#10b981' : '#ef4444',
    ],
  });

  return (
    <SafeAreaView
      style={[
        styles.container,
        {backgroundColor: theme.dark ? '#0f172a' : '#f8fafc'},
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            navigation.goBack();
          }}
          style={[
            styles.backButton,
            {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'},
          ]}>
          <Micon
            name="arrow-left"
            size={22}
            color={theme.dark ? '#ffffff' : '#1f2937'}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            {color: theme.dark ? '#ffffff' : '#1f2937'},
          ]}>
          Brain Gym
        </Text>
        <View style={{width: 40}} />
      </View>

      {/* Screen Router */}
      {screenMode === 'hub' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Daily Status Banner */}
          <View
            style={[
              styles.bannerCard,
              {
                backgroundColor: 'rgba(0,139,139,0.06)',
                borderColor: '#008b8b',
              },
            ]}>
            <View style={styles.bannerIconContainer}>
              <Micon name="brain" size={36} color="#008b8b" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text
                style={[
                  styles.bannerTitle,
                  {color: theme.dark ? '#ffffff' : '#1e293b'},
                ]}>
                Daily Mind Workouts
              </Text>
              <Text
                style={[
                  styles.bannerSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                Play each game once daily. Every completed session awards +5 XP.
              </Text>
            </View>
          </View>

          {/* Games list */}
          <Text
            style={[
              styles.sectionTitle,
              {color: theme.dark ? '#ffffff' : '#1e293b'},
            ]}>
            Workout Games
          </Text>

          {renderGameCard(
            'math_quest',
            'Math Quest',
            'Speed arithmetic equations (+, -, %, HCF, LCM, sum of squares) in 60s.',
            'calculator',
            '#008b8b',
            true,
            () => setScreenMode('math_intro'),
          )}

          {renderGameCard(
            'zip',
            'Constellation Path (Zip)',
            'Connect numbers in a sequence to light up the cosmic grid.',
            'transit-connection-variant',
            '#8b5cf6',
            true,
            () => setScreenMode('zip_intro'),
          )}

          {renderGameCard(
            'patches',
            'Crystal Fitter (Patches)',
            'Tile the grid with crystal blocks matching sizes.',
            'shape-rectangle-plus',
            '#ec4899',
            true,
            () => setScreenMode('patches_intro'),
          )}

          {renderGameCard(
            'sudoku',
            'Futuristic Sudoku',
            'Challenge your grid logic on a 4x4 Sudoku board.',
            'grid',
            '#f59e0b',
            true,
            () => setScreenMode('sudoku_intro'),
          )}
        </ScrollView>
      )}

      {/* ==========================================
          MATH QUEST SCREENS
          ========================================== */}
      {screenMode === 'math_intro' && (
        <View style={styles.contentContainer}>
          <Card
            style={[
              styles.setupCard,
              {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'},
            ]}>
            <Card.Content style={styles.setupContent}>
              <View
                style={[
                  styles.gameIconWrapper,
                  {backgroundColor: 'rgba(0,139,139,0.1)'},
                ]}>
                <Micon name="calculator" size={48} color="#008b8b" />
              </View>
              <Text
                style={[
                  styles.setupTitle,
                  {color: theme.dark ? '#ffffff' : '#1f2937'},
                ]}>
                Math Quest
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                A fast-paced digital arithmetic challenge designed to sharpen
                quick calculation skills.
              </Text>

              <View style={styles.rulesList}>
                <View style={styles.ruleItem}>
                  <Micon
                    name="clock-outline"
                    size={18}
                    color="#008b8b"
                    style={{marginRight: 8}}
                  />
                  <Text
                    style={[
                      styles.ruleText,
                      {color: theme.dark ? '#cbd5e1' : '#4b5563'},
                    ]}>
                    Strict 60-second limit countdown.
                  </Text>
                </View>
                <View style={styles.ruleItem}>
                  <Micon
                    name="keyboard-outline"
                    size={18}
                    color="#008b8b"
                    style={{marginRight: 8}}
                  />
                  <Text
                    style={[
                      styles.ruleText,
                      {color: theme.dark ? '#cbd5e1' : '#4b5563'},
                    ]}>
                    Use the comma (,) to separate the two values in Sum of
                    Squares (e.g. 6,8).
                  </Text>
                </View>
                <View style={styles.ruleItem}>
                  <Micon
                    name="pulse"
                    size={18}
                    color="#008b8b"
                    style={{marginRight: 8}}
                  />
                  <Text
                    style={[
                      styles.ruleText,
                      {color: theme.dark ? '#cbd5e1' : '#4b5563'},
                    ]}>
                    Covers addition, subtraction, modulo (%), sum of squares,
                    HCF \& LCM.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={startMathQuest}
                style={styles.startButton}>
                <Text style={styles.startButtonText}>Begin Game</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {screenMode === 'math_play' && (
        <View style={styles.playContainer}>
          <View style={styles.statusBar}>
            <View style={styles.scoreTextWrapper}>
              <Text
                style={[
                  styles.scoreLabel,
                  {color: theme.dark ? '#cbd5e1' : '#6b7280'},
                ]}>
                SCORE
              </Text>
              <Text style={[styles.scoreVal, {color: '#008b8b'}]}>{score}</Text>
            </View>
            <View style={styles.timerWrapper}>
              <Micon
                name="clock-outline"
                size={18}
                color={timeLeft <= 10 ? '#ef4444' : '#008b8b'}
              />
              <Text
                style={[
                  styles.timerText,
                  {
                    color:
                      timeLeft <= 10
                        ? '#ef4444'
                        : theme.dark
                        ? '#ffffff'
                        : '#1f2937',
                  },
                ]}>
                {timeLeft}s
              </Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.questionPanel,
              {
                backgroundColor: theme.dark ? '#1e293b' : '#ffffff',
                borderColor: borderFlashColor,
                borderWidth: 2,
              },
            ]}>
            <Text
              style={[
                styles.questionFormula,
                {color: theme.dark ? '#ffffff' : '#1f2937'},
              ]}>
              {currentQuestion.questionStr}
            </Text>
            {currentQuestion.type === 'sum_squares' && (
              <Text
                style={[
                  styles.helperInstructionText,
                  {color: theme.dark ? '#cbd5e1' : '#6b7280'},
                ]}>
                Enter both numbers separated by a comma (e.g. 6,8)
              </Text>
            )}
            <View
              style={[
                styles.inputAnswerContainer,
                {borderBottomColor: '#008b8b'},
              ]}>
              <Text
                style={[
                  styles.inputAnswerText,
                  {
                    color:
                      userInput === ''
                        ? '#94a3b8'
                        : theme.dark
                        ? '#00e5ff'
                        : '#008b8b',
                  },
                ]}>
                {userInput === '' ? '?' : userInput}
              </Text>
            </View>
          </Animated.View>

          {/* Keypad */}
          <View style={styles.keypadWrapper}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['-', '0', ','],
            ].map((row, rIndex) => (
              <View key={rIndex} style={styles.keypadRow}>
                {row.map(key => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => handleKeyPress(key)}
                    style={[
                      styles.keypadButton,
                      {
                        backgroundColor: theme.dark ? '#1e293b' : '#ffffff',
                        borderColor: theme.dark ? '#334155' : '#e2e8f0',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.keypadButtonText,
                        {color: theme.dark ? '#ffffff' : '#1f2937'},
                      ]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <View style={styles.keypadRow}>
              <TouchableOpacity
                onPress={() => handleKeyPress('DEL')}
                style={[styles.keypadActionBtn, {backgroundColor: '#ef4444'}]}>
                <Micon name="backspace-outline" size={22} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitAnswer}
                style={[
                  styles.keypadActionBtn,
                  {backgroundColor: '#008b8b', flex: 2},
                ]}>
                <Text style={styles.submitButtonText}>SUBMIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {screenMode === 'math_summary' && (
        <View style={styles.contentContainer}>
          <Confetti duration={3000} />
          <Card
            style={[
              styles.setupCard,
              {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'},
            ]}>
            <Card.Content style={styles.setupContent}>
              <View
                style={[
                  styles.gameIconWrapper,
                  {backgroundColor: 'rgba(16,185,129,0.1)'},
                ]}>
                <Micon name="trophy" size={48} color="#10b981" />
              </View>
              <Text
                style={[
                  styles.setupTitle,
                  {color: theme.dark ? '#ffffff' : '#1f2937'},
                ]}>
                Workout Finished!
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                You completed today's Math Quest!
              </Text>
              <View
                style={[
                  styles.summaryStatsBox,
                  {backgroundColor: theme.dark ? '#0f172a' : '#f8fafc'},
                ]}>
                <View style={styles.statCol}>
                  <Text style={styles.statTitleText}>Correct</Text>
                  <Text style={[styles.statValueText, {color: '#10b981'}]}>
                    {score}
                  </Text>
                </View>
                <View style={styles.dividerLine} />
                <View style={styles.statCol}>
                  <Text style={styles.statTitleText}>Accuracy</Text>
                  <Text style={[styles.statValueText, {color: '#008b8b'}]}>
                    {attempted > 0 ? Math.round((score / attempted) * 100) : 0}%
                  </Text>
                </View>
                <View style={styles.dividerLine} />
                <View style={styles.statCol}>
                  <Text style={styles.statTitleText}>XP Reward</Text>
                  <Text style={[styles.statValueText, {color: '#f59e0b'}]}>
                    +5 XP
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => finishGameSession('math_quest')}
                style={[styles.startButton, {backgroundColor: '#10b981'}]}>
                <Text style={styles.startButtonText}>Claim XP \& Exit</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* ==========================================
          ZIP (CONSTELLATION PATH) SCREENS
          ========================================== */}
      {screenMode === 'zip_intro' && (
        <View style={styles.contentContainer}>
          <Card
            style={[
              styles.setupCard,
              {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'},
            ]}>
            <Card.Content style={styles.setupContent}>
              <View
                style={[
                  styles.gameIconWrapper,
                  {backgroundColor: 'rgba(139,92,246,0.1)'},
                ]}>
                <Micon
                  name="transit-connection-variant"
                  size={48}
                  color="#8b5cf6"
                />
              </View>
              <Text
                style={[
                  styles.setupTitle,
                  {color: theme.dark ? '#ffffff' : '#1f2937'},
                ]}>
                Constellation Path
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                Draw a continuous path by tapping numbers from 1 to 9 in
                sequence. Connect neighboring stars only!
              </Text>
              <TouchableOpacity
                onPress={startZipGame}
                style={[styles.startButton, {backgroundColor: '#8b5cf6'}]}>
                <Text style={styles.startButtonText}>Start Path</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {screenMode === 'zip_play' && (
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.setupTitle,
              {
                textAlign: 'center',
                marginBottom: 20,
                color: theme.dark ? '#ffffff' : '#1f2937',
              },
            ]}>
            Connect 1 to 9
          </Text>
          <View style={styles.gridContainer}>
            {zipLabels.map((val, idx) => {
              const isVisited = zipVisited.includes(idx);
              const isLast = zipVisited[zipVisited.length - 1] === idx;
              const isError = zipErrorIndex === idx;

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleZipCellPress(idx)}
                  style={[
                    styles.gridCell3x3,
                    {
                      backgroundColor: isError
                        ? '#ef4444'
                        : isLast
                        ? '#8b5cf6'
                        : isVisited
                        ? 'rgba(139,92,246,0.2)'
                        : theme.dark
                        ? '#1e293b'
                        : '#ffffff',
                      borderColor: isVisited ? '#8b5cf6' : '#cbd5e1',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.gridCellText,
                      {
                        color:
                          isVisited || isError
                            ? '#ffffff'
                            : theme.dark
                            ? '#ffffff'
                            : '#1f2937',
                      },
                    ]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {screenMode === 'zip_summary' && (
        <View style={styles.contentContainer}>
          <Confetti duration={3000} />
          <Card
            style={[
              styles.setupCard,
              {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'},
            ]}>
            <Card.Content style={styles.setupContent}>
              <View
                style={[
                  styles.gameIconWrapper,
                  {backgroundColor: 'rgba(16,185,129,0.1)'},
                ]}>
                <Micon name="trophy" size={48} color="#10b981" />
              </View>
              <Text
                style={[
                  styles.setupTitle,
                  {color: theme.dark ? '#ffffff' : '#1f2937'},
                ]}>
                Path Connected!
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                You connected all stars in sequence successfully.
              </Text>
              <TouchableOpacity
                onPress={() => finishGameSession('zip')}
                style={[styles.startButton, {backgroundColor: '#10b981'}]}>
                <Text style={styles.startButtonText}>Claim +5 XP \& Exit</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* ==========================================
          PATCHES (CRYSTAL FITTER) SCREENS
          ========================================== */}
      {screenMode === 'patches_intro' && (
        <View style={styles.contentContainer}>
          <Card
            style={[
              styles.setupCard,
              {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'},
            ]}>
            <Card.Content style={styles.setupContent}>
              <View
                style={[
                  styles.gameIconWrapper,
                  {backgroundColor: 'rgba(236,72,153,0.1)'},
                ]}>
                <Micon name="shape-rectangle-plus" size={48} color="#ec4899" />
              </View>
              <Text
                style={[
                  styles.setupTitle,
                  {color: theme.dark ? '#ffffff' : '#1f2937'},
                ]}>
                Crystal Fitter
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                Group cells into four separate 2x2 quadrants. Tap cells to cycle
                colors (Red, Blue, Green, Yellow).
              </Text>
              <TouchableOpacity
                onPress={startPatchesGame}
                style={[styles.startButton, {backgroundColor: '#ec4899'}]}>
                <Text style={styles.startButtonText}>Start Fitting</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {screenMode === 'patches_play' && (
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.setupTitle,
              {
                textAlign: 'center',
                marginBottom: 10,
                color: theme.dark ? '#ffffff' : '#1f2937',
              },
            ]}>
            Form Four 2x2 Squares
          </Text>
          <Text
            style={[
              styles.helperInstructionText,
              {
                textAlign: 'center',
                marginBottom: 20,
                color: theme.dark ? '#cbd5e1' : '#64748b',
              },
            ]}>
            Numbers show starting points. Group colors matching sizes.
          </Text>

          <View style={styles.gridContainer4x4}>
            {patchesGrid.map((val, idx) => {
              const clue = patchesClues[idx];
              // Group colors mapping
              const colorsMap = {
                0: theme.dark ? '#1e293b' : '#ffffff',
                1: '#ef4444', // Red
                2: '#3b82f6', // Blue
                3: '#10b981', // Green
                4: '#eab308', // Yellow
              };

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handlePatchesCellPress(idx)}
                  style={[
                    styles.gridCell4x4,
                    {
                      backgroundColor: colorsMap[val],
                      borderColor: '#cbd5e1',
                    },
                  ]}>
                  {clue ? (
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 16,
                        color: val !== 0 ? '#ffffff' : '#008b8b',
                      }}>
                      {clue}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={verifyPatchesSolution}
            style={[
              styles.startButton,
              {backgroundColor: '#ec4899', marginTop: 24},
            ]}>
            <Text style={styles.startButtonText}>Verify Solution</Text>
          </TouchableOpacity>
        </View>
      )}

      {screenMode === 'patches_summary' && (
        <View style={styles.contentContainer}>
          <Confetti duration={3000} />
          <Card
            style={[
              styles.setupCard,
              {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'},
            ]}>
            <Card.Content style={styles.setupContent}>
              <View
                style={[
                  styles.gameIconWrapper,
                  {backgroundColor: 'rgba(16,185,129,0.1)'},
                ]}>
                <Micon name="trophy" size={48} color="#10b981" />
              </View>
              <Text
                style={[
                  styles.setupTitle,
                  {color: theme.dark ? '#ffffff' : '#1f2937'},
                ]}>
                Crystals Fitted!
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                All crystal quadrants successfully aligned.
              </Text>
              <TouchableOpacity
                onPress={() => finishGameSession('patches')}
                style={[styles.startButton, {backgroundColor: '#10b981'}]}>
                <Text style={styles.startButtonText}>Claim +5 XP \& Exit</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* ==========================================
          SUDOKU SCREENS
          ========================================== */}
      {screenMode === 'sudoku_intro' && (
        <View style={styles.contentContainer}>
          <Card
            style={[
              styles.setupCard,
              {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'},
            ]}>
            <Card.Content style={styles.setupContent}>
              <View
                style={[
                  styles.gameIconWrapper,
                  {backgroundColor: 'rgba(245,158,11,0.1)'},
                ]}>
                <Micon name="grid" size={48} color="#f59e0b" />
              </View>
              <Text
                style={[
                  styles.setupTitle,
                  {color: theme.dark ? '#ffffff' : '#1f2937'},
                ]}>
                Futuristic Sudoku
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                Solve the 4x4 logic matrix. Fill rows, columns, and 2x2
                quadrants with digits 1 to 4 without duplicates.
              </Text>
              <TouchableOpacity
                onPress={startSudokuGame}
                style={[styles.startButton, {backgroundColor: '#f59e0b'}]}>
                <Text style={styles.startButtonText}>Start Sudoku</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {screenMode === 'sudoku_play' && (
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.setupTitle,
              {
                textAlign: 'center',
                marginBottom: 20,
                color: theme.dark ? '#ffffff' : '#1f2937',
              },
            ]}>
            Solve 4x4 Grid
          </Text>
          <View style={styles.gridContainer4x4}>
            {sudokuGrid.map((val, idx) => {
              const isOriginal = sudokuInitial[idx] !== 0;

              return (
                <TouchableOpacity
                  key={idx}
                  disabled={isOriginal}
                  onPress={() => handleSudokuCellPress(idx)}
                  style={[
                    styles.gridCell4x4,
                    {
                      backgroundColor: isOriginal
                        ? theme.dark
                          ? '#1e293b'
                          : '#e2e8f0'
                        : theme.dark
                        ? '#0f172a'
                        : '#ffffff',
                      borderColor: '#cbd5e1',
                    },
                  ]}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: isOriginal ? 'bold' : 'normal',
                      color: isOriginal
                        ? theme.dark
                          ? '#ffffff'
                          : '#1f2937'
                        : '#008b8b',
                    }}>
                    {val === 0 ? '?' : val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            onPress={verifySudokuSolution}
            style={[
              styles.startButton,
              {backgroundColor: '#f59e0b', marginTop: 24},
            ]}>
            <Text style={styles.startButtonText}>Verify Grid</Text>
          </TouchableOpacity>
        </View>
      )}

      {screenMode === 'sudoku_summary' && (
        <View style={styles.contentContainer}>
          <Confetti duration={3000} />
          <Card
            style={[
              styles.setupCard,
              {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'},
            ]}>
            <Card.Content style={styles.setupContent}>
              <View
                style={[
                  styles.gameIconWrapper,
                  {backgroundColor: 'rgba(16,185,129,0.1)'},
                ]}>
                <Micon name="trophy" size={48} color="#10b981" />
              </View>
              <Text
                style={[
                  styles.setupTitle,
                  {color: theme.dark ? '#ffffff' : '#1f2937'},
                ]}>
                Sudoku Solved!
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                Your logic matrix is completely correct.
              </Text>
              <TouchableOpacity
                onPress={() => finishGameSession('sudoku')}
                style={[styles.startButton, {backgroundColor: '#10b981'}]}>
                <Text style={styles.startButtonText}>Claim +5 XP \& Exit</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  bannerIconContainer: {
    marginRight: 16,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 4,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  gameCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gameCardDetails: {
    flex: 1,
  },
  gameCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameCardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  gameCardStatus: {
    marginLeft: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  comingSoonTag: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  countdownText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  setupCard: {
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  setupContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  gameIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  rulesList: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 28,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 13,
    flex: 1,
  },
  startButton: {
    backgroundColor: '#008b8b',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  scoreTextWrapper: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scoreVal: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  questionPanel: {
    height: height * 0.25,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    padding: 16,
  },
  questionFormula: {
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  helperInstructionText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  inputAnswerContainer: {
    borderBottomWidth: 3,
    paddingHorizontal: 20,
    paddingBottom: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  inputAnswerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  keypadWrapper: {
    width: '100%',
    paddingBottom: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  keypadButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.02,
    shadowRadius: 1,
  },
  keypadButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  keypadActionBtn: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  summaryStatsBox: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 28,
  },
  statCol: {
    alignItems: 'center',
  },
  statTitleText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValueText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dividerLine: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  // Game Grid Styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width - 64,
    height: width - 64,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  gridCell3x3: {
    width: (width - 96) / 3,
    height: (width - 96) / 3,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  gridCellText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gridContainer4x4: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width - 64,
    height: width - 64,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  gridCell4x4: {
    width: (width - 100) / 4,
    height: (width - 100) / 4,
    borderRadius: 16,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
});
