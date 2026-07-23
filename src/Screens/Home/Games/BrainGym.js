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
  PanResponder,
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

// Dynamic Zip Path Generator with Obstacles & Hamiltonian Path
const generateZipGame = () => {
  const gridRows = 4;
  const gridCols = 4;

  const getNeighbors = (cellIdx, obstaclesSet) => {
    const r = Math.floor(cellIdx / gridCols);
    const c = cellIdx % gridCols;
    const nbrs = [];
    if (r > 0) nbrs.push((r - 1) * gridCols + c);
    if (r < gridRows - 1) nbrs.push((r + 1) * gridCols + c);
    if (c > 0) nbrs.push(r * gridCols + (c - 1));
    if (c < gridCols - 1) nbrs.push(r * gridCols + (c + 1));
    return nbrs.filter(idx => !obstaclesSet.has(idx));
  };

  const findPath = (curr, visited, obstaclesSet, targetLen) => {
    if (visited.length === targetLen) return visited;
    const nbrs = getNeighbors(curr, obstaclesSet).sort(() => Math.random() - 0.5);
    for (const next of nbrs) {
      if (!visited.includes(next)) {
        const res = findPath(next, [...visited, next], obstaclesSet, targetLen);
        if (res) return res;
      }
    }
    return null;
  };

  for (let attempt = 0; attempt < 80; attempt++) {
    const allIndices = Array.from({ length: 16 }, (_, i) => i).sort(() => Math.random() - 0.5);
    const obstaclesArr = allIndices.slice(0, 2);
    const obstaclesSet = new Set(obstaclesArr);

    const walkableIndices = allIndices.slice(2);
    const startNode = walkableIndices[Math.floor(Math.random() * walkableIndices.length)];
    const targetLen = 14;

    const path = findPath(startNode, [startNode], obstaclesSet, targetLen);
    if (path) {
      const labels = Array(16).fill('');
      const totalSteps = path.length;

      const dotIntervals = [0, 2, 4, 6, 8, 10, 12, totalSteps - 1];
      dotIntervals.forEach((stepIdx, numIdx) => {
        if (stepIdx < path.length) {
          labels[path[stepIdx]] = String(numIdx + 1);
        }
      });

      return {
        path,
        labels,
        startIdx: path[0],
        obstacles: obstaclesArr,
        totalWalkable: targetLen,
        gridSize: 4,
      };
    }
  }

  // Fallback 3x3 with 1 obstacle
  const obstaclesArr = [4];
  const path = [0, 1, 2, 5, 8, 7, 6, 3];
  const labels = Array(9).fill('');
  path.forEach((cellIdx, stepIdx) => {
    labels[cellIdx] = String(stepIdx + 1);
  });
  return {
    path,
    labels,
    startIdx: path[0],
    obstacles: obstaclesArr,
    totalWalkable: 8,
    gridSize: 3,
  };
};

// Dynamic Multi-Size Sudoku Generator (Supports 4x4, 6x6, and 9x9 Sudoku grids dynamically!)
const generateDynamicSudokuGame = () => {
  const sizes = [4, 6, 9];
  const size = sizes[Math.floor(Math.random() * sizes.length)];

  if (size === 4) {
    const base = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ];
    const digits = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const map = { 1: digits[0], 2: digits[1], 3: digits[2], 4: digits[3] };
    let grid2D = base.map(row => row.map(cell => map[cell]));
    if (Math.random() > 0.5) [grid2D[0], grid2D[1]] = [grid2D[1], grid2D[0]];
    if (Math.random() > 0.5) [grid2D[2], grid2D[3]] = [grid2D[3], grid2D[2]];
    const solution = grid2D.flat();
    const initial = [...solution];
    const hideIndices = Array.from({ length: 16 }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 7);
    hideIndices.forEach(idx => { initial[idx] = 0; });
    return { initial, solution, size: 4, boxRows: 2, boxCols: 2, maxDigit: 4 };
  } else if (size === 6) {
    const base = [
      [1, 2, 3, 4, 5, 6],
      [4, 5, 6, 1, 2, 3],
      [2, 3, 1, 5, 6, 4],
      [5, 6, 4, 2, 3, 1],
      [3, 1, 2, 6, 4, 5],
      [6, 4, 5, 3, 1, 2],
    ];
    const digits = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    const map = { 1: digits[0], 2: digits[1], 3: digits[2], 4: digits[3], 5: digits[4], 6: digits[5] };
    let grid2D = base.map(row => row.map(cell => map[cell]));
    if (Math.random() > 0.5) [grid2D[0], grid2D[1]] = [grid2D[1], grid2D[0]];
    if (Math.random() > 0.5) [grid2D[2], grid2D[3]] = [grid2D[3], grid2D[2]];
    if (Math.random() > 0.5) [grid2D[4], grid2D[5]] = [grid2D[5], grid2D[4]];
    const solution = grid2D.flat();
    const initial = [...solution];
    const hideIndices = Array.from({ length: 36 }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
    hideIndices.forEach(idx => { initial[idx] = 0; });
    return { initial, solution, size: 6, boxRows: 2, boxCols: 3, maxDigit: 6 };
  } else {
    const base = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 1, 5, 6, 4, 8, 9, 7],
      [5, 6, 4, 8, 9, 7, 2, 3, 1],
      [8, 9, 7, 2, 3, 1, 5, 6, 4],
      [3, 1, 2, 6, 4, 5, 9, 7, 8],
      [6, 4, 5, 9, 7, 8, 3, 1, 2],
      [9, 7, 8, 3, 1, 2, 6, 4, 5],
    ];
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    const map = {};
    for (let i = 1; i <= 9; i++) map[i] = digits[i - 1];
    let grid2D = base.map(row => row.map(cell => map[cell]));
    if (Math.random() > 0.5) [grid2D[0], grid2D[1]] = [grid2D[1], grid2D[0]];
    if (Math.random() > 0.5) [grid2D[3], grid2D[4]] = [grid2D[4], grid2D[3]];
    if (Math.random() > 0.5) [grid2D[6], grid2D[7]] = [grid2D[7], grid2D[6]];
    const solution = grid2D.flat();
    const initial = [...solution];
    const hideIndices = Array.from({ length: 81 }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 42);
    hideIndices.forEach(idx => { initial[idx] = 0; });
    return { initial, solution, size: 9, boxRows: 3, boxCols: 3, maxDigit: 9 };
  }
};

// Validate Sudoku Board according to standard row, col, and box rules
const isValidSudokuBoard = (grid, size, boxRows, boxCols) => {
  if (!grid || grid.some(v => v === 0)) return false;

  for (let r = 0; r < size; r++) {
    const rowSet = new Set();
    for (let c = 0; c < size; c++) {
      const val = grid[r * size + c];
      if (val < 1 || val > size || rowSet.has(val)) return false;
      rowSet.add(val);
    }
  }

  for (let c = 0; c < size; c++) {
    const colSet = new Set();
    for (let r = 0; r < size; r++) {
      const val = grid[r * size + c];
      if (val < 1 || val > size || colSet.has(val)) return false;
      colSet.add(val);
    }
  }

  for (let br = 0; br < size; br += boxRows) {
    for (let bc = 0; bc < size; bc += boxCols) {
      const boxSet = new Set();
      for (let r = 0; r < boxRows; r++) {
        for (let c = 0; c < boxCols; c++) {
          const val = grid[(br + r) * size + (bc + c)];
          if (val < 1 || val > size || boxSet.has(val)) return false;
          boxSet.add(val);
        }
      }
    }
  }

  return true;
};

// Dynamic Patches Game Generator (Creates a fresh partition of Rectangles/Squares with size clues)
const generatePatchesGame = () => {
  const patchTemplates = [
    {
      targetGrid: [
        1, 1, 2, 2,
        1, 1, 2, 2,
        3, 3, 4, 4,
        3, 3, 4, 4,
      ],
      clues: { 0: 4, 2: 4, 8: 4, 10: 4 },
      shapesCount: 4,
    },
    {
      targetGrid: [
        1, 1, 1, 2,
        3, 3, 4, 2,
        3, 3, 4, 2,
        5, 5, 5, 5,
      ],
      clues: { 0: 3, 3: 3, 4: 4, 6: 2, 12: 4 },
      shapesCount: 5,
    },
    {
      targetGrid: [
        1, 2, 2, 2,
        1, 3, 3, 4,
        1, 3, 3, 4,
        1, 5, 5, 4,
      ],
      clues: { 0: 4, 1: 3, 5: 4, 7: 3, 13: 2 },
      shapesCount: 5,
    },
    {
      targetGrid: [
        1, 1, 2, 3,
        4, 4, 2, 3,
        4, 4, 2, 5,
        6, 6, 6, 5,
      ],
      clues: { 0: 2, 2: 3, 3: 2, 4: 4, 11: 2, 12: 3 },
      shapesCount: 6,
    },
  ];

  const template = patchTemplates[Math.floor(Math.random() * patchTemplates.length)];
  const palette = ['#ef4444', '#10b981', '#3b82f6', '#06b6d4', '#eab308', '#8b5cf6', '#f97316', '#ec4899'];
  const shuffledPalette = [...palette].sort(() => Math.random() - 0.5);

  return {
    targetGrid: template.targetGrid,
    clues: template.clues,
    shapesCount: template.shapesCount,
    palette: shuffledPalette,
  };
};

