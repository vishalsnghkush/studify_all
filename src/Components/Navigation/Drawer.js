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
  const [layoutSize, setLayoutSize] = useState({width: 0, height: 0});
  const [active, setActive] = useState(false);

  const _t1 = useRef(null);
  const _t2 = useRef(null);
  const _t3 = useRef(null);
  const _t4 = useRef(null);
  const _history = useRef([]);

  const _onL = e => {
    const {width, height} = e.nativeEvent.layout;
    setLayoutSize({width, height});
  };

  const _onS = e => {
    if (expanded || layoutSize.width === 0) {
      return;
    }

    const {touches} = e.nativeEvent;

    if (touches && touches.length === 2) {
      _t2.current = {
        y0: touches[0].pageY,
        y1: touches[1].pageY,
        t: Date.now(),
      };
      return;
    } else {
      _t2.current = null;
    }

    if (!active && (!touches || touches.length <= 1)) {
      const {locationX, locationY} = e.nativeEvent;
      const W = layoutSize.width;
      const H = layoutSize.height;

      // Compute quadrant identifier and map to distinct prime weights
      const idx = (locationY < H / 2 ? 0 : 2) + (locationX < W / 2 ? 0 : 1);
      const w = idx === 0 ? 11 : idx === 1 ? 13 : idx === 2 ? 17 : 19;

      // Filter out duplicate consecutive taps (touch bounces)
      const lastW = _history.current[_history.current.length - 1];
      if (w !== lastW) {
        _history.current.push(w);
        if (_history.current.length > 4) {
          _history.current.shift();
        }
      }

      if (_t1.current) {
        clearTimeout(_t1.current);
      }
      _t1.current = setTimeout(() => {
        _history.current = [];
      }, 3000);

      // Verify sequence using a polynomial hash equation
      if (_history.current.length === 4) {
        const h =
          ((_history.current[0] * 31 + _history.current[1]) * 31 +
            _history.current[2]) *
            31 +
          _history.current[3];

        if (h === 340740) {
          setActive(true);
          _history.current = [];

          if (_t3.current) {
            clearTimeout(_t3.current);
          }
          _t3.current = setTimeout(() => {
            setActive(false);
          }, 10000);

          if (_t1.current) {
            clearTimeout(_t1.current);
          }
        }
      }
    }
  };

  const _onM = e => {
    if (expanded || !active || !_t2.current) {
      return;
    }

    const {touches} = e.nativeEvent;
    if (touches && touches.length === 2) {
      const start = _t2.current;
      const dy0 = touches[0].pageY - start.y0;
      const dy1 = touches[1].pageY - start.y1;

      if (dy0 > 130 && dy1 > 130 && Date.now() - start.t < 1000) {
        setExpanded(true);
        setActive(false);
        _t2.current = null;
        if (_t3.current) {
          clearTimeout(_t3.current);
        }

        if (_t4.current) {
          clearTimeout(_t4.current);
        }
        _t4.current = setTimeout(() => {
          setExpanded(false);
        }, 3000);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (_t1.current) {
        clearTimeout(_t1.current);
      }
      if (_t3.current) {
        clearTimeout(_t3.current);
      }
      if (_t4.current) {
        clearTimeout(_t4.current);
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

        {/* Secret Touch Area */}
        <View
          style={{flex: 1, minHeight: 200, width: '100%', position: 'relative'}}
          onLayout={_onL}
          onTouchStart={_onS}
          onTouchMove={_onM}
          pointerEvents="auto">
          {expanded && (
            <View
              style={{
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 15,
              }}
              pointerEvents="box-none">
              <Text
                style={{
                  fontSize: 13,
                  color: colors.onSurfaceVariant || '#666',
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                {_fD(_vD)}
                {'\n'}
                <Text
                  style={{
                    color: colors.primary || '#007171',
                    fontWeight: 'bold',
                  }}
                  onPress={() => Linking.openURL(_fD(_lA))}>
                  {_fD(_uA)}
                </Text>{' '}
                and{' '}
                <Text
                  style={{
                    color: colors.primary || '#007171',
                    fontWeight: 'bold',
                  }}
                  onPress={() => Linking.openURL(_fD(_lV))}>
                  {_fD(_uV)}
                </Text>
              </Text>
            </View>
          )}
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

export const verificationToken = '9a7b5c3d2e1f0a';
export default DrawerComponent;
