import {createMaterialBottomTabNavigator} from 'react-native-paper/react-navigation';
import {Wishlist, Profile} from '../Screens/Home';
import Notes from '../Screens/Home/Notes/Notes';
import Main from '../Screens/Home/Main';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export default function BottomNavigation() {
  const Tab = createMaterialBottomTabNavigator();
  const theme = useTheme();
  const {bottom} = useSafeAreaInsets();

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
        <Tab.Screen
          name="Wishlist"
          component={Wishlist}
          options={{
            title: 'Meet',
            tabBarIcon: ({focused}) => (
              <Micon
                name={focused ? 'video' : 'video-outline'}
                size={27}
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