const DICTIONARY_WORDS = [
  'ALGORITHM', 'SPECTRUM', 'EQUATION', 'CATALYST', 'SYNTHESIS', 'HEURISTIC',
  'DYNAMICS', 'VARIABLE', 'QUANTUM', 'THEOREM', 'VELOCITY', 'FUNCTION',
  'ASTRONOMY', 'CALCULUS', 'GENETICS', 'MOLECULE', 'RADIATION', 'SOLUTION',
  'WAVELENGTH', 'VOLTAGE', 'KINETICS', 'ORGANISM', 'UNIVERSE', 'QUADRANT',
  'AARDVARK', 'ATHLETE', 'DECREE', 'BEACON', 'CASTLE', 'DRAGON', 'EAGLE',
  'FALCON', 'GLACIER', 'HORIZON', 'ISLAND', 'JUNGLE', 'KNIGHT', 'LANTERN',
  'MAGNET', 'NEBULA', 'OCTAGON', 'PULSE', 'QUARTZ', 'RADAR', 'SHADOW',
  'TEMPLE', 'URANIUM', 'VORTEX', 'WIZARD', 'XENON', 'YACHT', 'ZENITH',
  'SMART', 'BRAIN', 'GENIUS', 'STUDY', 'APPLE', 'EARTH', 'SOLAR', 'LOGIC',
  'FOCUS', 'QUEST', 'LIGHT', 'DREAM', 'POWER', 'STORM', 'SHINE', 'SPARK',
  'FLASH', 'ORBIT', 'TRACE', 'SWIFT', 'CRAFT', 'LEARN', 'SKILL',
  'THINK', 'SOLVE', 'MATCH', 'WORLD', 'FORCE', 'GUESS', 'FOUND', 'TRACK'
];

