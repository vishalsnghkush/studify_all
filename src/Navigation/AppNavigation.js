import {CardStyleInterpolators} from '@react-navigation/stack';
import DrawerNavigation from './DrawerNavigation';
import {lazy} from 'react';
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
  ClassNotesSelector,
  PersonalizedLearning,
} from '../Screens/Home';
import Meet from '../Screens/Home/Meet';
import Appreport from '../Screens/Home/Appreport';
import {CustomerService} from '../Screens/Home/HelpCenter';
import {AppBar} from '../Components/Navigation';
import {createStackNavigator} from '@react-navigation/stack';
import NoInternet from '../Screens/Home/NoInternet';
import FreeNotes from '../Screens/Home/Notes/FreeNotes';
import Pdf from '../Screens/Home/Notes/Pdf';
import Internship from '../Screens/Home/User/Internship';
const Groups = lazy(() => import('../Screens/Home/Chat/Groups'));
const Chat = lazy(() => import('../Screens/Home/Chat/Chat'));

const AppNavigation = () => {
  const Stack = createStackNavigator();
  return (
    <Stack.Navigator
      screenOptions={{
        header: props => <AppBar {...props} />,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}>
      <Stack.Screen
        options={{headerShown: false}}
        name="Main"
        component={DrawerNavigation}
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
      <Stack.Screen
        name="CustomerService"
        component={CustomerService}
        options={{
          title: 'Customer Service',
          showPhoneIcon: true,
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
        options={{
          headerShown: false,
        }}
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
