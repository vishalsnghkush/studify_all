import React, {useRef, useState} from 'react';
import {FlatList, View, StyleSheet, Image} from 'react-native';
import {Switch, useTheme} from 'react-native-paper';
import {Button, Text} from '../../Components/Input';
import {useDispatch, useSelector} from 'react-redux';
import {setTheme} from '../../Redux/Slices/InitialSlice';
import {windowHeight, windowWidth} from '../../Utils/Dimentions';
import {Screen} from '../../Components/Screen';

const Onboarding = ({navigation}) => {
  const theme = useTheme();
  const {isDark} = useSelector(state => state.initial);
  const flatListRef = useRef(null);
  const [isSwitchOn, setIsSwitchOn] = useState(isDark);
  const dispatch = useDispatch();
  const onToggleSwitch = () => {
    dispatch(setTheme());
    setIsSwitchOn(!isSwitchOn);
  };

  const data = [
    {
      id: '1',
      title: 'Online Learning Platform',
      component:
        'Choose from a variety of courses \n with our best instructors.',
      img: require('../../Assets/Images/logo.png'),
      color: theme.colors.secondaryContainer,
    },
    {
      id: '2',
      title: 'Learn on your schedule',
      component:
        'Anytime, anywhere live classes as \n well as recorded lectures.',
      img: require('../../Assets/Images/college.png'),
      color: theme.colors.tertiaryContainer,
    },
    {
      id: '3',
      title: isSwitchOn ? 'Dark Mode' : 'Light Mode',
      img: require('../../Assets/Images/darkmode.png'),
      icon: <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />,
    },
  ];

  const renderItem = ({item, index}) => (
    <View
      style={[
        styles.onboardingContainer,
        {backgroundColor: item.color || theme.colors.background},
      ]}>
      <Image
        source={require('../../Assets/Images/name.png')}
        style={styles.onboardingLogo}
      />
      <Image
        source={item.img}
        style={{
          height: index === 0 ? 180 : 300,
          width: index === 0 ? '80%' : '100%',
          marginBottom: 20,
          objectFit: 'contain',
        }}
      />
      <Text size="large" style={{marginBottom: 10}}>
        {item?.title}
      </Text>
      <Text size="medium" style={{textAlign: 'center'}}>
        {item.component}
      </Text>
      {item?.icon}
      {index < data.length - 1 && (
        <Button
          name="Next"
          onPress={() => handleNext(index)}
          style={styles.nextButton}
        />
      )}
      {index === data.length - 1 && (
        <Button
          name="Get Started"
          onPress={() => navigation.navigate('Signin')}
          style={styles.nextButton}
        />
      )}
    </View>
  );

  const handleNext = currentIndex => {
    flatListRef.current.scrollToIndex({index: currentIndex + 1});
  };

  return (
    <Screen padding>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  onboardingContainer: {
    width: windowWidth(100),
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  nextButton: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  onboardingLogo: {
    height: 50,
    width: '70%',
    objectFit: 'contain',
    position: 'absolute',
    top: windowHeight(7),
  },
});

export default Onboarding;
