import {View, StyleSheet} from 'react-native';
import {IconButton, Searchbar, useTheme} from 'react-native-paper';
import {Text} from '../Input';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import React from 'react';

var myDate = new Date();
var hrs = myDate.getHours();
var greet;
if (hrs < 12) {
  greet = 'Good Morning 👋';
} else if (hrs >= 12 && hrs <= 17) {
  greet = 'Good Afternoon 👋';
} else if (hrs >= 17 && hrs <= 24) {
  greet = 'Good Evening 👋';
} else {
  greet = 'Welcome 👋';
}

const HomeHeader = () => {
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  const {colors, dark} = useTheme();

  return (
    <View
      style={[
        styles.headerContainer,
        dark && {backgroundColor: colors.background},
      ]}>
      <View style={styles.headerRow}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={[
              styles.menuBtnContainer,
              dark && {backgroundColor: 'rgba(255, 255, 255, 0.05)'},
            ]}>
            <IconButton
              icon="sort-variant"
              size={22}
              iconColor={dark ? '#ffffff' : colors.primary}
              onPress={() => {
                navigation.openDrawer();
              }}
              style={{margin: 0}}
            />
          </View>
          <View style={{marginLeft: 12}}>
            <Text
              size="small"
              style={[styles.greetText, {color: dark ? '#b0bec5' : '#78909c'}]}>
              {greet}
            </Text>
            <Text
              style={[
                styles.userNameText,
                {color: dark ? '#ffffff' : '#263238'},
              ]}>
              {user.fname + ' ' + user.lname}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.bellBtnContainer,
            dark && {backgroundColor: 'rgba(255, 255, 255, 0.05)'},
          ]}>
          <IconButton
            icon="bell-outline"
            iconColor={dark ? '#ffb300' : colors.primary}
            size={20}
            onPress={() => {
              navigation.navigate('Notifications');
            }}
            style={{margin: 0}}
          />
          <View
            style={[
              styles.badgeIndicator,
              {borderColor: dark ? colors.background : '#ffffff'},
            ]}
          />
        </View>
      </View>
      <Searchbar
        placeholder="Search courses, study notes..."
        placeholderTextColor={dark ? '#90a4ae' : '#78909c'}
        iconColor={dark ? '#80cbc4' : colors.primary}
        style={[
          styles.searchBar,
          {
            backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : '#f5f7f8',
            borderColor: dark ? 'rgba(255, 255, 255, 0.08)' : '#e0e0e0',
          },
        ]}
        inputStyle={{
          color: dark ? '#ffffff' : '#263238',
          fontSize: 14,
          minHeight: 0,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuBtnContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef6f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBtnContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef6f5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ff5252',
    borderWidth: 1.5,
  },
  greetText: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 1,
  },
  searchBar: {
    borderRadius: 12,
    elevation: 0,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
  },
});

export default HomeHeader;
