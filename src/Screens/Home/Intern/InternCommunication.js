import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, Avatar, Button, Switch, Portal, Dialog, IconButton, Divider} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector, useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setUser, setUserLogout, setTheme} from '../../../Redux/Slices/InitialSlice';
import {openModal} from '../../../Redux/Slices/ModalSlice';
import {removeFcmToken} from '../../../Components/Api/CheckAuth';
import {getInternDb, addMockFeedback} from '../../../Utils/MockInternDb';
import {fetchChatGroups} from '../../../Redux/Slices/ChatSlice';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

let notifee = null;
try {
  notifee = require('@notifee/react-native').default;
} catch (e) {}

const DEPT_KEY = '@studify_chat_department';

const InternCommunication = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  const {groups, loadingGroups} = useSelector(state => state.chat);

  const [activeTab, setActiveTab] = useState('chats');
  const [deptPrompt, setDeptPrompt] = useState(false);
  const [selectedDept, setSelectedDept] = useState(user?.department || '');

  // Meeting Reminders State
  const [meetings, setMeetings] = useState([]);
  const [internStatus, setInternStatus] = useState('Pending');

  // TL: Schedule Meeting State
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [newMeetTitle, setNewMeetTitle] = useState('');
  const [newMeetDate, setNewMeetDate] = useState('');
  const [newMeetTime, setNewMeetTime] = useState('');
  const [newMeetLink, setNewMeetLink] = useState('');
  const [newMeetScope, setNewMeetScope] = useState('dept'); // 'dept' or 'all'

  const loadOnboardingStatus = async () => {
    try {
      const db = await getInternDb();
      const activeId = user?.user_id;
      const email = user?.email;
      const myRecord = db.interns.find(
        i => i.id === activeId || (email && (i.email === email || i.id === email))
      );
      setInternStatus(myRecord?.status || 'Pending');
    } catch (e) {
      console.log('Failed loading status in InternCommunication', e);
    }
  };

  useEffect(() => {
    loadOnboardingStatus();
    const unsubscribe = navigation.addListener('focus', loadOnboardingStatus);
    return unsubscribe;
  }, [navigation, user]);

  // Fetch dynamic discussion meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const db = await getInternDb();
        const dept = selectedDept || user?.department || 'Tech';
        const discussions = (db.meetings || []).filter(
          m => m.type === 'Discussion' && 
               (m.department.toLowerCase() === dept.toLowerCase() || m.department.toLowerCase() === 'all')
        );
        
        // Load reminder preference from AsyncStorage
        const savedRemindersJson = await AsyncStorage.getItem('@studify_meeting_reminders');
        const savedReminders = savedRemindersJson ? JSON.parse(savedRemindersJson) : [];

        setMeetings(discussions.map(m => ({ 
          ...m, 
          enabled: savedReminders.includes(m.id) 
        })));
      } catch (e) {
        console.error('Error loading discussions:', e);
      }
    };
    fetchMeetings();
    const unsubscribe = navigation.addListener('focus', fetchMeetings);
    return unsubscribe;
  }, [navigation, selectedDept, user?.department]);

  // Feedback State
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('General');

  // Check if department is selected on mount
  useEffect(() => {
    const checkDept = async () => {
      const saved = await AsyncStorage.getItem(DEPT_KEY);
      if (!saved && !user?.department) {
        setDeptPrompt(true);
      } else {
        const d = saved || user?.department;
        setSelectedDept(d);
      }
    };
    checkDept();
  }, [user?.department]);

  // Fetch groups when department is available
  useEffect(() => {
    if (selectedDept) {
      dispatch(fetchChatGroups({
        department: selectedDept,
        is_tl: user?.is_tl ? 'true' : 'false'
      }));
    }
  }, [selectedDept]);

  const handleSelectDept = async (dept) => {
    setSelectedDept(dept);
    await AsyncStorage.setItem(DEPT_KEY, dept);
    dispatch(setUser({...user, department: dept}));
    setDeptPrompt(false);
  };

  const toggleReminder = async (id, val) => {
    setMeetings(meetings.map(m => m.id === id ? {...m, enabled: val} : m));
    const meeting = meetings.find(m => m.id === id);
    
    // Save to AsyncStorage
    try {
      const savedRemindersJson = await AsyncStorage.getItem('@studify_meeting_reminders');
      let savedReminders = savedRemindersJson ? JSON.parse(savedRemindersJson) : [];
      if (val) {
        if (!savedReminders.includes(id)) {
          savedReminders.push(id);
        }
      } else {
        savedReminders = savedReminders.filter(rid => rid !== id);
      }
      await AsyncStorage.setItem('@studify_meeting_reminders', JSON.stringify(savedReminders));
    } catch (e) {
      console.error('Error saving reminder state:', e);
    }

    if (val) {
      if (notifee) {
        try {
          await notifee.requestPermission();
          const channelId = await notifee.createChannel({
            id: 'meeting-reminders',
            name: 'Meeting Reminders',
          });
          await notifee.displayNotification({
            title: 'Reminder Set',
            body: `You will be notified for: ${meeting.title} at ${meeting.time}`,
            android: {channelId, pressAction: {id: 'default'}},
          });
        } catch (e) {}
      } else {
        Alert.alert('Reminder Set', `You will receive a notification for: ${meeting.title} at ${meeting.time}`);
      }
    }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return Alert.alert('Error', 'Please enter feedback text.');
    
    const newFeedback = {
      id: Date.now().toString(),
      category: feedbackCategory,
      text: feedbackText.trim(),
      date: new Date().toISOString().split('T')[0],
      department: selectedDept || user?.department || 'Tech',
    };
    
    await addMockFeedback(newFeedback);
    Alert.alert('Feedback Submitted', 'Your anonymous feedback has been sent successfully.');
    setFeedbackText('');
  };

  const handleScheduleMeeting = async () => {
    if (!newMeetTitle.trim()) return Alert.alert('Required', 'Please enter a meeting title.');
    if (!newMeetDate.trim()) return Alert.alert('Required', 'Please enter the date (e.g., 2026-07-28).');
    if (!newMeetTime.trim()) return Alert.alert('Required', 'Please enter the time (e.g., 4:00 PM).');
    if (!newMeetLink.trim()) return Alert.alert('Required', 'Please paste the Google Meet link.');
    
    const linkVal = newMeetLink.trim();
    if (!linkVal.startsWith('http')) return Alert.alert('Invalid Link', 'Please enter a valid Google Meet URL starting with https://');

    const dept = selectedDept || user?.department || 'Tech';
    const newMeeting = {
      id: `meet_${Date.now()}`,
      title: newMeetTitle.trim(),
      date: newMeetDate.trim(),
      time: newMeetTime.trim(),
      link: linkVal,
      type: 'Discussion',
      department: newMeetScope === 'all' ? 'All' : dept,
      scheduledBy: `${user?.fname || 'TL'} ${user?.lname || ''}`.trim(),
    };

    try {
      const {addMockMeeting} = require('../../../Utils/MockInternDb');
      await addMockMeeting(newMeeting);
      setMeetings(prev => [newMeeting, ...prev]);
      setScheduleDialog(false);
      setNewMeetTitle('');
      setNewMeetDate('');
      setNewMeetTime('');
      setNewMeetLink('');
      setNewMeetScope('dept');
      Alert.alert('Meeting Scheduled!', `"${newMeeting.title}" has been shared with ${newMeetScope === 'all' ? 'all departments' : dept + ' department'}.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to save meeting. Please try again.');
    }
  };

  if (internStatus !== 'Approved') {
    return (
      <Screen NoHeader style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
        <Icon name="lock-outline" size={64} color="#999" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Verification Required</Text>
        <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
          Chat rooms, meetings, and feedback are locked. Please upload your Internship Offer Letter in your Profile and await TL approval to unlock them.
        </Text>
        <Button mode="contained" onPress={() => navigation.navigate('InternProfile')}>
          Go to Profile
        </Button>
      </Screen>
    );
  }

  return (
    <Screen NoHeader style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('chats')}
          style={[styles.tabButton, activeTab === 'chats' && [styles.activeTab, {borderBottomColor: colors.primary}]]}>
          <Text style={[styles.tabText, activeTab === 'chats' && {color: colors.primary}]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('meetings')}
          style={[styles.tabButton, activeTab === 'meetings' && [styles.activeTab, {borderBottomColor: colors.primary}]]}>
          <Text style={[styles.tabText, activeTab === 'meetings' && {color: colors.primary}]}>Meetings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('feedback')}
          style={[styles.tabButton, activeTab === 'feedback' && [styles.activeTab, {borderBottomColor: colors.primary}]]}>
          <Text style={[styles.tabText, activeTab === 'feedback' && {color: colors.primary}]}>Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* CHATS TAB */}
      {activeTab === 'chats' && (
        <View style={styles.tabContent}>
          {loadingGroups ? (
            <Text style={styles.emptyText}>Loading chat rooms...</Text>
          ) : groups.length === 0 ? (
            <Text style={styles.emptyText}>No chat groups found.</Text>
          ) : (
            groups.map((item) => (
              <Card key={item.chat_group_id} style={styles.chatCard} onPress={() => navigation.navigate('Chat', { data: item })}>
                <Card.Content style={styles.chatCardContent}>
                  <Avatar.Text
                    size={44}
                    label={item?.display_name?.substring(0, 2).toUpperCase()}
                    style={{backgroundColor: colors.primaryContainer}}
                    color={colors.onPrimaryContainer}
                  />
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{item?.display_name}</Text>
                    <Text style={styles.chatSnippet} numberOfLines={1}>
                      {item?.lastMessage || 'Real-time discussion channel'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      )}

      {/* MEETINGS TAB */}
      {activeTab === 'meetings' && (
        <View style={styles.tabContent}>

          {/* TL-only: Schedule Meeting button */}
          {user?.is_tl && (
            <Button
              mode="contained"
              icon="video-plus"
              onPress={() => setScheduleDialog(true)}
              style={[styles.scheduleBtn, {backgroundColor: colors.primary}]}
              labelStyle={{color: '#fff', fontWeight: 'bold'}}>
              Schedule Google Meet
            </Button>
          )}

          <Text style={styles.subHeader}>Upcoming Meetings</Text>
          {meetings.length === 0 ? (
            <View style={styles.emptyMeet}>
              <Icon name="video-off-outline" size={48} color={colors.outline} />
              <Text style={[styles.emptyText, {marginTop: 10}]}>No meetings scheduled yet.</Text>
              {user?.is_tl && (
                <Text style={[styles.emptyText, {fontSize: 12, marginTop: 4, color: colors.onSurfaceVariant}]}>
                  Tap "Schedule Google Meet" above to create one.
                </Text>
              )}
            </View>
          ) : (
            meetings.map(item => (
              <Card key={item.id} style={[styles.meetCard, {backgroundColor: colors.elevation.level2}]}>
                <Card.Content>
                  {/* Header row */}
                  <View style={styles.meetHeaderRow}>
                    <View style={[styles.meetIconBg, {backgroundColor: colors.primaryContainer}]}>
                      <Icon name="google" size={20} color={colors.onPrimaryContainer} />
                    </View>
                    <View style={{flex: 1, marginLeft: 10}}>
                      <Text style={[styles.meetTitle, {color: colors.onSurface}]}>{item.title}</Text>
                      <Text style={[styles.meetTime, {color: colors.onSurfaceVariant}]}>🗓 {item.date}  ·  🕐 {item.time}</Text>
                      {item.department && (
                        <Text style={[styles.meetDept, {color: colors.primary}]}>
                          {item.department.toLowerCase() === 'all' ? '🌐 All Departments' : `🏢 ${item.department}`}
                        </Text>
                      )}
                      {item.scheduledBy && (
                        <Text style={[styles.meetBy, {color: colors.outline}]}>Scheduled by {item.scheduledBy}</Text>
                      )}
                    </View>
                  </View>

                  <Divider style={{marginVertical: 10, backgroundColor: colors.outlineVariant}} />

                  {/* Action row */}
                  <View style={styles.meetActionRow}>
                    {item.link ? (
                      <Button
                        mode="contained"
                        icon="video"
                        buttonColor="#1a73e8"
                        textColor="#fff"
                        style={{borderRadius: 8}}
                        onPress={() => Linking.openURL(item.link).catch(() => Alert.alert('Error', 'Unable to open link.'))}
                      >
                        Join Meet
                      </Button>
                    ) : (
                      <Text style={{color: colors.outline, fontSize: 12}}>No link provided</Text>
                    )}
                    <View style={styles.switchWrapper}>
                      <Icon name="bell-outline" size={16} color={item.enabled ? colors.primary : colors.outline} />
                      <Text style={[styles.switchLabel, {color: item.enabled ? colors.primary : colors.onSurfaceVariant, marginLeft: 4}]}>Remind Me</Text>
                      <Switch value={item.enabled} onValueChange={(val) => toggleReminder(item.id, val)} color={colors.primary} />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      )}

      {/* FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.feedbackTitle}>Submit Feedback</Text>
            <Text style={styles.feedbackDesc}>Send anonymous reports directly to HR/TL panels.</Text>

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {['General', 'TL Review', 'Task Workload', 'HR Support'].map(cat => (
                <Button
                  key={cat}
                  compact
                  mode={feedbackCategory === cat ? 'contained' : 'outlined'}
                  onPress={() => setFeedbackCategory(cat)}
                  style={styles.catBtn}>
                  {cat}
                </Button>
              ))}
            </View>

            <Text style={styles.label}>Detailed Comments</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Explain issues, workloads, or requests here..."
              style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
              placeholderTextColor="#999"
            />
 
            <Button mode="contained" onPress={submitFeedback} style={styles.submitBtn}>
              Submit Feedback
            </Button>
          </Card.Content>
        </Card>
      )}
 
      {/* Department Selector Dialog */}
      <Portal>
        <Dialog visible={deptPrompt} dismissable={false} style={[styles.dialog, {backgroundColor: colors.elevation.level3}]}>
          <Dialog.Title style={{ color: colors.onSurface }}>Select Department</Dialog.Title>
          <Dialog.Content style={{ maxHeight: 350 }}>
            <Text style={[styles.dialogSub, {color: colors.onSurfaceVariant}]}>Select your internship department for the first time setup. This matches your chat peers.</Text>
            <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.deptBtnRow}>
              {[
                'Academics', 'Campus Ambassador', 'Career Counsellor', 
                'Communication And Engagement', 'Content Writing', 'Customer Support', 
                'Data Analysis', 'Digital Marketing', 'Finance', 'Graphics Design', 
                'Human Resource', 'Operations And Growth', 'Project Management', 
                'Public Relations', 'Research And Dev', 'Sales And Marketing', 
                'Social Media Management', 'Teaching', 'Tech', 'Video Editing', 
                'TL Program', 'Partner Program'
              ].map(dept => (
                <Button 
                  key={dept} 
                  mode="outlined" 
                  style={styles.dialogDeptBtn} 
                  compact
                  labelStyle={{ fontSize: 11 }}
                  onPress={() => handleSelectDept(dept)}
                >
                  {dept}
                </Button>
              ))}
            </ScrollView>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* TL: Schedule Meeting Dialog */}
      <Portal>
        <Dialog visible={scheduleDialog} onDismiss={() => setScheduleDialog(false)} style={[styles.dialog, {backgroundColor: colors.elevation.level3}]}>
          <Dialog.Title style={{color: colors.onSurface}}>📅 Schedule Google Meet</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.fieldLabel, {color: colors.onSurfaceVariant}]}>Meeting Title *</Text>
            <TextInput
              value={newMeetTitle}
              onChangeText={setNewMeetTitle}
              placeholder="e.g. Weekly Sync - Tech Dept"
              placeholderTextColor="#999"
              style={[styles.dialogInput, {borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface}]}
            />

            <View style={styles.dateTimeRow}>
              <View style={{flex: 1, marginRight: 8}}>
                <Text style={[styles.fieldLabel, {color: colors.onSurfaceVariant}]}>Date *</Text>
                <TextInput
                  value={newMeetDate}
                  onChangeText={setNewMeetDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                  style={[styles.dialogInput, {borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface}]}
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={[styles.fieldLabel, {color: colors.onSurfaceVariant}]}>Time *</Text>
                <TextInput
                  value={newMeetTime}
                  onChangeText={setNewMeetTime}
                  placeholder="e.g. 4:00 PM"
                  placeholderTextColor="#999"
                  style={[styles.dialogInput, {borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface}]}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, {color: colors.onSurfaceVariant}]}>Google Meet Link *</Text>
            <TextInput
              value={newMeetLink}
              onChangeText={setNewMeetLink}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="url"
              style={[styles.dialogInput, {borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface}]}
            />

            <Text style={[styles.fieldLabel, {color: colors.onSurfaceVariant}]}>Visible To *</Text>
            <View style={styles.scopeRow}>
              <Button
                mode={newMeetScope === 'dept' ? 'contained' : 'outlined'}
                onPress={() => setNewMeetScope('dept')}
                style={styles.scopeBtn}
                labelStyle={{fontSize: 12}}
                icon="account-group">
                My Dept Only
              </Button>
              <Button
                mode={newMeetScope === 'all' ? 'contained' : 'outlined'}
                onPress={() => setNewMeetScope('all')}
                style={styles.scopeBtn}
                labelStyle={{fontSize: 12}}
                icon="earth">
                All Departments
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setScheduleDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleScheduleMeeting} icon="calendar-check">Schedule</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2.5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  tabContent: {
    gap: 12,
  },
  chatCard: {
    elevation: 2,
    marginBottom: 8,
  },
  chatCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatSnippet: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  meetCard: {
    elevation: 1,
  },
  meetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  meetTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  switchWrapper: {
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 10,
    color: '#777',
    marginBottom: 2,
  },
  formCard: {
    elevation: 2,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  catBtn: {
    margin: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
  dialog: {
    borderRadius: 12,
  },
  dialogSub: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 16,
  },
  deptBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  dialogDeptBtn: {
    width: '45%',
  },
  subHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 13,
    padding: 10,
    textAlign: 'center',
  },
  emptyMeet: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  scheduleBtn: {
    borderRadius: 10,
    marginBottom: 4,
  },
  meetCard: {
    elevation: 2,
    borderRadius: 12,
  },
  meetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  meetIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  meetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  meetTime: {
    fontSize: 12,
    marginTop: 3,
  },
  meetDept: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  meetBy: {
    fontSize: 10,
    marginTop: 2,
  },
  meetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  scopeBtn: {
    flex: 1,
    borderRadius: 8,
  },
});

export default InternCommunication;
