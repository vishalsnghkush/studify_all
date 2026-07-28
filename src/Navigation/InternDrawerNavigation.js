import {createDrawerNavigator} from '@react-navigation/drawer';
import React from 'react';
import InternBottomNavigation from './InternBottomNavigation';
import {InternDrawerComponent} from '../Components/Navigation';
import {useTheme, Icon} from 'react-native-paper';
const Drawer = createDrawerNavigator();
const InternDrawerNavigation = () => {
  const theme = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={props => <InternDrawerComponent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: theme.colors.primary,
        drawerActiveTintColor: theme.colors.onPrimary,
        drawerInactiveTintColor: theme.colors.onBackground,
        drawerStyle: {
          backgroundColor: theme.colors.elevation.level3,
        },
        drawerLabelStyle: {
          fontSize: 15,
          marginLeft: -20,
        },
      }}>
      <Drawer.Screen
        name="InternBottomNavigation"
        component={InternBottomNavigation}
        options={{
          drawerIcon: ({color, size}) => (
            <Icon source="home" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default InternDrawerNavigation;
