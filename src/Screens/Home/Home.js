import React, {useState, useCallback} from 'react';
import {Screen} from '../../Components/Screen';
import HomeHeader from '../../Components/Screen/HomeHeader';
import Banner from '../../Components/Screen/Banner';
import {TouchableOpacity, StyleSheet, View, Image} from 'react-native';
import {Text} from '../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from 'react-native-paper';

const Home = () => {
  const navigation = useNavigation();
  const {colors, dark} = useTheme();

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

  // Stats Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <Screen NoHeader style={styles.screenContainer}>
      {/* 1. Header component */}
      <HomeHeader />

      {/* 2. Interactive Quick Stats Dashboard */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statBox,
            dark && {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <Icon name="fire" size={24} color="#ff9500" />
          <View style={styles.statTextContainer}>
            <Text style={[styles.statVal, dark && {color: colors.onSurface}]}>
              5 Days
            </Text>
            <Text
              style={[
                styles.statLabel,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              Study Streak
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statBox,
            dark && {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <Icon name="clipboard-check" size={22} color="#007171" />
          <View style={styles.statTextContainer}>
            <Text style={[styles.statVal, dark && {color: colors.onSurface}]}>
              {completedTasks}/{totalTasks}
            </Text>
            <Text
              style={[
                styles.statLabel,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              Tasks Done
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statBox,
            dark && {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <Icon name="calendar-multiselect" size={22} color="#5c6bc0" />
          <View style={styles.statTextContainer}>
            <Text style={[styles.statVal, dark && {color: colors.onSurface}]}>
              {plannerCount} Slots
            </Text>
            <Text
              style={[
                styles.statLabel,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              Scheduled
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Promo Banner Slides */}
      <Banner />

      {/* Personalized Learning Banner Card */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PersonalizedLearning')}
        style={[
          styles.personalBanner,
          dark && {
            backgroundColor: colors.surface,
            borderColor: colors.outlineVariant,
          },
        ]}>
        <View style={styles.personalTextContainer}>
          <Text
            style={[
              styles.personalSubtitle,
              dark && {color: colors.onSurfaceVariant},
            ]}>
            <Text
              style={[
                styles.subtitleBoldText,
                dark && {color: colors.primary},
              ]}>
              My
            </Text>{' '}
            study planner & targets
          </Text>
          <Text
            style={[styles.personalTitle, dark && {color: colors.onSurface}]}>
            Personalized Learning
          </Text>
          <View
            style={[
              styles.personalBtn,
              dark && {backgroundColor: colors.primary},
            ]}>
            <Text style={styles.personalBtnText}>Open Study Hub</Text>
            <Icon
              name="chevron-right"
              size={13}
              color="#ffffff"
              style={styles.chevronIcon}
            />
          </View>
        </View>
        <Image
          source={require('../../Assets/Images/personalized_learning.png')}
          style={styles.personalImage}
        />
      </TouchableOpacity>

      {/* Offline Coaching Banner Card */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('WebView', {
            url: 'https://www.studifysuccess.com/pre-registration-offline-tuition',
          })
        }
        style={[
          styles.offlineBanner,
          dark && {
            backgroundColor: colors.surface,
            borderColor: colors.outlineVariant,
          },
        ]}>
        <View style={styles.offlineTextContainer}>
          <Text
            style={[
              styles.offlineSubtitle,
              dark && {color: colors.onSurfaceVariant},
            ]}>
            <Text
              style={[
                styles.subtitleBoldOffline,
                dark && {color: colors.primary},
              ]}>
              Want
            </Text>{' '}
            to study{' '}
            <Text
              style={[
                styles.subtitleBoldOfflineHighlight,
                dark && {color: colors.secondary},
              ]}>
              offline
            </Text>
            ?
          </Text>
          <Text
            style={[styles.offlineTitle, dark && {color: colors.onSurface}]}>
            Offline Coaching
          </Text>
          <View
            style={[
              styles.offlineBtn,
              dark && {backgroundColor: colors.primary},
            ]}>
            <Text style={styles.offlineBtnText}>Register Now</Text>
            <Icon
              name="open-in-new"
              size={13}
              color="#ffffff"
              style={styles.openInNewIcon}
            />
          </View>
        </View>
        <Image
          source={require('../../Assets/Images/offline_coaching.png')}
          style={styles.offlineImage}
        />
      </TouchableOpacity>

      {/* Study Notes Banner Card */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ClassNotesSelector')}
        style={[
          styles.notesBanner,
          dark && {
            backgroundColor: colors.surface,
            borderColor: colors.outlineVariant,
          },
        ]}>
        <View style={styles.notesTextContainer}>
          <Text
            style={[
              styles.notesSubtitle,
              dark && {color: colors.onSurfaceVariant},
            ]}>
            <Text
              style={[
                styles.subtitleBoldNotes,
                dark && {color: colors.primary},
              ]}>
              Free
            </Text>{' '}
            study materials!
          </Text>
          <Text style={[styles.notesTitle, dark && {color: colors.onSurface}]}>
            Download Notes
          </Text>
          <View
            style={[
              styles.notesBtn,
              dark && {backgroundColor: colors.primary},
            ]}>
            <Text style={styles.notesBtnText}>Select Class</Text>
            <Icon
              name="chevron-right"
              size={13}
              color="#ffffff"
              style={styles.chevronIcon}
            />
          </View>
        </View>
        <Image
          source={require('../../Assets/Images/study_notes.png')}
          style={styles.notesImage}
        />
      </TouchableOpacity>

      {/* Careers Banner Card */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('WebView', {
            url: 'https://careers.studifysuccess.com/',
          })
        }
        style={[
          styles.careersBanner,
          dark && {
            backgroundColor: colors.surface,
            borderColor: colors.outlineVariant,
          },
        ]}>
        <View style={styles.careersTextContainer}>
          <Text
            style={[
              styles.careersSubtitle,
              dark && {color: colors.onSurfaceVariant},
            ]}>
            <Text
              style={[
                styles.subtitleBoldCareers,
                dark && {color: colors.primary},
              ]}>
              Build
            </Text>{' '}
            the future with us
          </Text>
          <Text
            style={[styles.careersTitle, dark && {color: colors.onSurface}]}>
            Careers
          </Text>
          <View
            style={[
              styles.careersBtn,
              dark && {backgroundColor: colors.primary},
            ]}>
            <Text style={styles.careersBtnText}>Join Our Team</Text>
            <Icon
              name="chevron-right"
              size={13}
              color="#ffffff"
              style={styles.chevronIcon}
            />
          </View>
        </View>
        <Image
          source={require('../../Assets/Images/careers.png')}
          style={styles.careersImage}
        />
      </TouchableOpacity>

      {/* Internship Banner */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Internship')}
        style={[
          styles.internshipBanner,
          dark && {
            backgroundColor: 'rgba(55, 71, 79, 0.4)',
            borderColor: '#546e7a',
            borderWidth: 1,
          },
        ]}>
        <View style={styles.internshipTextContainer}>
          <Text style={styles.internshipTitle}>
            Gain Professional Experience
          </Text>
          <Text style={[styles.internshipSubtitle, dark && {color: '#b0bec5'}]}>
            Apply for the Studify Internship Program. Learn, grow, and build
            together!
          </Text>
        </View>
        <Icon name="briefcase-check-outline" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* 9. Support & Feedback Hub */}
      <View
        style={[
          styles.supportHub,
          dark && {
            backgroundColor: colors.surface,
            borderColor: colors.outlineVariant,
          },
        ]}>
        <Text
          style={[styles.supportHubTitle, dark && {color: colors.onSurface}]}>
          Need Academic or Tech Support?
        </Text>
        <View style={styles.supportIconsRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('HelpCenter')}
            style={styles.supportIconCol}>
            <View
              style={[
                styles.supportIconCircle,
                dark && {backgroundColor: '#1c2d2d'},
              ]}>
              <Icon name="help-circle" size={22} color={colors.primary} />
            </View>
            <Text
              style={[
                styles.supportIconText,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              FAQ Center
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('CustomerService')}
            style={styles.supportIconCol}>
            <View
              style={[
                styles.supportIconCircle,
                dark && {backgroundColor: '#1c2d2d'},
              ]}>
              <Icon name="phone" size={22} color={colors.primary} />
            </View>
            <Text
              style={[
                styles.supportIconText,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              Call Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Appreport')}
            style={styles.supportIconCol}>
            <View
              style={[
                styles.supportIconCircle,
                dark && {backgroundColor: '#1c2d2d'},
              ]}>
              <Icon name="bug-outline" size={22} color={colors.primary} />
            </View>
            <Text
              style={[
                styles.supportIconText,
                dark && {color: colors.onSurfaceVariant},
              ]}>
              Report Bug
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    marginBottom: 80,
  },
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
    paddingHorizontal: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eceff1',
  },
  statTextContainer: {
    marginLeft: 4,
    flex: 1,
    flexShrink: 1,
  },
  statVal: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#263238',
  },
  statLabel: {
    fontSize: 9,
    color: '#78909c',
    marginTop: 1,
    flexWrap: 'wrap',
  },
  chevronIcon: {
    marginLeft: 2,
  },
  openInNewIcon: {
    marginLeft: 4,
  },
  subtitleBoldText: {
    fontWeight: 'bold',
    color: '#006064',
  },
  subtitleBoldOffline: {
    fontWeight: 'bold',
    color: '#b23b3b',
  },
  subtitleBoldOfflineHighlight: {
    fontWeight: 'bold',
    color: '#007171',
  },
  subtitleBoldNotes: {
    fontWeight: 'bold',
    color: '#007171',
  },
  subtitleBoldCareers: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  internshipTextContainer: {
    flex: 1,
  },
  internshipBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#37474f',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
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
  offlineBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffe0e0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  offlineTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  offlineSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  offlineBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  offlineBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  offlineImage: {
    flex: 0.8,
    height: 90,
    width: 90,
    resizeMode: 'contain',
  },
  notesBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#eef9f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d5ebeb',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  notesTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  notesSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  notesBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  notesBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  notesImage: {
    flex: 0.8,
    height: 90,
    width: 90,
    resizeMode: 'contain',
  },
  careersBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e0ff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  careersTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  careersSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  careersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  careersBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  careersBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  careersImage: {
    flex: 0.8,
    height: 90,
    width: 90,
    resizeMode: 'contain',
  },
  personalBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#b2ebf2',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  personalTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  personalSubtitle: {
    fontSize: 12,
    color: '#37474f',
    marginBottom: 4,
  },
  personalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  personalBtn: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 1,
  },
  personalBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  personalImage: {
    flex: 0.8,
    height: 90,
    width: 90,
    resizeMode: 'contain',
  },
});

export default Home;
