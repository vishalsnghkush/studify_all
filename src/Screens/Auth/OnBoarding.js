import React, {useRef, useState} from 'react';
import {FlatList, View, StyleSheet, Image, Dimensions} from 'react-native';
import {Switch, useTheme} from 'react-native-paper';
import {Button, Text} from '../../Components/Input';
import {useDispatch, useSelector} from 'react-redux';
import {setTheme} from '../../Redux/Slices/InitialSlice';
import {Screen} from '../../Components/Screen';
import AnimatedBackground from '../../Components/AnimatedBackground';

const {width, height} = Dimensions.get('window');

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
      component: 'Choose from a variety of courses \n with our best instructors.',
      img: require('../../Assets/Images/logo.png'),
    },
    {
      id: '2',
      title: 'Learn on your schedule',
      component: 'Anytime, anywhere live classes as \n well as recorded lectures.',
      img: require('../../Assets/Images/college.png'),
    },
    {
      id: '3',
      title: isSwitchOn ? 'Dark Mode' : 'Light Mode',
      component: 'Switch between light and dark themes to ease your eyes.',
      img: require('../../Assets/Images/darkmode.png'),
      icon: <Switch value={isSwitchOn} onValueChange={onToggleSwitch} color="#D81B60" />,
    },
  ];

  const renderItem = ({item, index}) => (
    <View style={styles.slideContainer}>
      <Image
        source={require('../../Assets/Images/name.png')}
        style={styles.logo}
      />
      <View style={styles.imageContainer}>
        <Image
          source={item.img}
          style={styles.mainImage}
        />
      </View>
      
      <View style={styles.glassCard}>
        <Text style={styles.titleText}>{item?.title}</Text>
        <Text style={styles.descText}>{item.component}</Text>
        
        {item?.icon && <View style={styles.switchContainer}>{item.icon}</View>}
        
        {index < data.length - 1 ? (
          <Button
            name="Next"
            onPress={() => handleNext(index)}
            style={styles.button}
          />
        ) : (
          <Button
            name="Get Started"
            onPress={() => navigation.navigate('Signin')}
            style={styles.button}
          />
        )}
      </View>
    </View>
  );

  const handleNext = currentIndex => {
    flatListRef.current.scrollToIndex({index: currentIndex + 1});
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  slideContainer: {
    width: width,
    height: height,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  logo: {
    height: 40,
    width: '60%',
    resizeMode: 'contain',
    marginBottom: 40,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  mainImage: {
    width: width * 0.8,
    height: width * 0.8,
    resizeMode: 'contain',
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    paddingBottom: 50,
    alignItems: 'center',
    shadowColor: '#FFB6C1',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  descText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  switchContainer: {
    marginBottom: 20,
  },
  button: {
    width: '100%',
    borderRadius: 15,
  },
});

export default Onboarding;
