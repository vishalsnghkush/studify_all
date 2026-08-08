import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, ProgressBar, Avatar, Button} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import useApi from '../../../Components/Api/Api';

const {width} = Dimensions.get('window');

const InternPerformance = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);

  const [metrics, setMetrics] = useState({
    completionRate: 0,
    accuracyScore: 0,
    reviewScore: '0.0',
    weeklyTasks: [0, 0, 0, 0, 0],
  });

  const [skills, setSkills] = useState([]);

  const [presentDays, setPresentDays] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [internStatus, setInternStatus] = useState('Pending');
  const { get } = useApi();

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        // Fetch real status from API
        try {
          const profileRes = await get('/interns/profile', {skipSuccessFlash: true, skipErrorFlash: true});
          if (profileRes && profileRes.data) {
            setInternStatus(profileRes.data.status || 'Pending');
          }
        } catch (profileErr) {
          console.log('Could not fetch profile from API in InternPerformance', profileErr);
        }

        // Fetch Performance Data
        try {
          const perfRes = await get('/interns/performance', {skipSuccessFlash: true, skipErrorFlash: true});
          if (perfRes && perfRes.data) {
            setMetrics(perfRes.data.metrics);
            setLeaderboard(perfRes.data.leaderboard);
            setSkills(perfRes.data.skills);
            
            // Set presentDays from the total tasks/eods count of the active user for now
            const myRank = perfRes.data.leaderboard.find(l => l.id === (user?.user_id || 'alice_123'));
            if (myRank) {
              setPresentDays(myRank.completed);
            }
          }
        } catch (perfErr) {
          console.log('Error fetching performance data', perfErr);
        }

      } catch (e) {
        console.error('Error fetching dashboard stats:', e);
      }
    };

    fetchPerformance();
    const unsubscribe = navigation.addListener('focus', fetchPerformance);
    return unsubscribe;
  }, [navigation, user]);

  const weeklyData = [
    {day: 'Mon', tasks: metrics.weeklyTasks[0]},
    {day: 'Tue', tasks: metrics.weeklyTasks[1]},
    {day: 'Wed', tasks: metrics.weeklyTasks[2]},
    {day: 'Thu', tasks: metrics.weeklyTasks[3]},
    {day: 'Fri', tasks: metrics.weeklyTasks[4]},
  ];

  const maxTasks = 10;

  // Certificate progress based on EOD reports (working days)
  const eodProgress = Math.min(1.0, presentDays / 27);
  const certs = [
    {
      title: 'Global Internship Completion Certificate',
      progress: eodProgress,
      status: eodProgress === 1.0 ? 'Completed & Signed' : `${Math.round(eodProgress * 100)}% Progress`,
    },
    {
      title: 'React Native Mobile Architecture (Course)',
      progress: 0.85,
      status: 'In Progress',
    },
  ];

  if (internStatus !== 'Approved') {
    return (
      <Screen NoHeader style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
        <Icon name="lock-outline" size={64} color="#999" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Verification Required</Text>
        <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
          Performance Dashboard is locked. Please upload your Internship Offer Letter in your Profile and await TL approval to unlock it.
        </Text>
        <Button mode="contained" onPress={() => navigation.navigate('InternProfile')}>
          Go to Profile
        </Button>
      </Screen>
    );
  }

  return (
    <Screen NoHeader style={styles.container}>
        <Text style={styles.title}>Performance Dashboard</Text>
        <Text style={styles.subtitle}>Track your task accuracy, skill progression, and weekly achievements.</Text>

        {/* 1. Custom SVG/View Bar Graph */}
        <Card style={styles.graphCard}>
          <Card.Content>
            <Text style={styles.cardHeader}>Weekly Tasks Completed</Text>
            <View style={styles.chartWrapper}>
              <View style={styles.yAxis}>
                <Text style={styles.axisText}>8</Text>
                <Text style={styles.axisText}>4</Text>
                <Text style={styles.axisText}>0</Text>
              </View>
              <View style={styles.chartGrid}>
                {weeklyData.map((d, index) => {
                  const barHeight = (d.tasks / maxTasks) * 120;
                  return (
                    <View key={index} style={styles.barColumn}>
                      <View style={[styles.bar, {height: barHeight, backgroundColor: colors.primary}]} />
                      <Text style={styles.barLabel}>{d.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 2. Key Metrics Grid */}
        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, {backgroundColor: colors.elevation.level2}]}>
            <Card.Content style={styles.metricContent}>
              <Icon name="check-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.metricVal}>{metrics.completionRate}%</Text>
              <Text style={styles.metricLbl}>Completion Rate</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.metricCard, {backgroundColor: colors.elevation.level2}]}>
            <Card.Content style={styles.metricContent}>
              <Icon name="bullseye-arrow" size={24} color={colors.primary} />
              <Text style={styles.metricVal}>{metrics.accuracyScore}%</Text>
              <Text style={styles.metricLbl}>Accuracy Score</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.metricCard, {backgroundColor: colors.elevation.level2}]}>
            <Card.Content style={styles.metricContent}>
              <Icon name="star-outline" size={24} color={colors.primary} />
              <Text style={styles.metricVal}>{metrics.reviewScore} / 5</Text>
              <Text style={styles.metricLbl}>Review Score</Text>
            </Card.Content>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Skills Improvement Tracker</Text>
        <Card style={styles.skillsCard}>
          <Card.Content>
            <View style={[styles.skillsNote, {backgroundColor: colors.elevation.level1, borderColor: colors.outlineVariant}]}>
              <Icon name="information-outline" size={13} color={colors.onSurfaceVariant} />
              <Text style={[styles.skillsNoteText, {color: colors.onSurfaceVariant}]}>
                {'  '}Skill levels are calculated from mock interview scores (60%) + task completion (40%). Take mock interviews in the AI Hub to improve your scores.
              </Text>
            </View>
            {skills.map((skill, index) => (
              <View key={index} style={styles.skillRow}>
                <View style={styles.skillHeader}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <View style={[styles.sourceTag, {backgroundColor: skill.source === 'interview' ? colors.primaryContainer : colors.elevation.level2}]}>
                      <Icon
                        name={skill.source === 'interview' ? 'comment-question-outline' : 'clipboard-check-outline'}
                        size={10}
                        color={skill.source === 'interview' ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                      />
                      <Text style={[styles.sourceTagText, {color: skill.source === 'interview' ? colors.onPrimaryContainer : colors.onSurfaceVariant}]}>
                        {'  '}{skill.source === 'interview' ? 'Interview' : 'Tasks'}
                      </Text>
                    </View>
                    <Text style={styles.skillPercentage}>{Math.round(skill.level * 100)}%</Text>
                  </View>
                </View>
                <ProgressBar progress={skill.level} color={skill.source === 'interview' ? colors.primary : colors.secondary || colors.primary} style={styles.progressBar} />
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Badges & Achievements Section */}
        <Text style={styles.sectionTitle}>Badges & Achievements 🏆</Text>
        <Card style={{marginBottom: 16, backgroundColor: '#fff', borderRadius: 12}}>
          <Card.Content style={{paddingVertical: 12}}>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'}}>
              {[
                { id: 'b1', title: 'Task Solver', desc: 'Completed 5+ assigned tasks', icon: 'checkbox-marked-circle-outline', color: '#10b981', earned: (metrics.completionRate || 0) >= 40 },
                { id: 'b2', title: 'Streak Bronze', desc: '3-day active check-in streak', icon: 'fire', color: '#d97706', earned: (metrics.accuracy || 0) >= 60 },
                { id: 'b3', title: 'Book Worm', desc: 'Read training module docs', icon: 'book-open-page-variant-outline', color: '#ec4899', earned: true },
                { id: 'b4', title: 'Elite Intern', desc: 'Achieved 85%+ task accuracy', icon: 'crown-outline', color: '#fbbf24', earned: (metrics.accuracy || 0) >= 85 },
                { id: 'b5', title: 'Streak Gold', desc: '30-day streak milestone', icon: 'seal-variant', color: '#94a3b8', earned: (metrics.accuracy || 0) >= 95 },
                { id: 'b6', title: 'Top Performer', desc: 'Ranked #1 in department', icon: 'trophy-award', color: '#8b5cf6', earned: (metrics.accuracy || 0) >= 90 },
              ].map(badge => (
                <View key={badge.id} style={{width: '48%', marginBottom: 12, padding: 8, backgroundColor: badge.earned ? '#F0FDF4' : '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: badge.earned ? '#BBF7D0' : '#E5E7EB', alignItems: 'center'}}>
                  <Icon name={badge.earned ? badge.icon : 'lock-outline'} size={28} color={badge.earned ? badge.color : '#9CA3AF'} />
                  <Text style={{fontSize: 12, fontWeight: 'bold', color: badge.earned ? '#111827' : '#6B7280', marginTop: 4, textAlign: 'center'}}>{badge.title}</Text>
                  <Text style={{fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 2}}>{badge.desc}</Text>
                  <View style={{marginTop: 6, backgroundColor: badge.earned ? '#10B981' : '#D1D5DB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10}}>
                    <Text style={{fontSize: 9, color: '#fff', fontWeight: 'bold'}}>{badge.earned ? '✓ Earned' : 'Locked'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 4. Leaderboard */}
        <Text style={styles.sectionTitle}>Intern Leaderboard</Text>
        <Card style={styles.leaderboardCard}>
          <Card.Content style={{padding: 4}}>
            {leaderboard.map((user) => (
              <View key={user.rank} style={styles.leaderRow}>
                <View style={styles.rankBadge}>
                  <Icon name="medal" size={20} color={user.color} />
                  <Text style={styles.rankText}>#{user.rank}</Text>
                </View>
                <Avatar.Text size={32} label={user.avatar} style={styles.leadAvatar} />
                <Text style={styles.leadName}>{user.name}</Text>
                <Text style={[styles.leadPoints, {color: colors.primary}]}>{user.points}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* 5. Certificates Progress */}
        <Text style={styles.sectionTitle}>Certificates Progress</Text>
        {certs.map((cert, index) => (
          <Card key={index} style={styles.certCard}>
            <Card.Content>
              <View style={styles.certHeader}>
                <Text style={styles.certTitle}>{cert.title}</Text>
                <Text style={[styles.certStatus, {color: cert.progress === 1.0 ? '#2E7D32' : colors.primary}]}>
                  {cert.status}
                </Text>
              </View>
              <ProgressBar progress={cert.progress} color={cert.progress === 1.0 ? '#4CAF50' : colors.primary} style={styles.progressBar} />
              {cert.progress === 1.0 && (
                <Button mode="contained-tonal" icon="share-variant" style={styles.shareBtn}>
                  Share Certificate
                </Button>
              )}
            </Card.Content>
          </Card>
        ))}
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  graphCard: {
    marginBottom: 20,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartWrapper: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
  },
  yAxis: {
    justifyContent: 'space-between',
    height: 120,
    paddingBottom: 15,
    marginRight: 10,
  },
  axisText: {
    fontSize: 11,
    color: '#888',
  },
  chartGrid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 140,
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(128, 128, 128, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    paddingBottom: 4,
  },
  barColumn: {
    alignItems: 'center',
  },
  bar: {
    width: 24,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    elevation: 1,
  },
  metricContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
  },
  metricLbl: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  skillsCard: {
    marginBottom: 20,
    elevation: 2,
  },
  skillRow: {
    marginBottom: 14,
  },
  skillsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  skillsNoteText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceTagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillName: {
    fontSize: 13,
    fontWeight: '600',
  },
  skillPercentage: {
    fontSize: 12,
    color: '#888',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  leaderboardCard: {
    marginBottom: 20,
    elevation: 2,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  rankText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  leadAvatar: {
    marginRight: 12,
  },
  leadName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  leadPoints: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  certCard: {
    marginBottom: 12,
    elevation: 1,
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  certTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    flex: 1,
    paddingRight: 10,
  },
  certStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  shareBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
});

export default InternPerformance;
