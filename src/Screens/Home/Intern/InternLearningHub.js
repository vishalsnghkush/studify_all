import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, Button, Dialog, Portal} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import useApi from '../../../Components/Api/Api';

const PRICE = 149;
const RAZORPAY_KEY = 'rzp_test_TNciL5Zn3FHf5v'; // User's active test key

const {width} = Dimensions.get('window');

const InternLearningHub = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = theme.dark;
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  const { get, post } = useApi();

  const [activeView, setActiveView] = useState('main');
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);
  const [recordedModules, setRecordedModules] = useState([]);
  const [trainingUnlocked, setTrainingUnlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const liveRes = await get('/interns/trainings/live', {skipSuccessFlash: true, skipErrorFlash: true});
        if (liveRes && liveRes.data) setLiveSessions(liveRes.data);

        const modRes = await get('/interns/trainings/modules', {skipSuccessFlash: true, skipErrorFlash: true});
        if (modRes && modRes.data) setRecordedModules(modRes.data);

        // Check if training modules are unlocked
        const purchaseRes = await get('/payment/my-purchases', {skipSuccessFlash: true, skipErrorFlash: true});
        if (purchaseRes && purchaseRes.data && purchaseRes.data.unlockedKeys) {
          setTrainingUnlocked(purchaseRes.data.unlockedKeys.includes('training_modules'));
        }
      } catch (e) {
        console.error('Error fetching training data:', e);
      }
    };

    fetchTrainings();
    const unsubscribe = navigation.addListener('focus', fetchTrainings);
    return unsubscribe;
  }, [navigation]);

  const openTrainingModulesPaywall = () => {
    if (trainingUnlocked) {
      setActiveView('recorded');
      return;
    }
    setShowPaywall(true);
  };

  const openRazorPay = () => {
    if (!RazorpayCheckout || !RazorpayCheckout.open) {
      Alert.alert('RazorPay Error', 'RazorPay SDK module is not linked or initialized correctly in the app build.');
      return;
    }
    setPaying(true);
    try {
      const options = {
        name: 'StudifySuccess',
        description: 'Training Modules',
        image: 'https://www.studifysuccess.com/images//apple-touch-icon.webp',
        currency: 'INR',
        key: RAZORPAY_KEY,
        amount: PRICE * 100,
        prefill: {
          email: (user && user.email) || '',
          contact: (user && user.phone && user.phone.length === 10) ? user.phone : '',
        },
        theme: {color: '#3F51B5'},
      };

      RazorpayCheckout.open(options)
      .then(async (e) => {
        try {
          await post('/payment/unlock-item', {
            item_key: 'training_modules',
            title: 'Training Modules',
            amount: PRICE,
            payment_id: e.razorpay_payment_id,
          });
          setTrainingUnlocked(true);
          setShowPaywall(false);
          setActiveView('recorded');
        } catch (err) {
          Alert.alert('Unlock Error', err.message || 'Payment succeeded but failed to unlock content in database.');
        }
      })
      .catch((error) => {
        Alert.alert('Payment Cancelled/Failed', error.description || error.message || 'The checkout sheet closed.');
      })
      .finally(() => setPaying(false));
    } catch (err) {
      Alert.alert('Checkout Launch Error', err.message || 'An error occurred while launching RazorPay.');
      setPaying(false);
    }
  };

  useEffect(() => {
    let title = 'Learning & Training';
    if (activeView === 'recorded') title = 'Recorded Training Modules';
    if (activeView === 'live') title = 'Live Training Sessions';
    if (activeView === 'docs') title = 'Documentation & Notes';
    navigation.setOptions({ title });
  }, [activeView, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (activeView !== 'main') {
        e.preventDefault();
        setActiveView('main');
      }
    });
    return unsubscribe;
  }, [activeView, navigation]);

  const handleJoin = (link) => {
    if (!link) {
      Alert.alert('No Link', 'No resource link is available.');
      return;
    }
    Linking.openURL(link).catch((err) =>
      Alert.alert('Error', 'Unable to launch link.'),
    );
  };

  const handleWatchVideo = (course) => {
    const driveRegExp = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = course.video_url ? course.video_url.match(driveRegExp) : null;
    
    if (match && match[1]) {
      navigation.navigate('LecturePlayer', {
        lecture: {
          id: match[1],
          name: course.title,
          description: course.description,
          subject: 'Training Module',
        }
      });
    } else if (course.video_url && !course.video_url.startsWith('http') && course.video_url.length > 15) {
      navigation.navigate('LecturePlayer', {
        lecture: {
          id: course.video_url,
          name: course.title,
          description: course.description,
          subject: 'Training Module',
        }
      });
    } else {
      handleJoin(course.video_url);
    }
  };

  const renderMainView = () => (
    <>
      <Text style={styles.sectionTitle}>Learning Hub</Text>
      
      {/* Card 1: Recorded Training Videos LOCKED */}
      <TouchableOpacity activeOpacity={0.8} onPress={openTrainingModulesPaywall}>
        <Card style={[styles.navCard, {backgroundColor: '#F0F4FF'}]}>
          <View style={styles.navCardContent}>
            <View style={{flex: 1, paddingRight: 16}}>
              <Text style={{fontSize: 13, color: '#3949AB', fontWeight: 'bold', marginBottom: 4}}>RECORDED TRAINING VIDEOS</Text>
              <Text style={{fontSize: 18, fontWeight: 'bold', color: '#1A237E', marginBottom: 8}}>Training Modules</Text>
              <View style={[styles.navButton, {backgroundColor: trainingUnlocked ? '#3F51B5' : '#e91e63'}]}>
                <Text style={styles.navButtonText}>{trainingUnlocked ? 'Watch Videos >' : '🔒 Unlock ₹149'}</Text>
              </View>
            </View>
            <View style={[styles.navIconCont, {backgroundColor: '#E8EAF6'}]}>
              <Icon name={trainingUnlocked ? 'video-outline' : 'lock'} size={28} color="#3F51B5" />
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Card 2: Live Session Links */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveView('live')}>
        <Card style={[styles.navCard, {backgroundColor: '#E0F2F1'}]}>
          <View style={styles.navCardContent}>
            <View style={{flex: 1, paddingRight: 16}}>
              <Text style={{fontSize: 13, color: '#00695C', fontWeight: 'bold', marginBottom: 4}}>LIVE SESSION LINKS</Text>
              <Text style={{fontSize: 18, fontWeight: 'bold', color: '#004D40', marginBottom: 8}}>Live Sessions</Text>
              <View style={[styles.navButton, {backgroundColor: '#00897B'}]}>
                <Text style={styles.navButtonText}>View Sessions ></Text>
              </View>
            </View>
            <View style={[styles.navIconCont, {backgroundColor: '#B2DFDB'}]}>
              <Icon name="video-account" size={28} color="#00796B" />
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Card 3: Documentation & Notes */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveView('docs')}>
        <Card style={[styles.navCard, {backgroundColor: '#FFF3E0'}]}>
          <View style={styles.navCardContent}>
            <View style={{flex: 1, paddingRight: 16}}>
              <Text style={{fontSize: 13, color: '#E65100', fontWeight: 'bold', marginBottom: 4}}>DOCUMENTATION & NOTES</Text>
              <Text style={{fontSize: 18, fontWeight: 'bold', color: '#BF360C', marginBottom: 8}}>Access Docs</Text>
              <View style={[styles.navButton, {backgroundColor: '#F57C00'}]}>
                <Text style={styles.navButtonText}>View Docs ></Text>
              </View>
            </View>
            <View style={[styles.navIconCont, {backgroundColor: '#FFE0B2'}]}>
              <Icon name="file-document-outline" size={28} color="#E65100" />
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Studify Podcasts & Learning Videos */}
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16}}>
        <Icon name="television-classic" size={24} color="#00695C" />
        <Text style={[styles.sectionTitle, {marginBottom: 0, marginLeft: 8}]}>Studify Podcasts & Learning Videos</Text>
      </View>

      {[
        {
          title: 'How internships at StudifySuccess help you build real experience!',
          type: 'Real Experience 🌟',
          channel: 'Studifysuccess Official',
          desc: 'Discover how working on live projects at StudifySuccess builds practical industry skills and accelerates your career growth.',
          youtubeUrl: 'https://www.youtube.com/watch?v=wyx2RPxv8Ug',
          badgeColor: '#00695C',
        },
        {
          title: 'Why every student must do at least one internship before graduation',
          type: 'Career Guidance 🎯',
          channel: 'Studifysuccess Official',
          desc: 'Essential insights for college students on why internships are the stepping stone to securing top-tier job offers.',
          youtubeUrl: 'https://www.youtube.com/watch?v=wyx2RPxv8Ug',
          badgeColor: '#E65100',
        },
        {
          title: 'Top 5 Skills Tech Companies Look For in 2026',
          type: 'Tech Industry 💻',
          channel: 'Studifysuccess Official',
          desc: 'A comprehensive breakdown of the most demanded skills in software engineering, AI, and cloud architecture today.',
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
    </>
  );

  const renderRecordedModules = () => (
    <>
      {recordedModules.length === 0 ? (
        <Card style={{ marginVertical: 8, backgroundColor: colors.elevation.level1, borderWidth: 1, borderColor: colors.outlineVariant }}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Icon name="video-off-outline" size={48} color={colors.outline} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.onSurface, marginTop: 12 }}>No Recorded Modules</Text>
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              There are currently no recorded training modules available for your division.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        recordedModules.map((course) => (
          <Card key={course.id} style={styles.videoCard}>
            <Card.Content>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseMeta}>
                Instructor: {course.instructor} | Duration: {course.duration}
              </Text>
              <Text style={styles.courseDesc}>{course.description}</Text>
              <Button mode="outlined" icon="play-circle-outline" onPress={() => handleWatchVideo(course)} style={styles.watchBtn}>
                Watch Video
              </Button>
            </Card.Content>
          </Card>
        ))
      )}
    </>
  );

  const renderLiveSessions = () => (
    <>
      {liveSessions.length === 0 ? (
        <Card style={{ marginVertical: 8, backgroundColor: colors.elevation.level1, borderWidth: 1, borderColor: colors.outlineVariant }}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Icon name="calendar-blank" size={48} color={colors.outline} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.onSurface, marginTop: 12 }}>No Live Sessions Scheduled</Text>
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              There are currently no upcoming live training sessions for your division. Your Team Leader will post scheduled sessions here.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        liveSessions.map((session, index) => (
          <Card key={index} style={[styles.liveCard, {backgroundColor: colors.elevation.level2}]}>
            <Card.Content style={styles.liveContent}>
              <View style={styles.liveInfo}>
                <View style={styles.liveBadge}>
                  <Icon name="video" size={14} color="#fff" />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
                <Text style={styles.liveTitle}>{session.title}</Text>
                <Text style={styles.liveTime}>🗓 {session.scheduled_time}</Text>
                {session.topic ? <Text style={styles.liveTopic}>Topic: {session.topic}</Text> : null}
              </View>
              <Button mode="contained" onPress={() => handleJoin(session.meeting_link)} style={styles.joinBtn}>
                Join
              </Button>
            </Card.Content>
          </Card>
        ))
      )}
    </>
  );

  const renderDocs = () => (
    <>
      <Card style={{ marginVertical: 8, backgroundColor: colors.elevation.level1, borderWidth: 1, borderColor: colors.outlineVariant }}>
        <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Icon name="file-document-outline" size={48} color={colors.outline} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.onSurface, marginTop: 12 }}>No Documents Available</Text>
          <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            There are currently no official documents or SOPs uploaded for your division.
          </Text>
        </Card.Content>
      </Card>
    </>
  );

  return (
    <Screen NoHeader style={styles.container}>
      {activeView === 'main' && renderMainView()}
      {activeView === 'recorded' && renderRecordedModules()}
      {activeView === 'live' && renderLiveSessions()}
      {activeView === 'docs' && renderDocs()}
      
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
      {/* Paywall Modal — Training Modules */}
      <Modal
        visible={showPaywall}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaywall(false)}>
        <View style={styles.paywallOverlay}>
          <View style={[styles.paywallCard, {backgroundColor: isDark ? colors.elevation.level3 : '#fff'}]}>
            <TouchableOpacity style={styles.paywallClose} onPress={() => setShowPaywall(false)}>
              <Icon name="close" size={22} color={isDark ? colors.onSurfaceVariant : '#555'} />
            </TouchableOpacity>
            <View style={[styles.paywallLockCircle, {backgroundColor: isDark ? 'rgba(63,81,181,0.15)' : '#EEF2FF'}]}>
              <Icon name="lock" size={36} color={isDark ? '#9FA8DA' : '#3F51B5'} />
            </View>
            <Text style={[styles.paywallTitle, {color: isDark ? '#9FA8DA' : '#3F51B5'}]}>Premium Content</Text>
            <Text style={[styles.paywallItemName, {color: isDark ? colors.onSurface : '#1A237E'}]}>Training Modules</Text>
            <Text style={[styles.paywallDesc, {color: isDark ? colors.onSurfaceVariant : '#555'}]}>Unlock lifetime access to all recorded training videos with a one-time payment.</Text>
            <View style={styles.paywallPriceRow}>
              <Text style={[styles.paywallPrice, {color: isDark ? colors.onSurface : '#1A237E'}]}>₹149</Text>
              <Text style={[styles.paywallPriceLabel, {color: isDark ? colors.onSurfaceVariant : '#666'}]}>  One-time</Text>
            </View>
            <TouchableOpacity
              style={[styles.paywallBtn, {backgroundColor: isDark ? colors.primary : '#3F51B5'}, paying && {opacity: 0.6}]}
              onPress={openRazorPay}
              disabled={paying}>
              <Icon name="credit-card-outline" size={18} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.paywallBtnText}>{paying ? 'Processing...' : 'Pay ₹149 & Unlock'}</Text>
            </TouchableOpacity>
            <Text style={[styles.paywallSecure, {color: isDark ? colors.outline : '#888'}]}>🔒 Secured by RazorPay · GPay · UPI · Cards</Text>
          </View>
        </View>
      </Modal>
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
  navCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  navCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  navIconCont: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
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
  watchBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
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
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  paywallCard: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  paywallClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  paywallLockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  paywallItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  paywallDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  paywallPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  paywallPrice: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  paywallPriceLabel: {
    fontSize: 13,
  },
  paywallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  paywallBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  paywallSecure: {
    fontSize: 10,
    textAlign: 'center',
  }
});

export default InternLearningHub;
