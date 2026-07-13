import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {useTheme, Card, ProgressBar, ActivityIndicator} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Screen} from '../../Components/Screen';
import {Text, Button} from '../../Components/Input';
import {useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXAMS_CLASSES_LIST = [
  'Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th', 'Class 11th', 'Class 12th',
  'JEE', 'NEET', 'GATE', 'CUET'
];

export default function Analysis({navigation}) {
  const theme = useTheme();
  const {user} = useSelector(state => state.initial);
  const gamification = useSelector(state => state.gamification || { xp: 0, level: 1, streak: 0, badges: [], streakHistory: [] });

  const [activeExam, setActiveExam] = useState('JEE');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBar, setSelectedBar] = useState(null);

  // States for real data
  const [realHistory, setRealHistory] = useState([]);
  const [plannerSlots, setPlannerSlots] = useState([]);
  const [pdfReads, setPdfReads] = useState([]);
  const [notebookCount, setNotebookCount] = useState(0);
  const [totalNotesPages, setTotalNotesPages] = useState(0);
  const [examTarget, setExamTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load all real databases from local storage
  const loadRealStats = async () => {
    try {
      // 1. Load test history
      const historyData = await AsyncStorage.getItem('@studify_test_history');
      if (historyData) setRealHistory(JSON.parse(historyData));

      // 2. Load study planner tasks
      const slotsData = await AsyncStorage.getItem('studify_slots');
      if (slotsData) setPlannerSlots(JSON.parse(slotsData));

      // 3. Load PDF notes reading log
      const pdfData = await AsyncStorage.getItem('@studify_notes_read_history');
      if (pdfData) setPdfReads(JSON.parse(pdfData));

      // 4. Load notebooks
      const notebooksData = await AsyncStorage.getItem('@voice_notebooks');
      if (notebooksData) {
        const parsedNotebooks = JSON.parse(notebooksData);
        setNotebookCount(parsedNotebooks.length);

        // Sum pages across all voice notebooks
        let pagesSum = 0;
        for (const notebook of parsedNotebooks) {
          const pagesData = await AsyncStorage.getItem(`@voice_notebook_pages_${notebook.id}`);
          if (pagesData) {
            pagesSum += JSON.parse(pagesData).length;
          }
        }
        setTotalNotesPages(pagesSum);
      }

      // 5. Load exam target
      const examTargetData = await AsyncStorage.getItem('@studify_exam_target');
      if (examTargetData) {
        setExamTarget(JSON.parse(examTargetData));
      } else {
        setExamTarget(null);
      }
    } catch (e) {
      console.warn('Failed to load local stats for analysis', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealStats();
    const unsubscribe = navigation.addListener('focus', () => {
      loadRealStats();
    });
    return unsubscribe;
  }, [navigation]);

  // Compute stats dynamically
  const examStats = useMemo(() => {
    const filteredReal = realHistory.filter(item => {
      const examName = (item.exam || '').toLowerCase().trim();
      const activeName = activeExam.toLowerCase().trim();
      
      if (activeName === 'class 6th' && (examName === 'ncert class 6' || examName === 'class 6th')) return true;
      if (activeName === 'class 7th' && (examName === 'ncert class 7' || examName === 'class 7th')) return true;
      if (activeName === 'class 8th' && (examName === 'ncert class 8' || examName === 'class 8th')) return true;
      if (activeName === 'class 9th' && (examName === 'ncert class 9' || examName === 'class 9th')) return true;
      if (activeName === 'class 10th' && (examName === 'ncert class 10' || examName === 'class 10th')) return true;
      if (activeName === 'class 11th' && (examName === 'ncert class 11' || examName === 'class 11th')) return true;
      if (activeName === 'class 12th' && (examName === 'ncert class 12' || examName === 'class 12th')) return true;
      
      return examName === activeName;
    });

    if (filteredReal.length === 0) {
      return {
        averageAccuracy: 0,
        totalTests: 0,
        averageScore: 0,
        maxMarks: 100,
        weeklyScores: [],
        subjects: [],
        strengths: [],
        weaknesses: [],
        history: []
      };
    }

    const totalTests = filteredReal.length;
    const avgAccuracy = Math.round(
      filteredReal.reduce((acc, item) => acc + (item.accuracy || 0), 0) / totalTests
    );
    const avgScore = Math.round(
      filteredReal.reduce((acc, item) => acc + (item.rawScore || 0), 0) / totalTests
    );
    const maxMarks = filteredReal[0].maxMarks || 100;

    const weeklyScores = filteredReal
      .slice(0, 10)
      .reverse()
      .map((item, idx) => ({
        label: `T${idx + 1}`,
        score: item.rawScore || 0,
        date: item.date
      }));

    // Group subject mastery
    const subjectMap = {};
    filteredReal.forEach(item => {
      const subName = item.subject || 'General';
      if (!subjectMap[subName]) {
        subjectMap[subName] = { total: 0, correctAcc: 0 };
      }
      subjectMap[subName].total += 1;
      subjectMap[subName].correctAcc += item.accuracy || 0;
    });

    const subjects = Object.keys(subjectMap).map((name, idx) => {
      const avgAcc = Math.round(subjectMap[name].correctAcc / subjectMap[name].total);
      const colorsList = ['#4caf50', '#007171', '#ff9800', '#2196f3'];
      return {
        name,
        score: avgAcc / 100,
        color: colorsList[idx % colorsList.length],
        rawPercent: avgAcc
      };
    });

    // Derive strengths and weaknesses
    const strengths = [];
    const weaknesses = [];
    filteredReal.forEach(item => {
      const topicName = item.subject || 'General';
      const accuracyVal = item.accuracy || 0;
      if (accuracyVal >= 75) {
        if (!strengths.some(s => s.topic === topicName)) {
          strengths.push({ topic: topicName, subject: activeExam, accuracy: accuracyVal });
        }
      } else {
        if (!weaknesses.some(w => w.topic === topicName)) {
          weaknesses.push({ topic: topicName, subject: activeExam, accuracy: accuracyVal });
        }
      }
    });

    return {
      averageAccuracy: avgAccuracy,
      totalTests,
      averageScore: avgScore,
      maxMarks,
      weeklyScores,
      subjects,
      strengths,
      weaknesses,
      history: filteredReal
    };
  }, [activeExam, realHistory]);

  // Compute Planner Analytics (Idea 1)
  const plannerAnalytics = useMemo(() => {
    const total = plannerSlots.length;
    const completed = plannerSlots.filter(s => s.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [plannerSlots]);

  // Compute PDF Notes Focus Analytics (Idea 2)
  const notesAnalytics = useMemo(() => {
    const totalReads = pdfReads.length;
    const subMap = {};
    pdfReads.forEach(item => {
      const sub = item.subject || 'General';
      subMap[sub] = (subMap[sub] || 0) + 1;
    });

    const distribution = Object.keys(subMap).map((sub, idx) => {
      const count = subMap[sub];
      const colorsList = ['#007171', '#ff9800', '#4caf50', '#2196f3'];
      return {
        subject: sub,
        count,
        percent: totalReads > 0 ? Math.round((count / totalReads) * 100) : 0,
        color: colorsList[idx % colorsList.length]
      };
    });

    return { totalReads, distribution };
  }, [pdfReads]);

  // Compute Streak contribution days for consistency grid (Idea 4)
  const lastFortnightDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const display = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const isActive = gamification.streakHistory?.includes(key);
      days.push({ key, display, isActive });
    }
    return days;
  }, [gamification.streakHistory]);

  const maxScoreVal = useMemo(() => {
    return Math.max(...examStats.weeklyScores.map(s => s.score), 10);
  }, [examStats]);

  const handleClearHistory = async () => {
    try {
      await AsyncStorage.removeItem('@studify_test_history');
      await AsyncStorage.removeItem('@studify_notes_read_history');
      setRealHistory([]);
      setPdfReads([]);
    } catch (_) {}
  };

  if (loading) {
    return (
      <Screen style={[styles.centerContainer, {backgroundColor: theme.colors.background}]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Screen>
    );
  }

  // General empty check: if there is no activity at all in planner, tests, pdfs, and notebooks
  const hasGlobalData =
    realHistory.length > 0 ||
    plannerSlots.length > 0 ||
    pdfReads.length > 0 ||
    notebookCount > 0;

  return (
    <Screen list style={{backgroundColor: theme.colors.background}}>
      <ScrollView contentContainerStyle={{paddingBottom: 40}} showsVerticalScrollIndicator={false}>
        
        {/* Header Title */}
        <View style={styles.header}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
            <View style={{flex: 1}}>
              <Text style={{fontWeight: 'bold', color: theme.colors.onBackground}} size="large">
                Performance Analyzer 📊
              </Text>
            </View>
            {hasGlobalData && (
              <TouchableOpacity onPress={handleClearHistory} style={{padding: 4}}>
                <Icon name="trash-can-outline" size={22} color="#c62828" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={{color: theme.colors.onSurfaceVariant, fontSize: 13, marginTop: 4}}>
            Real-time tracking of study plans, note logs, tests, and consistency.
          </Text>
        </View>

        {/* Gamification Progress Card */}
        <Card style={[styles.gameBanner, {backgroundColor: theme.colors.elevation.level1}]}>
          <Card.Content style={styles.gameBannerContent}>
            <View style={styles.gameHeaderRow}>
              <View style={styles.gameLeft}>
                <View style={[styles.levelCircle, {backgroundColor: theme.colors.primary}]}>
                  <Text style={styles.levelNum}>{gamification.level}</Text>
                </View>
                <View style={{marginLeft: 10}}>
                  <Text style={{fontWeight: 'bold', fontSize: 14}}>Level {gamification.level} Scholar</Text>
                  <Text style={{color: '#888', fontSize: 11}}>{gamification.xp} XP Accumulated</Text>
                </View>
              </View>
              <View style={styles.gameRight}>
                <Icon name="fire" size={20} color="#ff9800" />
                <Text style={{fontWeight: 'bold', color: '#ff9800', marginLeft: 4}}>
                  {gamification.streak} Days Streak
                </Text>
              </View>
            </View>
            <ProgressBar
              progress={(gamification.xp % 200) / 200}
              color={theme.colors.primary}
              style={{height: 6, borderRadius: 3, marginTop: 12}}
            />
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 4}}>
              <Text style={{fontSize: 9, color: '#888'}}>XP Progress to Level {gamification.level + 1}</Text>
              <Text style={{fontSize: 9, fontWeight: 'bold', color: theme.colors.primary}}>
                {gamification.xp % 200} / 200 XP
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Idea 4: Study Consistency Heat-map Grid */}
        <Card style={[styles.cardCommon, {backgroundColor: theme.colors.surface}]}>
          <Card.Content>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
              <Icon name="calendar-check" size={20} color="#007171" />
              <Text style={{fontWeight: 'bold', fontSize: 14, marginLeft: 8}}>
                Consistency Tracker (Last 14 Days)
              </Text>
            </View>
            <View style={styles.heatmapRow}>
              {lastFortnightDays.map((day, idx) => (
                <View key={idx} style={styles.heatmapDay}>
                  <View
                    style={[
                      styles.heatmapDot,
                      {
                        backgroundColor: day.isActive
                          ? '#4caf50'
                          : theme.dark
                          ? '#2a2a2a'
                          : '#e0e0e0',
                      },
                    ]}
                  />
                  <Text style={{fontSize: 9, color: '#888', marginTop: 4}}>{day.display}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* General empty check if there's no data */}
        {!hasGlobalData ? (
          <View style={styles.emptyContainer}>
            <Card style={[styles.emptyCard, {backgroundColor: theme.colors.surface}]}>
              <Card.Content style={styles.emptyContent}>
                <Image
                  source={require('../../Assets/Images/nodata.png')}
                  style={styles.emptyImage}
                />
                <Text style={{fontWeight: 'bold', fontSize: 16, marginTop: 15, textAlign: 'center'}}>
                  No Activity Logged Yet
                </Text>
                <Text style={{color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8, paddingHorizontal: 20, lineHeight: 18}}>
                  Open a Handwritten Note, add tasks in the Study Planner, or attempt an Online Quiz to start tracking your performance.
                </Text>
                <View style={{flexDirection: 'row', gap: 10, marginTop: 20, width: '90%', justifyContent: 'center'}}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('TestGenerator')}
                    style={[styles.emptyBtn, {backgroundColor: theme.colors.primary}]}>
                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 12}}>Practice Test</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('OnlineQuiz')}
                    style={[styles.emptyBtn, {borderColor: theme.colors.primary, borderWidth: 1.5}]}>
                    <Text style={{color: theme.colors.primary, fontWeight: 'bold', fontSize: 12}}>Online Quiz</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          </View>
        ) : (
          <View>
            
            {/* Idea 1 & 3: Study Planner & Notes Writing Statistics */}
            <View style={styles.rowGrid}>
              <Card style={[styles.halfCard, {backgroundColor: theme.colors.surface}]}>
                <Card.Content style={{alignItems: 'center', paddingVertical: 12}}>
                  <Icon name="checkbox-marked-circle-outline" size={24} color="#4caf50" />
                  <Text style={styles.statLabel}>Planner Efficiency</Text>
                  <Text style={[styles.statVal, {color: '#4caf50'}]}>{plannerAnalytics.rate}%</Text>
                  <Text style={{fontSize: 9, color: '#888', marginTop: 2}}>
                    {plannerAnalytics.completed}/{plannerAnalytics.total} Tasks Done
                  </Text>
                </Card.Content>
              </Card>

              <Card style={[styles.halfCard, {backgroundColor: theme.colors.surface}]}>
                <Card.Content style={{alignItems: 'center', paddingVertical: 12}}>
                  <Icon name="notebook-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.statLabel}>Notebook Pages</Text>
                  <Text style={[styles.statVal, {color: theme.colors.primary}]}>{totalNotesPages}</Text>
                  <Text style={{fontSize: 9, color: '#888', marginTop: 2}}>
                    Across {notebookCount} Notebooks
                  </Text>
                </Card.Content>
              </Card>
            </View>

            {/* Idea 2: Note Reading Focus Distribution */}
            {notesAnalytics.totalReads > 0 && (
              <Card style={[styles.cardCommon, {backgroundColor: theme.colors.surface, marginTop: 15}]}>
                <Card.Content>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
                    <Icon name="chart-donut" size={20} color="#673ab7" />
                    <Text style={{fontWeight: 'bold', fontSize: 14, marginLeft: 8}}>
                      Note Study Focus (Time Distribution)
                    </Text>
                  </View>
                  {notesAnalytics.distribution.map((dist, idx) => (
                    <View key={idx} style={{marginBottom: 10}}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                        <Text style={{fontSize: 12, fontWeight: 'bold'}}>{dist.subject}</Text>
                        <Text style={{fontSize: 12, color: dist.color, fontWeight: 'bold'}}>{dist.percent}%</Text>
                      </View>
                      <ProgressBar progress={dist.percent / 100} color={dist.color} style={{height: 6, borderRadius: 3}} />
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}

            {/* Exam Selector badge for Quiz & Test Performance */}
            <View style={{marginTop: 20}}>
              <Text style={{fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 8}}>
                Test & Quiz Performance:
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.examToggleScroll}>
                {EXAMS_CLASSES_LIST.map(exam => {
                  const isSelected = activeExam === exam;
                  return (
                    <TouchableOpacity
                      key={exam}
                      onPress={() => {
                        setActiveExam(exam);
                        setSelectedBar(null);
                      }}
                      style={[
                        styles.examBadge,
                        isSelected
                          ? {backgroundColor: theme.colors.primary}
                          : {backgroundColor: theme.colors.surfaceVariant || '#eee'},
                      ]}>
                      <Text
                        style={{
                          color: isSelected ? 'white' : theme.colors.onSurfaceVariant,
                          fontWeight: 'bold',
                          fontSize: 12,
                        }}>
                        {exam}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {examStats.totalTests === 0 ? (
              <Card style={[styles.cardCommon, {backgroundColor: theme.colors.surface, marginTop: 15}]}>
                <Card.Content style={{alignItems: 'center', paddingVertical: 20}}>
                  <Icon name="alert-circle-outline" size={32} color="#ff9800" />
                  <Text style={{fontWeight: 'bold', fontSize: 14, marginTop: 8}}>No Test Logs for {activeExam}</Text>
                  <Text style={{fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4, paddingHorizontal: 20}}>
                    Attempt an AI Test or Online Quiz for this class level to view marks progression graphs and strengths.
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <View>
                {/* Tab selections */}
                <View style={[styles.tabContainer, {borderBottomColor: theme.colors.outlineVariant || '#ddd'}]}>
                  {[
                    {id: 'overview', label: 'Overview', icon: 'view-dashboard-outline'},
                    {id: 'subjects', label: 'Subjects', icon: 'book-open-variant'},
                    {id: 'topics', label: 'Strengths', icon: 'star-circle-outline'},
                    {id: 'history', label: 'History', icon: 'history'},
                  ].map(tab => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id)}
                        style={[
                          styles.tabButton,
                          isSelected && {borderBottomColor: theme.colors.primary, borderBottomWidth: 3},
                        ]}>
                        <View style={styles.tabContent}>
                          <Icon
                            name={tab.icon}
                            size={16}
                            color={isSelected ? theme.colors.primary : '#888'}
                          />
                          <Text
                            style={{
                              color: isSelected ? theme.colors.primary : '#888',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              fontSize: 12,
                              marginLeft: 4,
                            }}>
                            {tab.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <View style={styles.tabView}>
                    {examTarget && (
                      <Card style={[styles.targetSummaryCard, {backgroundColor: theme.colors.surface}]}>
                        <Card.Content>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                              <Icon name="bullseye-arrow" size={20} color={theme.colors.primary} />
                              <Text style={{fontWeight: 'bold', fontSize: 14, color: theme.colors.onSurface}}>{examTarget.title}</Text>
                            </View>
                            <Text style={{fontSize: 12, fontWeight: 'bold', color: theme.colors.primary}}>
                              {(() => {
                                const daysRemaining = Math.max(0, Math.ceil((new Date(examTarget.date) - new Date()) / (1000 * 60 * 60 * 24)));
                                return daysRemaining > 0 ? `${daysRemaining} days left` : 'Exam completed';
                              })()}
                            </Text>
                          </View>
                          <ProgressBar
                            progress={Math.min(1, examTarget.completedChapters / examTarget.totalChapters)}
                            color={theme.colors.primary}
                            style={{height: 6, borderRadius: 3, marginBottom: 6}}
                          />
                          <Text style={{fontSize: 10, color: theme.colors.onSurfaceVariant}}>
                            Syllabus coverage: {examTarget.completedChapters} of {examTarget.totalChapters} chapters ({Math.min(100, Math.round((examTarget.completedChapters / examTarget.totalChapters) * 100)) || 0}%)
                          </Text>
                        </Card.Content>
                      </Card>
                    )}

                    <View style={styles.metricsGrid}>
                      <Card style={[styles.metricCard, {backgroundColor: theme.colors.surface}]}>
                        <Card.Content style={styles.metricContent}>
                          <Icon name="bullseye-arrow" size={24} color="#4caf50" />
                          <Text style={styles.metricTitle}>Accuracy</Text>
                          <Text style={[styles.metricVal, {color: '#4caf50'}]}>
                            {examStats.averageAccuracy}%
                          </Text>
                        </Card.Content>
                      </Card>

                      <Card style={[styles.metricCard, {backgroundColor: theme.colors.surface}]}>
                        <Card.Content style={styles.metricContent}>
                          <Icon name="checkbox-marked-circle-outline" size={24} color={theme.colors.primary} />
                          <Text style={styles.metricTitle}>Avg Score</Text>
                          <Text style={[styles.metricVal, {color: theme.colors.primary}]}>
                            {examStats.averageScore}
                          </Text>
                        </Card.Content>
                      </Card>

                      <Card style={[styles.metricCard, {backgroundColor: theme.colors.surface}]}>
                        <Card.Content style={styles.metricContent}>
                          <Icon name="chart-bar" size={24} color="#ff9800" />
                          <Text style={styles.metricTitle}>Percentile</Text>
                          <Text style={[styles.metricVal, {color: '#ff9800'}]}>
                            92nd
                          </Text>
                        </Card.Content>
                      </Card>
                    </View>

                    <Card style={[styles.chartCard, {backgroundColor: theme.colors.surface}]}>
                      <Card.Content>
                        <Text style={{fontWeight: 'bold', color: theme.colors.onSurface}} size="medium">
                          Score Progression Graph
                        </Text>
                        <Text style={{color: '#888', fontSize: 11, marginBottom: 15}}>
                          Tap on any bar to display the details of that test session.
                        </Text>

                        {selectedBar !== null && examStats.weeklyScores[selectedBar] && (
                          <View style={[styles.tooltipContainer, {backgroundColor: theme.colors.primary}]}>
                            <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11}}>
                              Attempt {examStats.weeklyScores[selectedBar].label} • {examStats.weeklyScores[selectedBar].date}
                            </Text>
                            <Text style={{color: 'white', fontSize: 12, fontWeight: 'bold', marginTop: 2}}>
                              Score: {examStats.weeklyScores[selectedBar].score} / {examStats.maxMarks}
                            </Text>
                          </View>
                        )}

                        <View style={styles.barChartContainer}>
                          {examStats.weeklyScores.map((item, idx) => {
                            const heightPercent = `${(item.score / maxScoreVal) * 80 + 10}%`;
                            const isSelected = selectedBar === idx;
                            return (
                              <View key={idx} style={styles.chartCol}>
                                <TouchableOpacity
                                  onPress={() => setSelectedBar(isSelected ? null : idx)}
                                  style={[
                                    styles.chartBar,
                                    {
                                      height: heightPercent,
                                      backgroundColor: isSelected ? theme.colors.primary : '#b2dfdf',
                                    },
                                  ]}
                                />
                                <Text style={styles.barLabel}>{item.label}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </Card.Content>
                    </Card>
                  </View>
                )}

                {/* SUBJECTS TAB */}
                {activeTab === 'subjects' && (
                  <View style={styles.tabView}>
                    {examStats.subjects.map((sub, index) => (
                      <Card key={index} style={[styles.subjectCard, {backgroundColor: theme.colors.surface}]}>
                        <Card.Content>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                              <View style={[styles.subjectIconWrap, {backgroundColor: sub.color + '15'}]}>
                                <Icon name="book-open-outline" size={20} color={sub.color} />
                              </View>
                              <Text style={{fontWeight: 'bold', fontSize: 16, marginLeft: 10}}>
                                {sub.name}
                              </Text>
                            </View>
                            <Text style={{fontWeight: 'bold', color: sub.color}}>{sub.rawPercent}%</Text>
                          </View>
                          <ProgressBar progress={sub.score} color={sub.color} style={{height: 8, borderRadius: 4, marginTop: 15}} />
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}

                {/* STRENGTHS TAB */}
                {activeTab === 'topics' && (
                  <View style={styles.tabView}>
                    {examStats.strengths.length > 0 && (
                      <Card style={[styles.secCard, {backgroundColor: theme.colors.surface}]}>
                        <Card.Content>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
                            <Icon name="check-decagram" size={24} color="#4caf50" />
                            <Text style={{fontWeight: 'bold', fontSize: 16, marginLeft: 8}}>
                              Strongest Subjects (Acc &gt;= 75%)
                            </Text>
                          </View>
                          {examStats.strengths.map((str, index) => (
                            <View key={index} style={styles.topicRow}>
                              <View style={{flex: 1}}>
                                <Text style={{fontWeight: 'bold'}}>{str.topic}</Text>
                                <Text style={{color: '#888', fontSize: 11}}>{str.subject}</Text>
                              </View>
                              <View style={{alignItems: 'flex-end'}}>
                                <Text style={{color: '#4caf50', fontWeight: 'bold'}}>{str.accuracy}% Acc</Text>
                                <ProgressBar progress={str.accuracy / 100} color="#4caf50" style={styles.topicBar} />
                              </View>
                            </View>
                          ))}
                        </Card.Content>
                      </Card>
                    )}

                    {examStats.weaknesses.length > 0 && (
                      <Card style={[styles.secCard, {backgroundColor: theme.colors.surface, marginTop: 20}]}>
                        <Card.Content>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
                            <Icon name="alert-decagram-outline" size={24} color="#ff9800" />
                            <Text style={{fontWeight: 'bold', fontSize: 16, marginLeft: 8}}>
                              Focus Areas (Acc &lt; 75%)
                            </Text>
                          </View>
                          {examStats.weaknesses.map((weak, index) => (
                            <View key={index} style={styles.topicRow}>
                              <View style={{flex: 1}}>
                                <Text style={{fontWeight: 'bold'}}>{weak.topic}</Text>
                                <Text style={{color: '#888', fontSize: 11}}>{weak.subject}</Text>
                              </View>
                              <View style={{alignItems: 'flex-end', gap: 4}}>
                                <Text style={{color: '#ff9800', fontWeight: 'bold'}}>{weak.accuracy}% Acc</Text>
                              </View>
                            </View>
                          ))}
                        </Card.Content>
                      </Card>
                    )}
                  </View>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                  <View style={styles.tabView}>
                    {examStats.history.map((hist, index) => (
                      <Card key={index} style={[styles.historyCard, {backgroundColor: theme.colors.surface}]}>
                        <Card.Content>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={{fontWeight: 'bold', fontSize: 15, color: theme.colors.primary}}>
                              {hist.id}
                            </Text>
                            <View style={styles.historyBadge}>
                              <Text style={{fontSize: 10, fontWeight: 'bold', color: theme.colors.primary}}>
                                {hist.type || 'AI Test'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.histGrid}>
                            <View>
                              <Text style={styles.histLabel}>Subject</Text>
                              <Text style={styles.histVal}>{hist.subject}</Text>
                            </View>
                            <View>
                              <Text style={styles.histLabel}>Score</Text>
                              <Text style={[styles.histVal, {color: '#4caf50'}]}>{hist.score}</Text>
                            </View>
                            <View>
                              <Text style={styles.histLabel}>Accuracy</Text>
                              <Text style={styles.histVal}>{hist.accuracy}%</Text>
                            </View>
                          </View>
                          <View style={styles.histFooter}>
                            <Icon name="calendar" size={14} color="#888" />
                            <Text style={styles.histFooterText}>{hist.date} • Duration: {hist.time || '15m 00s'}</Text>
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}
              </View>
            )}

          </View>
        )}

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  gameBanner: {
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    elevation: 2,
  },
  gameBannerContent: {
    paddingVertical: 12,
  },
  gameHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gameRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  cardCommon: {
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    elevation: 2,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  heatmapDay: {
    alignItems: 'center',
    flex: 1,
  },
  heatmapDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  rowGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 15,
    gap: 12,
  },
  halfCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 6,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  examToggleScroll: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 15,
    paddingBottom: 5,
  },
  examBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 1,
    marginRight: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingVertical: 10,
    flex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabView: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
  },
  metricContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  metricTitle: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 6,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  chartCard: {
    marginTop: 20,
    elevation: 2,
    borderRadius: 12,
  },
  tooltipContainer: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 16,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 6,
  },
  subjectCard: {
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
  },
  subjectIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  subGridLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
  },
  subGridVal: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  secCard: {
    elevation: 2,
    borderRadius: 12,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topicBar: {
    height: 4,
    width: 60,
    borderRadius: 2,
    marginTop: 4,
  },
  historyCard: {
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
  },
  historyBadge: {
    backgroundColor: '#eef6f5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  histGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  histLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
  },
  histVal: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  histFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  histFooterText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 6,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  emptyCard: {
    borderRadius: 15,
    elevation: 3,
    paddingVertical: 20,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  emptyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetSummaryCard: {
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
});