// 100% Procedural Wend Word Path Generator (Random Walk Maze Algorithm)
const generateWendGame = () => {
  const getNeighbors = idx => {
    const row = Math.floor(idx / 6);
    const col = idx % 6;
    const neighbors = [];
    if (row > 0) neighbors.push((row - 1) * 6 + col);
    if (row < 5) neighbors.push((row + 1) * 6 + col);
    if (col > 0) neighbors.push(row * 6 + (col - 1));
    if (col < 5) neighbors.push(row * 6 + (col + 1));
    return neighbors.sort(() => Math.random() - 0.5);
  };

  // Attempt up to 100 procedural maze generations
  for (let attempt = 0; attempt < 100; attempt++) {
    const gridCells = Array(36).fill(null);
    const usedCells = new Set();
    const wordsConfig = [];
    
    // Pick 4 random distinct words from the dictionary
    const shuffledWords = [...DICTIONARY_WORDS].sort(() => Math.random() - 0.5);
    const targetWords = shuffledWords.slice(0, 4);

    let success = true;

    for (let wIdx = 0; wIdx < targetWords.length; wIdx++) {
      const wordStr = targetWords[wIdx];
      const letters = wordStr.split('');
      
      // Find empty start cell
      const emptyIndices = Array.from({ length: 36 }, (_, i) => i).filter(i => !usedCells.has(i)).sort(() => Math.random() - 0.5);
      
      let wordPath = null;
      for (const startIdx of emptyIndices) {
        // Backtracking random walk to find path for letter sequence
        const pathAttempt = [startIdx];
        const visitedInPath = new Set([startIdx]);

        const findPath = currentIdx => {
          if (pathAttempt.length === letters.length) return true;
          const neighbors = getNeighbors(currentIdx).filter(n => !usedCells.has(n) && !visitedInPath.has(n));
          for (const nextIdx of neighbors) {
            pathAttempt.push(nextIdx);
            visitedInPath.add(nextIdx);
            if (findPath(nextIdx)) return true;
            pathAttempt.pop();
            visitedInPath.delete(nextIdx);
          }
          return false;
        };

        if (findPath(startIdx)) {
          wordPath = pathAttempt;
          break;
        }
      }

      if (!wordPath) {
        success = false;
        break;
      }

      wordPath.forEach(idx => usedCells.add(idx));
      wordsConfig.push({
        word: wordStr,
        startIdx: wordPath[0],
        path: wordPath,
      });
    }

    if (success && wordsConfig.length === 4) {
      // Build grid cells
      wordsConfig.forEach((wObj, wIdx) => {
        const letters = wObj.word.split('');
        wObj.path.forEach((cellIdx, stepIdx) => {
          gridCells[cellIdx] = {
            letter: letters[stepIdx],
            isBlockage: false,
            wordIdx: wIdx,
            isStart: stepIdx === 0,
          };
        });
      });

      // Any unplaced cells become blockage wall tiles
      for (let i = 0; i < 36; i++) {
        if (!gridCells[i]) {
          gridCells[i] = {
            letter: '',
            color: '#334155',
            isBlockage: true,
            wordIdx: -1,
            isStart: false,
          };
        }
      }

      return {
        words: wordsConfig,
        grid: gridCells,
      };
    }
  }

  // Fallback to seed if loop exhausts
  const fallbackPath1 = [0, 1, 7, 13, 14, 20, 26, 27, 28];
  const fallbackPath2 = [2, 3, 4, 10, 16, 15, 9, 8];
  const fallbackPath3 = [35, 34, 33, 29, 23, 17, 22, 21];
  const fallbackPath4 = [5, 11, 12, 18, 19, 25, 24, 30];

  const gridCells = Array(36).fill(null);
  const wordsConfig = [
    { word: 'ALGORITHM', startIdx: 0, path: fallbackPath1 },
    { word: 'SPECTRUM', startIdx: 2, path: fallbackPath2 },
    { word: 'EQUATION', startIdx: 35, path: fallbackPath3 },
    { word: 'CATALYST', startIdx: 5, path: fallbackPath4 },
  ];

  wordsConfig.forEach((wObj, wIdx) => {
    const letters = wObj.word.split('');
    wObj.path.forEach((cellIdx, stepIdx) => {
      gridCells[cellIdx] = {
        letter: letters[stepIdx],
        isBlockage: false,
        wordIdx: wIdx,
        isStart: stepIdx === 0,
      };
    });
  });

  for (let i = 0; i < 36; i++) {
    if (!gridCells[i]) {
      gridCells[i] = {
        letter: '',
        color: '#334155',
        isBlockage: true,
        wordIdx: -1,
        isStart: false,
      };
    }
  }

  return {
    words: wordsConfig,
    grid: gridCells,
  };
};
const generateQuestion = () => {
  const types = [
    'addition',
    'subtraction',
    'multiplication',
    'percentage',
    'square_root',
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
    case 'multiplication': {
      const a = Math.floor(Math.random() * 15) + 3;
      const b = Math.floor(Math.random() * 12) + 3;
      questionStr = `${a} × ${b}`;
      answer = a * b;
      break;
    }
    case 'percentage': {
      const p = [10, 20, 25, 50, 75][Math.floor(Math.random() * 5)];
      const baseVal = (Math.floor(Math.random() * 20) + 2) * 20;
      questionStr = `${p}% of ${baseVal}`;
      answer = (p * baseVal) / 100;
      break;
    }
    case 'square_root': {
      const root = Math.floor(Math.random() * 15) + 2;
      questionStr = `√${root * root}`;
      answer = root;
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

  const lastBrainGymDates = useSelector(
    state => state.gamification?.lastBrainGymDates || {},
  );

  const isPlayedToday = useCallback(
    gameId => {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastDate = lastBrainGymDates ? lastBrainGymDates[gameId] : null;
      return lastDate === todayStr;
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

  // Dynamic Zip State (3x3 grid)
  const [zipData, setZipData] = useState({ labels: [], obstacles: [], path: [], totalWalkable: 14 });
  const [zipVisited, setZipVisited] = useState([]);
  const [zipErrorIndex, setZipErrorIndex] = useState(null);
  const [showZipHelp, setShowZipHelp] = useState(false);

  const [patchesData, setPatchesData] = useState({ palette: [], targetGrid: [], clues: [] });
  const [patchesGrid, setPatchesGrid] = useState(Array(16).fill(0));
  const [patchesHistory, setPatchesHistory] = useState([]);

  // Dynamic Multi-Size Sudoku State (4x4, 6x6, 9x9)
  const [sudokuData, setSudokuData] = useState({ initial: Array(36).fill(0), solution: Array(36).fill(0), size: 6, boxRows: 2, boxCols: 3, maxDigit: 6 });
  const [sudokuGrid, setSudokuGrid] = useState(Array(36).fill(0));
  const [selectedSudokuCell, setSelectedSudokuCell] = useState(null);
  const [sudokuHistory, setSudokuHistory] = useState([]);
  const [notesMode, setNotesMode] = useState(false);
  const [sudokuNotes, setSudokuNotes] = useState(Array(36).fill([]));

  // Dynamic Wend Word Path State
  const [wendData, setWendData] = useState({ words: [], grid: [] });
  const [wendGrid, setWendGrid] = useState(Array(36).fill(null));
  const [wendUserPath, setWendUserPath] = useState([]);
  const [completedWords, setCompletedWords] = useState([]);
  const [revealedHintIndices, setRevealedHintIndices] = useState({});
  const [showWendHelp, setShowWendHelp] = useState(false);

  // Animations
  const borderFlashAnim = useRef(new Animated.Value(0)).current;

  const [elapsedTime, setElapsedTime] = useState(0);
  const gameStartTimeRef = useRef(null);

  useEffect(() => {
    if (screenMode.endsWith('_play')) {
      gameStartTimeRef.current = Date.now();
    }
  }, [screenMode]);

  const recordTimeTaken = () => {
    if (gameStartTimeRef.current) {
      const secs = Math.max(1, Math.floor((Date.now() - gameStartTimeRef.current) / 1000));
      setElapsedTime(secs);
    }
  };

  const formatTimeTaken = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const [gameScrollEnabled, setGameScrollEnabled] = useState(true);
  const gameScrollEnabledRef = useRef(true);

  const zipGrantPosRef = useRef({ x: 0, y: 0 });
  const wendGrantPosRef = useRef({ x: 0, y: 0 });
  const patchesGrantPosRef = useRef({ x: 0, y: 0 });

  const zipBoardSizeRef = useRef({ w: 0, h: 0 });
  const wendBoardSizeRef = useRef({ w: 0, h: 0 });
  const patchesBoardSizeRef = useRef({ w: 0, h: 0 });

  const lastTouchedIndexRef = useRef(null);

  // Callback refs — always point to latest handler without recreating PanResponder
  const zipCellTouchRef = useRef(null);
  const wendCellTouchRef = useRef(null);
  const patchesCellTouchRef = useRef(null);

  // Anti-jitter cooldown: prevents accidental backtracking right after adding a cell
  const lastCellAddedTimeRef = useRef(0);

  const processGridTouch = (posX, posY, gridCols, gridRows, sizeRef, callbackRef) => {
    const { w: bW, h: bH } = sizeRef.current;
    if (!bW || !bH) return;

    if (posX >= 0 && posX <= bW && posY >= 0 && posY <= bH) {
      const col = Math.min(Math.max(0, Math.floor((posX / bW) * gridCols)), gridCols - 1);
      const row = Math.min(Math.max(0, Math.floor((posY / bH) * gridRows)), gridRows - 1);
      const idx = row * gridCols + col;
      if (lastTouchedIndexRef.current !== idx) {
        lastTouchedIndexRef.current = idx;
        if (callbackRef.current) {
          callbackRef.current(idx);
        }
      }
    }
  };

  const setScrollLock = (locked) => {
    gameScrollEnabledRef.current = !locked;
    setGameScrollEnabled(!locked);
  };

  // STABLE Zip PanResponder — created ONCE, uses pixel-perfect local coordinates
  const zipPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt, gestureState) => {
        setScrollLock(true);
        lastTouchedIndexRef.current = null;
        const lx = evt.nativeEvent.locationX;
        const ly = evt.nativeEvent.locationY;
        zipGrantPosRef.current = { x: lx, y: ly };
        processGridTouch(lx, ly, 4, 4, zipBoardSizeRef, zipCellTouchRef);
      },
      onPanResponderMove: (evt, gestureState) => {
        const curX = zipGrantPosRef.current.x + gestureState.dx;
        const curY = zipGrantPosRef.current.y + gestureState.dy;
        processGridTouch(curX, curY, 4, 4, zipBoardSizeRef, zipCellTouchRef);
      },
      onPanResponderRelease: () => {
        setScrollLock(false);
        lastTouchedIndexRef.current = null;
      },
      onPanResponderTerminate: () => {
        setScrollLock(false);
        lastTouchedIndexRef.current = null;
      },
    })
  ).current;

  // STABLE Wend PanResponder — created ONCE, uses pixel-perfect local coordinates
  const wendPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt, gestureState) => {
        setScrollLock(true);
        lastTouchedIndexRef.current = null;
        const lx = evt.nativeEvent.locationX;
        const ly = evt.nativeEvent.locationY;
        wendGrantPosRef.current = { x: lx, y: ly };
        processGridTouch(lx, ly, 6, 6, wendBoardSizeRef, wendCellTouchRef);
      },
      onPanResponderMove: (evt, gestureState) => {
        const curX = wendGrantPosRef.current.x + gestureState.dx;
        const curY = wendGrantPosRef.current.y + gestureState.dy;
        processGridTouch(curX, curY, 6, 6, wendBoardSizeRef, wendCellTouchRef);
      },
      onPanResponderRelease: () => {
        setScrollLock(false);
        lastTouchedIndexRef.current = null;
      },
      onPanResponderTerminate: () => {
        setScrollLock(false);
        lastTouchedIndexRef.current = null;
      },
    })
  ).current;

  // STABLE Patches PanResponder — created ONCE, uses pixel-perfect local coordinates
  const patchesPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt, gestureState) => {
        setScrollLock(true);
        lastTouchedIndexRef.current = null;
        const lx = evt.nativeEvent.locationX;
        const ly = evt.nativeEvent.locationY;
        patchesGrantPosRef.current = { x: lx, y: ly };
        processGridTouch(lx, ly, 4, 4, patchesBoardSizeRef, patchesCellTouchRef);
      },
      onPanResponderMove: (evt, gestureState) => {
        const curX = patchesGrantPosRef.current.x + gestureState.dx;
        const curY = patchesGrantPosRef.current.y + gestureState.dy;
        processGridTouch(curX, curY, 4, 4, patchesBoardSizeRef, patchesCellTouchRef);
      },
      onPanResponderRelease: () => {
        setScrollLock(false);
        lastTouchedIndexRef.current = null;
      },
      onPanResponderTerminate: () => {
        setScrollLock(false);
        lastTouchedIndexRef.current = null;
      },
    })
  ).current;

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
    setCurrentQuestion(generateQuestion() || { questionStr: '1 + 1', answer: 2, type: 'addition' });
    setScreenMode('math_play');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setLeftTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          recordTimeTaken();
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
  // LINKEDIN ZIP LOGIC
  // ==========================================
  // Refs that mirror state so PanResponder callbacks always see latest values
  const zipVisitedRef = useRef([]);
  const zipDataRef = useRef({ labels: [], obstacles: [], path: [], totalWalkable: 14 });

  const startZipGame = () => {
    const newZip = generateZipGame() || { labels: Array(16).fill(''), obstacles: [], path: [], totalWalkable: 14, startIdx: 0 };
    setZipData(newZip);
    zipDataRef.current = newZip;
    const initial = [newZip.startIdx ?? 0];
    setZipVisited(initial);
    zipVisitedRef.current = initial;
    setZipErrorIndex(null);
    setShowZipHelp(false);
    setScreenMode('zip_play');
  };

  const handleZipCellPress = index => {
    const visited = zipVisitedRef.current;
    const data = zipDataRef.current;

    // If tapping an obstacle cell, block and vibrate
    if (data.obstacles && data.obstacles.includes(index)) {
      setZipErrorIndex(index);
      Vibration.vibrate(150);
      setTimeout(() => setZipErrorIndex(null), 500);
      return;
    }

    // Already at this cell — ignore (prevents duplicate triggers)
    if (visited.length > 0 && visited[visited.length - 1] === index) {
      return;
    }

    // Backtrack: dragging to the second-to-last cell removes the last step
    // BUT only if 300ms has passed since the last cell was added (anti-jitter)
    if (visited.length > 1 && visited[visited.length - 2] === index) {
      if (Date.now() - lastCellAddedTimeRef.current > 300) {
        const newVisited = visited.slice(0, -1);
        setZipVisited(newVisited);
        zipVisitedRef.current = newVisited;
        setZipErrorIndex(null);
      }
      return;
    }

    // If cell is already visited elsewhere in path, ignore
    if (visited.includes(index)) {
      return;
    }

    const lastIndex = visited[visited.length - 1];
    const gridSize = data.gridSize || 4;
    const row1 = Math.floor(lastIndex / gridSize);
    const col1 = lastIndex % gridSize;
    const row2 = Math.floor(index / gridSize);
    const col2 = index % gridSize;
    const isAdjacent = Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;

    if (isAdjacent) {
      const nextVisited = [...visited, index];
      setZipVisited(nextVisited);
      zipVisitedRef.current = nextVisited;
      lastCellAddedTimeRef.current = Date.now();
      setZipErrorIndex(null);

      // AUTOMATIC SUBMIT as soon as all walkable cells are connected!
      if (nextVisited.length === data.totalWalkable) {
        Vibration.vibrate([0, 100, 50, 100]);
        recordTimeTaken();
        setTimeout(() => setScreenMode('zip_summary'), 150);
      }
    } else {
      setZipErrorIndex(index);
      Vibration.vibrate(150);
      setTimeout(() => setZipErrorIndex(null), 500);
    }
  };

  // Keep callback ref always pointing to latest handler
  zipCellTouchRef.current = handleZipCellPress;

  const handleZipUndo = () => {
    if (zipVisited.length > 1) {
      setZipVisited(prev => prev.slice(0, -1));
      setZipErrorIndex(null);
    }
  };

  const handleZipReset = () => {
    setZipVisited([zipData.startIdx]);
    setZipErrorIndex(null);
  };

  const handleZipHint = () => {
    let matchLen = 0;
    while (matchLen < zipVisited.length && zipVisited[matchLen] === zipData.path[matchLen]) {
      matchLen++;
    }
    if (matchLen < zipData.path.length) {
      const nextPath = zipData.path.slice(0, matchLen + 1);
      setZipVisited(nextPath);
      setZipErrorIndex(null);
    }
  };

  const verifyZipSubmission = () => {
    const requiredCount = zipData.totalWalkable || 14;
    if (zipVisited.length !== requiredCount) {
      Vibration.vibrate(200);
      triggerBorderFlash('incorrect');
      return;
    }
    let isCorrect = true;
    for (let i = 0; i < zipData.path.length; i++) {
      if (zipVisited[i] !== zipData.path[i]) {
        isCorrect = false;
        break;
      }
    }
    if (zipVisited.length === zipData.totalWalkable) {
      Vibration.vibrate([0, 100, 50, 100]);
      recordTimeTaken();
      setScreenMode('zip_summary');
    } else {
      Vibration.vibrate(200);
      triggerBorderFlash('incorrect');
    }
  };

  // ==========================================
  // PATCHES (CRYSTAL FITTER) LOGIC
  // ==========================================
  const startPatchesGame = () => {
    const newPatches = generatePatchesGame();
    setPatchesData(newPatches);
    setPatchesGrid(Array(16).fill(0));
    setPatchesHistory([]);
    setScreenMode('patches_play');
  };

  const handlePatchesCellPress = index => {
    setPatchesHistory(prev => [...prev, [...patchesGrid]]);
    const next = [...patchesGrid];
    next[index] = (next[index] + 1) % (patchesData.shapesCount + 1);
    setPatchesGrid(next);

    // AUTOMATIC SUBMIT as soon as crystal grid is correctly fitted!
    if (next.every((val, idx) => val === patchesData.targetGrid[idx])) {
      Vibration.vibrate([0, 100, 50, 100]);
      recordTimeTaken();
      setTimeout(() => setScreenMode('patches_summary'), 150);
    }
  };

  // Keep callback ref always pointing to latest handler
  patchesCellTouchRef.current = handlePatchesCellPress;

  const handlePatchesUndo = () => {
    if (patchesHistory.length > 0) {
      setPatchesGrid(patchesHistory[patchesHistory.length - 1]);
      setPatchesHistory(prev => prev.slice(0, -1));
    }
  };

  const handlePatchesReset = () => {
    setPatchesGrid(Array(16).fill(0));
    setPatchesHistory([]);
  };

  const handlePatchesHint = () => {
    const emptyIdx = patchesGrid.findIndex((v, i) => v !== patchesData.targetGrid[i]);
    if (emptyIdx !== -1) {
      setPatchesHistory(prev => [...prev, [...patchesGrid]]);
      setPatchesGrid(prev => {
        const next = [...prev];
        next[emptyIdx] = patchesData.targetGrid[emptyIdx];
        return next;
      });
    }
  };

  const verifyPatchesSolution = () => {
    const isCorrect = patchesGrid.every(
      (val, idx) => val === patchesData.targetGrid[idx],
    );
    if (isCorrect) {
      Vibration.vibrate([0, 100, 50, 100]);
      recordTimeTaken();
      setScreenMode('patches_summary');
    } else {
      Vibration.vibrate(200);
      triggerBorderFlash('incorrect');
    }
  };

  // ==========================================
  // WEND (WORD PATH) LOGIC
  // ==========================================
  // Refs that mirror state so PanResponder callbacks always see latest values
  const wendUserPathRef = useRef([]);
  const wendGridRef = useRef(Array(36).fill(null));
  const wendDataRef = useRef({ words: [], grid: [] });
  const completedWordsRef = useRef([]);

  const startWendGame = () => {
    const newWend = generateWendGame() || { words: [], grid: Array(36).fill(null) };
    const grid = [...(newWend.grid || newWend.gridCells || Array(36).fill(null))];
    setWendData(newWend);
    wendDataRef.current = newWend;
    setWendGrid(grid);
    wendGridRef.current = grid;
    setWendUserPath([]);
    wendUserPathRef.current = [];
    setCompletedWords([]);
    completedWordsRef.current = [];
    setRevealedHintIndices({});
    setShowWendHelp(false);
    setScreenMode('wend_play');
  };

  const handleWendCellPress = index => {
    const grid = wendGridRef.current;
    const userPath = wendUserPathRef.current;
    const found = completedWordsRef.current;
    const data = wendDataRef.current;

    if (!grid[index] || grid[index].isBlockage) {
      return;
    }

    // Already at this cell — ignore (prevents duplicate triggers)
    if (userPath.length > 0 && userPath[userPath.length - 1] === index) {
      return;
    }

    // Backtrack: dragging to the second-to-last cell removes the last step
    // BUT only if 300ms has passed since the last cell was added (anti-jitter)
    if (userPath.length > 1 && userPath[userPath.length - 2] === index) {
      if (Date.now() - lastCellAddedTimeRef.current > 300) {
        const newPath = userPath.slice(0, -1);
        setWendUserPath(newPath);
        wendUserPathRef.current = newPath;
      }
      return;
    }

    // If cell is already visited elsewhere in path, ignore
    if (userPath.includes(index)) {
      return;
    }

    if (userPath.length === 0) {
      const newPath = [index];
      setWendUserPath(newPath);
      wendUserPathRef.current = newPath;
      lastCellAddedTimeRef.current = Date.now();
    } else {
      const lastIdx = userPath[userPath.length - 1];
      const r1 = Math.floor(lastIdx / 6);
      const c1 = lastIdx % 6;
      const r2 = Math.floor(index / 6);
      const c2 = index % 6;
      const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

      if (isAdjacent) {
        const nextPath = [...userPath, index];
        setWendUserPath(nextPath);
        wendUserPathRef.current = nextPath;
        lastCellAddedTimeRef.current = Date.now();

        const currentWordStr = nextPath.map(i => grid[i]?.letter || '').join('');
        let newFound = [...found];
        (data?.words || []).forEach((wObj, wIdx) => {
          if (wObj.word === currentWordStr && !newFound.includes(wIdx)) {
            newFound.push(wIdx);
            setCompletedWords(newFound);
            completedWordsRef.current = newFound;
            Vibration.vibrate(100);

            // AUTOMATIC SUBMIT as soon as all word paths are found!
            if (newFound.length === (data?.words || []).length) {
              Vibration.vibrate([0, 100, 50, 100]);
              recordTimeTaken();
              setTimeout(() => setScreenMode('wend_summary'), 150);
            }
          }
        });
      }
    }
  };

  // Keep callback ref always pointing to latest handler
  wendCellTouchRef.current = handleWendCellPress;

  const handleWendUndo = () => {
    const userPath = wendUserPathRef.current;
    if (userPath.length > 0) {
      const newPath = userPath.slice(0, -1);
      setWendUserPath(newPath);
      wendUserPathRef.current = newPath;
    }
  };

  const handleWendReset = () => {
    setWendUserPath([]);
    wendUserPathRef.current = [];
    setCompletedWords([]);
    completedWordsRef.current = [];
    setRevealedHintIndices({});
  };

  const handleWendHint = () => {
    const found = completedWordsRef.current;
    const data = wendDataRef.current;
    const uncompletedIdx = (data?.words || []).findIndex((_, idx) => !found.includes(idx));
    if (uncompletedIdx !== -1) {
      const currentCount = revealedHintIndices[uncompletedIdx] || 0;
      const targetWordObj = data.words[uncompletedIdx];
      if (currentCount < targetWordObj.word.length) {
        setRevealedHintIndices(prev => ({
          ...prev,
          [uncompletedIdx]: currentCount + 1,
        }));
        Vibration.vibrate(100);
      }
    }
  };

  const verifyWendSubmission = () => {
    if (completedWords.length === wendData.words.length) {
      Vibration.vibrate([0, 100, 50, 100]);
      recordTimeTaken();
      setScreenMode('wend_summary');
    } else {
      Vibration.vibrate(200);
      triggerBorderFlash('incorrect');
    }
  };

  // ==========================================
  // DYNAMIC MULTI-SIZE SUDOKU LOGIC (4x4 / 6x6 / 9x9)
  // ==========================================
  const startSudokuGame = () => {
    const newSudoku = generateDynamicSudokuGame() || { initial: Array(36).fill(0), solution: Array(36).fill(0), size: 6 };
    const initialArr = [...(newSudoku.initial || Array(36).fill(0))];
    setSudokuData(newSudoku);
    setSudokuGrid(initialArr);
    setSelectedSudokuCell(null);
    setSudokuHistory([]);
    setNotesMode(false);
    const totalCells = (newSudoku.size || 6) * (newSudoku.size || 6);
    setSudokuNotes(Array(totalCells).fill([]));
    setScreenMode('sudoku_play');
  };

  const handleSudokuCellPress = index => {
    setSelectedSudokuCell(index);
  };

  const handleSudokuNumberPress = num => {
    if (selectedSudokuCell === null) return;
    if (sudokuData.initial[selectedSudokuCell] !== 0) return;

    if (notesMode) {
      setSudokuNotes(prev => {
        const next = [...prev];
        const currentNotes = next[selectedSudokuCell] || [];
        if (currentNotes.includes(num)) {
          next[selectedSudokuCell] = currentNotes.filter(n => n !== num);
        } else {
          next[selectedSudokuCell] = [...currentNotes, num].sort();
        }
        return next;
      });
    } else {
      const newGrid = [...sudokuGrid];
      newGrid[selectedSudokuCell] = num;

      setSudokuHistory(prev => [...prev, [...sudokuGrid]]);
      setSudokuGrid(newGrid);

      // AUTOMATIC SUBMIT: Instant zero-delay completion as soon as all cells are filled!
      if (newGrid.every(v => v !== 0)) {
        Vibration.vibrate([0, 100, 50, 100]);
        recordTimeTaken();
        setScreenMode('sudoku_summary');
      }
    }
  };

  const verifySudokuSolution = () => {
    if (isValidSudokuBoard(sudokuGrid, sudokuData.size, sudokuData.boxRows, sudokuData.boxCols)) {
      Vibration.vibrate([0, 100, 50, 100]);
      recordTimeTaken();
      setScreenMode('sudoku_summary');
    } else {
      Vibration.vibrate(200);
      triggerBorderFlash('incorrect');
    }
  };

  const handleSudokuErase = () => {
    if (selectedSudokuCell === null) return;
    if (sudokuData.initial[selectedSudokuCell] !== 0) return;

    setSudokuHistory(prev => [...prev, [...sudokuGrid]]);
    setSudokuGrid(prev => {
      const next = [...prev];
      next[selectedSudokuCell] = 0;
      return next;
    });
    setSudokuNotes(prev => {
      const next = [...prev];
      next[selectedSudokuCell] = [];
      return next;
    });
  };

  const handleSudokuUndo = () => {
    if (sudokuHistory.length > 0) {
      const lastState = sudokuHistory[sudokuHistory.length - 1];
      setSudokuGrid(lastState);
      setSudokuHistory(prev => prev.slice(0, -1));
    }
  };

  const handleSudokuReset = () => {
    setSudokuGrid([...sudokuData.initial]);
    setSudokuHistory([]);
    setSudokuNotes(Array(36).fill([]));
  };

  const handleSudokuHint = () => {
    let targetIdx = selectedSudokuCell;
    if (targetIdx === null || sudokuData.initial[targetIdx] !== 0 || sudokuGrid[targetIdx] === sudokuData.solution[targetIdx]) {
      targetIdx = sudokuGrid.findIndex((v, i) => sudokuData.initial[i] === 0 && v !== sudokuData.solution[i]);
    }
    if (targetIdx !== -1 && targetIdx !== null) {
      setSelectedSudokuCell(targetIdx);
      setSudokuGrid(prev => {
        const next = [...prev];
        next[targetIdx] = sudokuData.solution[targetIdx];
        return next;
      });
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
    const isDisabled = !active || played;

    return (
      <TouchableOpacity
        disabled={isDisabled}
        onPress={onPress}
        style={[
          styles.gameCard,
          {
            backgroundColor: theme.dark ? '#1e293b' : '#ffffff',
            borderColor:
              active && !played ? color : played ? '#10b981' : '#e2e8f0',
          },
          isDisabled ? {opacity: 0.7} : null,
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
            {played
              ? 'Completed today! +5 XP earned. New puzzle tomorrow!'
              : subtitle}
          </Text>
        </View>
        <View style={styles.gameCardStatus}>
          {played ? (
            <View
              style={[
                styles.comingSoonTag,
                {backgroundColor: 'rgba(16,185,129,0.15)'},
              ]}>
              <Text style={[styles.comingSoonText, {color: '#10b981'}]}>
                SOLVED
              </Text>
            </View>
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

          {/* {renderGameCard(
            'patches',
            'Crystal Fitter (Patches)',
            'Tile the grid with crystal blocks matching sizes.',
            'shape-rectangle-plus',
            '#ec4899',
            true,
            () => setScreenMode('patches_intro'),
          )} */}

          {renderGameCard(
            'wend',
            'Wend (Word Path)',
            'Trace hidden word paths across colored grid territories.',
            'crosshairs-gps',
            '#6366f1',
            true,
            () => setScreenMode('wend_intro'),
          )}

          {renderGameCard(
            'sudoku',
            'Mind Matrix Sudoku',
            'Challenge your grid logic on a Sudoku matrix.',
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
              <View style={{
                backgroundColor: 'rgba(0,139,139,0.1)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center',
              }}>
                <Micon name="clock-outline" size={18} color="#008b8b" style={{marginRight: 6}} />
                <Text style={{fontWeight: 'bold', color: '#008b8b', fontSize: 14}}>
                  Time Taken: {formatTimeTaken(elapsedTime)}
                </Text>
              </View>
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
        <ScrollView scrollEnabled={gameScrollEnabled} contentContainerStyle={styles.scrollContent}>
          {/* Studify Zip Header Bar */}
          <View style={styles.zipHeaderRow}>
            <View style={styles.zipTitleGroup}>
              <Micon name="transit-connection-variant" size={24} color="#8b5cf6" style={{marginRight: 8}} />
              <Text style={[styles.zipMainTitle, {color: theme.dark ? '#ffffff' : '#1f2937'}]}>
                Constellation Path
              </Text>
            </View>
            <View style={styles.zipHeaderControls}>
              <TouchableOpacity
                onPress={() => setShowZipHelp(prev => !prev)}
                style={styles.zipIconButton}>
                <Micon name="help-circle-outline" size={22} color={theme.dark ? '#ffffff' : '#4b5563'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleZipReset}
                style={[styles.zipResetPill, {backgroundColor: theme.dark ? '#1e293b' : '#e2e8f0'}]}>
                <Text style={[styles.zipResetText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LinkedIn Zip Board Grid */}
          <View style={[styles.zipBoardWrapper, {backgroundColor: theme.dark ? '#0f172a' : '#ffffff'}]}>
            <View
              onLayout={e => {
                zipBoardSizeRef.current = {
                  w: e.nativeEvent.layout.width,
                  h: e.nativeEvent.layout.height,
                };
              }}
              {...zipPanResponder.panHandlers}
              style={styles.gridContainer4x4}>
              {(zipData?.labels || []).map((val, idx) => {
                const isObstacle = zipData?.obstacles && zipData.obstacles.includes(idx);
                const isVisited = zipVisited.includes(idx);
                const stepOrder = zipVisited.indexOf(idx);
                const isLast = zipVisited[zipVisited.length - 1] === idx;
                const isError = zipErrorIndex === idx;

                const colorsArr = ['#ea580c', '#f97316', '#eab308', '#d97706', '#ca8a04', '#c2410c'];
                const pipeColor = isVisited ? colorsArr[stepOrder % colorsArr.length] : '#f1f5f9';

                if (isObstacle) {
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.gridCell4x4,
                        {
                          backgroundColor: theme.dark ? '#1e293b' : '#334155',
                          borderColor: theme.dark ? '#0f172a' : '#1e293b',
                        },
                      ]}>
                      <Micon name="close-octagon-outline" size={22} color="#94a3b8" />
                    </View>
                  );
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => handleZipCellPress(idx)}
                    style={[
                      styles.gridCell4x4,
                      {
                        backgroundColor: isError
                          ? '#ef4444'
                          : isVisited
                          ? pipeColor
                          : theme.dark
                          ? '#1e293b'
                          : '#f8fafc',
                        borderColor: isVisited ? pipeColor : theme.dark ? '#334155' : '#e2e8f0',
                      },
                    ]}>
                    <View style={{justifyContent: 'center', alignItems: 'center', flex: 1, width: '100%', height: '100%'}} pointerEvents="none">
                      {val !== '' ? (
                        <View style={[
                          styles.zipNumberDot,
                          {
                            backgroundColor: isVisited ? '#000000' : '#1e293b',
                            borderColor: isLast ? '#ffffff' : '#000000',
                            borderWidth: isLast ? 2 : 0,
                          }
                        ]}>
                          <Text style={styles.zipNumberText}>{val}</Text>
                        </View>
                      ) : isVisited ? (
                        <View style={styles.zipPathDot} />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Undo & Hint Action Row */}
          <View style={styles.zipActionRow}>
            <TouchableOpacity
              onPress={handleZipUndo}
              style={[styles.zipPillButton, {backgroundColor: theme.dark ? '#1e293b' : '#e2e8f0'}]}>
              <Text style={[styles.zipPillText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleZipHint}
              style={[styles.zipPillButton, {backgroundColor: theme.dark ? '#1e293b' : '#e2e8f0'}]}>
              <Text style={[styles.zipPillText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Hint</Text>
            </TouchableOpacity>
          </View>

          {/* Expandable How to Play Drawer */}
          <View style={[styles.zipHelpCard, {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'}]}>
            <TouchableOpacity
              onPress={() => setShowZipHelp(prev => !prev)}
              style={styles.zipHelpHeaderRow}>
              <Text style={[styles.zipHelpTitle, {color: theme.dark ? '#ffffff' : '#1f2937'}]}>
                How to play
              </Text>
              <Micon name={showZipHelp ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
            </TouchableOpacity>

            {showZipHelp && (
              <View style={styles.zipHelpContent}>
                <View style={styles.zipHelpRuleRow}>
                  <View style={styles.zipRuleIconBox}>
                    <View style={styles.miniDotBlack}><Text style={styles.miniDotText}>1</Text></View>
                    <View style={styles.miniDotBlack}><Text style={styles.miniDotText}>2</Text></View>
                    <View style={styles.miniDotBlack}><Text style={styles.miniDotText}>3</Text></View>
                  </View>
                  <Text style={[styles.zipRuleDesc, {color: theme.dark ? '#cbd5e1' : '#4b5563'}]}>
                    Connect the dots in order
                  </Text>
                </View>

                <View style={styles.zipHelpRuleRow}>
                  <View style={styles.zipRuleIconBox}>
                    <Micon name="grid" size={24} color="#f97316" />
                  </View>
                  <Text style={[styles.zipRuleDesc, {color: theme.dark ? '#cbd5e1' : '#4b5563'}]}>
                    Fill every cell
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Bottom See Results / Submit Button */}
          <TouchableOpacity
            onPress={verifyZipSubmission}
            style={[styles.zipSubmitButton, {backgroundColor: '#8b5cf6'}]}>
            <Text style={styles.zipSubmitButtonText}>Submit Path Solution</Text>
          </TouchableOpacity>
        </ScrollView>
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
              <View style={{
                backgroundColor: 'rgba(139,92,246,0.1)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center',
              }}>
                <Micon name="clock-outline" size={18} color="#8b5cf6" style={{marginRight: 6}} />
                <Text style={{fontWeight: 'bold', color: '#8b5cf6', fontSize: 14}}>
                  Time Taken: {formatTimeTaken(elapsedTime)}
                </Text>
              </View>
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
          PATCHES (CRYSTAL FITTER) SCREENS (DISABLED)
          ========================================== */}
      {/* {screenMode === 'patches_intro' && (
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
        <ScrollView scrollEnabled={gameScrollEnabled} contentContainerStyle={styles.scrollContent}>
          <View style={styles.zipHeaderRow}>
            <View style={styles.zipTitleGroup}>
              <Micon name="shape-rectangle-plus" size={24} color="#ec4899" style={{marginRight: 8}} />
              <Text style={[styles.zipMainTitle, {color: theme.dark ? '#ffffff' : '#1f2937'}]}>
                Crystal Fitter
              </Text>
            </View>
            <View style={styles.zipHeaderControls}>
              <TouchableOpacity
                onPress={handlePatchesReset}
                style={[styles.zipResetPill, {backgroundColor: theme.dark ? '#1e293b' : '#e2e8f0'}]}>
                <Text style={[styles.zipResetText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.zipBoardWrapper, {backgroundColor: theme.dark ? '#0f172a' : '#ffffff'}]}>
            <View
              onLayout={e => {
                patchesBoardSizeRef.current = {
                  w: e.nativeEvent.layout.width,
                  h: e.nativeEvent.layout.height,
                };
              }}
              {...patchesPanResponder.panHandlers}
              style={styles.gridContainer4x4}>
              {patchesGrid.map((val, idx) => {
                const clue = patchesData.clues ? patchesData.clues[idx] : null;
                const cellColor = val === 0
                  ? (theme.dark ? '#1e293b' : '#f8fafc')
                  : patchesData.palette[(val - 1) % patchesData.palette.length];

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => handlePatchesCellPress(idx)}
                    style={[
                      styles.gridCell4x4,
                      {
                        backgroundColor: cellColor,
                        borderColor: val !== 0 ? cellColor : (theme.dark ? '#334155' : '#cbd5e1'),
                      },
                    ]}>
                    {clue ? (
                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Text style={{fontWeight: 'bold', fontSize: 14, color: '#ffffff'}}>
                          {clue}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.zipActionRow}>
            <TouchableOpacity
              onPress={handlePatchesUndo}
              style={[styles.zipPillButton, {backgroundColor: theme.dark ? '#1e293b' : '#f8fafc'}]}>
              <Micon name="undo" size={18} color={theme.dark ? '#ffffff' : '#4b5563'} style={{marginRight: 6}} />
              <Text style={[styles.zipPillText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePatchesHint}
              style={[styles.zipPillButton, {backgroundColor: theme.dark ? '#1e293b' : '#f8fafc'}]}>
              <Micon name="lightbulb-outline" size={18} color={theme.dark ? '#ffffff' : '#4b5563'} style={{marginRight: 6}} />
              <Text style={[styles.zipPillText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Hint</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.zipHelpCard, {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'}]}>
            <Text style={[styles.zipHelpTitle, {color: theme.dark ? '#ffffff' : '#1f2937'}, {marginBottom: 10}]}>
              Complete each shape to fill the grid
            </Text>
            <View style={{gap: 8}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Micon name="square" size={18} color="#ec4899" />
                <Text style={{fontSize: 13, color: theme.dark ? '#cbd5e1' : '#4b5563'}}>Square (2x2)</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Micon name="rectangle" size={18} color="#3b82f6" />
                <Text style={{fontSize: 13, color: theme.dark ? '#cbd5e1' : '#4b5563'}}>Wide & Tall Rectangles</Text>
              </View>
              <Text style={{fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4}}>
                If a shape has a number, it must be that size.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={verifyPatchesSolution}
            style={[styles.zipSubmitButton, {backgroundColor: '#ec4899'}]}>
            <Text style={styles.zipSubmitButtonText}>Submit Crystal Solution</Text>
          </TouchableOpacity>
        </ScrollView>
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
                Crystal Grid Fitted!
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                You fitted all crystal shapes correctly into the grid.
              </Text>
              <View style={{
                backgroundColor: 'rgba(236,72,153,0.1)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center',
              }}>
                <Micon name="clock-outline" size={18} color="#ec4899" style={{marginRight: 6}} />
                <Text style={{fontWeight: 'bold', color: '#ec4899', fontSize: 14}}>
                  Time Taken: {formatTimeTaken(elapsedTime)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => finishGameSession('patches')}
                style={[styles.startButton, {backgroundColor: '#10b981'}]}>
                <Text style={styles.startButtonText}>Claim +5 XP \& Exit</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )} */}

      {/* ==========================================
          WEND (WORD PATH) SCREENS
          ========================================== */}
      {screenMode === 'wend_intro' && (
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
                  {backgroundColor: 'rgba(99,102,241,0.1)'},
                ]}>
                <Micon name="crosshairs-gps" size={48} color="#6366f1" />
              </View>
              <Text
                style={[
                  styles.setupTitle,
                  {color: theme.dark ? '#ffffff' : '#1f2937'},
                ]}>
                Wend (Word Path)
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                Trace hidden word paths across colored grid territories. Follow directional
                arrows from starting letters.
              </Text>
              <TouchableOpacity
                onPress={startWendGame}
                style={[styles.startButton, {backgroundColor: '#6366f1'}]}>
                <Text style={styles.startButtonText}>Start Word Path</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {screenMode === 'wend_play' && (
        <ScrollView scrollEnabled={gameScrollEnabled} contentContainerStyle={styles.scrollContent}>
          {/* Studify Header */}
          <View style={styles.zipHeaderRow}>
            <View style={styles.zipTitleGroup}>
              <Micon name="crosshairs-gps" size={24} color="#6366f1" style={{marginRight: 8}} />
              <Text style={[styles.zipMainTitle, {color: theme.dark ? '#ffffff' : '#1f2937'}]}>
                Wend (Word Path)
              </Text>
            </View>
            <View style={styles.zipHeaderControls}>
              <TouchableOpacity
                onPress={handleWendReset}
                style={[styles.zipResetPill, {backgroundColor: theme.dark ? '#1e293b' : '#e2e8f0'}]}>
                <Text style={[styles.zipResetText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 6x6 Grid with Territory Colors, Blockage Walls & Start Checkmarks */}
          <View style={[styles.sudokuBoardOuterContainer, {backgroundColor: theme.dark ? '#0f172a' : '#ffffff', padding: 6}]}>
            <View
              onLayout={e => {
                wendBoardSizeRef.current = {
                  w: e.nativeEvent.layout.width,
                  h: e.nativeEvent.layout.height,
                };
              }}
              {...wendPanResponder.panHandlers}
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                width: width - 72,
                height: width - 72,
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {(wendGrid || []).map((cell, idx) => {
                const isSelected = wendUserPath.includes(idx);
                const isWordSolved = cell && cell.wordIdx !== undefined && cell.wordIdx !== -1 && completedWords.includes(cell.wordIdx);
                const cellDim = (width - 72) / 6;

                if (cell && cell.isBlockage) {
                  return (
                    <View
                      key={idx}
                      style={{
                        width: cellDim,
                        height: cellDim,
                        backgroundColor: theme.dark ? '#0f172a' : '#334155',
                        borderColor: theme.dark ? '#1e293b' : '#1e293b',
                        borderWidth: 1,
                        borderRadius: 6,
                      }}
                    />
                  );
                }

                const bgStyle = isSelected
                  ? '#6366f1'
                  : isWordSolved
                  ? '#10b981'
                  : theme.dark ? '#1e293b' : '#ffffff';

                const textStyle = (isSelected || isWordSolved)
                  ? '#ffffff'
                  : theme.dark ? '#f8fafc' : '#1e293b';

                return (
                  <View
                    key={idx}
                    style={[
                      {
                        width: cellDim,
                        height: cellDim,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: bgStyle,
                        borderColor: theme.dark ? '#0f172a' : '#cbd5e1',
                        borderWidth: 1,
                        borderRadius: 8,
                      },
                    ]}>
                    <View style={{justifyContent: 'center', alignItems: 'center'}} pointerEvents="none">
                      <Text style={{fontSize: 17, fontWeight: 'bold', color: textStyle}}>
                        {cell ? cell.letter : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Word List Rendered as Hidden Letter Square Tiles until found */}
          <View style={{gap: 8, alignItems: 'center', marginBottom: 16}}>
            {(wendData?.words || []).map((wObj, wIdx) => {
              const isFound = completedWords.includes(wIdx);
              const revealedCount = revealedHintIndices[wIdx] || 0;
              const lettersArr = (wObj?.word || '').split('');

              return (
                <View key={wIdx} style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  {lettersArr.map((char, cIdx) => {
                    const isLetterRevealed = isFound || cIdx < revealedCount;

                    return (
                      <View
                        key={cIdx}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: isFound
                            ? '#10b981'
                            : isLetterRevealed
                            ? 'rgba(99,102,241,0.2)'
                            : (theme.dark ? '#1e293b' : '#e2e8f0'),
                          borderColor: isFound
                            ? '#10b981'
                            : isLetterRevealed
                            ? '#6366f1'
                            : (wObj?.color || '#6366f1'),
                          borderWidth: isFound ? 0 : 1.5,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: isFound
                              ? '#ffffff'
                              : isLetterRevealed
                              ? '#6366f1'
                              : (theme.dark ? '#64748b' : '#94a3b8'),
                          }}>
                          {isLetterRevealed ? char : '?'}
                        </Text>
                      </View>
                    );
                  })}
                  {isFound ? (
                    <Micon name="check-bold" size={18} color="#10b981" style={{marginLeft: 4}} />
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Action Row: Undo & Hint */}
          <View style={styles.sudokuActionRow}>
            <TouchableOpacity
              onPress={handleWendUndo}
              style={[styles.zipPillButton, {backgroundColor: theme.dark ? '#1e293b' : '#f8fafc'}]}>
              <Micon name="undo" size={18} color={theme.dark ? '#ffffff' : '#4b5563'} style={{marginRight: 6}} />
              <Text style={[styles.zipPillText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleWendHint}
              style={[styles.zipPillButton, {backgroundColor: theme.dark ? '#1e293b' : '#f8fafc'}]}>
              <Micon name="lightbulb-outline" size={18} color={theme.dark ? '#ffffff' : '#4b5563'} style={{marginRight: 6}} />
              <Text style={[styles.zipPillText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Hint</Text>
            </TouchableOpacity>
          </View>

          {/* Expandable How to Play Drawer */}
          <TouchableOpacity
            onPress={() => setShowWendHelp(prev => !prev)}
            style={[styles.zipHelpCard, {backgroundColor: theme.dark ? '#1e293b' : '#ffffff'}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={[styles.zipHelpTitle, {color: theme.dark ? '#ffffff' : '#1f2937'}]}>How to play</Text>
              <Micon name={showWendHelp ? 'chevron-up' : 'chevron-down'} size={20} color={theme.dark ? '#ffffff' : '#4b5563'} />
            </View>
            {showWendHelp && (
              <View style={{marginTop: 10, gap: 6}}>
                <Text style={{fontSize: 12, color: theme.dark ? '#cbd5e1' : '#4b5563'}}>
                  1. Trace adjacent letter cells starting from circled letters.
                </Text>
                <Text style={{fontSize: 12, color: theme.dark ? '#cbd5e1' : '#4b5563'}}>
                  2. Follow directional arrows (&gt;, &lt;, ^, v) to form target words.
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={verifyWendSubmission}
            style={[styles.zipSubmitButton, {backgroundColor: '#6366f1'}]}>
            <Text style={styles.zipSubmitButtonText}>Submit Word Paths</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {screenMode === 'wend_summary' && (
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
                Word Paths Solved!
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                All hidden words successfully traced on the grid.
              </Text>
              <View style={{
                backgroundColor: 'rgba(99,102,241,0.1)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center',
              }}>
                <Micon name="clock-outline" size={18} color="#6366f1" style={{marginRight: 6}} />
                <Text style={{fontWeight: 'bold', color: '#6366f1', fontSize: 14}}>
                  Time Taken: {formatTimeTaken(elapsedTime)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => finishGameSession('wend')}
                style={[styles.startButton, {backgroundColor: '#10b981'}]}>
                <Text style={styles.startButtonText}>Claim +5 XP \& Exit</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* ==========================================
          LINKEDIN MINI SUDOKU SCREENS (6x6)
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
                Mind Matrix Sudoku
              </Text>
              <Text
                style={[
                  styles.setupSubtitle,
                  {color: theme.dark ? '#94a3b8' : '#64748b'},
                ]}>
                Solve the dynamic logic matrix. Fill rows, columns, and region
                boxes with digits without duplicates.
              </Text>
              <TouchableOpacity
                onPress={startSudokuGame}
                style={[styles.startButton, {backgroundColor: '#f59e0b'}]}>
                <Text style={styles.startButtonText}>Start Mini Sudoku</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {screenMode === 'sudoku_play' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Studify Sudoku Header */}
          <View style={styles.zipHeaderRow}>
            <View style={styles.zipTitleGroup}>
              <Micon name="grid" size={24} color="#f59e0b" style={{marginRight: 8}} />
              <Text style={[styles.zipMainTitle, {color: theme.dark ? '#ffffff' : '#1f2937'}]}>
                Mind Matrix Sudoku
              </Text>
            </View>
            <View style={styles.zipHeaderControls}>
              <TouchableOpacity
                onPress={handleSudokuReset}
                style={[styles.zipResetPill, {backgroundColor: theme.dark ? '#1e293b' : '#e2e8f0'}]}>
                <Text style={[styles.zipResetText, {color: theme.dark ? '#ffffff' : '#4b5563'}]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dynamic Sudoku Board Grid */}
          <View style={styles.sudokuBoardOuterContainer}>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              width: width - 72,
              height: width - 72,
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {sudokuGrid.map((val, idx) => {
                const isOriginal = sudokuData.initial[idx] !== 0;
                const isSelected = selectedSudokuCell === idx;
                const size = sudokuData.size;
                const r = Math.floor(idx / size);
                const c = idx % size;

                const isBoxRight = (c + 1) % sudokuData.boxCols === 0 && c !== size - 1;
                const isBoxBottom = (r + 1) % sudokuData.boxRows === 0 && r !== size - 1;

                const cellDim = (width - 72) / size;
                const fontSz = size === 9 ? 14 : size === 6 ? 19 : 22;

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => handleSudokuCellPress(idx)}
                    style={[
                      {
                        width: cellDim,
                        height: cellDim,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: isSelected
                          ? 'rgba(10,102,194,0.15)'
                          : isOriginal
                          ? theme.dark ? '#1e293b' : '#f8fafc'
                          : theme.dark ? '#0f172a' : '#ffffff',
                        borderColor: isSelected ? '#0a66c2' : '#cbd5e1',
                        borderRightWidth: isBoxRight ? 2.5 : 1,
                        borderBottomWidth: isBoxBottom ? 2.5 : 1,
                        borderRightColor: isBoxRight ? (theme.dark ? '#ffffff' : '#1f2937') : '#cbd5e1',
                        borderBottomColor: isBoxBottom ? (theme.dark ? '#ffffff' : '#1f2937') : '#cbd5e1',
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: fontSz,
                        fontWeight: isOriginal ? 'bold' : '600',
                        color: isOriginal
                          ? theme.dark ? '#ffffff' : '#1f2937'
                          : '#0a66c2',
                      }}>
                      {val === 0 ? '' : val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Row: Hint & Notes */}
          <View style={styles.sudokuActionRow}>
            <TouchableOpacity
              onPress={handleSudokuHint}
              style={[styles.zipPillButton, {backgroundColor: theme.dark ? '#1e293b' : '#f8fafc'}]}>
              <Micon name="lightbulb-outline" size={18} color={theme.dark ? '#ffffff' : '#1f2937'} style={{marginRight: 6}} />
              <Text style={[styles.zipPillText, {color: theme.dark ? '#ffffff' : '#1f2937'}]}>Hint</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setNotesMode(prev => !prev)}
              style={[styles.zipPillButton, {backgroundColor: notesMode ? 'rgba(10,102,194,0.15)' : theme.dark ? '#1e293b' : '#f8fafc'}]}>
              <Micon name="pencil" size={18} color={notesMode ? '#0a66c2' : theme.dark ? '#ffffff' : '#1f2937'} style={{marginRight: 6}} />
              <Text style={[styles.zipPillText, {color: notesMode ? '#0a66c2' : theme.dark ? '#ffffff' : '#1f2937'}]}>
                Notes {notesMode ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Sudoku Keypad (1 to maxDigit + Erase + Undo) */}
          <View style={styles.sudokuKeypadWrapper}>
            <View style={styles.sudokuKeypadRow}>
              {Array.from({ length: Math.ceil(sudokuData.maxDigit / 2) }, (_, i) => i + 1).map(num => (
                <TouchableOpacity
                  key={num}
                  onPress={() => handleSudokuNumberPress(num)}
                  style={[styles.sudokuKeypadButton, {backgroundColor: theme.dark ? '#1e293b' : '#f1f5f9'}]}>
                  <Text style={[styles.sudokuKeypadText, {color: theme.dark ? '#ffffff' : '#1f2937'}]}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={handleSudokuErase}
                style={[styles.sudokuKeypadButton, {backgroundColor: theme.dark ? '#1e293b' : '#f1f5f9'}]}>
                <Micon name="close" size={18} color="#ef4444" />
                <Text style={{fontSize: 9, color: '#ef4444', fontWeight: 'bold'}}>Erase</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sudokuKeypadRow}>
              {Array.from({ length: Math.floor(sudokuData.maxDigit / 2) }, (_, i) => i + Math.ceil(sudokuData.maxDigit / 2) + 1).map(num => (
                <TouchableOpacity
                  key={num}
                  onPress={() => handleSudokuNumberPress(num)}
                  style={[styles.sudokuKeypadButton, {backgroundColor: theme.dark ? '#1e293b' : '#f1f5f9'}]}>
                  <Text style={[styles.sudokuKeypadText, {color: theme.dark ? '#ffffff' : '#1f2937'}]}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={handleSudokuUndo}
                style={[styles.sudokuKeypadButton, {backgroundColor: theme.dark ? '#1e293b' : '#f1f5f9'}]}>
                <Micon name="undo" size={18} color="#64748b" />
                <Text style={{fontSize: 9, color: '#64748b', fontWeight: 'bold'}}>Undo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={verifySudokuSolution}
            style={[styles.zipSubmitButton, {backgroundColor: '#f59e0b', marginTop: 12}]}>
            <Text style={styles.zipSubmitButtonText}>Submit Sudoku Solution</Text>
          </TouchableOpacity>
        </ScrollView>
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
              <View style={{
                backgroundColor: 'rgba(245,158,11,0.1)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center',
              }}>
                <Micon name="clock-outline" size={18} color="#f59e0b" style={{marginRight: 6}} />
                <Text style={{fontWeight: 'bold', color: '#f59e0b', fontSize: 14}}>
                  Time Taken: {formatTimeTaken(elapsedTime)}
                </Text>
              </View>
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
  // LinkedIn Zip Custom Styles
  zipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  zipTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zipMainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  zipHeaderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zipIconButton: {
    padding: 6,
  },
  zipResetPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  zipResetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  zipBoardWrapper: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  zipGridCell: {
    width: (width - 110) / 3,
    height: (width - 110) / 3,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zipNumberDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  zipNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zipPathDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
  },
  zipActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  zipPillButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  zipPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  zipHelpCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  zipHelpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zipHelpTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  zipHelpContent: {
    marginTop: 14,
    gap: 12,
  },
  zipHelpRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zipRuleIconBox: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    width: 80,
  },
  miniDotBlack: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniDotText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  zipRuleDesc: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  zipSubmitButton: {
    backgroundColor: '#1f2937',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    elevation: 2,
  },
  zipSubmitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // LinkedIn 6x6 Mini Sudoku Styles
  sudokuBoardOuterContainer: {
    padding: 8,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1f2937',
    alignSelf: 'center',
    marginBottom: 16,
  },
  gridContainer6x6: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width - 80,
    height: width - 80,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCell6x6: {
    width: (width - 80) / 6,
    height: (width - 80) / 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sudokuActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sudokuKeypadWrapper: {
    width: '100%',
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  sudokuKeypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sudokuKeypadButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  sudokuKeypadText: {
    fontSize: 22,
    fontWeight: '600',
  },
});
