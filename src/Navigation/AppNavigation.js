import {CardStyleInterpolators} from '@react-navigation/stack';
import DrawerNavigation from './DrawerNavigation';
import InternDrawerNavigation from './InternDrawerNavigation';
import TLDrawerNavigation from './TLDrawerNavigation';
import React, {lazy} from 'react';
import {useSelector} from 'react-redux';
import InternAiHub from '../Screens/Home/Intern/InternAiHub';
import InternLearningHub from '../Screens/Home/Intern/InternLearningHub';
import InternReports from '../Screens/Home/Intern/InternReports';
import {
  Profile,
  EditProfile,
  Notifications,
  CourseDetails,
  HelpCenter,
  Transaction,
  ChangePassword,
  WebView,
  Update,
  TransactionDetails,
  Search,
  TestGenerator,
  StudyPlanner,
  OnlineTuitions,
  OfflineTuitions,
  ClassNotesSelector,
  PersonalizedLearning,
  GamificationDashboard,
  Careers,
  Activities,
  Counselling,
  VoiceNotebook,
  AiNotesGenerator,
  AiFlashcards,
  AiLecturePlayer,
  BrainGym,
} from '../Screens/Home';
import FocusSpace from '../Screens/Home/FocusSpace';
import Analysis from '../Screens/Home/Analysis';
import Meet from '../Screens/Home/Meet';
import Appreport from '../Screens/Home/Appreport';

import {AppBar} from '../Components/Navigation';
import {createStackNavigator} from '@react-navigation/stack';
import NoInternet from '../Screens/Home/NoInternet';
import FreeNotes from '../Screens/Home/Notes/FreeNotes';
import Lectures from '../Screens/Home/Notes/Lectures';
import LecturePlayer from '../Screens/Home/Notes/LecturePlayer';
import NcertSolutions from '../Screens/Home/Notes/NcertSolutions';
import ImportantQuestions from '../Screens/Home/Notes/ImportantQuestions';
import OnlineQuiz from '../Screens/Home/Notes/OnlineQuiz';
import Keywords from '../Screens/Home/Notes/Keywords';
import Pdf from '../Screens/Home/Notes/Pdf';
import Internship from '../Screens/Home/User/Internship';
const Groups = lazy(() => import('../Screens/Home/Chat/Groups'));
const Chat = lazy(() => import('../Screens/Home/Chat/Chat'));

const Stack = createStackNavigator();

const AppNavigation = () => {
  const {user} = useSelector(state => state.initial);
  return (
    <Stack.Navigator
      screenOptions={{
        header: props => <AppBar {...props} />,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}>
      <Stack.Screen
        key={user?.is_tl ? 'tl_stack' : user?.is_intern ? 'intern_stack' : 'student_stack'}
        options={{headerShown: false}}
        name="Main"
        component={
          user?.is_tl
            ? TLDrawerNavigation
            : user?.is_intern
            ? InternDrawerNavigation
            : DrawerNavigation
        }
      />
      <Stack.Screen
        name="InternAiHub"
        component={InternAiHub}
        options={{
          title: 'AI Productivity Hub',
          headerStyle: { backgroundColor: '#007171' },
          headerTintColor: '#ffffff',
        }}
      />
      <Stack.Screen
        name="InternLearningHub"
        component={InternLearningHub}
        options={{
          title: 'Learning & Training',
          headerStyle: { backgroundColor: '#007171' },
          headerTintColor: '#ffffff',
        }}
      />
      <Stack.Screen
        name="InternReports"
        component={InternReports}
        options={{
          title: 'EOD & Reports',
          headerStyle: { backgroundColor: '#007171' },
          headerTintColor: '#ffffff',
        }}
      />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenter}
        options={{
          title: 'Help Center',
        }}
      />

      <Stack.Screen name="Transaction" component={Transaction} />
      <Stack.Screen
        name="TransactionDetails"
        component={TransactionDetails}
        options={{
          title: 'E -Receipt',
        }}
      />
      <Stack.Screen
        name="WebView"
        component={WebView}
        options={({route}) => ({
          title: route?.params?.title || '',
          headerShown: route?.params?.title ? true : false,
          headerStyle: {
            backgroundColor: '#007171',
          },
          headerTintColor: '#ffffff',
        })}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePassword}
        options={{
          title: 'Change Password',
        }}
      />
      <Stack.Screen name="Internship" component={Internship} />
      <Stack.Screen
        name="Search"
        component={Search}
        options={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        }}
        sharedElements={() => {
          return ['searchbar'];
        }}
      />
      <Stack.Screen
        name="Update"
        component={Update}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Nointernet"
        component={NoInternet}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Meet"
        component={Meet}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="FreeNotes"
        component={FreeNotes}
        options={{title: 'YouTube Notes'}}
      />
      <Stack.Screen
        name="Lectures"
        component={Lectures}
        options={{title: 'Lectures'}}
      />
      <Stack.Screen
        name="LecturePlayer"
        component={LecturePlayer}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NcertSolutions"
        component={NcertSolutions}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ImportantQuestions"
        component={ImportantQuestions}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="OnlineQuiz"
        component={OnlineQuiz}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Keywords"
        component={Keywords}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Pdf" component={Pdf} options={{headerShown: false}} />
      <Stack.Screen
        name="Appreport"
        component={Appreport}
        options={{title: 'Report issue or bug'}}
      />
      <Stack.Screen
        name="TestGenerator"
        component={TestGenerator}
        options={{title: 'AI Test Generator'}}
      />
      <Stack.Screen
        name="StudyPlanner"
        component={StudyPlanner}
        options={{title: 'Study Planner & Tasks'}}
      />

      <Stack.Screen
        name="AiFlashcards"
        component={AiFlashcards}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ClassNotesSelector"
        component={ClassNotesSelector}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="PersonalizedLearning"
        component={PersonalizedLearning}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Groups"
        component={Groups}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="GamificationDashboard"
        component={GamificationDashboard}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="OfflineTuitions"
        component={OfflineTuitions}
        options={{
          title: 'Offline Tuitions',
        }}
      />
      <Stack.Screen
        name="Careers"
        component={Careers}
        options={{
          title: 'Careers',
        }}
      />
      <Stack.Screen
        name="Activities"
        component={Activities}
        options={{
          title: 'Activities',
        }}
      />
      <Stack.Screen
        name="Counselling"
        component={Counselling}
        options={{
          title: 'Counselling System',
        }}
      />
      <Stack.Screen
        name="VoiceNotebook"
        component={VoiceNotebook}
        options={{
          title: 'Voice Notebook',
          headerStyle: {
            backgroundColor: '#007171',
          },
          headerTintColor: '#ffffff',
        }}
      />
      <Stack.Screen
        name="AiNotesGenerator"
        component={AiNotesGenerator}
        options={{
          title: 'AI Study Notes Generator',
          headerStyle: {
            backgroundColor: '#007171',
          },
          headerTintColor: '#ffffff',
        }}
      />
      <Stack.Screen
        name="AiLecturePlayer"
        component={AiLecturePlayer}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FocusSpace"
        component={FocusSpace}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Analysis"
        component={Analysis}
        options={{
          title: 'Performance Analyzer',
        }}
      />
      <Stack.Screen
        name="BrainGym"
        component={BrainGym}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Chat"
        component={Chat}
        options={({route}) => ({
          title: route?.params?.data?.display_name || 'Chats',
        })}
      />
    </Stack.Navigator>
  );
};

export default AppNavigation;
