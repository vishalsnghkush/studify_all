import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput as RNTextInput,
} from 'react-native';
import {useTheme, ActivityIndicator, Card} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import { SvgXml } from 'react-native-svg';
import {trackEngagement, setRecentNote, getTopEngagedSubjects} from '../../../Utils/EngagementTracker';

import { PremiumLoader } from '../../../Components/PremiumLoader';

// App components
import {Screen} from '../../../Components/Screen';
import {Text} from '../../../Components/Input';
import {CurriculumSelector} from '../../../Components/CurriculumSelector';
import GlassButton from '../../../Components/Input/GlassButton';
import GlassDropdown from '../../../Components/Input/GlassDropdown';

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
  {label: 'Science (General)', value: 'Science'},
  {label: 'Social Studies', value: 'Social Studies'},
];

const OPENROUTER_API_KEY =
  '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';

export default function AiNotesGenerator({ route }) {
  const theme = useTheme();
  const navigation = useNavigation();

  // Screen State: 'setup' | 'library' | 'generating' | 'viewing'
  const [currentTab, setCurrentTab] = useState('generate'); // 'generate' | 'library'
  const [appState, setAppState] = useState('setup'); // 'setup' | 'generating' | 'viewing'

  // Form inputs
  const [board, setBoard] = useState('CBSE');
  const [studentClass, setStudentClass] = useState('Class 10');
  const [stream, setStream] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [notesLength, setNotesLength] = useState('Detailed');

  // Active notes content
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [activeNotesTitle, setActiveNotesTitle] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  // Library state
  const [savedNotes, setSavedNotes] = useState([]);
  const [topSubject, setTopSubject] = useState('');

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const top = await getTopEngagedSubjects(1);
        if (top && top.length > 0) {
          setTopSubject(top[0]);
        }
      } catch (e) {
        console.log('Error loading recommendations in notes generator', e);
      }
    };
    if (appState === 'setup') {
      fetchRecommendation();
    }
  }, [appState]);

  // Load saved notes library on start
  useEffect(() => {
    loadSavedNotes();
  }, []);

  // Read navigation parameters (autofill)
  useEffect(() => {
    if (route?.params?.subject) {
      const formatted = route.params.subject.charAt(0).toUpperCase() + route.params.subject.slice(1);
      setSubject(formatted);
    }
    if (route?.params?.topic) {
      setTopic(route.params.topic);
    }
  }, [route?.params]);

  const loadSavedNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem('@studify_saved_notes');
      if (stored) {
        setSavedNotes(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed to load saved notes', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!generatedNotes) {
      return;
    }
    try {
      const newNote = {
        id: 'note_' + Date.now(),
        title: activeNotesTitle || `${topic} - ${subtopic}` || 'AI Study Guide',
        board,
        studentClass,
        subject,
        topic,
        subtopic,
        content: generatedNotes,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      };

      const updated = [newNote, ...savedNotes];
      setSavedNotes(updated);
      await AsyncStorage.setItem(
        '@studify_saved_notes',
        JSON.stringify(updated),
      );
      Alert.alert(
        'Saved!',
        'This study guide has been added to your local library.',
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to save notes.');
    }
  };

  const handleDeleteNote = async id => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to remove this note from your library?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = savedNotes.filter(n => n.id !== id);
              setSavedNotes(updated);
              await AsyncStorage.setItem(
                '@studify_saved_notes',
                JSON.stringify(updated),
              );
            } catch (_) {}
          },
        },
      ],
    );
  };

  const handleOpenSavedNote = note => {
    setBoard(note.board);
    setStudentClass(note.studentClass || 'Class 10');
    setSubject(note.subject);
    setTopic(note.topic);
    setSubtopic(note.subtopic);
    setGeneratedNotes(note.content);
    setActiveNotesTitle(note.title);
    setAppState('viewing');
  };

  const resilientOpenRouterFetch = async (
    systemPrompt,
    userPrompt,
    temperature,
  ) => {
    try {
      let response = await fetch(
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
            temperature: temperature,
          }),
        },
      );

      if (!response.ok) {
        response = await fetch(
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
              temperature: temperature,
            }),
          },
        );
      }

      return response;
    } catch (e) {
      return await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          temperature: temperature,
        }),
      });
    }
  };

  const triggerGeneration = async () => {
    if (!topic.trim()) {
      Alert.alert('Topic Required', 'Please enter a study topic.');
      return;
    }

    setAppState('generating');
    setGeneratedNotes('');
    setLoadingMessage('Creating syllabus outline...');

    trackEngagement(subject || 'General', 'note');
    setRecentNote({
      name: topic.trim(),
      subject: subject,
      type: 'note',
      board: board,
      class: studentClass,
      subtopic: subtopic.trim() || ''
    });

    const targetSubtopic = subtopic.trim() ? ` (${subtopic.trim()})` : '';
    const fullTopicTitle = `${topic.trim()}${targetSubtopic}`;
    setActiveNotesTitle(fullTopicTitle);

    try {
      // Step 1: Curriculum Planning (Subtopics Planner)
      const plannerSystemPrompt =
        'You are an expert academic curriculum planner.\n' +
        'Given a study topic, break it down into a list of 4 to 6 logical, sequential subtopics (ordered from easiest to most advanced) suitable for a detailed textbook chapter.\n' +
        'RESPONSE FORMAT: You MUST return ONLY a JSON array of strings containing the subtopic names. Do not wrap in markdown or code blocks. Nothing else.';

      const plannerUserPrompt =
        `Plan subtopics for:\n` +
        `- Board/Exam: ${board}\n` +
        `- Class Level: ${studentClass}\n` +
        `- Subject: ${subject}\n` +
        `- Main Topic: ${topic.trim()}\n` +
        `- Subtopic Focus: ${subtopic.trim() || 'General overview'}`;

      const plannerResponse = await resilientOpenRouterFetch(
        plannerSystemPrompt,
        plannerUserPrompt,
        0.1,
      );

      if (!plannerResponse.ok) {
        throw new Error('Curriculum planner failed');
      }

      const plannerResJson = await plannerResponse.json();
      let rawPlannerText =
        plannerResJson.choices?.[0]?.message?.content || '[]';
      rawPlannerText = rawPlannerText.trim();

      // Clean markdown code fences if included
      if (rawPlannerText.startsWith('```json')) {
        rawPlannerText = rawPlannerText
          .replace(/^```json\n?/, '')
          .replace(/\n?```$/, '');
      } else if (rawPlannerText.startsWith('```')) {
        rawPlannerText = rawPlannerText
          .replace(/^```\n?/, '')
          .replace(/\n?```$/, '');
      }
      rawPlannerText = rawPlannerText.trim();

      const match = rawPlannerText.match(/\[[\s\S]*\]/);
      const cleanJson = match ? match[0] : '[]';
      let subtopics = JSON.parse(cleanJson);

      if (!Array.isArray(subtopics) || subtopics.length === 0) {
        subtopics = [
          'Introduction & Basic Concepts',
          'Key Theories & Mechanisms',
          'Physical & Chemical Properties',
          'Advanced Applications & Exceptions',
        ];
      }

      let notesContent = '';

      // Step 2: Sequential Section Writer
      for (let i = 0; i < subtopics.length; i++) {
        const subtopicTitle = subtopics[i];
        setLoadingMessage(
          `Writing Section ${i + 1} of ${
            subtopics.length
          }:\n${subtopicTitle}...`,
        );

        const isShort = notesLength === 'Short';
        const sectionSystemPrompt = isShort
          ? 'You are a premier textbook writer. Write a concise summary and short notes for the given subtopic.\n\n' +
            'CRITICAL QUALITY RULES:\n' +
            '- Write a brief, easy-to-read summary. Keep explanations short and to the point.\n' +
            '- Maximize formatting: Use Markdown headers (###), bold text, bullet points, and numbered lists.\n' +
            '- Wrap Key Concepts, Important Notes, and Solved Examples in markdown blockquotes (lines starting with > ). For example:\n' +
            '  > **Key Concept:** Define the core idea here...\n' +
            '  > **Important Note:** Crucial formula or exam tip to remember...\n' +
            '- Ensure definitions are accurate but concise.\n' +
            '- DIAGRAMS / ILLUSTRATIONS: You can include a clean chalkboard-style vector illustration inside a markdown code block of type "svg" (e.g. ```svg \n <svg viewBox="0 0 300 150">...</svg> \n ```). Make sure the SVG tags are valid, use bright chalk colors ("white", "#a3e635", "#60a5fa", "#f472b6", "#f59e0b"), and set viewBox="0 0 300 150" with width="100%" and height="100%". Do not use black colors.\n' +
            '- STRICT MATH RULE: NEVER use LaTeX notation (like \\( \\), \\[ \\], \\frac, \\mathbf, etc.) or backslashes. Write math equations in readable plain text.'
          : 'You are a premier textbook writer. Write a comprehensive, detailed textbook section for the given subtopic.\n\n' +
            'CRITICAL QUALITY RULES:\n' +
            '- Write exhaustive, rich, detailed, and comprehensive content. Do not write a short summary.\n' +
            '- Maximize formatting: Use Markdown headers (###), bold text, bullet points, and numbered lists.\n' +
            '- Wrap Key Concepts, Important Notes, and Solved Examples in markdown blockquotes (lines starting with > ). For example:\n' +
            '  > **Key Concept:** Define the core idea here...\n' +
            '  > **Important Note:** Crucial formula or exam tip to remember...\n' +
            '- Ensure definitions are formal and textbook-standard.\n' +
            '- DIAGRAMS / ILLUSTRATIONS: For technical concepts (especially Chemistry structures/bonds, Physics forces/circuits, Mathematics graphs/coordinate systems, Biology flowcharts), you MUST include a clean chalkboard-style vector illustration inside a markdown code block of type "svg" (e.g. ```svg \n <svg viewBox="0 0 300 150">...</svg> \n ```). Make sure the SVG tags are valid, use bright chalk colors ("white", "#a3e635" (lime green), "#60a5fa" (sky blue), "#f472b6" (pink), "#f59e0b" (yellow)), and set viewBox="0 0 300 150" with width="100%" and height="100%". Do not use black colors.\n' +
            '- STRICT MATH RULE: NEVER use LaTeX notation (like \\( \\), \\[ \\], \\frac, \\mathbf, etc.) or backslashes. Write math equations in readable plain text.';

        const sectionUserPrompt = isShort
          ? `Write a concise summary section for:\n` +
            `- Main Chapter Topic: ${topic.trim()}\n` +
            `- Current Section Subtopic: ${subtopicTitle}\n` +
            `- Board: ${board}\n` +
            `- Class Level: ${studentClass}\n` +
            `- Subject: ${subject}\n\n` +
            `Provide brief theoretical summaries, key equations, a quick example, and a chalkboard SVG diagram in a \`\`\`svg code block if it is visual.`
          : `Write a highly detailed chapter section for:\n` +
            `- Main Chapter Topic: ${topic.trim()}\n` +
            `- Current Section Subtopic: ${subtopicTitle}\n` +
            `- Board: ${board}\n` +
            `- Class Level: ${studentClass}\n` +
            `- Subject: ${subject}\n\n` +
            `Provide full theoretical explanations, deep concepts, equations, illustrative examples, and a chalkboard SVG diagram in a \`\`\`svg code block if the concept is visual.`;

        const sectionResponse = await resilientOpenRouterFetch(
          sectionSystemPrompt,
          sectionUserPrompt,
          0.3,
        );

        if (sectionResponse.ok) {
          const sectionResJson = await sectionResponse.json();
          const sectionContent =
            sectionResJson.choices?.[0]?.message?.content || '';
          if (sectionContent.trim()) {
            notesContent += `### Section ${
              i + 1
            }: ${subtopicTitle}\n\n${sectionContent.trim()}\n\n---\n\n`;
          }
        }
      }

      // Step 3: Solved Examples & Revision Questions
      setLoadingMessage('Formulating solved examples & revision exercises...');

      const exercisesSystemPrompt =
        'You are a senior academic tutor. Generate a comprehensive practice exercise section for the given topic.\n\n' +
        'REQUIRED STRUCTURE:\n' +
        '1. **Step-by-Step Solved Numericals:** Walk through two problems:\n' +
        '   - Case A: A basic concept-builder application.\n' +
        '   - Case B: A complex, high-difficulty exam-level question with full logical steps.\n' +
        '   (Wrap solved examples in markdown blockquotes > )\n' +
        '2. **5 Sample Revision Questions & Answers:** Write 5 practice questions and detailed explanations at the end.\n' +
        '- DIAGRAMS: If a diagram helps explain a solved numerical or revision solution, you can include a clean chalkboard-style vector illustration inside a markdown code block of type "svg" (e.g. ```svg \n <svg viewBox="0 0 300 150">...</svg> \n ```). Make it look like chalk drawings using white/bright colors.\n' +
        '- STRICT MATH RULE: NEVER use LaTeX notation or backslashes. Write math equations in readable plain text.';

      const exercisesUserPrompt =
        `Generate solved examples and 5 practice questions with answers for:\n` +
        `- Main Topic: ${topic.trim()}\n` +
        `- Board: ${board}\n` +
        `- Class Level: ${studentClass}\n` +
        `- Subject: ${subject}`;

      const exercisesResponse = await resilientOpenRouterFetch(
        exercisesSystemPrompt,
        exercisesUserPrompt,
        0.2,
      );

      if (exercisesResponse.ok) {
        const exercisesResJson = await exercisesResponse.json();
        const exercisesContent =
          exercisesResJson.choices?.[0]?.message?.content || '';
        if (exercisesContent.trim()) {
          notesContent += `### Section ${
            subtopics.length + 1
          }: Practice Exercises & Questions\n\n${exercisesContent.trim()}`;
        }
      }

      if (!notesContent.trim()) {
        throw new Error('Failed to generate study guide sections');
      }

      setGeneratedNotes(notesContent);
      setAppState('viewing');
    } catch (err) {
      console.warn(err);
      Alert.alert(
        'Generation Failed',
        'AI notes generation failed. Please try again.',
      );
      setAppState('setup');
    }
  };

  const handleAttemptTest = () => {
    setAppState('setup');
    navigation.navigate('TestGenerator', {
      board,
      subject,
      topic,
      subtopic,
      autoStart: true,
    });
  };

  // LaTeX and mathematical terms cleaner
  const cleanLatex = str => {
    if (!str) {
      return '';
    }
    let res = str;
    // Replace LaTeX block/inline math wrappers
    res = res.replace(/\\\[/g, '').replace(/\\\]/g, '');
    res = res.replace(/\\\(/g, '').replace(/\\\)/g, '');
    // Replace common LaTeX formats
    res = res.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)');
    res = res.replace(/\\dfrac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)');
    res = res.replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)');
    res = res.replace(/\\text\{([^}]*)\}/g, '$1');
    res = res.replace(/\\mathrm\{([^}]*)\}/g, '$1');
    res = res.replace(/\\mathbf\{([^}]*)\}/g, '$1');
    res = res.replace(/\\boxed\{([^}]*)\}/g, '[$1]');
    res = res.replace(
      /\\int_([^{]*)\^\{([^}]*)\}/g,
      'integral from $1 to $2 of ',
    );
    res = res.replace(/\\int/g, 'integral');
    res = res.replace(/\\tau/g, 't');
    res = res.replace(/\\Delta/g, 'Delta');
    res = res.replace(/\\cdot/g, '*');
    res = res.replace(/\\times/g, 'x');
    res = res.replace(/\\Rightarrow/g, ' => ');
    res = res.replace(/\\Leftarrow/g, ' <= ');
    res = res.replace(/\\rightarrow/g, ' -> ');
    res = res.replace(/\\leftarrow/g, ' <- ');
    res = res.replace(/\\pm/g, '+/-');
    res = res.replace(/\\,/g, ' ');
    res = res.replace(/\\quad/g, '  ');
    res = res.replace(/\\;/g, ' ');
    // Remove remaining backslashes before characters
    res = res.replace(/\\/g, '');
    return res;
  };

  // Parses markdown inline tags **bold** and *italic* into native Text nodes
  const parseMarkdownText = text => {
    if (!text) {
      return '';
    }
    const parts = text.split('**');
    return parts.map((part, index) => {
      const isBold = index % 2 === 1;
      const subParts = part.split('*');
      return subParts.map((subPart, subIndex) => {
        const isItalic = subIndex % 2 === 1;
        let style = {};
        if (isBold) {
          style.fontWeight = 'bold';
        }
        if (isItalic) {
          style.fontStyle = 'italic';
        }
        if (isBold) {
          style.color = theme.colors.onSurface;
        }
        return (
          <Text key={`${index}-${subIndex}`} style={style}>
            {subPart}
          </Text>
        );
      });
    });
  };

  // Convert raw study guide text into structured block data objects
  const parseNotesToBlocks = rawText => {
    if (!rawText) {
      return [];
    }
    const lines = rawText.split('\n');
    const blocks = [];
    let currentTable = null;
    let inCodeBlock = false;
    let codeContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Handle Code Blocks
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          if (inCodeBlock === 'svg' || inCodeBlock === 'xml') {
            blocks.push({type: 'diagram', text: codeContent.join('\n')});
          } else {
            blocks.push({type: 'code', text: codeContent.join('\n')});
          }
          inCodeBlock = false;
          codeContent = [];
        } else {
          const type = trimmed.substring(3).trim().toLowerCase();
          inCodeBlock = type || true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Handle Tables
      const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');
      const isTableSeparator =
        isTableRow && (trimmed.includes('---') || trimmed.includes('-|-'));

      if (isTableRow) {
        if (isTableSeparator) {
          continue; // Skip the separator row
        }
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map(c => c.trim());
        if (!currentTable) {
          currentTable = [];
        }
        currentTable.push(cells);
        continue;
      } else {
        if (currentTable) {
          blocks.push({type: 'table', rows: currentTable});
          currentTable = null;
        }
      }

      // Headers
      if (trimmed.startsWith('# ')) {
        blocks.push({type: 'h1', text: trimmed.substring(2)});
      } else if (trimmed.startsWith('## ')) {
        blocks.push({type: 'h2', text: trimmed.substring(3)});
      } else if (trimmed.startsWith('### ')) {
        blocks.push({type: 'h3', text: trimmed.substring(4)});
      } else if (trimmed.startsWith('#### ')) {
        blocks.push({type: 'h4', text: trimmed.substring(5)});
      }
      // Blockquotes
      else if (trimmed.startsWith('> ')) {
        blocks.push({type: 'blockquote', text: trimmed.substring(2)});
      }
      // Bullet lists
      else if (
        trimmed.startsWith('* ') ||
        trimmed.startsWith('- ') ||
        trimmed.startsWith('• ')
      ) {
        const clean = trimmed.replace(/^(\*\s|-\s|•\s)/, '');
        blocks.push({type: 'bullet', text: clean});
      }
      // Numbered lists
      else if (trimmed.match(/^\d+\.\s/)) {
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        blocks.push({type: 'numbered', num: numMatch[1], text: numMatch[2]});
      }
      // Spacers / empty lines
      else if (trimmed === '') {
        blocks.push({type: 'spacer'});
      }
      // Normal paragraphs
      else {
        blocks.push({type: 'paragraph', text: trimmed});
      }
    }

    if (currentTable) {
      blocks.push({type: 'table', rows: currentTable});
    }

    return blocks;
  };

  // Render a parsed table block as a structured React Native Card
  const renderTableBlock = (rows, key) => {
    if (!rows || rows.length === 0) {
      return null;
    }
    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    return (
      <Card
        key={key}
        style={[
          styles.tableCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            borderWidth: 1,
            marginVertical: 8,
            elevation: 1,
          },
        ]}>
        {/* Table Header */}
        <View
          style={[
            styles.tableHeaderRow,
            {
              backgroundColor: theme.dark ? '#1e2d27' : '#f0f5f3',
              borderBottomWidth: 1.5,
              borderBottomColor: theme.colors.outlineVariant,
              flexDirection: 'row',
              padding: 8,
            },
          ]}>
          {headerRow.map((cell, cIdx) => (
            <View key={cIdx} style={{flex: 1, paddingHorizontal: 4}}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 12,
                  color: theme.colors.onSurface,
                }}>
                {parseMarkdownText(cleanLatex(cell))}
              </Text>
            </View>
          ))}
        </View>
        {/* Table Body */}
        {dataRows.map((row, rIdx) => (
          <View
            key={rIdx}
            style={{
              flexDirection: 'row',
              padding: 8,
              borderBottomWidth: rIdx === dataRows.length - 1 ? 0 : 1,
              borderBottomColor: theme.colors.outlineVariant,
            }}>
            {row.map((cell, cIdx) => (
              <View key={cIdx} style={{flex: 1, paddingHorizontal: 4}}>
                <Text
                  style={{fontSize: 11, color: theme.colors.onSurfaceVariant}}>
                  {parseMarkdownText(cleanLatex(cell))}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </Card>
    );
  };

  // Main custom renderer
  const renderMarkdown = text => {
    if (!text) {
      return null;
    }
    const blocks = parseNotesToBlocks(text);

    return blocks.map((block, idx) => {
      switch (block.type) {
        case 'spacer':
          return <View key={idx} style={{height: 6}} />;
        case 'diagram': {
          const svgText = block.text.trim();
          let cleanSvg = svgText
            .replace(/stroke\s*=\s*["']black["']/gi, 'stroke="white"')
            .replace(/stroke\s*=\s*["']#000000["']/gi, 'stroke="white"')
            .replace(/stroke\s*=\s*["']#000["']/gi, 'stroke="white"');
            
          cleanSvg = cleanSvg
              .replace(/fill\s*=\s*["']#000000["']/gi, 'fill="none"')
              .replace(/fill\s*=\s*["']#333["']/gi, 'fill="none"')
              .replace(/stroke\s*=\s*["']#333["']/gi, 'stroke="#60a5fa"');
            
            // Auto-fix LLM SVG syntax errors
            cleanSvg = cleanSvg.replace(/viewBox=["'][^"']*["']/gi, 'viewBox="0 0 300 150"');
            cleanSvg = cleanSvg.replace(/<rect[^>]*width=["']300["'][^>]*fill=["']#(1a1a1a|000000|222222|333333)["'][^>]*\/?>/gi, '');

          const notesBoardBg = theme.dark ? '#1e293b' : '#f1f5f9';

          return (
            <View
              key={idx}
              style={{
                backgroundColor: notesBoardBg,
                borderRadius: 12,
                padding: 8,
                marginVertical: 12,
                borderWidth: 1,
                borderColor: theme.dark ? '#334155' : '#e2e8f0',
                alignSelf: 'stretch',
                alignItems: 'center',
                justifyContent: 'center',
                height: 180,
              }}>
              <SvgXml 
                xml={cleanSvg} 
                width="100%" 
                height="100%" 
                onError={(e) => console.log('SVG Parse Error:', e)}
                fallback={
                  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <Icon name="image-broken-variant" size={40} color={theme.dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} />
                    <Text style={{color: theme.dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 12, marginTop: 8}}>
                      Diagram generation failed
                    </Text>
                  </View>
                }
              />
            </View>
          );
        }
        case 'code':
          return (
            <View
              key={idx}
              style={[
                styles.codeBlock,
                {
                  backgroundColor: theme.dark ? '#1e1e1e' : '#f5f5f5',
                  borderColor: theme.dark ? '#333' : '#e0e0e0',
                },
              ]}>
              <Text style={styles.codeText}>{block.text}</Text>
            </View>
          );
        case 'table':
          return renderTableBlock(block.rows, idx);
        case 'h1':
          return (
            <Text key={idx} style={[styles.h1, {color: theme.colors.primary}]}>
              {parseMarkdownText(cleanLatex(block.text))}
            </Text>
          );
        case 'h2':
          return (
            <Text key={idx} style={[styles.h2, {color: theme.colors.primary}]}>
              {parseMarkdownText(cleanLatex(block.text))}
            </Text>
          );
        case 'h3':
          return (
            <Text
              key={idx}
              style={[styles.h3, {color: theme.colors.onSurface}]}>
              {parseMarkdownText(cleanLatex(block.text))}
            </Text>
          );
        case 'h4':
          return (
            <Text
              key={idx}
              style={[styles.h4, {color: theme.colors.onSurface}]}>
              {parseMarkdownText(cleanLatex(block.text))}
            </Text>
          );
        case 'blockquote': {
          const rawText = block.text.trim();
          const cleanText = cleanLatex(rawText);
          const lowerText = cleanText.toLowerCase();

          let boxColor = '#007171'; // default Teal
          let bgColor = theme.dark ? 'rgba(0, 113, 113, 0.1)' : '#f0fbfb';
          let iconName = 'information-outline';
          let boxTitle = '';

          if (
            lowerText.includes('key concept') ||
            lowerText.includes('concept') ||
            lowerText.includes('definition')
          ) {
            boxColor = '#3f51b5'; // Indigo/Blue
            bgColor = theme.dark ? 'rgba(63, 81, 181, 0.12)' : '#eef2ff';
            iconName = 'lightbulb-on-outline';
            boxTitle = 'Key Concept';
          } else if (
            lowerText.includes('formula') ||
            lowerText.includes('important') ||
            lowerText.includes('note') ||
            lowerText.includes('attention')
          ) {
            boxColor = '#ff9800'; // Amber/Orange
            bgColor = theme.dark ? 'rgba(255, 152, 0, 0.12)' : '#fffbeb';
            iconName = 'alert-decagram-outline';
            boxTitle = 'Important Note';
          } else if (
            lowerText.includes('example') ||
            lowerText.includes('solved example')
          ) {
            boxColor = '#2e7d32'; // Green
            bgColor = theme.dark ? 'rgba(46, 125, 50, 0.12)' : '#f0fdf4';
            iconName = 'book-open-outline';
            boxTitle = 'Solved Example';
          }

          return (
            <View
              key={idx}
              style={[
                styles.blockquote,
                {
                  borderLeftColor: boxColor,
                  borderLeftWidth: 4,
                  backgroundColor: bgColor,
                  borderRadius: 8,
                  padding: 12,
                  marginVertical: 8,
                },
              ]}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: boxTitle ? 6 : 0,
                  gap: 6,
                }}>
                <Icon name={iconName} size={18} color={boxColor} />
                {!!boxTitle && (
                  <Text
                    style={{fontWeight: 'bold', fontSize: 13, color: boxColor}}>
                    {boxTitle}
                  </Text>
                )}
              </View>
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 13,
                  lineHeight: 18,
                }}>
                {parseMarkdownText(cleanText)}
              </Text>
            </View>
          );
        }
        case 'bullet':
          return (
            <View key={idx} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, {color: theme.colors.primary}]}>
                •
              </Text>
              <Text
                style={[
                  styles.bulletText,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                {parseMarkdownText(cleanLatex(block.text))}
              </Text>
            </View>
          );
        case 'numbered':
          return (
            <View key={idx} style={styles.bulletRow}>
              <Text
                style={[styles.bulletNumber, {color: theme.colors.primary}]}>
                {block.num}.
              </Text>
              <Text
                style={[
                  styles.bulletText,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                {parseMarkdownText(cleanLatex(block.text))}
              </Text>
            </View>
          );
        case 'paragraph':
        default:
          return (
            <Text
              key={idx}
              style={[
                styles.paragraph,
                {color: theme.colors.onSurfaceVariant},
              ]}>
              {parseMarkdownText(cleanLatex(block.text))}
            </Text>
          );
      }
    });
  };

  return (
    <Screen NoHeader style={{backgroundColor: theme.colors.background}}>
      {/* Custom Header (Hidden in setup since navigation header already says "AI Study Notes Generator") */}
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
              if (appState === 'viewing') {
                setAppState('setup');
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {appState === 'viewing' ? 'Study Guide' : 'Notes Generator'}
          </Text>
          <View style={{width: 40}} />
        </View>
      )}

      {appState === 'setup' && (
        <View style={{flex: 1}}>
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
                Generate Notes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setCurrentTab('library');
                loadSavedNotes();
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
                Saved Library ({savedNotes.length})
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
                  {
                    backgroundColor: theme.dark ? '#1e293b' : '#ffffff',
                    shadowColor: '#006d5b',
                    shadowOpacity: 0.1,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                  },
                ]}>
                <Card.Content style={styles.heroRow}>
                  <View style={[styles.heroIconCircle, { 
                    backgroundColor: '#008374',
                    shadowColor: '#008374',
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 8,
                  }]}>
                    <Icon
                      name="book-open-variant"
                      size={28}
                      color="white"
                    />
                  </View>
                  <View style={{flex: 1, marginLeft: 16}}>
                    <Text
                      style={{
                        fontWeight: '700',
                        fontSize: 16,
                        color: theme.dark ? '#f1f5f9' : '#0f172a',
                      }}>
                      Deep Study Package 📖
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.dark ? '#94a3b8' : '#475569',
                        marginTop: 4,
                        lineHeight: 16,
                      }}>
                      Create progressive, board-aligned notes (easy to complex),
                      complete with formulas, numericals, and sample revision
                      questions.
                    </Text>
                  </View>
                </Card.Content>
              </Card>

              {topSubject ? (
                <Card
                  onPress={() => {
                    const formatted = topSubject.charAt(0).toUpperCase() + topSubject.slice(1);
                    setSubject(formatted);
                  }}
                  style={{
                    marginBottom: 16,
                    backgroundColor: theme.dark ? 'rgba(0, 113, 113, 0.15)' : '#e0f2f1',
                    borderWidth: 1,
                    borderColor: theme.dark ? '#007171' : '#b2dfdb',
                    borderRadius: 12,
                    elevation: 1,
                  }}>
                  <Card.Content style={{flexDirection: 'row', alignItems: 'center', padding: 12}}>
                    <Icon name="brain" size={24} color={theme.dark ? '#a3e635' : '#007171'} style={{marginRight: 10}} />
                    <View style={{flex: 1}}>
                      <Text style={{fontWeight: 'bold', fontSize: 13, color: theme.dark ? 'white' : '#004d40'}}>
                        💡 Suggested Notes: {topSubject.charAt(0).toUpperCase() + topSubject.slice(1)}
                      </Text>
                      <Text style={{fontSize: 11, color: theme.dark ? '#cccccc' : '#007171', marginTop: 2}}>
                        You study {topSubject} often. Tap to auto-select this subject!
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={18} color={theme.dark ? 'white' : '#004d40'} />
                  </Card.Content>
                </Card>
              ) : null}

              {/* Form Input Fields */}
              <CurriculumSelector
                board={board} setBoard={setBoard}
                studentClass={studentClass} setStudentClass={setStudentClass}
                stream={stream} setStream={setStream}
                subject={subject} setSubject={setSubject}
                topic={topic} setTopic={setTopic}
                subtopic={subtopic} setSubtopic={setSubtopic}
              />

              <GlassDropdown
                label="Notes Type"
                value={notesLength}
                options={[
                  { label: 'Detailed Notes (Complete coverage)', value: 'Detailed' },
                  { label: 'Short Notes (3-4 pages summary)', value: 'Short' }
                ]}
                onSelect={setNotesLength}
                icon="text-box-outline"
                placeholder="Select notes length..."
              />

              <GlassButton
                label="Generate Study Notes"
                icon="sparkles"
                onPress={triggerGeneration}
                disabled={!topic || !subject || !board || !studentClass}
              />
              <Text style={{ textAlign: 'center', color: theme.dark ? '#52525b' : '#a1a1aa', fontSize: 12, marginTop: -10, marginBottom: 20 }}>
                powered by AI
              </Text>
            </ScrollView>
          ) : (
            /* Saved Library tab list */
            <ScrollView contentContainerStyle={styles.libraryContainer}>
              {savedNotes.length === 0 ? (
                <View style={styles.emptyLibrary}>
                  <Icon name="folder-outline" size={60} color="#bbb" />
                  <Text style={{fontSize: 14, color: '#888', marginTop: 12}}>
                    Your study guides library is empty.
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#aaa',
                      marginTop: 4,
                      textAlign: 'center',
                      paddingHorizontal: 40,
                    }}>
                    Generated notes that you save will appear here for offline
                    reading.
                  </Text>
                </View>
              ) : (
                savedNotes.map(item => (
                  <Card
                    key={item.id}
                    style={[
                      styles.noteLibraryCard,
                      {backgroundColor: theme.colors.surface},
                    ]}>
                    <TouchableOpacity
                      onPress={() => handleOpenSavedNote(item)}
                      style={styles.libraryCardPress}>
                      <View style={styles.libraryCardLeft}>
                        <View
                          style={[
                            styles.libraryIconWrap,
                            {backgroundColor: '#e8eaf6'},
                          ]}>
                          <Icon
                            name="file-document-outline"
                            size={24}
                            color="#3f51b5"
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
                            {item.board} • {item.subject} • {item.date}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteNote(item.id)}
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
           title={loadingMessage || 'AI is writing your Study Notes...'} 
           accentColor={theme.colors.primary} 
           subTitle={
             notesLength === 'Detailed'
               ? "Because we generate complete, highly detailed notes (10-15 pages long) subtopic by subtopic, this takes about 30-45 seconds."
               : "We are generating concise short notes. This will be ready in just a few seconds."
           }
        />
      )}

      {appState === 'viewing' && (
        <View style={{flex: 1}}>
          <ScrollView contentContainerStyle={styles.notesContainer}>
            <Card
              style={[
                styles.summaryBox,
                {backgroundColor: theme.colors.primary},
              ]}>
              <Text
                style={{color: 'white', fontWeight: 'bold', fontSize: 16}}
                numberOfLines={1}>
                {activeNotesTitle}
              </Text>
              <Text style={{color: '#e0f2f2', fontSize: 11, marginTop: 4}}>
                Level: {board} • Subject: {subject}
              </Text>
            </Card>

            <View style={{paddingHorizontal: 4, marginTop: 10}}>
              {renderMarkdown(generatedNotes)}
            </View>

            {/* Bottom Actions for Study Guide */}
            <Card
              style={[
                styles.actionsCard,
                {backgroundColor: theme.colors.surface},
              ]}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 14,
                  color: theme.colors.onSurface,
                  textAlign: 'center',
                  marginBottom: 4,
                }}>
                Ready to check your understanding?
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.outline,
                  textAlign: 'center',
                  marginBottom: 12,
                }}>
                Take a quick 5-question mock quiz based on this study material.
              </Text>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  onPress={handleSaveNotes}
                  style={[
                    styles.actionBtn,
                    styles.saveBtn,
                    {borderColor: theme.colors.primary},
                  ]}>
                  <Icon
                    name="bookmark-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontWeight: 'bold',
                      fontSize: 12,
                      marginLeft: 4,
                    }}>
                    Save Notes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAttemptTest}
                  style={[
                    styles.actionBtn,
                    styles.testBtn,
                    {backgroundColor: theme.colors.primary},
                  ]}>
                  <Icon name="clipboard-text-outline" size={16} color="white" />
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 12,
                      marginLeft: 4,
                    }}>
                    Attempt Test
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </ScrollView>
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
    backgroundColor: '#3f51b5',
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
  notesContainer: {
    padding: 16,
    paddingBottom: 60,
  },
  summaryBox: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  actionsCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    borderWidth: 1.5,
  },
  testBtn: {
    elevation: 1,
  },
  // Markdown Render Styles
  h1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
  },
  h2: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 6,
  },
  h3: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  h4: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  blockquote: {
    paddingLeft: 12,
    paddingVertical: 8,
    borderLeftWidth: 4,
    marginVertical: 10,
    borderRadius: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingRight: 12,
  },
  bulletDot: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 18,
  },
  bulletNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 6,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  codeBlock: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 10,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#e53935',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
});
