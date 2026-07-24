import React, {useState, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {IconButton, Searchbar, useTheme} from 'react-native-paper';
import {Text} from '../Input';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  fetchGlobalLeaderboard,
  fetchUserRank,
} from '../../Utils/GamificationSync';
import {CopilotStep, walkthroughable} from 'react-native-copilot';

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

const CopilotView = walkthroughable(View);

const HomeHeader = () => {
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  const {streak, xp, level} = useSelector(
    state => state.gamification || {streak: 0, xp: 0, level: 1},
  );
  const theme = useTheme();

  // Dynamic user rank calculation from Firebase
  const [userRank, setUserRank] = useState(1);

  useEffect(() => {
    let active = true;
    const loadRank = async () => {
      try {
        const rank = await fetchUserRank(xp);
        if (!active) {
          return;
        }
        setUserRank(rank);
      } catch (err) {
        if (active) {
          setUserRank(1);
        }
      }
    };
    loadRank();
    return () => {
      active = false;
    };
  }, [xp]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <IconButton
            icon="sort-variant"
            size={25}
            onPress={() => {
              navigation.openDrawer();
            }}
          />
          <View>
            <Text size="medium" style={{color: theme.colors.onSurfaceVariant}}>
              {greet}
            </Text>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 18,
                color: theme.colors.onSurface,
              }}>
              {user.fname + ' ' + user.lname}
            </Text>
          </View>
        </View>
        <CopilotStep text="📣 All your updates, reminders & alerts land here. Never miss a beat!" order={1} name="bellIcon">
        <CopilotView>
          <IconButton
            icon="bell"
            color="white"
            size={23}
            onPress={() => {
              navigation.navigate('Notifications');
            }}
          />
        </CopilotView>
        </CopilotStep>
      </View>

      {/* Gamification Mini-Stats Bar */}
      <View
        style={[
          styles.statsBar,
          {
            backgroundColor: theme.dark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,139,139,0.05)',
            borderColor: theme.dark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,139,139,0.15)',
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('GamificationDashboard')}
          style={styles.statItem}>
          <Micon name="lightning-bolt" size={18} color="#eab308" />
          <Text style={[styles.statText, {color: theme.colors.onSurface}]}>
            Lvl <Text style={styles.statVal}>{level || 1}</Text> ({xp || 0} XP)
          </Text>
        </TouchableOpacity>
        <View
          style={[
            styles.separator,
            {
              backgroundColor: theme.dark
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(0,0,0,0.1)',
            },
          ]}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('GamificationDashboard')}
          style={styles.statItem}>
          <Micon name="trophy" size={16} color="#fbbf24" />
          <Text style={[styles.statText, {color: theme.colors.onSurface}]}>
            Rank: <Text style={styles.statVal}>#{userRank}</Text>
          </Text>
        </TouchableOpacity>
        <View
          style={[
            styles.separator,
            {
              backgroundColor: theme.dark
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(0,0,0,0.1)',
            },
          ]}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('FocusSpace')}
          style={styles.statItem}>
          <Micon name="timer-sand" size={16} color="#008b8b" />
          <Text style={[styles.statText, {color: theme.colors.onSurface}]}>
            Focus
          </Text>
        </TouchableOpacity>
      </View>

      <CopilotStep text="🔍 Lost? Just search it. Notes, tests, topics: we've got you." order={2} name="searchBar">
      <CopilotView>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Search')}>
          <View pointerEvents="none">
            <Searchbar placeholder="Search" style={{marginTop: 8}} />
          </View>
        </TouchableOpacity>
      </CopilotView>
      </CopilotStep>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 8,
    marginVertical: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  statVal: {
    fontWeight: 'bold',
  },
  separator: {
    width: 1,
    height: 16,
  },
});

export default HomeHeader;
