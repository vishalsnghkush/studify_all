import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
  Alert,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, List, Button, ProgressBar, Dialog, Portal} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {getInternDb} from '../../../Utils/MockInternDb';

const {width} = Dimensions.get('window');

const InternLearningHub = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);

  const [activeDoc, setActiveDoc] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const db = await getInternDb();
        const userDept = user?.department || 'Tech';
        const sessions = (db.meetings || []).filter(
          m => m.type === 'Training' && m.department.toLowerCase() === userDept.toLowerCase()
        );
        setLiveSessions(sessions);
      } catch (e) {
        console.error('Error fetching dynamic training sessions:', e);
      }
    };

    fetchMeetings();
    const unsubscribe = navigation.addListener('focus', fetchMeetings);
    return unsubscribe;
  }, [navigation, user?.department]);

  const courses = [
    {
      id: 1,
      title: 'React Native Navigation Best Practices',
      duration: '45 mins',
      progress: 0.8,
      instructor: 'John Doe (Tech Lead)',
      desc: 'Learn about stack navigation, nested drawer bars, and performance enhancements.',
    },
    {
      id: 2,
      title: 'Git Workflows & Collaborative Branching',
      duration: '32 mins',
      progress: 0.35,
      instructor: 'Sarah Jenkins (Senior PM)',
      desc: 'Best practices for pull requests, commits formatting, resolving merge conflicts, and squashing.',
    },
    {
      id: 3,
      title: 'Firebase Analytics & Cloud Crashlytics',
      duration: '50 mins',
      progress: 0.0,
      instructor: 'Alan Smith (Lead Architect)',
      desc: 'Integrating user event tracking, app health, and diagnosing remote crash traces.',
    },
  ];



  const docs = [
    {
      title: 'Studify Coding Guidelines',
      content:
        '1. Use clean variables naming structures.\n2. Wrap complex callbacks in React.useCallback to maintain rendering speeds.\n3. Always type check values and use optional chaining for nested objects user?.profile?.\n4. Avoid raw state mutations. Use appropriate React hooks.',
    },
    {
      title: 'Pull Request Review Standards',
      content:
        '1. Keep Pull Requests limited to 300 modified lines max.\n2. Include screenshots or visual walkthroughs for major UI modifications.\n3. Resolve all linting and test suite runs before asking your TL for approval.',
    },
    {
      title: 'Figma System and Styling Guide',
      content:
        '1. Use standard HSL colors matching the branding stylesheet.\n2. Do not use ad-hoc margin/padding variables; always match design grid tokens (8px, 16px, 24px).\n3. Keep text sizes locked to small (12px), medium (16px), or large (20px) to prevent scaling issues.',
    },
  ];

  const handleJoin = (link) => {
    Linking.openURL(link).catch((err) =>
      Alert.alert('Error', 'Unable to launch Google Meet link.'),
    );
  };

  const playVideo = (video) => {
    setActiveVideo(video);
    setVideoModalVisible(true);
  };

  return (
    <Screen NoHeader style={styles.container}>
        {/* Live Session Links */}
        <Text style={styles.sectionTitle}>Live Training Sessions</Text>
        {liveSessions.map((session, index) => (
          <Card key={index} style={[styles.liveCard, {backgroundColor: colors.elevation.level2}]}>
            <Card.Content style={styles.liveContent}>
              <View style={styles.liveInfo}>
                <View style={styles.liveBadge}>
                  <Icon name="video" size={14} color="#fff" />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
                <Text style={styles.liveTitle}>{session.title}</Text>
                <Text style={styles.liveTime}>🗓 {session.time}</Text>
                <Text style={styles.liveTopic}>Topic: {session.topic}</Text>
              </View>
              <Button mode="contained" onPress={() => handleJoin(session.link)} style={styles.joinBtn}>
                Join
              </Button>
            </Card.Content>
          </Card>
        ))}

        {/* Studify Official Podcasts & Training Videos */}
        <Text style={[styles.sectionTitle, {marginTop: 20}]}>📺 Studify Podcasts & Learning Videos</Text>
        {[
          {
            title: 'How internships at StudifySuccess help you build real experience!',
            type: 'Real Experience 🌟',
            channel: 'Studifysuccess Official',
            desc: 'Discover how working on live projects at StudifySuccess builds practical industry skills and accelerates your career growth.',
            youtubeUrl: 'https://www.youtube.com/watch?v=3dpNU3f7G2g',
            badgeColor: '#007171',
          },
          {
            title: 'Why every student must do at least one internship before graduation',
            type: 'Career Guidance 🎯',
            channel: 'Studifysuccess Official',
            desc: 'Essential insights for college students on why gaining internship experience before graduating is the key to landing high-paying job offers.',
            youtubeUrl: 'https://www.youtube.com/watch?v=ZkMpoktZKpA',
            badgeColor: '#E65100',
          },
          {
            title: 'Benefits of Internship',
            type: 'Shorts ⚡',
            channel: 'Studifysuccess Official',
            desc: 'Quick breakdown of the top benefits you gain as an intern at StudifySuccess.',
            youtubeUrl: 'https://youtube.com/shorts/hDr3o-Lq0vc?si=vZreXSZASYBBR0zY',
            badgeColor: '#D32F2F',
          },
          {
            title: 'Podcast with Our Best Sales and Marketing Intern',
            type: 'Sales Podcast 🎙️',
            channel: 'Studifysuccess Podcast',
            desc: 'Exclusive interview with our top Sales & Marketing intern sharing strategies, challenges, and how they succeeded.',
            youtubeUrl: 'https://www.youtube.com/watch?v=wyx2RPxv8Ug',
            badgeColor: '#1976D2',
          },
          {
            title: 'Podcast with Our Best Academic Intern – An Exclusive Journey of Growth and Excellence!',
            type: 'Academic Podcast 🎙️',
            channel: 'Studifysuccess Podcast',
            desc: 'Hear from our star Academic Intern about their daily workflow, mentorship, and journey to excellence.',
            youtubeUrl: 'https://www.youtube.com/watch?v=B7Xd-eKNXmk',
            badgeColor: '#7B1FA2',
          },
          {
            title: 'Podcast with Our Best HR Intern – A Story of Growth, Challenges, and Success! 🎙️',
            type: 'HR Podcast 🎙️',
            channel: 'Studifysuccess Podcast',
            desc: 'An inspiring conversation with our top HR intern discussing talent sourcing, team management, and personal growth.',
            youtubeUrl: 'https://www.youtube.com/watch?v=cRPvzMhrn5Q',
            badgeColor: '#388E3C',
          },
        ].map((item, idx) => (
          <Card key={idx} style={[styles.videoCard, {backgroundColor: colors.elevation?.level2 || '#fff'}]}>
            <Card.Content>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                <View style={{backgroundColor: item.badgeColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6}}>
                  <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>{item.type}</Text>
                </View>
                <Text style={{fontSize: 11, color: colors.outline}}>▶ YouTube Video</Text>
              </View>
              <Text style={[styles.courseTitle, {color: colors.onSurface}]}>{item.title}</Text>
              <Text style={{fontSize: 11, color: colors.primary, fontWeight: 'bold', marginBottom: 6}}>
                Channel: {item.channel}
              </Text>
              <Text style={[styles.courseDesc, {color: colors.onSurfaceVariant}]}>{item.desc}</Text>
              <Button
                mode="contained"
                icon="youtube"
                buttonColor="#FF0000"
                textColor="#fff"
                onPress={() => Linking.openURL(item.youtubeUrl).catch(() => Alert.alert('Error', 'Unable to open YouTube video link.'))}
                style={[styles.watchBtn, {marginTop: 10}]}>
                Watch on YouTube
              </Button>
            </Card.Content>
          </Card>
        ))}

        {/* Recorded Training Videos */}
        <Text style={[styles.sectionTitle, {marginTop: 20}]}>Recorded Training Modules</Text>
        {courses.map((course) => (
          <Card key={course.id} style={styles.videoCard}>
            <Card.Content>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseMeta}>
                Instructor: {course.instructor} | Duration: {course.duration}
              </Text>
              <Text style={styles.courseDesc}>{course.desc}</Text>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Completed: {Math.round(course.progress * 100)}%</Text>
                <ProgressBar progress={course.progress} color={colors.primary} style={styles.progressBar} />
              </View>
              <Button mode="outlined" icon="play-circle-outline" onPress={() => playVideo(course)} style={styles.watchBtn}>
                Watch Video
              </Button>
            </Card.Content>
          </Card>
        ))}

        {/* Documentation & Guidelines */}
        <Text style={[styles.sectionTitle, {marginTop: 20}]}>Documentation & Notes</Text>
        <Card style={styles.docsCard}>
          <Card.Content style={{padding: 4}}>
            {docs.map((doc, idx) => (
              <List.Accordion
                key={idx}
                title={doc.title}
                left={(props) => <List.Icon {...props} icon="book-open-page-variant" color={colors.primary} />}
                expanded={activeDoc === idx}
                onPress={() => setActiveDoc(activeDoc === idx ? null : idx)}>
                <View style={styles.docContent}>
                  <Text style={styles.docText}>{doc.content}</Text>
                </View>
              </List.Accordion>
            ))}
          </Card.Content>
        </Card>

        {/* Simulated Video Player Modal */}
        <Portal>
          <Dialog visible={videoModalVisible} onDismiss={() => setVideoModalVisible(false)} style={styles.videoDialog}>
            <Dialog.Title>{activeVideo?.title}</Dialog.Title>
            <Dialog.Content>
              <View style={styles.mockPlayer}>
                <Icon name="movie-play-outline" size={60} color="#fff" />
                <Text style={styles.playerText}>Simulated Streaming Video Player</Text>
                <Text style={styles.playerSub}>Instructor: {activeVideo?.instructor}</Text>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setVideoModalVisible(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  liveCard: {
    marginBottom: 12,
  },
  liveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveInfo: {
    flex: 1,
    paddingRight: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  liveTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  liveTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  liveTopic: {
    fontSize: 12,
    color: '#555',
  },
  joinBtn: {
    paddingHorizontal: 8,
  },
  videoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  courseMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    marginBottom: 6,
  },
  courseDesc: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  progressRow: {
    marginTop: 12,
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  watchBtn: {
    alignSelf: 'flex-start',
  },
  docsCard: {
    elevation: 2,
    marginBottom: 20,
  },
  docContent: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  docText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
  },
  videoDialog: {
    borderRadius: 12,
  },
  mockPlayer: {
    height: 180,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
  },
  playerSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
});

export default InternLearningHub;
