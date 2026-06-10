import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  Image,
  StyleSheet,
  Linking,
  FlatList,
  View,
  Dimensions,
} from 'react-native';
import {TouchableRipple} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {windowPaddingHorizontal} from '../../Utils/Dimentions';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 2 * windowPaddingHorizontal;

const Banner = () => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const banners = [
    {
      id: '1',
      image: require('../../Assets/Images/studify_banner_final.png'),
      onPress: () => {
        Linking.openURL('https://ai.studifysuccess.com/');
      },
    },
    {
      id: '2',
      image: require('../../Assets/Images/studify_banner_smart.png'),
      onPress: () => {
        navigation.navigate('PersonalizedLearning');
      },
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4500); // Cycles every 4.5 seconds

    return () => clearInterval(interval);
  }, [activeIndex, banners.length]);

  const handleScroll = event => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SLIDER_WIDTH);
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  const getItemLayout = useCallback(
    (data, index) => ({
      length: SLIDER_WIDTH,
      offset: SLIDER_WIDTH * index,
      index,
    }),
    [],
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={item => item.id}
        getItemLayout={getItemLayout}
        renderItem={({item}) => (
          <TouchableRipple
            style={[styles.bannerWrapper, {width: SLIDER_WIDTH}]}
            onPress={item.onPress}>
            <Image source={item.image} style={styles.img} />
          </TouchableRipple>
        )}
      />
      <View style={styles.paginationRow}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginVertical: 15,
  },
  bannerWrapper: {
    height: '100%',
  },
  img: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
    borderRadius: 15,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#007171',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
});

export default Banner;
