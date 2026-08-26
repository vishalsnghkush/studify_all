import {createDrawerNavigator} from '@react-navigation/drawer';
import React from 'react';
import TLBottomNavigation from './TLBottomNavigation';
import {TLDrawerComponent} from '../Components/Navigation';
import {useTheme, Icon} from 'react-native-paper';
const Drawer = createDrawerNavigator();
const TLDrawerNavigation = () => {
  const theme = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={props => <TLDrawerComponent {...props} />}
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
        name="TLBottomNavigation"
        component={TLBottomNavigation}
        options={{
          drawerIcon: ({color, size}) => (
            <Icon source="home" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default TLDrawerNavigation;
