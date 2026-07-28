import React, {useState, useEffect} from 'react';
import {Linking, View, Image, StyleSheet} from 'react-native';
import {Drawer, Avatar, TouchableRipple, useTheme} from 'react-native-paper';
import {DrawerContentScrollView} from '@react-navigation/drawer';
import {Text} from '../Input';
import {useSelector} from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const InternDrawerComponent = props => {
  const navigate = nav => {
    props.navigation.navigate(nav);
    props.navigation.closeDrawer();
  };
  const navigateWithParams = (nav, params) => {
    props.navigation.navigate(nav, params);
    props.navigation.closeDrawer();
  };

  const {user} = useSelector(state => state.initial);
  const {bottom} = useSafeAreaInsets();
  const {colors} = useTheme();

  return (
    <View style={{flex: 1}}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingBottom: (bottom || 0) + 10,
        }}>
        <View>
          <TouchableRipple onPress={() => navigate('InternProfile')}>
            <View
              style={{
                backgroundColor: colors.primary,
                padding: 20,
                paddingTop: 24,
                paddingBottom: 24,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                elevation: 4,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 4,
                shadowOffset: {width: 0, height: 2},
                marginBottom: 10,
              }}>
              {user?.avatar ? (
                <Image
                  source={{uri: user.avatar}}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                />
              ) : (
                <Avatar.Text
                  size={60}
                  label={(user.fname?.[0] || 'I') + (user.lname?.[0] || '')}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                  color="#fff"
                />
              )}
              <View style={{flex: 1}}>
                <Text size="medium" style={{color: '#fff', fontWeight: 'bold'}}>
                  {user.fname} {user.lname}
                </Text>
                <Text
                  size="small"
                  style={{
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontWeight: 'bold',
                    marginTop: 2,
                  }}>
                  Intern Role
                </Text>
              </View>
            </View>
          </TouchableRipple>
          <Drawer.Item
            label="Intern Dashboard"
            icon="briefcase"
            onPress={() => navigate('InternHome')}
          />
          <Drawer.Item
            label="AI Productivity Hub"
            icon="robot"
            onPress={() => navigate('InternAiHub')}
          />
          <Drawer.Item
            label="EOD & Reports"
            icon="file-document"
            onPress={() => navigate('InternReports')}
          />
          <Drawer.Item
            label="Learning & Training"
            icon="school"
            onPress={() => navigate('InternLearningHub')}
          />
          <Drawer.Item
            label="Support Portal"
            icon="help-circle"
            onPress={() =>
              navigateWithParams('WebView', {
                url: 'https://support.studifysuccess.com/',
                title: 'Support Portal',
              })
            }
          />
        </View>

        <View style={{alignItems: 'center', padding: 10, paddingBottom: 15}}>
          <View style={{alignItems: 'center'}}>
            <Text
              style={{
                fontSize: 12,
                color: colors.onSurfaceVariant || '#666',
                fontWeight: '500',
              }}>
              Crafted with 💚 in India
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.onSurfaceVariant || '#666',
                marginTop: 2,
              }}>
              App Version : {DeviceInfo.getVersion()}
            </Text>
          </View>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

export default InternDrawerComponent;
