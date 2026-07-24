import {View, Switch, Image, Share} from 'react-native';
import {useState, useEffect} from 'react';
import {Text} from '../../../Components/Input';
import {Screen, CardHorizontal} from '../../../Components/Screen';
import {Avatar, useTheme} from 'react-native-paper';

import {useDispatch, useSelector} from 'react-redux';
import {setUserLogout, setTheme, setUser} from '../../../Redux/Slices/InitialSlice';
import {openModal} from '../../../Redux/Slices/ModalSlice';
import InAppReview from '../../../Components/Screen/InAppReview';
import {removeFcmToken} from '../../../Components/Api/CheckAuth';
import useApi from '../../../Components/Api/Api';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNShare from 'react-native-share';

import {
  getAllSubjectStats,
  getTopEngagedSubjects,
  getAverageTestAccuracy,
  getLastFailedTopic,
  getFeatureUsageStats,
  getStudyStylePersona
} from '../../../Utils/EngagementTracker';

const formatSubjectName = (name) => {
  if (!name) return 'General';
  return name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const Profile = ({navigation}) => {
  const dispatch = useDispatch();
  const {colors} = useTheme();
  const {isDark, user} = useSelector(state => state.initial);
  const gamification = useSelector(state => state.gamification || { streak: 0 });
  const [isSwitchOn, setIsSwitchOn] = useState(isDark);

  const onToggleSwitch = () => {
    dispatch(setTheme());
    setIsSwitchOn(!isSwitchOn);
  };

  const handleShareReport = async () => {
    try {
      const stats = await getAllSubjectStats();
      const topSubjects = await getTopEngagedSubjects(3);
      const avgAccuracy = await getAverageTestAccuracy();
      const weakTopicInfo = await getLastFailedTopic();
      const featureStats = await getFeatureUsageStats();
      const persona = await getStudyStylePersona();

      const userName = `${user?.fname || 'Student'} ${user?.lname || ''}`.trim();
      const userClass = user?.studentClass || 'Class 10';
      const userBoard = user?.board || 'CBSE';
      const currentStreak = gamification.streak || 0;

      let topSubjectsText = '';
      if (topSubjects && topSubjects.length > 0) {
        topSubjects.forEach((sub, idx) => {
          const count = stats[sub]?.count || 0;
          topSubjectsText += `  #${idx + 1} ${formatSubjectName(sub)} (${count * 10} pts)\n`;
        });
      } else {
        topSubjectsText = '  No active subjects tracked yet.\n';
      }

      let revisionText = '  No weak areas identified. Great job! 🌟';
      if (weakTopicInfo && weakTopicInfo.topic) {
        revisionText = `  Focus: ${weakTopicInfo.subject} — "${weakTopicInfo.topic}"`;
      }

      let mentorTip = '';
      if (weakTopicInfo && weakTopicInfo.topic) {
        mentorTip = `Review notes on "${weakTopicInfo.topic}" and take a practice test.`;
      } else if (persona.title === 'Visual Reader') {
        mentorTip = `Turn summaries into quick practice quizzes to test active recall.`;
      } else if (persona.title === 'Active Tester') {
        mentorTip = `Read summary notes before jumping into tests to improve accuracy.`;
      } else if (persona.title === 'Auditory Learner') {
        mentorTip = `Listen to interactive audio slide lectures before bedtime.`;
      } else {
        mentorTip = `Explore AI Notes and mock tests to build a regular study habit.`;
      }

      const shareMessage = 
`🎓 STUDIFY SUCCESS — WEEKLY MENTOR REPORT

👤 Student: ${userName}
📚 Profile: ${userClass} (${userBoard})
🔥 Consistency Streak: ${currentStreak} Days
🎯 Avg Quiz Accuracy: ${avgAccuracy}%

📊 Top Focused Subjects:
${topSubjectsText}
📈 Activity Summary:
  • AI Notes Generated: ${featureStats.note || 0}
  • Quizzes & Mock Tests: ${featureStats.quiz || 0}
  • Audio Lectures Listened: ${featureStats.lecture || 0}

📌 Revision Focus:
${revisionText}

🧠 Learning Style: ${persona.title}
💡 Mentor Recommendation:
  ${mentorTip}

✨ Sent via Studify Success App
https://www.studifysuccess.com`;

      await RNShare.open({
        title: 'Weekly Mentor Report',
        message: shareMessage,
        failOnCancel: false,
      });
    } catch (error) {
      if (error && error.message && !error.message.includes('CANCELLED') && !error.message.includes('dismissed')) {
        Alert.alert('Share Error', 'Could not share report.');
      }
    }
  };

  return (
    <Screen NoHeader style={{justifyContent: 'center'}}>
      <InAppReview />
      <View 
        style={{
          alignItems: 'center', 
          backgroundColor: isDark ? colors.elevation.level1 : 'rgba(216, 27, 96, 0.04)',
          margin: 16,
          padding: 24,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: isDark ? colors.outlineVariant : 'rgba(216, 27, 96, 0.1)',
        }}
      >
        {user?.avatar ? (
          <Image
            source={{uri: user.avatar}}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 3,
              borderColor: colors.primary,
            }}
          />
        ) : (
          <Avatar.Text
            size={100}
            label={(user?.fname?.[0] || '') + (user?.lname?.[0] || '')}
            style={{backgroundColor: colors.primary}}
            color={colors.onPrimary}
          />
        )}
        <Text size="medium" style={{marginTop: 14, fontWeight: 'bold', color: colors.onSurface}}>
          {(user?.fname || '') + ' ' + (user?.lname || '')}
        </Text>
        <Text style={{color: colors.onSurfaceVariant, marginTop: 4}}>{user?.email}</Text>
        {user?.class && !user?.is_intern && (
          <Text style={{color: colors.primary, marginTop: 4, fontWeight: 'bold'}}>
            Class: {user.class}
          </Text>
        )}

      </View>
      <View style={{marginTop: 10}}>
        <CardHorizontal
          title="Share Mentor Report"
          leftIcon="share-variant"
          onPress={handleShareReport}
        />
        <CardHorizontal
          title="Edit Profile"
          leftIcon="account"
          onPress={() => {
            navigation.navigate('EditProfile');
          }}
        />
        <CardHorizontal
          title="Change Password"
          leftIcon="shield-account"
          onPress={() => {
            navigation.navigate('ChangePassword');
          }}
        />
        {/* <CardHorizontal
          title="Transactions"
          leftIcon="credit-card"
          onPress={() => {
            // navigation.navigate('Transaction');
            navigation.navigate('CustomerService');
          }}
        /> */}

        <CardHorizontal
          title="Dark Mode"
          leftIcon="weather-night"
          rightIcon={
            <View pointerEvents="none">
              <Switch
                value={isSwitchOn}
                trackColor={{false: '#afafaf81'}}
              />
            </View>
          }
          onPress={onToggleSwitch}
        />


        <CardHorizontal
          title="Terms & Conditions"
          leftIcon="shield-alert"
          onPress={() => {
            navigation.navigate('WebView', {
              url: 'https://studifysuccess.com/terms-conditions',
            });
          }}
        />
        <CardHorizontal
          title="Privacy Policy"
          leftIcon="clipboard-text"
          onPress={() => {
            navigation.navigate('WebView', {
              url: 'https://studifysuccess.com/privacy-policy',
            });
          }}
        />
        <CardHorizontal
          title="Help Center"
          leftIcon="help-circle"
          onPress={() => {
            navigation.navigate('HelpCenter');
          }}
        />
        <CardHorizontal
          title="Logout"
          leftIcon="logout"
          onPress={() => {
            dispatch(
              openModal({
                title: 'Logout',
                content: 'Are you sure you want to logout?',
                button: {
                  title: 'Logout',
                  onPress: () => {
                    dispatch(setUserLogout());
                    removeFcmToken();
                  },
                },
              }),
            );
          }}
        />
      </View>
    </Screen>
  );
};

export default Profile;
