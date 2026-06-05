import {createMaterialBottomTabNavigator} from 'react-native-paper/react-navigation';
import {Profile, OnlineTuitions} from '../Screens/Home';
import Notes from '../Screens/Home/Notes/Notes';
import Main from '../Screens/Home/Main';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import Groups from '../Screens/Home/Chat/Groups';

export default function BottomNavigation() {
  const Tab = createMaterialBottomTabNavigator();
  const theme = useTheme();
  const {bottom} = useSafeAreaInsets();
  const {user} = useSelector(state => state.initial);

  return (
    <>
      <Tab.Navigator
        activeColor={theme.colors.primary}
        inactiveColor={theme.colors.onSurfaceVariant}
        barStyle={{
          paddingBottom: bottom || 0,
          height: 55,
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
        screenOptions={{
          tabBarHideOnKeyboard: true,
          headerShown: false,
        }}>
        <Tab.Screen
          name="Home"
          component={Main}
          options={{
            title: 'Home',
            tabBarIcon: ({focused}) => (
              <Micon
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={
                  focused ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
            ),
          }}
        />
        <Tab.Screen
          name="Notes"
          component={Notes}
          options={{
            tabBarIcon: ({focused}) => (
              <Micon
                name={focused ? 'book-open-variant' : 'book-open-blank-variant'}
                size={23}
                color={
                  focused ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
            ),
          }}
        />
        {user?.is_intern ? (
          <Tab.Screen
            name="Groups"
            component={Groups}
            options={{
              title: 'Chat',
              tabBarIcon: ({focused}) => (
                <Micon
                  name={focused ? 'chat' : 'chat-outline'}
                  size={23}
                  color={
                    focused
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
              ),
            }}
          />
        ) : null}
        <Tab.Screen
          name="OnlineTuitions"
          component={OnlineTuitions}
          options={{
            title: 'Online Tutions',
            tabBarIcon: ({focused}) => (
              <Micon
                name={focused ? 'school' : 'school-outline'}
                size={24}
                color={
                  focused ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({focused}) => (
              <Micon
                name={focused ? 'account-circle' : 'account-circle-outline'}
                size={24}
                color={
                  focused ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}
