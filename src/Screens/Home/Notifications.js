import React, {useState, useEffect, useCallback} from 'react';
import {View, FlatList, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useTheme, ActivityIndicator, Button, Divider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import notifee, {AndroidImportance, AndroidStyle} from '@notifee/react-native';
import {Screen} from '../../Components/Screen';
import {Text} from '../../Components/Input';
import FlashMessage from '../../Components/Screen/FlashMessage';
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../../Utils/NotificationStorage';

const formatTimeElapsed = (timestamp) => {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const Notifications = () => {
  const {colors, dark} = useTheme();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationPress = async (item) => {
    const updated = await markAsRead(item.id);
    setNotifications(updated);
    if (item.screen) {
      try {
        navigation.navigate(item.screen, item.params || {});
      } catch (err) {
        console.log('Deep link error:', err);
      }
    } else if (item.url) {
      navigation.navigate('WebView', {url: item.url, title: item.title});
    }
  };

  const handleDelete = async (id) => {
    const updated = await deleteNotification(id);
    setNotifications(updated);
    FlashMessage({
      message: 'Notification deleted',
      type: 'success',
    });
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear your notification history?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const updated = await clearAllNotifications();
            setNotifications(updated);
            FlashMessage({
              message: 'Notification history cleared',
              type: 'success',
            });
          },
        },
      ]
    );
  };

  const triggerTestNotification = () => {
    FlashMessage({
      message: 'Push notification scheduled in 3s! Close the app or stay here to test.',
      type: 'info',
    });
    setTimeout(async () => {
      try {
        const channelId = await notifee.createChannel({
          id: 'general',
          name: 'General Channel',
          importance: AndroidImportance.HIGH,
          sound: 'default',
        });
        await notifee.displayNotification({
          id: Date.now().toString(),
          title: '👋 hye intern',
          body: 'This is a test notification for the intern.',
          data: {
            url: 'https://allstudynotes.studifysuccess.com/select-class-chapter?mobile=true',
            screen: 'ClassNotesSelector',
          },
          android: {
            channelId,
            largeIcon: 'https://www.studifysuccess.com/images/apple-touch-icon.webp',
            timestamp: Date.now(),
            showTimestamp: true,
            style: {
              type: AndroidStyle.BIGTEXT,
              text: 'Premium Science Notes for Chapter 4 are now available. Tap to study now!',
            },
            color: 'teal',
          },
        });
        setTimeout(() => {
          loadNotifications();
        }, 1000);
      } catch (err) {
        console.error('Failed to trigger mock notification:', err);
      }
    }, 3000);
  };

  const getCategoryColor = (title = '') => {
    const text = title.toLowerCase();
    if (text.includes('note') || text.includes('class') || text.includes('study')) {
      return {bg: dark ? 'rgba(76, 175, 80, 0.15)' : '#e8f5e9', text: '#4caf50'};
    }
    if (text.includes('chat') || text.includes('message')) {
      return {bg: dark ? 'rgba(33, 150, 243, 0.15)' : '#e3f2fd', text: '#2196f3'};
    }
    return {bg: dark ? 'rgba(156, 39, 176, 0.15)' : '#f3e5f5', text: '#9c27b0'};
  };

  const renderItem = ({item}) => {
    const colorsTag = getCategoryColor(item.title);
    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.card,
          {
            backgroundColor: dark ? colors.elevation.level2 : '#ffffff',
            borderColor: dark ? colors.outlineVariant : '#eceff1',
          },
          !item.read && {borderLeftWidth: 4, borderLeftColor: colors.primary},
        ]}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, {backgroundColor: colorsTag.bg}]}>
            <Text style={[styles.badgeText, {color: colorsTag.text}]}>
              {item.title.toLowerCase().includes('note') ? 'NOTES' : 'UPDATE'}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTimeElapsed(item.timestamp)}</Text>
        </View>
        <Text
          size="medium"
          style={[
            styles.titleText,
            {color: colors.onSurface},
            !item.read && {fontWeight: 'bold'},
          ]}>
          {item.title}
        </Text>
        <Text
          size="small"
          numberOfLines={2}
          style={[styles.bodyText, {color: colors.onSurfaceVariant}]}>
          {item.body}
        </Text>
        <Divider style={styles.divider} />
        <View style={styles.cardActions}>
          {!item.read && (
            <View style={styles.unreadIndicator}>
              <View style={[styles.dot, {backgroundColor: colors.primary}]} />
              <Text style={{color: colors.primary, fontSize: 12}}>New</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}>
            <Icon name="delete-outline" size={20} color="#ff1744" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen list style={{flex: 1}}>
      <View style={styles.topBar}>
        <Button
          mode="outlined"
          onPress={triggerTestNotification}
          icon="bell-ring"
          textColor={colors.primary}
          style={styles.actionBtn}>
          Test Push
        </Button>
        {notifications.length > 0 && (
          <Button
            mode="text"
            onPress={handleClearAll}
            icon="delete-sweep"
            textColor="#ff1744"
            style={styles.actionBtn}>
            Clear All
          </Button>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="large" style={{marginTop: 50}} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, {backgroundColor: dark ? '#1c2d2d' : '#e0f2f1'}]}>
            <Icon name="bell-off-outline" size={60} color={colors.primary} />
          </View>
          <Text size="large" style={{marginTop: 20, fontWeight: 'bold'}}>
            No Notifications yet
          </Text>
          <Text
            size="small"
            style={{
              textAlign: 'center',
              marginTop: 10,
              color: colors.onSurfaceVariant,
              paddingHorizontal: 30,
            }}>
            When you receive updates about new notes or products, they will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  actionBtn: {
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 11,
    color: '#9e9e9e',
  },
  titleText: {
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  bodyText: {
    lineHeight: 18,
    marginBottom: 10,
  },
  divider: {
    marginVertical: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  unreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 'auto',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Notifications;
