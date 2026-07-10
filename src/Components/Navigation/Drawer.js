import React, {useState, useRef, useEffect} from 'react';
import {Linking, View, Image, Animated, StyleSheet} from 'react-native';
import {Drawer, Avatar, TouchableRipple, useTheme} from 'react-native-paper';
import {DrawerContentScrollView} from '@react-navigation/drawer';
import {Text} from '../Input';
import {useSelector} from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const DrawerComponent = props => {
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

  const _c1 = [66, 101, 97, 117, 116, 105, 102, 117, 108, 108, 121, 32, 73, 109, 97, 103, 105, 110, 101, 100, 32, 97, 110, 100, 32, 98, 117, 105, 108, 116, 32, 98, 121, 32];
  const _c2 = [65, 100, 105, 116, 105];
  const _c3 = [86, 105, 115, 104, 97, 108];

  const getC1 = () => String.fromCharCode(..._c1);
  const getC2 = () => String.fromCharCode(..._c2);
  const getC3 = () => String.fromCharCode(..._c3);

  return (
    <View style={{flex: 1}}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          flex: 1,
          justifyContent: 'space-between',
          paddingBottom: bottom || 0,
        }}>
        <View>
          <TouchableRipple onPress={() => navigate('Profile')}>
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
                <Image source={{uri: user.avatar}} style={{width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#fff'}} />
              ) : (
                <Avatar.Text
                  size={60}
                  label={(user.fname?.[0] || 'U') + (user.lname?.[0] || '')}
                  style={{backgroundColor: 'rgba(255, 255, 255, 0.25)', borderWidth: 2, borderColor: '#fff'}}
                  color="#fff"
                />
              )}
              <View style={{flex: 1}}>
                <Text size="medium" style={{color: '#fff', fontWeight: 'bold'}}>{user.fname} {user.lname}</Text>
                {user?.class && !user?.is_intern && (
                  <Text size="small" style={{color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'bold', marginTop: 2}}>
                    Class: {user.class}
                  </Text>
                )}
              </View>
            </View>
          </TouchableRipple>
          <Drawer.Item
            label="AI Test Generator"
            icon="brain"
            onPress={() => navigate('TestGenerator')}
          />
          <Drawer.Item
            label="Online Quiz"
            icon="chat-question"
            onPress={() => navigate('OnlineQuiz')}
          />
          <Drawer.Item
            label="Activities"
            icon="layers"
            onPress={() => navigate('Activities')}
          />
          <Drawer.Item
            label="Counseling System"
            icon="account-group"
            onPress={() => navigate('Counselling')}
          />
          <Drawer.Item
            label="Voice Notebook"
            icon="microphone"
            onPress={() => navigate('VoiceNotebook')}
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
          <Drawer.Item
            label="Report Issue or Bug"
            icon="bug"
            onPress={() => navigate('Appreport')}
          />
        </View>

        <View style={{alignItems: 'center', padding: 10, paddingBottom: 15}}>
          <Text style={{fontSize: 12, color: colors.onSurfaceVariant || '#666'}}>
            App Version : {DeviceInfo.getVersion()}
          </Text>
          <Text style={{fontSize: 13, color: colors.onSurfaceVariant || '#666', fontWeight: '500', marginTop: 4, textAlign: 'center'}}>
            {getC1()}{'\n'}
            <Text
              style={{color: colors.primary || '#007171', fontWeight: 'bold'}}
              onPress={() => Linking.openURL('https://www.linkedin.com/in/' + getC2().toLowerCase() + '-malviya-9b093322a/')}>
              {getC2()}
            </Text>{' '}
            and{' '}
            <Text
              style={{color: colors.primary || '#007171', fontWeight: 'bold'}}
              onPress={() => Linking.openURL('https://www.linkedin.com/in/' + getC3().toLowerCase() + '-kushwaha-a8337022a/')}>
              {getC3()}
            </Text>
          </Text>
        </View>
      </DrawerContentScrollView>
    </View>

  );
};

export const verificationToken = '9a7b5c3d2e1f0a';
export default DrawerComponent;
