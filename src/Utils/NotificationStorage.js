import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = 'studify_notifications';

export const getNotifications = async () => {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
};

export const addNotification = async (notification) => {
  try {
    const list = await getNotifications();
    const newList = [
      {
        id: notification.id || Date.now().toString(),
        title: notification.title || 'Notification',
        body: notification.body || '',
        timestamp: notification.timestamp || Date.now(),
        read: false,
        screen: notification.screen || '',
        url: notification.url || '',
      },
      ...list,
    ];
    if (newList.length > 50) {
      newList.splice(50);
    }
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newList));
    return newList;
  } catch (error) {
    console.error('Failed to add notification:', error);
    return [];
  }
};

export const markAsRead = async (id) => {
  try {
    const list = await getNotifications();
    const newList = list.map(item =>
      item.id === id ? { ...item, read: true } : item
    );
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newList));
    return newList;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return [];
  }
};

export const deleteNotification = async (id) => {
  try {
    const list = await getNotifications();
    const newList = list.filter(item => item.id !== id);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newList));
    return newList;
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return [];
  }
};

export const clearAllNotifications = async () => {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
    return [];
  } catch (error) {
    console.error('Failed to clear notifications:', error);
    return [];
  }
};
