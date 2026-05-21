import React, {useState, useCallback} from 'react';
import {Screen} from '../../Components/Screen';
import HomeHeader from '../../Components/Screen/HomeHeader';
import Banner from '../../Components/Screen/Banner';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import {Text} from '../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme, Card, ProgressBar} from 'react-native-paper';

const Home = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [plannerCount, setPlannerCount] = useState(0);

  const loadDashboardData = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('studify_tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        setTasks([]);
      }
      
      const storedSlots = await AsyncStorage.getItem('studify_slots');
      if (storedSlots) {
        setPlannerCount(JSON.parse(storedSlots).length);
      } else {
        setPlannerCount(0);
      }
    } catch (e) {
      console.log('Failed to load dashboard data', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

  const handleToggleTask = async (id) => {
    const updated = tasks.map(t =>
      t.id === id ? {...t, completed: !t.completed} : t
    );
    setTasks(updated);
    try {
      await AsyncStorage.setItem('studify_tasks', JSON.stringify(updated));
    } catch (e) {
      console.log('Failed to save updated task state', e);
    }
  };

  // Stats Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
  const topPendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
  return (
    <Screen NoHeader style={{marginBottom: 80}}>
      {/* 1. Header component */}
      <HomeHeader />

      {/* 2. Interactive Quick Stats Dashboard */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Icon name="fire" size={24} color="#ff9500" />
          <View style={{marginLeft: 6}}>
            <Text style={styles.statVal}>5 Days</Text>
            <Text style={styles.statLabel}>Study Streak</Text>
          </View>
        </View>
        
        <View style={styles.statBox}>
          <Icon name="clipboard-check" size={22} color="#007171" />
          <View style={{marginLeft: 6}}>
            <Text style={styles.statVal}>
              {completedTasks}/{totalTasks}
            </Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Icon name="calendar-multiselect" size={22} color="#5c6bc0" />
          <View style={{marginLeft: 6}}>
            <Text style={styles.statVal}>{plannerCount} Slots</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
        </View>
      </View>

      {/* 3. Promo Banner Slides */}
      <Banner />
      {/* 4. Daily Study Progress Tracker Card */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Icon name="chart-donut" size={24} color="#ffffff" />
          <Text style={styles.progressTitle}>Today's Learning Progress</Text>
        </View>
        <Text style={styles.progressText}>
          {totalTasks === 0
            ? "Create daily study targets to track progress!"
            : `You've completed ${completedTasks} of ${totalTasks} scheduled tasks (${Math.round(completionRate * 100)}%).`}
        </Text>
        <ProgressBar
          progress={completionRate}
          color="#80cbc4"
          style={styles.progressBar}
        />
      </Card>

      {/* 5. Mini Task Checklist Widget */}
      <View style={styles.checklistSection}>
        <View style={styles.sectionHeader}>
          <Text size="medium" style={styles.sectionTitle}>
            Current Tasks
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('StudyPlanner')}>
            <Text style={styles.seeAllText}>Manage Planner &gt;</Text>
          </TouchableOpacity>
        </View>

        {topPendingTasks.length === 0 ? (
          <Card style={styles.emptyChecklistCard}>
            <Icon name="check-decagram" size={32} color="#007171" />
            <Text style={styles.emptyChecklistText}>
              {totalTasks > 0
                ? "Excellent! All scheduled tasks are complete."
                : "No study tasks set. Structure your day in the planner!"}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('StudyPlanner')}
              style={[styles.miniBtn, {borderColor: theme.colors.primary}]}>
              <Text style={[styles.miniBtnText, {color: theme.colors.primary}]}>
                {totalTasks > 0 ? "Add More Tasks" : "Create Task List"}
              </Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <View>
            {topPendingTasks.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleToggleTask(item.id)}
                style={styles.checklistRow}>
                <Icon
                  name="minus-circle-outline"
                  size={22}
                  color="#b0bec5"
                  style={styles.checklistCheckIcon}
                />
                <View style={{flex: 1}}>
                  <Text style={styles.checklistTaskDesc}>{item.description}</Text>
                  <Text style={styles.checklistTaskSub}>{item.subject} • Urgent</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#b0bec5" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 6. Primary Feature Navigation Grid (2x2) */}
      <View style={styles.gridSection}>
        <Text size="medium" style={[styles.sectionTitle, {marginBottom: 12}]}>
          Learning Modules
        </Text>

        <View style={styles.gridRow}>
          {/* Card 1: AI Test Generator */}
          <TouchableOpacity
            onPress={() => navigation.navigate('TestGenerator')}
            style={[styles.gridCard, {backgroundColor: '#eef6f5', borderColor: '#007171'}]}>
            <View style={[styles.gridIconCircle, {backgroundColor: '#007171'}]}>
              <Icon name="brain" size={26} color="white" />
            </View>
            <Text style={styles.gridCardTitle}>AI Test Generator</Text>
            <Text style={styles.gridCardDesc}>
              Customized mock tests for CBSE, JEE, NEET & CUET.
            </Text>
            <View style={styles.gridBadgeNew}>
              <Text style={styles.gridBadgeNewText}>AI</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Study Planner & Tasks */}
          <TouchableOpacity
            onPress={() => navigation.navigate('StudyPlanner')}
            style={[styles.gridCard, {backgroundColor: '#f1f8e9', borderColor: '#558b2f'}]}>
            <View style={[styles.gridIconCircle, {backgroundColor: '#558b2f'}]}>
              <Icon name="calendar-clock" size={26} color="white" />
            </View>
            <Text style={styles.gridCardTitle}>Planner & Tasks</Text>
            <Text style={styles.gridCardDesc}>
              Structure study slots, logs, and live timelines.
            </Text>
            <View style={[styles.gridBadgeNew, {backgroundColor: '#558b2f'}]}>
              <Text style={styles.gridBadgeNewText}>NEW</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          {/* Card 3: Virtual Live Meet */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Wishlist')}
            style={[styles.gridCard, {backgroundColor: '#e8eaf6', borderColor: '#283593'}]}>
            <View style={[styles.gridIconCircle, {backgroundColor: '#283593'}]}>
              <Icon name="video" size={26} color="white" />
            </View>
            <Text style={styles.gridCardTitle}>Virtual Live Meet</Text>
            <Text style={styles.gridCardDesc}>
              Join virtual classrooms and instant online doubt rooms.
            </Text>
          </TouchableOpacity>

          {/* Card 4: Free YouTube Notes */}
          <TouchableOpacity
            onPress={() => navigation.navigate('FreeNotes')}
            style={[styles.gridCard, {backgroundColor: '#ffebee', borderColor: '#c62828'}]}>
            <View style={[styles.gridIconCircle, {backgroundColor: '#c62828'}]}>
              <Icon name="youtube" size={26} color="white" />
            </View>
            <Text style={styles.gridCardTitle}>YouTube Notes</Text>
            <Text style={styles.gridCardDesc}>
              High quality free study notes mapped to video lectures.
            </Text>
            <View style={[styles.gridBadgeNew, {backgroundColor: '#c62828'}]}>
              <Text style={styles.gridBadgeNewText}>FREE</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. Premium Paid Academic Notes Section */}
      <View style={styles.premiumSection}>
        <View style={styles.sectionHeader}>
          <Text size="medium" style={styles.sectionTitle}>
            Premium Academic Notes
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.notesSlider}>
          {/* Note Card 1 */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('WebView', {
                url: 'https://allstudynotes.studifysuccess.com/select-class-chapter?mobile=true',
              })
            }
            style={styles.notesCard}>
            <View style={[styles.notesIconBox, {backgroundColor: '#e0f2f1'}]}>
              <Icon name="file-document-multiple-outline" size={24} color="#007171" />
            </View>
            <Text style={styles.notesCardTitle}>Chapter-Wise Notes</Text>
            <Text style={styles.notesCardDesc}>
              In-depth coverage of all concepts. High scores guaranteed.
            </Text>
          </TouchableOpacity>

          {/* Note Card 2 */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('WebView', {
                url: 'https://allstudynotes.studifysuccess.com/select-class-subject?mobile=true',
              })
            }
            style={styles.notesCard}>
            <View style={[styles.notesIconBox, {backgroundColor: '#fff3e0'}]}>
              <Icon name="book-open-page-variant" size={24} color="#e65100" />
            </View>
            <Text style={styles.notesCardTitle}>Combo Study Notes</Text>
            <Text style={styles.notesCardDesc}>
              Full syllabus bundles. Quick revision summaries.
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 8. Internship Banner */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Internship')}
        style={styles.internshipBanner}>
        <View style={{flex: 1}}>
          <Text style={styles.internshipTitle}>Gain Professional Experience</Text>
          <Text style={styles.internshipSubtitle}>
            Apply for the Studify Internship Program. Learn, grow, and build together!
          </Text>
        </View>
        <Icon name="briefcase-check-outline" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* 9. Support & Feedback Hub */}
      <View style={styles.supportHub}>
        <Text style={styles.supportHubTitle}>Need Academic or Tech Support?</Text>
        <View style={styles.supportIconsRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('HelpCenter')}
            style={styles.supportIconCol}>
            <View style={styles.supportIconCircle}>
              <Icon name="help-circle" size={22} color="#007171" />
            </View>
            <Text style={styles.supportIconText}>FAQ Center</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('CustomerService')}
            style={styles.supportIconCol}>
            <View style={styles.supportIconCircle}>
              <Icon name="phone" size={22} color="#007171" />
            </View>
            <Text style={styles.supportIconText}>Call Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Appreport')}
            style={styles.supportIconCol}>
            <View style={styles.supportIconCircle}>
              <Icon name="bug-outline" size={22} color="#007171" />
            </View>
            <Text style={styles.supportIconText}>Report Bug</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginVertical: 10,
    gap: 8,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eceff1',
  },
  statVal: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#263238',
  },
  statLabel: {
    fontSize: 9,
    color: '#78909c',
    marginTop: 1,
  },
  progressCard: {
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#007171',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
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
  checklistSection: {
    marginHorizontal: 15,
    marginVertical: 12,
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
  checklistTaskSub: {
    fontSize: 10,
    color: '#78909c',
    marginTop: 2,
  },
  gridSection: {
    marginHorizontal: 15,
    marginVertical: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 11,
    color: '#546e7a',
    lineHeight: 15,
  },
  gridBadgeNew: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#007171',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  gridBadgeNewText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  premiumSection: {
    marginVertical: 12,
  },
  notesSlider: {
    paddingLeft: 15,
    paddingRight: 5,
    gap: 12,
    paddingVertical: 4,
  },
  notesCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eceff1',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  notesIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  notesCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 4,
  },
  notesCardDesc: {
    fontSize: 11,
    color: '#78909c',
    lineHeight: 15,
  },
  internshipBanner: {
    marginHorizontal: 15,
    marginVertical: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#37474f',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    gap: 10,
  },
  internshipTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  internshipSubtitle: {
    color: '#cfd8dc',
    fontSize: 11,
    lineHeight: 16,
  },
  supportHub: {
    marginHorizontal: 15,
    marginVertical: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eceff1',
    elevation: 2,
    alignItems: 'center',
  },
  supportHubTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 12,
  },
  supportIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  supportIconCol: {
    alignItems: 'center',
    flex: 1,
  },
  supportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef6f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  supportIconText: {
    fontSize: 10,
    color: '#546e7a',
    fontWeight: 'bold',
  },
});

export default Home;
