import React, {useState, useCallback} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {Text} from '../../Components/Input';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTheme, Card, ProgressBar} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PersonalizedLearning = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [plannerCount, setPlannerCount] = useState(0);

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
    }, [loadDashboardData]),
  );

  const handleToggleTask = async id => {
    try {
      const storedSlots = await AsyncStorage.getItem('studify_slots');
      if (storedSlots) {
        const slotsArray = JSON.parse(storedSlots);
        const updated = slotsArray.map(s =>
          s.id === id ? {...s, completed: !s.completed} : s,
        );
        await AsyncStorage.setItem('studify_slots', JSON.stringify(updated));
        loadDashboardData();
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
                          style={styles.checklistCheckIcon}
                        />
                        <View style={styles.flex1}>
                          <Text
                            style={[
                              styles.checklistTaskDesc,
                              {color: theme.colors.onSurface},
                              isCompleted && styles.completedTaskText,
                            ]}>
                            {item.description}
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
      </ScrollView>
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
});

export default PersonalizedLearning;
