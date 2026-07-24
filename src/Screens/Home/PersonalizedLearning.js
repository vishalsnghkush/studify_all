import React, {useState, useCallback, useEffect} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '../../Components/Input';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTheme, Card, ProgressBar} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Confetti, MiniBurst} from '../../Components/Screen/Confetti';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {
  getAllSubjectStats,
  getTopEngagedSubjects,
  getAIFocusSubject
} from '../../Utils/EngagementTracker';

const formatSubjectName = (name) => {
  if (!name) return 'General';
  return name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};


const PersonalizedLearning = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [plannerCount, setPlannerCount] = useState(0);
  const [activeMiniBurstId, setActiveMiniBurstId] = useState(null);
  const [showGrandConfetti, setShowGrandConfetti] = useState(false);

  // AI Study Planner & Exam Countdown states
  const [examTarget, setExamTarget] = useState(null);
  const [isSettingTarget, setIsSettingTarget] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTotalChapters, setTempTotalChapters] = useState('10');
  const [tempCompletedChapters, setTempCompletedChapters] = useState('0');

  // Personalization local states
  const [subjectStats, setSubjectStats] = useState({});
  const [aiFocusSub, setAiFocusSub] = useState(null);
  const [repetitionNudge, setRepetitionNudge] = useState(null);
  const [failedTopicNudge, setFailedTopicNudge] = useState(null);

  const loadPersonalizationData = useCallback(async () => {
    try {
      const stats = await getAllSubjectStats();
      setSubjectStats(stats);

      const focus = await getAIFocusSubject();
      setAiFocusSub(focus);

      const failedTop = await AsyncStorage.getItem('@studify_last_failed_topic');
      if (failedTop) {
        setFailedTopicNudge(JSON.parse(failedTop));
      } else {
        setFailedTopicNudge(null);
      }

      const top = await getTopEngagedSubjects(1);
      if (top && top.length > 0) {
        const topSubjectName = top[0];
        const topSubjectData = stats[topSubjectName];
        if (topSubjectData && topSubjectData.lastOpenedTime) {
          const diffMs = Date.now() - topSubjectData.lastOpenedTime;
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays >= 3) {
            setRepetitionNudge({
              subject: topSubjectName,
              days: diffDays
            });
          } else {
            setRepetitionNudge(null);
          }
        }
      } else {
        setRepetitionNudge(null);
      }
    } catch (e) {
      console.log('Error loading personalization data', e);
    }
  }, []);


  const loadExamTarget = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('@studify_exam_target');
      if (saved) {
        setExamTarget(JSON.parse(saved));
      }
    } catch (e) {
      console.log('Failed to load exam target', e);
    }
  }, []);

  const handleSaveTarget = async () => {
    if (!tempTitle.trim()) {
      alert('Please enter an exam title');
      return;
    }
    const targetObj = {
      title: tempTitle,
      date: tempDate.toISOString().split('T')[0],
      totalChapters: parseInt(tempTotalChapters) || 10,
      completedChapters: parseInt(tempCompletedChapters) || 0,
    };
    await AsyncStorage.setItem(
      '@studify_exam_target',
      JSON.stringify(targetObj),
    );
    setExamTarget(targetObj);
    setIsSettingTarget(false);
  };

  const handleDeleteTarget = async () => {
    await AsyncStorage.removeItem('@studify_exam_target');
    setExamTarget(null);
  };

  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: tempDate,
      onChange: (event, selectedDate) => {
        if (selectedDate) {
          setTempDate(selectedDate);
        }
      },
      mode: 'date',
      is24Hour: true,
    });
  };

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
      loadExamTarget();
      loadPersonalizationData();
    }, [loadDashboardData, loadExamTarget, loadPersonalizationData]),
  );


  const handleToggleTask = async id => {
    try {
      const target = tasks.find(t => t.id === id);
      if (!target) {
        return;
      }

      const checkingDone = !target.completed;

      if (checkingDone) {
        // Trigger mini checkbox burst immediately
        setActiveMiniBurstId(id);

        // Delay moving/updating the task to allow the animation to play fully
        setTimeout(async () => {
          const storedSlots = await AsyncStorage.getItem('studify_slots');
          if (storedSlots) {
            const slotsArray = JSON.parse(storedSlots);
            const updated = slotsArray.map(s =>
              s.id === id ? {...s, completed: true} : s,
            );
            await AsyncStorage.setItem(
              'studify_slots',
              JSON.stringify(updated),
            );

            // Reload state
            const todayKey = formatDateKey(new Date());
            const todaySlots = updated.filter(
              s => (s.date || todayKey) === todayKey,
            );
            setTasks(todaySlots);
            setPlannerCount(todaySlots.length);

            // Check if all today's slots are now completed
            const allDone =
              todaySlots.length > 0 && todaySlots.every(s => s.completed);
            if (allDone) {
              setShowGrandConfetti(true);
            }
          }
          setActiveMiniBurstId(null);
        }, 550);
      } else {
        // If unchecking, toggle immediately without animation delays
        const storedSlots = await AsyncStorage.getItem('studify_slots');
        if (storedSlots) {
          const slotsArray = JSON.parse(storedSlots);
          const updated = slotsArray.map(s =>
            s.id === id ? {...s, completed: false} : s,
          );
          await AsyncStorage.setItem('studify_slots', JSON.stringify(updated));
          loadDashboardData();
        }
      }
    } catch (e) {
      console.log('Failed to save updated task state', e);
    }
  };

  // Stats Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  // Group today's tasks by subject (e.g. Mathematics, General)
  const groupedTasks = tasks.reduce((groups, task) => {
    const subj = task.subject || 'General';
    if (!groups[subj]) {
      groups[subj] = [];
    }
    groups[subj].push(task);
    return groups;
  }, {});

  // Sort tasks within each subject: pending first, then by priority (High -> Medium -> Low)
  const priorityWeight = {High: 3, Medium: 2, Low: 1};
  Object.keys(groupedTasks).forEach(subj => {
    groupedTasks[subj].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const weightA = priorityWeight[a.priority] || 2;
      const weightB = priorityWeight[b.priority] || 2;
      return weightB - weightA;
    });
  });

  const getPriorityColor = p => {
    if (p === 'High') {
      return '#ff3b30';
    }
    if (p === 'Medium') {
      return '#ff9500';
    }
    return '#007171';
  };

  const renderExamTarget = () => {
    if (!examTarget) {
      return null;
    }
    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (new Date(examTarget.date) - new Date()) / (1000 * 60 * 60 * 24),
      ),
    );
    const remainingChapters = Math.max(
      0,
      examTarget.totalChapters - examTarget.completedChapters,
    );
    const chaptersPerDay =
      daysRemaining > 0 ? (remainingChapters / daysRemaining).toFixed(2) : 0;
    const completionPercent =
      Math.min(
        100,
        Math.round(
          (examTarget.completedChapters / examTarget.totalChapters) * 100,
        ),
      ) || 0;

    let plannerAdvice = 'On track! Spend 30 minutes revising daily.';
    if (chaptersPerDay > 0.05 && chaptersPerDay <= 0.2) {
      plannerAdvice = 'Steady pace! Study 1.5 hours daily to finish in time.';
    } else if (chaptersPerDay > 0.2) {
      plannerAdvice =
        'Needs focus! Dedicate 3 hours daily to cover the syllabus.';
    }

    return (
      <View
        style={[
          styles.targetCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}>
        <View style={styles.targetHeader}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
            <View style={styles.targetIconCircle}>
              <Icon name="bullseye-arrow" size={24} color="#ffffff" />
            </View>
            <View>
              <Text
                style={[styles.targetTitle, {color: theme.colors.onSurface}]}>
                {examTarget.title}
              </Text>
              <Text
                style={[styles.targetSubtitle, {color: theme.colors.outline}]}>
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : 'Exam today / completed!'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleDeleteTarget}
            style={styles.deleteTargetBtn}>
            <Icon name="trash-can-outline" size={20} color="#e53935" />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.targetProgressSection}>
          <View style={styles.progressLabelRow}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: theme.colors.onSurface,
              }}>
              Syllabus Coverage
            </Text>
            <Text style={{fontSize: 12, color: theme.colors.outline}}>
              {completionPercent}%
            </Text>
          </View>
          <ProgressBar
            progress={completionPercent / 100}
            color={theme.colors.primary}
            style={styles.targetProgressBar}
          />
          <Text style={styles.chaptersRatioText}>
            {examTarget.completedChapters} of {examTarget.totalChapters}{' '}
            chapters completed
          </Text>
        </View>

        {/* Study Advice */}
        <View
          style={[
            styles.adviceBox,
            {
              backgroundColor: theme.dark
                ? 'rgba(99, 102, 241, 0.12)'
                : '#eef2ff',
              borderColor: theme.dark ? '#4f46e5' : '#c7d2fe',
            },
          ]}>
          <Icon name="robot" size={20} color="#6366f1" />
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: theme.dark ? '#818cf8' : '#4f46e5',
              }}>
              Study Advice
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.onSurfaceVariant,
                marginTop: 2,
              }}>
              {plannerAdvice} ({chaptersPerDay} chapters/day required)
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View
        style={[
          styles.header,
          {borderBottomColor: theme.colors.outlineVariant},
        ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personalized Learning</Text>
        <View style={styles.headerBackSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Today's Progress Tracker Card */}
        <Card
          style={[
            styles.progressCard,
            {backgroundColor: theme.colors.primary},
          ]}>
          <View style={styles.progressHeader}>
            <Icon name="chart-donut" size={24} color="#ffffff" />
            <Text style={styles.progressTitle}>Today's Learning Progress</Text>
          </View>
          <Text style={styles.progressText}>
            {totalTasks === 0
              ? 'Create daily study targets to track progress!'
              : `You've completed ${completedTasks} of ${totalTasks} scheduled tasks (${Math.round(
                  completionRate * 100,
                )}%).`}
          </Text>
          <ProgressBar
            progress={completionRate}
            color={theme.colors.primaryContainer}
            style={styles.progressBar}
          />
        </Card>

        {/* Local Personalization Section */}
        {(repetitionNudge || Object.keys(subjectStats).length > 0) && (
          <View style={{ marginBottom: 20 }}>

            {aiFocusSub && (
              <View
                style={{
                  backgroundColor: theme.dark ? 'rgba(0, 113, 113, 0.15)' : '#e0f2f1',
                  borderLeftWidth: 4,
                  borderLeftColor: '#007171',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Icon name="rocket-launch" size={20} color="#007171" style={{marginRight: 10}} />
                <Text style={{fontSize: 12, color: theme.colors.onSurface, flex: 1, lineHeight: 16}}>
                  ✨ <Text style={{fontWeight: 'bold'}}>AI Focus of the Day:</Text> Boost your learning in <Text style={{ fontWeight: 'bold' }}>{formatSubjectName(aiFocusSub)}</Text> based on your spaced repetition & weakness score!
                </Text>
              </View>
            )}

            {/* 2. Spaced Repetition Nudge (if active) */}
            {repetitionNudge && (
              <View
                style={{
                  backgroundColor: theme.dark ? 'rgba(76, 175, 80, 0.15)' : '#e8f5e9',
                  borderLeftWidth: 4,
                  borderLeftColor: '#4caf50',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Icon name="brain" size={20} color="#4caf50" style={{marginRight: 10}} />
                <Text style={{fontSize: 12, color: theme.colors.onSurface, flex: 1, lineHeight: 16}}>
                  You studied <Text style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{repetitionNudge.subject}</Text> {repetitionNudge.days} days ago. A quick 5-minute recap helps retain 90% of memory!
                </Text>
              </View>
            )}

            {failedTopicNudge && (
              <TouchableOpacity
                onPress={() => navigation.navigate('AiNotesGenerator', { subject: failedTopicNudge.subject, topic: failedTopicNudge.topic })}
                style={{
                  backgroundColor: theme.dark ? 'rgba(233, 30, 99, 0.15)' : '#fce4ec',
                  borderLeftWidth: 4,
                  borderLeftColor: '#e91e63',
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}>
                <Icon name="robot-outline" size={26} color="#e91e63" style={{marginTop: 2, marginRight: 12}} />
                <View style={{flex: 1}}>
                  <Text style={{fontWeight: 'bold', fontSize: 14, color: '#e91e63', marginBottom: 4}}>Context-Aware AI Tutor</Text>
                  <Text style={{fontSize: 12, color: theme.colors.onSurface, lineHeight: 18}}>
                    I noticed you struggled with <Text style={{fontWeight: 'bold'}}>{failedTopicNudge.topic}</Text> in your last quiz. Want me to generate a custom study guide for you?
                  </Text>
                </View>
              </TouchableOpacity>
            )}

          </View>
        )}


        {/* Feature Cards Grid (Test Generator & Full Planner) */}
        <View style={styles.featuresRow}>
          {/* Card 1: AI Test Generator */}
          <TouchableOpacity
            onPress={() => navigation.navigate('TestGenerator')}
            style={[
              styles.featureCard1,
              theme.dark && {
                backgroundColor: 'rgba(0, 113, 113, 0.15)',
                borderColor: '#007171',
              },
            ]}>
            <View style={styles.featureIconCircle1}>
              <Icon name="brain" size={26} color="white" />
            </View>
            <Text
              style={[
                styles.featureCardTitle,
                {color: theme.colors.onSurface},
              ]}>
              AI Test Generator
            </Text>
            <Text
              style={[
                styles.featureCardDesc,
                {color: theme.colors.onSurfaceVariant},
              ]}>
              Customized mock tests for CBSE, JEE, NEET & CUET.
            </Text>
          </TouchableOpacity>

          {/* Card 2: Full Study Planner */}
          <TouchableOpacity
            onPress={() => navigation.navigate('StudyPlanner')}
            style={[
              styles.featureCard2,
              theme.dark && {
                backgroundColor: 'rgba(85, 139, 47, 0.15)',
                borderColor: '#558b2f',
              },
            ]}>
            <View style={styles.featureIconCircle2}>
              <Icon name="calendar-clock" size={26} color="white" />
            </View>
            <Text
              style={[
                styles.featureCardTitle,
                {color: theme.colors.onSurface},
              ]}>
              Planner & Tasks
            </Text>
            <Text
              style={[
                styles.featureCardDesc,
                {color: theme.colors.onSurfaceVariant},
              ]}>
              Structure study slots ({plannerCount} scheduled today), logs, and
              live timelines.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feature Cards Grid Row 2 (Notes Generator & Lecture Generator) */}
        <View style={[styles.featuresRow, {marginTop: -8, marginBottom: 20}]}>
          {/* Card 3: Notes Generator */}
          <TouchableOpacity
            onPress={() => navigation.navigate('AiNotesGenerator')}
            style={[
              styles.featureCard1,
              {
                backgroundColor: '#f5f6ff',
                borderColor: '#3f51b5',
              },
              theme.dark && {
                backgroundColor: 'rgba(63, 81, 181, 0.15)',
                borderColor: '#3f51b5',
              },
            ]}>
            <View
              style={[styles.featureIconCircle1, {backgroundColor: '#3f51b5'}]}>
              <Icon name="book-open-page-variant" size={24} color="white" />
            </View>
            <Text
              style={[
                styles.featureCardTitle,
                {color: theme.colors.onSurface},
              ]}>
              Notes Generator
            </Text>
            <Text
              style={[
                styles.featureCardDesc,
                {color: theme.colors.onSurfaceVariant},
              ]}>
              Generate rich topic notes for CBSE & Boards, then test yourself.
            </Text>
          </TouchableOpacity>

          {/* Card 4: Lecture Generator */}
          <TouchableOpacity
            onPress={() => navigation.navigate('AiLecturePlayer')}
            style={[
              styles.featureCard2,
              {
                backgroundColor: '#fdf4ff',
                borderColor: '#d946ef',
              },
              theme.dark && {
                backgroundColor: 'rgba(217, 70, 239, 0.15)',
                borderColor: '#d946ef',
              },
            ]}>
            <View
              style={[styles.featureIconCircle2, {backgroundColor: '#d946ef'}]}>
              <Icon name="play-circle-outline" size={26} color="white" />
            </View>
            <Text
              style={[
                styles.featureCardTitle,
                {color: theme.colors.onSurface},
              ]}>
              Lecture Generator
            </Text>
            <Text
              style={[
                styles.featureCardDesc,
                {color: theme.colors.onSurfaceVariant},
              ]}>
              Listen to interactive audio slide lectures on any topic, offline.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Exam Target & AI Study Planner Card */}
        {isSettingTarget ? (
          <View
            style={[
              styles.targetFormCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}>
            <View style={styles.formHeader}>
              <Icon name="target" size={20} color={theme.colors.primary} />
              <Text style={[styles.formTitle, {color: theme.colors.onSurface}]}>
                Set Exam Target
              </Text>
            </View>

            <Text style={styles.inputLabel}>Exam Name / Title</Text>
            <TextInput
              value={tempTitle}
              onChangeText={setTempTitle}
              placeholder="e.g. Class 10 Board Exam"
              placeholderTextColor={theme.colors.outline}
              style={[
                styles.formInput,
                {
                  color: theme.colors.onSurface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            />

            <Text style={styles.inputLabel}>Exam Date</Text>
            <TouchableOpacity
              onPress={showDatePicker}
              style={[
                styles.dateSelectorBtn,
                {borderColor: theme.colors.outlineVariant},
              ]}>
              <Icon name="calendar" size={18} color={theme.colors.primary} />
              <Text
                style={{
                  color: theme.colors.onSurface,
                  marginLeft: 8,
                  fontSize: 13,
                }}>
                {tempDate.toDateString()}
              </Text>
            </TouchableOpacity>

            <View style={styles.formRow}>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>Total Chapters</Text>
                <TextInput
                  value={tempTotalChapters}
                  onChangeText={setTempTotalChapters}
                  keyboardType="numeric"
                  style={[
                    styles.formInput,
                    {
                      color: theme.colors.onSurface,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                />
              </View>
              <View style={{width: 12}} />
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>Chapters Completed</Text>
                <TextInput
                  value={tempCompletedChapters}
                  onChangeText={setTempCompletedChapters}
                  keyboardType="numeric"
                  style={[
                    styles.formInput,
                    {
                      color: theme.colors.onSurface,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                onPress={() => setIsSettingTarget(false)}
                style={[styles.formBtn, {borderColor: theme.colors.outline}]}>
                <Text
                  style={{color: theme.colors.onSurfaceVariant, fontSize: 12}}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveTarget}
                style={[
                  styles.formBtn,
                  styles.btnPrimary,
                  {backgroundColor: theme.colors.primary},
                ]}>
                <Text
                  style={{color: '#ffffff', fontSize: 12, fontWeight: 'bold'}}>
                  Save Target
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : examTarget ? (
          renderExamTarget()
        ) : (
          <TouchableOpacity
            onPress={() => {
              setTempTitle('');
              setTempDate(new Date());
              setTempTotalChapters('12');
              setTempCompletedChapters('3');
              setIsSettingTarget(true);
            }}
            style={[
              styles.featureCardFull,
              {
                backgroundColor: '#eef2ff',
                borderColor: '#c7d2fe',
              },
              theme.dark && {
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                borderColor: '#6366f1',
              },
            ]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <View
                style={[
                  styles.featureIconCircleFull,
                  {backgroundColor: '#6366f1'},
                ]}>
                <Icon name="bullseye-arrow" size={26} color="white" />
              </View>
              <View style={{flex: 1}}>
                <Text
                  style={[
                    styles.featureCardTitle,
                    {color: theme.colors.onSurface},
                  ]}>
                  AI Exam Target & Study Planner
                </Text>
                <Text
                  style={[
                    styles.featureCardDesc,
                    {color: theme.colors.onSurfaceVariant},
                  ]}>
                  Set your exam date to generate a customized countdown,
                  coverage rate, and daily study targets!
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Card 3: Performance Analyzer */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Analysis')}
          style={[
            styles.featureCardFull,
            theme.dark && {
              backgroundColor: 'rgba(103, 58, 183, 0.15)',
              borderColor: '#673ab7',
            },
          ]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
            <View style={styles.featureIconCircleFull}>
              <Icon name="chart-bar" size={26} color="white" />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.featureCardTitle,
                  {color: theme.colors.onSurface},
                ]}>
                Performance Analyzer
              </Text>
              <Text
                style={[
                  styles.featureCardDesc,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                Track your study streaks, task completion rates, and test scores
                over time.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Current Tasks Checklist */}
        <View style={styles.checklistSection}>
          <View style={styles.sectionHeader}>
            <Text
              size="medium"
              style={[styles.sectionTitle, {color: theme.colors.onBackground}]}>
              Current Tasks ({pendingTasksCount} pending)
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('StudyPlanner')}>
              <Text style={[styles.seeAllText, {color: theme.colors.primary}]}>
                Manage Planner &gt;
              </Text>
            </TouchableOpacity>
          </View>

          {totalTasks === 0 ? (
            <Card
              style={[
                styles.emptyChecklistCard,
                theme.dark && {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}>
              <Icon
                name="check-decagram"
                size={32}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.emptyChecklistText,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                No study tasks set. Structure your day in the planner!
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('StudyPlanner')}
                style={[styles.miniBtn, {borderColor: theme.colors.primary}]}>
                <Text
                  style={[styles.miniBtnText, {color: theme.colors.primary}]}>
                  Create Task List
                </Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View>
              {Object.keys(groupedTasks).map(subj => (
                <View key={subj} style={styles.subjectGroupSection}>
                  <Text
                    style={[
                      styles.subjectGroupHeader,
                      {
                        color: theme.colors.primary,
                        borderBottomColor: theme.colors.outlineVariant,
                      },
                    ]}>
                    {subj}
                  </Text>
                  {groupedTasks[subj].map(item => {
                    const isCompleted = item.completed;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleToggleTask(item.id)}
                        style={[
                          styles.checklistRow,
                          theme.dark && {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.outlineVariant,
                          },
                        ]}>
                        <View
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                          }}>
                          <Icon
                            name={
                              isCompleted
                                ? 'checkbox-marked-circle'
                                : 'checkbox-blank-circle-outline'
                            }
                            size={22}
                            color={
                              isCompleted
                                ? theme.colors.primary
                                : theme.colors.onSurfaceVariant
                            }
                          />
                          <MiniBurst
                            active={activeMiniBurstId === item.id}
                            onComplete={() => setActiveMiniBurstId(null)}
                          />
                        </View>
                        <View style={styles.flex1}>
                          <Text
                            style={[
                              styles.checklistTaskDesc,
                              {color: theme.colors.onSurface},
                              isCompleted && styles.completedTaskText,
                            ]}>
                            {item.topic || item.description || 'Specific study topic'}
                          </Text>
                          <View style={styles.taskMetaRow}>
                            <View
                              style={[
                                styles.priorityTag,
                                {
                                  borderColor: getPriorityColor(
                                    item.priority || 'Medium',
                                  ),
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.priorityTagText,
                                  {
                                    color: getPriorityColor(
                                      item.priority || 'Medium',
                                    ),
                                  },
                                ]}>
                                {item.priority || 'Medium'}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Icon
                          name="chevron-right"
                          size={20}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Learning Diet (Balance Meter) - Moved to bottom */}
        <Card style={[styles.dietCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, marginTop: 20 }]}>
          <Card.Content>
            <View style={styles.dietHeader}>
              <Icon name="scale-balance" size={20} color={theme.colors.primary} />
              <Text style={[styles.dietTitle, { color: theme.colors.onSurface }]}>Your Subject Learning Diet</Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.colors.outline, marginBottom: 12 }}>
              Tracks which subjects you focus on. Powered by AI priority recommendation engine!
            </Text>

            {Object.keys(subjectStats).length === 0 ? (
              <View style={styles.emptyDiet}>
                <Icon name="book-open-outline" size={32} color="#aaa" />
                <Text style={{ fontSize: 12, color: theme.colors.outline, marginTop: 6, textAlign: 'center' }}>
                  No study sessions tracked. Open notes or create quizzes to see your distribution!
                </Text>
              </View>
            ) : (() => {
              const totalClicks = Object.values(subjectStats).reduce((sum, d) => sum + d.count, 0) || 1;

              // Normalize and group duplicates
              const normalizedStats = {};
              Object.entries(subjectStats).forEach(([subj, data]) => {
                const normName = formatSubjectName(subj);
                if (!normalizedStats[normName]) {
                  normalizedStats[normName] = { count: 0, lastOpenedTime: data.lastOpenedTime };
                }
                normalizedStats[normName].count += data.count;
                if (data.lastOpenedTime > normalizedStats[normName].lastOpenedTime) {
                  normalizedStats[normName].lastOpenedTime = data.lastOpenedTime;
                }
              });

              // Sort normalized subjects descending by count
              const sortedEntries = Object.entries(normalizedStats).sort((a, b) => b[1].count - a[1].count);

              // Separate main vs others (less than 5% clicks)
              const mainEntries = [];
              let othersCount = 0;
              const othersList = [];

              sortedEntries.forEach(([subj, data]) => {
                const percentage = (data.count / totalClicks) * 100;
                if (percentage >= 5) {
                  mainEntries.push({ name: subj, count: data.count, percent: Math.round(percentage) });
                } else {
                  othersCount += data.count;
                  othersList.push({ name: subj, count: data.count, percent: Math.round(percentage) });
                }
              });

              if (othersCount > 0) {
                mainEntries.push({ name: 'Others', count: othersCount, percent: Math.round((othersCount / totalClicks) * 100), isOthers: true });
              }

              const colorsList = ['#007171', '#673ab7', '#ff9800', '#2196f3', '#4caf50', '#e91e63', '#9c27b0', '#795548', '#3f51b5'];

              return (
                <View>
                  {/* Stacked diet progress bar */}
                  <View style={{ flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', marginVertical: 12, backgroundColor: theme.dark ? '#334155' : '#f1f5f9' }}>
                    {mainEntries.map((item, idx) => {
                      const color = item.isOthers ? '#94a3b8' : colorsList[idx % colorsList.length];
                      return (
                        <View
                          key={item.name}
                          style={{
                            flex: item.count,
                            backgroundColor: color,
                            height: '100%',
                          }}
                        />
                      );
                    })}
                  </View>

                  {/* Legend breakdown list */}
                  <View style={{ gap: 10, marginTop: 10 }}>
                    {sortedEntries.map(([subj, data], idx) => {
                      const percentage = Math.round((data.count / totalClicks) * 100);
                      const isOthers = percentage < 5;
                      const mainIdx = mainEntries.findIndex(m => m.name === subj);
                      const color = isOthers ? '#94a3b8' : colorsList[mainIdx !== -1 ? mainIdx : idx % colorsList.length];
                      const isAiFocus = aiFocusSub?.toLowerCase() === subj.toLowerCase();

                      return (
                        <View key={subj} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 8 }} />
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.onSurface }}>{subj}</Text>
                            {isAiFocus && (
                              <View style={{ backgroundColor: '#007171', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', color: '#ffffff' }}>✨ AI Focus</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 12, color: theme.colors.outline }}>{percentage}% ({data.count} clicks)</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })()}
          </Card.Content>
        </Card>
      </ScrollView>
      <Confetti
        active={showGrandConfetti}
        onComplete={() => setShowGrandConfetti(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerBackSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
  },
  progressCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#007171',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  progressTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  progressText: {
    color: '#e0f2f1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#004d40',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  featureCard1: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    backgroundColor: '#eef6f5',
    borderColor: '#007171',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featureCard2: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    backgroundColor: '#f1f8e9',
    borderColor: '#558b2f',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featureCardFull: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    backgroundColor: '#f3e5f5',
    borderColor: '#673ab7',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  featureIconCircleFull: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#673ab7',
  },
  featureIconCircle1: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#007171',
  },
  featureIconCircle2: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#558b2f',
  },
  featureCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 4,
  },
  featureCardDesc: {
    fontSize: 11,
    color: '#546e7a',
    lineHeight: 15,
  },
  checklistSection: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1d1d',
  },
  seeAllText: {
    color: '#007171',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyChecklistCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eceff1',
  },
  emptyChecklistText: {
    color: '#546e7a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    marginBottom: 12,
  },
  miniBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eceff1',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'visible',
  },
  checklistCheckIcon: {
    marginRight: 12,
  },
  checklistTaskDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#37474f',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#90a4ae',
  },
  flex1: {
    flex: 1,
  },
  subjectGroupSection: {
    marginBottom: 16,
  },
  subjectGroupHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007171',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0eded',
    paddingBottom: 4,
    textTransform: 'capitalize',
  },
  taskMetaRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  priorityTag: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  targetFormCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 12,
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  formBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnPrimary: {
    borderWidth: 0,
  },
  targetCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  targetIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  targetTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  targetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteTargetBtn: {
    padding: 6,
  },
  targetProgressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  targetProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  chaptersRatioText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  personaCard: {
    borderRadius: 16,
    elevation: 2,
    marginBottom: 12,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  personaIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  personaTextDetails: {
    flex: 1,
  },
  personaLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pulseIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  personaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  personaDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  nudgeCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 1,
  },
  nudgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dietCard: {
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    marginBottom: 12,
  },
  dietHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dietTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyDiet: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  dietRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dietLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dietSubjectName: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  dietBar: {
    height: 6,
    borderRadius: 3,
  },
});


export default PersonalizedLearning;
