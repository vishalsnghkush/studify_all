import {createMaterialBottomTabNavigator} from 'react-native-paper/react-navigation';
import React from 'react';
import InternHome from '../Screens/Home/Intern/InternHome';
import InternAttendance from '../Screens/Home/Intern/InternAttendance';
import InternTasks from '../Screens/Home/Intern/InternTasks';
import InternCommunication from '../Screens/Home/Intern/InternCommunication';
import InternPerformance from '../Screens/Home/Intern/InternPerformance';
import InternProfile from '../Screens/Home/Intern/InternProfile';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const Tab = createMaterialBottomTabNavigator();

export default function InternBottomNavigation() {
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
        name="InternHome"
        component={InternHome}
        options={{
          title: 'Home',
          tabBarIcon: ({focused}) => (
            <Micon
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          ),
        }}
      />
      <Tab.Screen
        name="InternAttendance"
        component={InternAttendance}
        options={{
          title: 'Attendance',
          tabBarIcon: ({focused}) => (
            <Micon
              name={focused ? 'calendar-check' : 'calendar-check-outline'}
              size={24}
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          ),
        }}
      />
      <Tab.Screen
        name="InternTasks"
        component={InternTasks}
        options={{
          title: 'Tasks',
          tabBarIcon: ({focused}) => (
            <Micon
              name={focused ? 'clipboard-check' : 'clipboard-check-outline'}
              size={24}
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          ),
        }}
      />
      <Tab.Screen
        name="InternCommunication"
        component={InternCommunication}
        options={{
          title: 'Discussion',
          tabBarIcon: ({focused}) => (
            <Micon
              name={focused ? 'forum' : 'forum-outline'}
              size={23}
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          ),
        }}
      />
      <Tab.Screen
        name="InternPerformance"
        component={InternPerformance}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({focused}) => (
            <Micon
              name={focused ? 'chart-box' : 'chart-box-outline'}
              size={24}
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          ),
        }}
      />
      <Tab.Screen
        name="InternProfile"
        component={InternProfile}
        options={{
          title: 'Profile',
          tabBarIcon: ({focused}) => (
            <Micon
              name={focused ? 'account-circle' : 'account-circle-outline'}
              size={24}
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
