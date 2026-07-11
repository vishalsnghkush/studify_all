import React, {useRef, useState} from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import {Switch, useTheme} from 'react-native-paper';
import {Text} from '../../Components/Input';
import {BouncyButton} from '../../Components/Screen';
import {useDispatch, useSelector} from 'react-redux';
import {setTheme} from '../../Redux/Slices/InitialSlice';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const {width, height} = Dimensions.get('window');

const Onboarding = ({navigation}) => {
  const {colors, dark} = useTheme();
  const insets = useSafeAreaInsets();
  const {isDark} = useSelector(state => state.initial);
  const flatListRef = useRef(null);
  const [isSwitchOn, setIsSwitchOn] = useState(isDark);
  const [activeIndex, setActiveIndex] = useState(0);
  const dispatch = useDispatch();

  const onToggleSwitch = () => {
    dispatch(setTheme());
    setIsSwitchOn(!isSwitchOn);
  };

  const data = [
    {
      id: '1',
      tag: 'WELCOME',
      title: 'Online Learning\nPlatform',
      description:
        'Choose from a variety of courses with our best instructors, tailored to your pace.',
      img: require('../../Assets/Images/logo.png'),
      haloBg: '#e0f7fa',
      haloBgDark: 'rgba(0, 188, 212, 0.15)',
      accent: '#00838f',
      accentDark: '#4dd0e1',
      icon: 'book-open-page-variant',
    },
    {
      id: '2',
      tag: 'FLEXIBLE',
      title: 'Learn on Your\nSchedule',
      description:
        'Anytime, anywhere live classes as well as recorded lectures — always at hand.',
      img: require('../../Assets/Images/college.png'),
      haloBg: '#ede7f6',
      haloBgDark: 'rgba(103, 58, 183, 0.15)',
      accent: '#512da8',
      accentDark: '#b39ddb',
      icon: 'calendar-clock',
    },
    {
      id: '3',
      tag: 'PERSONALIZE',
      title: isSwitchOn ? 'Enjoy Dark\nMode' : 'Enjoy Light\nMode',
      description:
        'Switch between light and dark themes to ease your eyes, day or night.',
      img: require('../../Assets/Images/darkmode.png'),
      haloBg: '#fff3e0',
      haloBgDark: 'rgba(255, 152, 0, 0.15)',
      accent: '#e65100',
      accentDark: '#ffb74d',
      icon: 'theme-light-dark',
      isThemeSlide: true,
    },
  ];

  const scrollTo = idx => {
    if (idx < 0 || idx >= data.length) return;
    setActiveIndex(idx);
    flatListRef.current?.scrollToOffset({
      offset: idx * width,
      animated: true,
    });
  };

  const handleNext = () => {
    if (activeIndex < data.length - 1) {
      scrollTo(activeIndex + 1);
    } else {
      navigation.navigate('Signin');
    }
  };

  const handleSkip = () => navigation.navigate('Signin');

  const onScroll = e => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const renderItem = ({item}) => {
    const accent = dark ? item.accentDark : item.accent;
    const halo = dark ? item.haloBgDark : item.haloBg;

    return (
      <View style={styles.slide}>
        <View style={styles.imageSection}>
          <View
            style={[
              styles.haloOuter,
              {backgroundColor: halo, opacity: dark ? 0.5 : 0.6},
            ]}
          />
          <View
            style={[
              styles.haloInner,
              {backgroundColor: halo},
            ]}
          />
          <Image source={item.img} style={styles.mainImage} />
        </View>

        <View style={styles.textSection}>
          <View style={styles.tagRow}>
            <View
              style={[
                styles.tagIcon,
                {backgroundColor: halo},
              ]}>
              <Icon name={item.icon} size={16} color={accent} />
            </View>
            <Text style={[styles.tag, {color: accent}]}>{item.tag}</Text>
          </View>

          <Text
            style={[
              styles.title,
              {color: dark ? colors.onSurface : '#0f172a'},
            ]}>
            {item.title}
          </Text>
          <Text
            style={[
              styles.description,
              {color: dark ? colors.onSurfaceVariant : '#64748b'},
            ]}>
            {item.description}
          </Text>

          {item.isThemeSlide && (
            <View
              style={[
                styles.switchCard,
                {
                  backgroundColor: dark ? colors.surface : '#ffffff',
                  borderColor: dark ? colors.outlineVariant : '#f1f5f9',
                },
              ]}>
              <Icon
                name="white-balance-sunny"
                size={20}
                color={isSwitchOn ? (dark ? colors.onSurfaceVariant : '#94a3b8') : '#f59e0b'}
              />
              <Text
                style={[
                  styles.switchLabel,
                  {color: dark ? colors.onSurface : '#334155'},
                ]}>
                {isSwitchOn ? 'Dark' : 'Light'} Theme
              </Text>
              <Switch
                value={isSwitchOn}
                onValueChange={onToggleSwitch}
                color={dark ? colors.primary : '#007171'}
              />
              <Icon
                name="moon-waning-crescent"
                size={20}
                color={isSwitchOn ? (dark ? colors.primary : '#5c6bc0') : (dark ? colors.onSurfaceVariant : '#94a3b8')}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: dark ? colors.background : '#ffffff'},
      ]}>
      {/* Top bar: logo + skip */}
      <View style={[styles.topBar, {paddingTop: insets.top + 16}]}>
        <Image
          source={require('../../Assets/Images/name.png')}
          style={[styles.logo, dark && {tintColor: colors.onSurface}]}
        />
        {activeIndex < data.length - 1 && (
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text
              style={[
                styles.skipText,
                {color: dark ? colors.onSurfaceVariant : '#64748b'},
              ]}>
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom controls */}
      <View style={[styles.bottomBar, {paddingBottom: insets.bottom + 24}]}>
        <View style={styles.dotsContainer}>
          {data.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeIndex === i
                  ? [
                      styles.dotActive,
                      {backgroundColor: dark ? colors.primary : '#007171'},
                    ]
                  : [
                      styles.dotInactive,
                      {
                        backgroundColor: dark
                          ? colors.outlineVariant
                          : '#e2e8f0',
                      },
                    ],
              ]}
            />
          ))}
        </View>

        <View style={styles.actionsRow}>
          {activeIndex > 0 ? (
            <BouncyButton
              onPress={() => scrollTo(activeIndex - 1)}
              style={[
                styles.backButton,
                {
                  backgroundColor: dark ? colors.surface : '#f1f5f9',
                  borderColor: dark ? colors.outlineVariant : '#e2e8f0',
                },
              ]}>
              <View style={styles.backInner}>
                <Icon
                  name="chevron-left"
                  size={22}
                  color={dark ? colors.onSurface : '#334155'}
                />
              </View>
            </BouncyButton>
          ) : (
            <View style={styles.backSpacer} />
          )}

          <BouncyButton
            onPress={handleNext}
            style={[
              styles.ctaButton,
              {backgroundColor: dark ? colors.primary : '#007171'},
            ]}>
            <View style={styles.ctaInner}>
              <Text style={styles.ctaText}>
                {activeIndex === data.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Icon name="arrow-right" size={20} color="#ffffff" />
            </View>
          </BouncyButton>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 2,
  },
  logo: {
    height: 28,
    width: 120,
    resizeMode: 'contain',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slide: {
    width: width,
    paddingHorizontal: 24,
  },
  imageSection: {
    width: '100%',
    height: height * 0.42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
  },
  haloInner: {
    position: 'absolute',
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
  },
  mainImage: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain',
  },
  textSection: {
    width: '100%',
    paddingTop: 20,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tagIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tag: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
  },
  switchCard: {
    marginTop: 22,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginLeft: 12,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
  },
  backInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 0,
  },
  ctaButton: {
    flex: 1,
    borderRadius: 27,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  ctaInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default Onboarding;
