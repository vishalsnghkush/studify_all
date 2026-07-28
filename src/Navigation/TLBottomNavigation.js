import {createMaterialBottomTabNavigator} from 'react-native-paper/react-navigation';
import React from 'react';
import TLDashboard from '../Screens/Home/TL/TLDashboard';
import InternCommunication from '../Screens/Home/Intern/InternCommunication';
import InternProfile from '../Screens/Home/Intern/InternProfile';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const Tab = createMaterialBottomTabNavigator();

export default function TLBottomNavigation() {
  const theme = useTheme();
  const {bottom} = useSafeAreaInsets();

  return (
    <Tab.Navigator
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      barStyle={{
        backgroundColor: theme.colors.background,
        paddingBottom: bottom,
      }}
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}>
      <Tab.Screen
        name="TLDashboard"
        component={TLDashboard}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({focused}) => (
            <Micon
              name={focused ? 'shield-home' : 'shield-home-outline'}
              size={24}
              color={
                focused ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
            />
          ),
        }}
      />
      <Tab.Screen
        name="TLChat"
        component={InternCommunication}
        options={{
          title: 'Communication',
          tabBarIcon: ({focused}) => (
            <Micon
              name={focused ? 'forum' : 'forum-outline'}
              size={23}
              color={
                focused ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
            />
          ),
        }}
      />
      <Tab.Screen
        name="TLProfile"
        component={InternProfile}
        options={{
          title: 'Profile',
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
  );
}
