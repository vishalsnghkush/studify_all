import React, {useState, useEffect, useRef} from 'react';
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

  // Obfuscated credits data (XOR-ed with 90 to prevent plaintext code searches)
  const _vD = [
    24, 63, 59, 47, 46, 51, 60, 47, 54, 54, 35, 122, 19, 55, 59, 61, 51, 52, 63,
    62, 122, 59, 52, 62, 122, 56, 47, 51, 54, 46, 122, 56, 35, 122,
  ];
  const _uA = [27, 62, 51, 46, 51];
  const _uV = [12, 51, 41, 50, 59, 54];
  const _lA = [
    50, 46, 46, 42, 41, 96, 117, 117, 45, 45, 45, 116, 54, 51, 52, 49, 63, 62,
    51, 52, 116, 57, 53, 55, 117, 51, 52, 117, 59, 62, 51, 46, 51, 119, 55, 59,
    54, 44, 51, 35, 59, 119, 99, 56, 106, 99, 105, 105, 104, 104, 59, 117,
  ];
  const _lV = [
    50, 46, 46, 42, 41, 96, 117, 117, 45, 45, 45, 116, 54, 51, 52, 49, 63, 62,
    51, 52, 116, 57, 53, 55, 117, 51, 52, 117, 44, 51, 41, 50, 59, 54, 119, 49,
    47, 41, 50, 45, 59, 50, 59, 119, 59, 98, 105, 105, 109, 106, 104, 104, 59,
    117,
  ];

  const _fD = arr => arr.map(c => String.fromCharCode(c ^ 90)).join(''); // eslint-disable-line no-bitwise

  const [expanded, setExpanded] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  const _handleCreditTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    if (tapCount.current >= 3) {
      setExpanded(prev => !prev);
      tapCount.current = 0;
    } else {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 1500);
    }
  };

  useEffect(() => {
    return () => {
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
    };
  }, []);

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
                  label={(user.fname?.[0] || 'U') + (user.lname?.[0] || '')}
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
                {user?.class && !user?.is_intern && (
                  <Text
                    size="small"
                    style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: 'bold',
                      marginTop: 2,
                    }}>
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
            label="Focus Space"
            icon="timer-sand"
            onPress={() => navigate('FocusSpace')}
          />
          <Drawer.Item
            label="Performance Analyzer"
            icon="chart-bar"
            onPress={() => navigate('Analysis')}
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

        {/* Footer & Secret Credit Toggle Area */}
        <TouchableRipple
          onPress={_handleCreditTap}
          rippleColor="rgba(0, 0, 0, 0.05)"
          style={{width: '100%', padding: 12, paddingBottom: 15, alignItems: 'center'}}>
          <View style={{alignItems: 'center', width: '100%'}}>
            {expanded && (
              <Text
                style={{
                  fontSize: 13,
                  color: colors.onSurfaceVariant || '#666',
                  fontWeight: '500',
                  marginBottom: 8,
                  textAlign: 'center',
                }}>
                {_fD(_vD)}
                {'\n'}
                <Text
                  style={{color: colors.primary || '#007171', fontWeight: 'bold'}}
                  onPress={() => Linking.openURL(_fD(_lA))}>
                  {_fD(_uA)}
                </Text>{' '}
                and{' '}
                <Text
                  style={{color: colors.primary || '#007171', fontWeight: 'bold'}}
                  onPress={() => Linking.openURL(_fD(_lV))}>
                  {_fD(_uV)}
                </Text>
              </Text>
            )}

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
        </TouchableRipple>
      </DrawerContentScrollView>
    </View>
  );
};

export const verificationToken = '9a7b5c3d2e1f0a';
export default DrawerComponent;
