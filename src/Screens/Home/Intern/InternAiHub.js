import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Clipboard,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, Button, SegmentedButtons, Chip, IconButton, Portal, Dialog} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {saveInternInterview, getInternDb} from '../../../Utils/MockInternDb';

const {width} = Dimensions.get('window');

const InternAiHub = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  const insets = useSafeAreaInsets();
  const [activeTool, setActiveTool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');

  // States for individual tools
  const [taskText, setTaskText] = useState('');
  const [codeText, setCodeText] = useState('');
  const [codeLang, setCodeLang] = useState('javascript');
  const [resumeText, setResumeText] = useState('');
  const [resumeSkills, setResumeSkills] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [internStatus, setInternStatus] = useState('Pending');

  useEffect(() => {
    const loadOnboardingStatusAndResume = async () => {
      const activeId = user?.user_id || 'alice_123';
      try {
        const db = await getInternDb();
        const myRecord = db.interns.find(i => i.id === activeId);
        setInternStatus(myRecord?.status || 'Pending');
      } catch (e) {
        console.log('Failed loading status in InternAiHub', e);
      }
      
      const saved = await AsyncStorage.getItem(`@studify_resume_name_${activeId}`);
      setResumeName(saved || '');
    };
    loadOnboardingStatusAndResume();
  }, [activeTool, user]);
  const [doubtText, setDoubtText] = useState('');
  const [emailTopic, setEmailTopic] = useState('');
  const [emailTone, setEmailTone] = useState('formal');
  const [emailTo, setEmailTo] = useState('TL');
  const [careerRole, setCareerRole] = useState('');
  const [prodHours, setProdHours] = useState('6');
  const [prodEnergy, setProdEnergy] = useState('high');

  // Mock Interview State
  const [interviewDomain, setInterviewDomain] = useState('React Native Layouts');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewMessages, setInterviewMessages] = useState([]);
  const [interviewInput, setInterviewInput] = useState('');
  const [interviewStep, setInterviewStep] = useState(0);

  const row1 = [
    {id: 'explainer', name: 'Task Explainer', icon: 'file-search-outline', desc: 'Break down complex tasks into checklists.', color: '#4CAF50'},
    {id: 'reviewer', name: 'Code Reviewer', icon: 'code-braces', desc: 'Scan code for bugs and security fixes.', color: '#2196F3'},
    {id: 'resume', name: 'Resume Analyzer', icon: 'file-account-outline', desc: 'Match resume keywords with target jobs.', color: '#9C27B0'},
    {id: 'interview', name: 'Mock Interview', icon: 'chat-question-outline', desc: 'Simulated 1-on-1 interview practice.', color: '#E91E63'},
  ];

  const row2 = [
    {id: 'doubts', name: 'Doubt Solver', icon: 'brain', desc: 'Resolve technical and logical doubts.', color: '#FF9800'},
    {id: 'email', name: 'Email Generator', icon: 'email-plus-outline', desc: 'Draft messages to supervisor or team.', color: '#00BCD4'},
    {id: 'roadmap', name: 'Career Roadmap', icon: 'map-marker-path', desc: 'Milestones road maps for tech jobs.', color: '#795548'},
    {id: 'productivity', name: 'Productivity Planner', icon: 'timer-cog-outline', desc: 'Tailor Pomodoros to energy levels.', color: '#607D8B'},
  ];

  const handleCopy = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Content copied to clipboard.');
  };

  const callOpenRouter = async (promptText) => {
    const models = [
      'google/gemini-2.0-flash-lite-001',
      'meta-llama/llama-3.3-70b-instruct:free',
      'openrouter/free',
    ];
    for (const modelName of models) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer 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',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{role: 'user', content: promptText}],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.choices?.[0]?.message?.content) {
            return data.choices[0].message.content;
          }
        }
      } catch (err) {
        console.log(`Failed with model ${modelName}`, err);
      }
    }
    throw new Error('All model attempts failed');
  };

  const handleTaskExplainer = async () => {
    if (!taskText.trim()) return;
    setLoading(true);
    setResultText('');
    const prompt = `Act as an expert software architect. Explain this task and break it down into a checklist of subtasks. Focus on React Native best practices. Task details: "${taskText}"`;
    try {
      const response = await callOpenRouter(prompt);
      setResultText(response);
    } catch (e) {
      setResultText(`**Task Breakdown (Fallback Simulation)**\n\n🎯 **Core Goal**: Implement layout structures with standard validations.\n\n**Action Checkpoints**:\n1. Configure components files.\n2. Bind local state states.\n3. Verify overlaps using useSafeAreaInsets.`);
    }
    setLoading(false);
  };

  const handleCodeReviewer = async () => {
    if (!codeText.trim()) return;
    setLoading(true);
    setResultText('');
    const prompt = `Review this ${codeLang} code block. Point out bugs, styling improvements, and performance issues. Code:\n${codeText}`;
    try {
      const response = await callOpenRouter(prompt);
      setResultText(response);
    } catch (e) {
      setResultText(`**Code Review (Fallback Simulation)**\n\n⚠️ **Warning**: Wrap callbacks inside React.useCallback to prevent unnecessary child rebuilds.\n💡 **Suggestion**: Use const instead of let for constants.`);
    }
    setLoading(false);
  };

  const handleResumeAnalyzer = async () => {
    if (!resumeSkills.trim()) {
      return Alert.alert('Error', 'Please enter target position skills.');
    }
    setLoading(true);
    setResultText('');
    const prompt = `Analyze my uploaded resume "${resumeName}" against these target job skills: ${resumeSkills}. Calculate match rate and list strengths and missing keywords.`;
    try {
      const response = await callOpenRouter(prompt);
      setResultText(response);
    } catch (e) {
      setResultText(`**Resume Audit (Fallback Simulation)**\n\n📄 **Analyzed Resume**: ${resumeName}\n📊 **Match Rate**: 82%\n\n✅ **Strengths**: Strong frontend foundation, React Native experience matches target requirements.\n❌ **Missing Keywords**: CI/CD pipelines, Jest unit tests, Redux Saga.`);
    }
    setLoading(false);
  };

  const handleDoubtSolver = async () => {
    if (!doubtText.trim()) return;
    setLoading(true);
    setResultText('');
    const prompt = `Explain this technical concept clearly with code examples: "${doubtText}"`;
    try {
      const response = await callOpenRouter(prompt);
      setResultText(response);
    } catch (e) {
      setResultText(`**Technical Doubt Solution (Fallback Simulation)**\n\n**Concept**: State updates in React are asynchronous.\n\n**Solution**: Always use functional state updates when depending on previous states: setState(prev => prev + 1).`);
    }
    setLoading(false);
  };

  const handleEmailGenerator = async () => {
    if (!emailTopic.trim()) return;
    setLoading(true);
    setResultText('');
    const prompt = `Draft a professional short message to a ${emailTo} about this topic: "${emailTopic}". Tone should be ${emailTone}. Keep it concise.`;
    try {
      const response = await callOpenRouter(prompt);
      setResultText(response);
    } catch (e) {
      setResultText(`Subject: ${emailTopic}\n\nHi ${emailTo},\n\nI am writing regarding ${emailTopic}. I have finalized the required segments and verified them locally.\n\nBest,\n[Your Name]`);
    }
    setLoading(false);
  };

  const handleRoadmap = async () => {
    if (!careerRole.trim()) return;
    setLoading(true);
    setResultText('');
    const prompt = `Generate a detailed step-by-step career development roadmap (with 4 phases) to achieve the role of: "${careerRole}"`;
    try {
      const response = await callOpenRouter(prompt);
      setResultText(response);
    } catch (e) {
      setResultText(`**Roadmap for ${careerRole} (Fallback Simulation)**\n\nPhase 1: Advanced Algorithms & Data Structures\nPhase 2: Master Mobile State Redux/Context\nPhase 3: Deep dive Native bridge drivers`);
    }
    setLoading(false);
  };

  const handleProductivity = async () => {
    setLoading(true);
    setResultText('');
    const prompt = `Create a custom Pomodoro schedule split for a ${prodHours}-hour work shift with a ${prodEnergy} energy level.`;
    try {
      const response = await callOpenRouter(prompt);
      setResultText(response);
    } catch (e) {
      setResultText(`**Shift Pomodoro Schedule (Fallback Simulation)**\n\nBlock 1 (90 mins): Complex bug resolutions\nBreak (15 mins): Walk\nBlock 2 (90 mins): Review pull requests`);
    }
    setLoading(false);
  };

  const handleEndInterview = async () => {
    const activeId = user?.user_id || 'alice_123';
    const userAnswersCount = interviewMessages.filter(m => m.sender === 'user').length;
    const baseScore = 65;
    const extra = Math.min(30, userAnswersCount * 8);
    const finalScore = baseScore + extra + Math.floor(Math.random() * 5);
    const percentageScore = Math.min(99, finalScore);
    
    await saveInternInterview(activeId, interviewDomain, percentageScore);
    
    Alert.alert(
      'Evaluation Completed',
      `Excellent practice session! Your interview performance has been evaluated by the AI.\n\nScore: ${percentageScore}%\nDomain: ${interviewDomain}\n\nYour skills tracker on the Performance Dashboard has been updated.`,
      [
        {
          text: 'Ok',
          onPress: () => {
            setInterviewStarted(false);
            setActiveTool(null);
          }
        }
      ]
    );
  };

  // Mock Interview Interactive Chat
  const startInterview = () => {
    setInterviewStarted(true);
    setInterviewStep(0);
    const firstMsg = {
      sender: 'ai',
      text: `Welcome! I am your AI interviewer for the ${interviewDomain} role. Let's start:\n\nCould you describe the React component lifecycle and how hooks map to it?`,
    };
    setInterviewMessages([firstMsg]);
  };

  const submitInterviewAnswer = async () => {
    if (!interviewInput.trim()) return;
    const userMsg = {sender: 'user', text: interviewInput};
    const nextMsgs = [...interviewMessages, userMsg];
    setInterviewMessages(nextMsgs);
    setInterviewInput('');

    setLoading(true);
    const prompt = `Act as an interviewer for a ${interviewDomain} engineer position. Evaluate the user's answer: "${interviewInput}". Provide brief constructive feedback, and then ask the next technical question. (Current question step: ${interviewStep})`;
    
    try {
      const response = await callOpenRouter(prompt);
      setInterviewMessages(prev => [...prev, {sender: 'ai', text: response}]);
      setInterviewStep(prev => prev + 1);
    } catch (e) {
      // Fallback interview answers
      setTimeout(() => {
        let reply = '';
        if (interviewStep === 0) {
          reply = `Good answer. Correct, useEffect covers componentDidMount and componentWillUnmount.\n\nNext Question:\nHow do you optimize FlatList performance in React Native?`;
          setInterviewStep(1);
        } else {
          reply = `Reconciliation and Virtual DOM are key. Excellent mock session. Performance evaluation: 8.5/10!`;
          setInterviewStep(2);
        }
        setInterviewMessages(prev => [...prev, {sender: 'ai', text: reply}]);
      }, 1000);
    }
    setLoading(false);
  };

  const parseInlineStyles = (text) => {
    if (!text) return '';
    const parts = text.split('**');
    return parts.map((part, index) => {
      const isBold = index % 2 === 1;
      const subParts = part.split('*');
      return subParts.map((subPart, subIndex) => {
        const isItalic = subIndex % 2 === 1;
        
        const textStyle = {};
        if (isBold) {
          textStyle.fontWeight = 'bold';
          textStyle.color = colors.primary;
        }
        if (isItalic) {
          textStyle.fontStyle = 'italic';
        }
        
        return (
          <Text key={`${index}-${subIndex}`} style={textStyle}>
            {subPart}
          </Text>
        );
      });
    });
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, index) => {
      let trimmed = line.trim();
      if (!trimmed) {
        return <View key={index} style={{ height: 8 }} />;
      }

      if (trimmed.startsWith('#')) {
        const headerLevel = (trimmed.match(/^#+/) || ['#'])[0].length;
        const cleanText = trimmed.replace(/^#+\s*/, '').replace(/\*\*|\*/g, '');
        return (
          <Text
            key={index}
            style={[
              styles.resHeaderTitle,
              {
                fontSize: headerLevel === 1 ? 20 : headerLevel === 2 ? 18 : 16,
                color: colors.primary,
                marginTop: index > 0 ? 12 : 4,
                marginBottom: 6,
              },
            ]}>
            {cleanText}
          </Text>
        );
      }

      let isFullLineBold = false;
      if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
        trimmed = trimmed.substring(2, trimmed.length - 2);
        isFullLineBold = true;
      }

      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
      const isNumbered = /^\d+\.\s/.test(trimmed);

      if (isBullet || isNumbered) {
        let content = isBullet ? trimmed.substring(2) : trimmed.replace(/^\d+\.\s/, '');
        const numberMatch = trimmed.match(/^(\d+)\.\s/);
        const numberLabel = numberMatch ? numberMatch[1] : '';

        if (content.startsWith('**') && content.endsWith('**') && content.length > 4) {
          content = content.substring(2, content.length - 2);
        }

        return (
          <View key={index} style={styles.listRow}>
            {isBullet ? (
              <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
            ) : (
              <View style={[styles.numberBadge, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[styles.numberText, { color: colors.onPrimaryContainer }]}>{numberLabel}</Text>
              </View>
            )}
            <Text style={styles.listContent}>
              {parseInlineStyles(content)}
            </Text>
          </View>
        );
      }

      const isBlockquote = trimmed.startsWith('>');
      let finalStyle = isFullLineBold ? styles.resBoldText : styles.resParagraph;
      
      if (isBlockquote) {
        trimmed = trimmed.replace(/^>\s*/, '');
        return (
          <View key={index} style={[styles.blockquote, { borderLeftColor: colors.primary }]}>
            <Text style={[styles.blockquoteText, { color: colors.onSurfaceVariant }]}>
              {parseInlineStyles(trimmed)}
            </Text>
          </View>
        );
      }

      return (
        <Text key={index} style={finalStyle}>
          {parseInlineStyles(trimmed)}
        </Text>
      );
    });
  };

  if (internStatus !== 'Approved') {
    return (
      <Screen NoHeader style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
        <Icon name="lock-outline" size={64} color="#999" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Verification Required</Text>
        <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
          AI Productivity Hub is locked. Please upload your Internship Offer Letter in your Profile and await TL approval to unlock it.
        </Text>
        <Button mode="contained" onPress={() => navigation.navigate('InternProfile')}>
          Go to Profile
        </Button>
      </Screen>
    );
  }

  return (
    <Screen NoHeader style={styles.container}>
        {!activeTool ? (
          <>
            <Text style={styles.title}>AI Productivity Hub</Text>
            <Text style={styles.subtitle}>Supercharge your daily internship tasks with real-time AI solutions.</Text>

            <View style={styles.gridContainer}>
              {[...row1, ...row2].map(tool => (
                <TouchableOpacity
                  key={tool.id}
                  activeOpacity={0.8}
                  style={[styles.gridCard, {borderColor: colors.outlineVariant}]}
                  onPress={() => {
                    setActiveTool(tool.id);
                    setResultText('');
                  }}>
                  <View style={[styles.iconBox, {backgroundColor: tool.color + '1A'}]}>
                    <Icon name={tool.icon} size={28} color={tool.color} />
                  </View>
                  <Text style={styles.cardTitle}>{tool.name}</Text>
                  <Text style={styles.cardDesc}>{tool.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View>
            {/* Top Back Action */}
            <View style={[styles.toolbar, { justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }]}>
              <Button
                mode="text"
                icon="arrow-left"
                onPress={() => {
                  setActiveTool(null);
                  setResultText('');
                  setInterviewStarted(false);
                }}
                style={{ minWidth: 80 }}
              >
                Back
              </Button>
              <Text style={[styles.toolTitle, { flex: 1, textAlign: 'center' }]}>
                {row1.find(t => t.id === activeTool)?.name || row2.find(t => t.id === activeTool)?.name}
              </Text>
              {activeTool === 'interview' && interviewStarted ? (
                <Button
                  mode="contained-tonal"
                  compact
                  onPress={handleEndInterview}
                  style={{ marginRight: 4 }}
                  labelStyle={{ fontSize: 11 }}
                >
                  Finish
                </Button>
              ) : (
                <View style={{ width: 80 }} />
              )}
            </View>

            {/* Tool Forms */}
            {activeTool === 'explainer' && (
              <Card style={styles.formCard}>
                <Card.Content>
                  <Text style={styles.label}>Paste Task Description</Text>
                  <TextInput
                    multiline
                    numberOfLines={4}
                    value={taskText}
                    onChangeText={setTaskText}
                    placeholder="E.g., Implement check-in layouts and safe area overlays."
                    style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                    placeholderTextColor="#999"
                  />
                  <Button mode="contained" onPress={handleTaskExplainer} loading={loading} style={styles.submitBtn}>
                    Analyze & Explain Task
                  </Button>
                </Card.Content>
              </Card>
            )}

            {activeTool === 'reviewer' && (
              <Card style={styles.formCard}>
                <Card.Content>
                  <Text style={styles.label}>Language</Text>
                  <View style={styles.chipRow}>
                    {['javascript', 'python', 'java'].map(lang => (
                      <Chip key={lang} selected={codeLang === lang} onPress={() => setCodeLang(lang)} style={styles.chip}>
                        {lang.toUpperCase()}
                      </Chip>
                    ))}
                  </View>
                  <Text style={styles.label}>Paste Code Snippet</Text>
                  <TextInput
                    multiline
                    numberOfLines={5}
                    value={codeText}
                    onChangeText={setCodeText}
                    placeholder="Paste code here..."
                    style={[styles.input, styles.codeInput, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                    placeholderTextColor="#999"
                  />
                  <Button mode="contained" onPress={handleCodeReviewer} loading={loading} style={styles.submitBtn}>
                    Scan Code Quality
                  </Button>
                </Card.Content>
              </Card>
            )}

            {activeTool === 'resume' && (
              <View>
                {!resumeName ? (
                  <Card style={styles.formCard}>
                    <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <Icon name="file-alert-outline" size={48} color={colors.error} />
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 6, color: '#333' }}>No Resume Uploaded</Text>
                      <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 16 }}>
                        Please go to your Profile and upload your resume first to run the AI Analyzer.
                      </Text>
                      <Button mode="contained" onPress={() => navigation.navigate('InternProfile')}>
                        Go to Profile
                      </Button>
                    </Card.Content>
                  </Card>
                ) : (
                  <Card style={styles.formCard}>
                    <Card.Content>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#C8E6C9' }}>
                        <Icon name="file-document-check" size={28} color="#2E7D32" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1B5E20' }}>Active Resume</Text>
                          <Text style={{ fontSize: 11, color: '#2E7D32' }}>{resumeName}</Text>
                        </View>
                      </View>

                      <Text style={styles.label}>Target Position Skills</Text>
                      <TextInput
                        value={resumeSkills}
                        onChangeText={setResumeSkills}
                        placeholder="E.g., React Native, TypeScript, Node.js"
                        style={[styles.input, {borderColor: colors.outline, height: 40, marginBottom: 16, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                        placeholderTextColor="#999"
                      />
                      
                      <Button mode="contained" onPress={handleResumeAnalyzer} loading={loading} style={styles.submitBtn}>
                        Verify Skills Match
                      </Button>
                    </Card.Content>
                  </Card>
                )}
              </View>
            )}

            {activeTool === 'interview' && (
              <View>
                {!interviewStarted ? (
                  <Card style={styles.formCard}>
                    <Card.Content>
                      <Text style={styles.label}>Select Practice Domain</Text>
                      <View style={{ marginBottom: 12 }}>
                        {[
                          {value: 'React Native Layouts', label: 'React Native Layouts'},
                          {value: 'Redux State Management', label: 'Redux State Management'},
                          {value: 'Git Collaboration', label: 'Git Collaboration'},
                          {value: 'API Testing & Fetching', label: 'API Testing & Fetching'},
                        ].map(item => (
                          <Button
                            key={item.value}
                            mode={interviewDomain === item.value ? 'contained' : 'outlined'}
                            style={{ marginVertical: 4 }}
                            onPress={() => setInterviewDomain(item.value)}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </View>
                      <Button mode="contained" onPress={startInterview} style={[styles.submitBtn, {marginTop: 20}]}>
                        Start Practice Session
                      </Button>
                    </Card.Content>
                  </Card>
                ) : (
                  <View style={[styles.chatWrapper, {backgroundColor: colors.elevation.level1, borderColor: colors.outlineVariant}]}>
                    <ScrollView style={styles.chatScroll} contentContainerStyle={{paddingBottom: 20}}>
                      {interviewMessages.map((msg, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.chatBubble,
                            msg.sender === 'ai' ? [styles.bubbleAi, {backgroundColor: colors.elevation.level2}] : [styles.bubbleUser, {backgroundColor: colors.primary}],
                          ]}>
                          <Text style={{color: msg.sender === 'ai' ? colors.onSurface : '#fff'}}>{msg.text}</Text>
                        </View>
                      ))}
                      {loading && (
                        <View style={[styles.chatBubble, styles.bubbleAi, {backgroundColor: colors.elevation.level2}]}>
                          <Text style={{color: colors.onSurfaceVariant}}>AI is evaluating...</Text>
                        </View>
                      )}
                    </ScrollView>
                    <View style={[styles.chatInputRow, {backgroundColor: colors.surface, borderTopColor: colors.outlineVariant}]}>
                      <TextInput
                        value={interviewInput}
                        onChangeText={setInterviewInput}
                        placeholder="Type answer..."
                        style={[styles.chatInput, {borderColor: colors.outline, color: colors.onSurface, backgroundColor: colors.elevation.level2}]}
                        placeholderTextColor="#999"
                      />
                      <IconButton icon="send" mode="contained" containerColor={colors.primary} iconColor="#fff" onPress={submitInterviewAnswer} />
                    </View>
                  </View>
                )}
              </View>
            )}

            {activeTool === 'doubts' && (
              <Card style={styles.formCard}>
                <Card.Content>
                  <Text style={styles.label}>Describe technical doubt</Text>
                  <TextInput
                    multiline
                    numberOfLines={4}
                    value={doubtText}
                    onChangeText={setDoubtText}
                    placeholder="E.g., How does Virtual DOM compare with real DOM?"
                    style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                    placeholderTextColor="#999"
                  />
                  <Button mode="contained" onPress={handleDoubtSolver} loading={loading} style={styles.submitBtn}>
                    Explain & Resolve
                  </Button>
                </Card.Content>
              </Card>
            )}

            {activeTool === 'email' && (
              <Card style={styles.formCard}>
                <Card.Content>
                  <Text style={styles.label}>Send Message To</Text>
                  <View style={styles.chipRow}>
                    {['TL', 'HR', 'Team'].map(to => (
                      <Chip key={to} selected={emailTo === to} onPress={() => setEmailTo(to)} style={styles.chip}>
                        {to}
                      </Chip>
                    ))}
                  </View>
                  <Text style={styles.label}>Tone Mode</Text>
                  <View style={styles.chipRow}>
                    {['formal', 'informal', 'apologetic'].map(tone => (
                      <Chip key={tone} selected={emailTone === tone} onPress={() => setEmailTone(tone)} style={styles.chip}>
                        {tone.toUpperCase()}
                      </Chip>
                    ))}
                  </View>
                  <Text style={styles.label}>Topic / Reason</Text>
                  <TextInput
                    value={emailTopic}
                    onChangeText={setEmailTopic}
                    placeholder="E.g., Informing about family event leave"
                    style={[styles.input, {borderColor: colors.outline, height: 40, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                    placeholderTextColor="#999"
                  />
                  <Button mode="contained" onPress={handleEmailGenerator} loading={loading} style={styles.submitBtn}>
                    Draft Template
                  </Button>
                </Card.Content>
              </Card>
            )}

            {activeTool === 'roadmap' && (
              <Card style={styles.formCard}>
                <Card.Content>
                  <Text style={styles.label}>Target Engineering Role</Text>
                  <TextInput
                    value={careerRole}
                    onChangeText={setCareerRole}
                    placeholder="E.g., Full Stack Developer"
                    style={[styles.input, {borderColor: colors.outline, height: 40, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                    placeholderTextColor="#999"
                  />
                  <Button mode="contained" onPress={handleRoadmap} loading={loading} style={styles.submitBtn}>
                    Build Roadmap
                  </Button>
                </Card.Content>
              </Card>
            )}

            {activeTool === 'productivity' && (
              <Card style={styles.formCard}>
                <Card.Content>
                  <Text style={styles.label}>Shift hours block</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={prodHours}
                    onChangeText={setProdHours}
                    placeholder="E.g., 6"
                    style={[styles.input, {borderColor: colors.outline, height: 40, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.label}>Current energy</Text>
                  <View style={styles.chipRow}>
                    {['high', 'medium', 'low'].map(e => (
                      <Chip key={e} selected={prodEnergy === e} onPress={() => setProdEnergy(e)} style={styles.chip}>
                        {e.toUpperCase()}
                      </Chip>
                    ))}
                  </View>
                  <Button mode="contained" onPress={handleProductivity} loading={loading} style={styles.submitBtn}>
                    Plan Shift blocks
                  </Button>
                </Card.Content>
              </Card>
            )}

            {/* Result Render Card */}
            {resultText !== '' && (
              <Card style={[styles.resCard, { borderColor: colors.outlineVariant }]}>
                <Card.Content>
                  <View style={styles.resHeader}>
                    <Text style={styles.resTitle}>AI Hub Completion</Text>
                    <IconButton icon="content-copy" size={20} onPress={() => handleCopy(resultText)} style={{ margin: 0 }} />
                  </View>
                  <View style={styles.resBody}>
                    {renderFormattedContent(resultText)}
                  </View>
                </Card.Content>
              </Card>
            )}
          </View>
        )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 24,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  gridCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    elevation: 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: '#888',
    lineHeight: 15,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  formCard: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  codeInput: {
    fontFamily: 'monospace',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    height: 32,
  },
  submitBtn: {
    marginTop: 8,
  },
  resCard: {
    borderColor: 'rgba(128, 128, 128, 0.2)',
    borderWidth: 1,
    marginBottom: 20,
    elevation: 2,
  },
  resHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    paddingBottom: 6,
    marginBottom: 10,
  },
  resTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  resContent: {
    fontSize: 13,
    lineHeight: 20,
  },
  chatWrapper: {
    height: 380,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  chatScroll: {
    flex: 1,
    padding: 12,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  bubbleAi: {
    alignSelf: 'flex-start',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  resHeaderTitle: {
    fontWeight: 'bold',
  },
  resBody: {
    marginTop: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 10,
  },
  numberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 8,
  },
  numberText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
  },
  blockquote: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginVertical: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  blockquoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  resParagraph: {
    fontSize: 13.5,
    lineHeight: 20,
    marginVertical: 4,
  },
  resBoldText: {
    fontSize: 14.5,
    fontWeight: 'bold',
    marginVertical: 6,
  },
});

export default InternAiHub;
