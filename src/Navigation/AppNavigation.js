import {CardStyleInterpolators} from '@react-navigation/stack';
import DrawerNavigation from './DrawerNavigation';
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
} from '../Screens/Home';
import Meet from '../Screens/Home/Meet';
import Appreport from '../Screens/Home/Appreport';
import {CustomerService} from '../Screens/Home/HelpCenter';
import {AppBar} from '../Components/Navigation';
import {createStackNavigator} from '@react-navigation/stack';
import NoInternet from '../Screens/Home/NoInternet';
import FreeNotes from '../Screens/Home/Notes/FreeNotes';
import Pdf from '../Screens/Home/Notes/Pdf';

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
      <Stack.Screen name="FreeNotes" component={FreeNotes} />
      <Stack.Screen name="Pdf" component={Pdf} options={{headerShown: false}} />
      <Stack.Screen
        name="Appreport"
        component={Appreport}
        options={{title: 'Report issue or bug'}}
      />
    </Stack.Navigator>
  );
};

export default AppNavigation;
