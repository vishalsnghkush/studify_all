import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, Avatar, Portal, Dialog, IconButton, Button} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getInternDb, syncInternProfile} from '../../../Utils/MockInternDb';
import useApi from '../../../Components/Api/Api';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';

const {width} = Dimensions.get('window');

const InternHome = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [daysCompleted, setDaysCompleted] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [announcements, setAnnouncements] = useState([]);

  const [tasks, setTasks] = useState([]);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [db, setDb] = useState(null);
  const [internStatus, setInternStatus] = useState('Pending');
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  // Added from Attendance screen
  const [attendanceData, setAttendanceData] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({startDate: '', endDate: '', type: 'Casual', reason: ''});
  const [calendarDate, setCalendarDate] = useState(new Date());

  const changeMonth = (offset) => {
    setCalendarDate(prev => {
      const newD = new Date(prev);
      newD.setMonth(newD.getMonth() + offset);
      return newD;
    });
  };

  const showLeaveDatePicker = (targetField) => {
    let initDate = new Date();
    const currentVal = leaveForm[targetField];
    if (currentVal) {
      const parts = currentVal.split('-');
      if (parts.length === 3) {
        initDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    DateTimePickerAndroid.open({
      value: initDate,
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          setLeaveForm(prev => ({
            ...prev,
            [targetField]: formatted,
            ...(targetField === 'startDate' && !prev.endDate ? { endDate: formatted } : {})
          }));
        }
      },
    });
  };

  const { get, post } = useApi();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch REAL status from MySQL API
        try {
          const profileRes = await get('/interns/profile', {skipSuccessFlash: true, skipErrorFlash: true});
          if (profileRes && profileRes.data) {
            setInternStatus(profileRes.data.status || 'Pending');
          }
        } catch (profileErr) {
          console.log('Could not fetch profile from API, falling back to mock', profileErr);
        }

        // Fetch today's attendance status
        try {
          const attRes = await get('/interns/attendance', {skipSuccessFlash: true, skipErrorFlash: true});
          if (attRes && attRes.data) {
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = attRes.data.find(r => {
              const d = new Date(r.date).toISOString().split('T')[0];
              return d === today;
            });
            setAttendanceToday(todayRecord || null);
          }
        } catch (attErr) {
          console.log('Could not fetch attendance', attErr);
        }

        // Fetch leaves
        try {
          const leavesRes = await get('/interns/leaves', {skipSuccessFlash: true, skipErrorFlash: true});
          if (leavesRes && leavesRes.data) {
            setLeaveRequests(leavesRes.data.map(l => {
              const startStr = typeof l.start_date === 'string' && l.start_date.length >= 10 && !l.start_date.includes('0000') ? l.start_date.substring(0, 10) : 'N/A';
              const endStr = typeof l.end_date === 'string' && l.end_date.length >= 10 && !l.end_date.includes('0000') ? l.end_date.substring(0, 10) : 'N/A';
              return {
                id: l.id.toString(),
                dates: startStr === endStr ? startStr : `${startStr} - ${endStr}`,
                reason: l.reason,
                status: l.status,
                type: 'Leave'
              };
            }));
          }
        } catch (lErr) {}

        // Fetch attendance map for calendar
        try {
          const attMapRes = await get('/interns/attendance', {skipSuccessFlash: true, skipErrorFlash: true});
          if (attMapRes && attMapRes.data) {
            const mergedAtt = {};
            attMapRes.data.forEach(a => {
              if (a.date) {
                const dateKey = typeof a.date === 'string' ? a.date.substring(0, 10) : new Date(a.date).toISOString().split('T')[0];
                mergedAtt[dateKey] = a.status;
              }
            });
            setAttendanceData(mergedAtt);
          }
        } catch (aErr) {}

        // Keep mock data for tasks and announcements (not yet migrated)
        if (user) {
          await syncInternProfile(user);
        }
        const dbData = await getInternDb();
        setDb(dbData);
        const activeId = user?.user_id || 'alice_123';
        const myReports = dbData.reports.filter(r => r.internId === activeId);
        
        // Count submitted Daily EOD reports
        const eodCount = myReports.filter(r => r.type === 'Daily EOD').length;
        setDaysCompleted(eodCount);

        // Fetch live tasks from API
        try {
          const taskRes = await get('/interns/tasks', {skipSuccessFlash: true, skipErrorFlash: true});
          if (taskRes && taskRes.data) {
            const loadedTasks = taskRes.data;
            setTasks(loadedTasks);
            
            // Count tasks completed specifically by this intern
            const completedCount = loadedTasks.filter(t => t.completed && (t.assigned_to?.includes(activeId) || t.completed_by === activeId)).length;
            setTasksDone(completedCount);
          }
        } catch (tErr) {
          console.log('Error fetching live tasks', tErr);
        }

        // Fetch Announcements from live API
        try {
          const annRes = await get('/interns/announcements', {skipSuccessFlash: true, skipErrorFlash: true});
          if (annRes && annRes.data) {
            setAnnouncements(annRes.data);
          }
        } catch (annErr) {
          console.log('Error fetching announcements', annErr);
        }

      } catch (e) {
        console.error('Error fetching intern stats:', e);
      }
    };

    fetchStats();
    const unsubscribe = navigation.addListener('focus', fetchStats);
    return unsubscribe;
  }, [navigation, user]);

  // Schedule Daily EOD reminder notifications at 5 PM, 7 PM, and 10 PM
  useEffect(() => {
    const scheduleEodReminders = async () => {
      try {
        let Notifee = null;
        try {
          Notifee = require('@notifee/react-native').default;
        } catch (e) {
          console.log('Notifee not available');
          return;
        }
        if (!Notifee) return;
        
        await Notifee.requestPermission();
        
        const db = await getInternDb();
        const activeId = user?.user_id || 'alice_123';
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Check if EOD is already submitted today
        const hasSubmittedToday = db.reports.some(
          r => r.internId === activeId && r.date === todayStr && r.type === 'Daily EOD'
        );
        
        // If already submitted, cancel any pending notifications for today
        if (hasSubmittedToday) {
          await Notifee.cancelNotification('daily_eod_5pm');
          await Notifee.cancelNotification('daily_eod_7pm');
          await Notifee.cancelNotification('daily_eod_10pm');
          return;
        }
        
        // Schedule 5:00 PM
        let time5 = new Date().setHours(17, 0, 0, 0);
        if (time5 < Date.now()) time5 += 86400000;
        await Notifee.createTriggerNotification(
          {
            id: 'daily_eod_5pm',
            title: `📋 Send EOD Report Reminder (5 PM)`,
            body: `Hi ${user?.fname || 'Intern'}, it is 5:00 PM. Please remember to submit your Daily EOD report today!`,
            android: { channelId: 'default', smallIcon: 'ic_launcher', pressAction: { id: 'default' } },
          },
          { type: 1, timestamp: time5, repeatFrequency: 1 }
        );
        
        // Schedule 7:00 PM
        let time7 = new Date().setHours(19, 0, 0, 0);
        if (time7 < Date.now()) time7 += 86400000;
        await Notifee.createTriggerNotification(
          {
            id: 'daily_eod_7pm',
            title: `⏰ EOD Report Pending (7 PM)`,
            body: `Hi ${user?.fname || 'Intern'}, it is 7:00 PM and your EOD report is still pending. Please submit it soon!`,
            android: { channelId: 'default', smallIcon: 'ic_launcher', pressAction: { id: 'default' } },
          },
          { type: 1, timestamp: time7, repeatFrequency: 1 }
        );
        
        // Schedule 10:00 PM
        let time10 = new Date().setHours(22, 0, 0, 0);
        if (time10 < Date.now()) time10 += 86400000;
        await Notifee.createTriggerNotification(
          {
            id: 'daily_eod_10pm',
            title: `⚠️ EOD Report Urgent Reminder (10 PM)`,
            body: `Hi ${user?.fname || 'Intern'}, it is 10:00 PM. Please submit your EOD report before the day ends!`,
            android: { channelId: 'default', smallIcon: 'ic_launcher', pressAction: { id: 'default' } },
          },
          { type: 1, timestamp: time10, repeatFrequency: 1 }
        );
        
      } catch (e) {
        console.log('Failed to schedule EOD reminder notifications:', e);
      }
    };
    
    if (user?.is_intern) {
      scheduleEodReminders();
    }
  }, [user]);

  const handleToggleTask = async (taskId) => {
    const activeId = user?.user_id || 'alice_123';
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Rule: only those who said "I'm working" can check on completed
    if (!task.assignedTo.includes(activeId)) {
      return Alert.alert('Access Denied', "Only interns currently working on this task can mark it as completed.");
    }

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedBy: nextCompleted ? activeId : null
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    
    await saveInternTasks(activeId, updatedTasks);
    
    const completedCount = updatedTasks.filter(t => t.completed && (t.assignedTo?.includes(activeId) || t.completedBy === activeId)).length;
    setTasksDone(completedCount);
  };

  const handleClaimTask = async (taskId) => {
    const activeId = user?.user_id || 'alice_123';
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isAssigned = task.assignedTo.includes(activeId);

    if (isAssigned) {
      // Opt-out / Stop working
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          const nextAssigned = t.assignedTo.filter(id => id !== activeId);
          return {
            ...t,
            assignedTo: nextAssigned,
            helpNeeded: nextAssigned.length === 0 ? false : t.helpNeeded
          };
        }
        return t;
      });
      setTasks(updatedTasks);
      await saveInternTasks(activeId, updatedTasks);
      
      const completedCount = updatedTasks.filter(t => t.completed && (t.assignedTo?.includes(activeId) || t.completedBy === activeId)).length;
      setTasksDone(completedCount);
    } else {
      // Opt-in / Start working
      // Rule: cannot work on more than 3 ongoing tasks
      const ongoingCount = tasks.filter(t => !t.completed && t.assignedTo.includes(activeId)).length;
      if (ongoingCount >= 3) {
        return Alert.alert('Limit Reached', 'You cannot work on more than 3 ongoing tasks at the same time.');
      }

      // Rule: can only join if unassigned, OR if assigned to someone else but helpNeeded is checked
      const isTaken = task.assignedTo.length > 0;
      if (isTaken && !task.helpNeeded) {
        return Alert.alert('Claimed', 'This task is already claimed. You can only join if "Help Needed" is checked.');
      }

      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            assignedTo: [...t.assignedTo, activeId]
          };
        }
        return t;
      });
      setTasks(updatedTasks);
      await saveInternTasks(activeId, updatedTasks);
      
      const completedCount = updatedTasks.filter(t => t.completed && (t.assignedTo?.includes(activeId) || t.completedBy === activeId)).length;
      setTasksDone(completedCount);
    }
  };

  const handleToggleHelp = async (taskId) => {
    const activeId = user?.user_id || 'alice_123';
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Rule: only assigned interns can toggle help
    if (!task.assignedTo.includes(activeId)) {
      return Alert.alert('Access Denied', 'Only interns currently working on this task can request help.');
    }

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          helpNeeded: !t.helpNeeded
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    await saveInternTasks(activeId, updatedTasks);
  };

  const handleRequestTasks = async () => {
    const activeId = user?.user_id || 'alice_123';
    
    const starterTasks = [
      {
        id: 'starter_1',
        title: 'Complete Onboarding & Environment Setup',
        completed: false,
        assignedTo: [],
        helpNeeded: false,
        completedBy: null,
        createdBy: 'system',
        createdByName: 'System'
      },
      {
        id: 'starter_2',
        title: 'Review Project Guidelines & Coding Standards',
        completed: false,
        assignedTo: [],
        helpNeeded: false,
        completedBy: null,
        createdBy: 'system',
        createdByName: 'System'
      },
      {
        id: 'starter_3',
        title: 'Schedule Introduction Call with TL',
        completed: false,
        assignedTo: [],
        helpNeeded: false,
        completedBy: null,
        createdBy: 'system',
        createdByName: 'System'
      }
    ];
    
    setTasks(starterTasks);
    await saveInternTasks(activeId, starterTasks);
    
    Alert.alert(
      'Tasks Requested',
      'Your request has been logged! We have seeded some starter tasks for your department to begin working immediately.'
    );
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const activeId = user?.user_id || 'alice_123';
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      assignedTo: [],
      helpNeeded: false,
      completedBy: null,
      createdBy: activeId,
      createdByName: `${user?.fname || 'Intern'} ${user?.lname || ''}`.trim()
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskTitle('');
    
    await saveInternTasks(activeId, updatedTasks);
  };

  const handleDeleteTask = async (taskId) => {
    const activeId = user?.user_id || 'alice_123';
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    
    await saveInternTasks(activeId, updatedTasks);
    
    const completedCount = updatedTasks.filter(t => t.completed && (t.assignedTo?.includes(activeId) || t.completedBy === activeId)).length;
    setTasksDone(completedCount);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const markAttendance = async (type) => {
    setMarkingAttendance(true);
    try {
      const res = await post('/interns/attendance/mark', { type }, {skipSuccessFlash: false});
      if (res && res.data) {
        setAttendanceToday(res.data);
      }
    } catch (e) {
      console.log('Mark attendance error:', e);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const submitLeave = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      return Alert.alert('Error', 'Please fill in all leave request fields.');
    }
    try {
      await post('/interns/leaves', {
        start_date: leaveForm.startDate,
        end_date: leaveForm.endDate,
        reason: leaveForm.reason
      });
      setLeaveForm({startDate: '', endDate: '', type: 'Casual', reason: ''});
      setLeaveModal(false);
      Alert.alert('Submitted', 'Leave request submitted to TL for approval.');
      // Refresh leaves
      const leavesRes = await get('/interns/leaves', {skipSuccessFlash: true});
      if (leavesRes && leavesRes.data) {
        setLeaveRequests(leavesRes.data.map(l => {
          const startStr = typeof l.start_date === 'string' && l.start_date.length >= 10 && !l.start_date.includes('0000') ? l.start_date.substring(0, 10) : 'N/A';
          const endStr = typeof l.end_date === 'string' && l.end_date.length >= 10 && !l.end_date.includes('0000') ? l.end_date.substring(0, 10) : 'N/A';
          return {
            id: l.id.toString(),
            dates: startStr === endStr ? startStr : `${startStr} - ${endStr}`,
            reason: l.reason,
            status: l.status,
            type: 'Leave'
          };
        }));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to request leave.');
    }
  };

  // Dynamic Monthly Calendar Renderer with Month Controls
  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    const monthYearStr = `${monthNames[month]} ${year}`;
    
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const cells = [];

    // Header with Month Name and Navigation Controls
    cells.push(
      <View key="cal-header" style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4}}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => changeMonth(-1)} 
          style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surfaceVariant || '#EEEEEE'}}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.onSurface}}>‹</Text>
        </TouchableOpacity>
        <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.onSurface}}>
          {monthYearStr}
        </Text>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => changeMonth(1)} 
          style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surfaceVariant || '#EEEEEE'}}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.onSurface}}>›</Text>
        </TouchableOpacity>
      </View>
    );

    // Day Labels Header Row
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    cells.push(
      <View key="labels" style={styles.calendarRow}>
        {dayLabels.map(d => <Text key={d} style={styles.calLabel}>{d}</Text>)}
      </View>
    );

    let currentRow = [];
    for (let i = 0; i < startDay; i++) {
      currentRow.push(<View key={`empty-${i}`} style={styles.calCell} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const status = attendanceData[dateKey];
      const isToday = dateKey === todayStr;

      let statusColor = colors.surfaceVariant || '#E0E0E0';
      let textColor = colors.onSurface || '#333';
      let isBold = false;
      let borderWidth = 0;
      let borderColor = 'transparent';

      if (status === 'Full' || status === 'Present' || status === 1) {
        statusColor = '#4CAF50'; // Green
        textColor = '#FFFFFF';
      } else if (status === 'Half' || status === 2) {
        statusColor = '#FFC107'; // Amber
        textColor = '#000000';
      } else if (status === 'Absent' || status === 3) {
        statusColor = '#F44336'; // Red
        textColor = '#FFFFFF';
      }

      if (isToday) {
        borderWidth = 2;
        borderColor = (statusColor === '#4CAF50' || statusColor === '#F44336') ? '#000000' : '#FF9800'; 
        isBold = true;
        if (!status) {
          statusColor = '#FFF9C4'; // Today highlight when no attendance marked yet
          textColor = '#E65100';
        }
      }

      currentRow.push(
        <View key={d} style={styles.calCell}>
          <View style={[
            styles.calDayCircle, 
            {backgroundColor: statusColor, borderWidth: borderWidth, borderColor: borderColor}
          ]}>
            <Text style={[styles.calDayText, {color: textColor, fontWeight: isBold ? 'bold' : '500'}]}>{d}</Text>
          </View>
        </View>
      );

      if (currentRow.length === 7) {
        cells.push(<View key={`row-${d}`} style={styles.calendarRow}>{currentRow}</View>);
        currentRow = [];
      }
    }

    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push(<View key={`empty-end-${currentRow.length}`} style={styles.calCell} />);
      }
      cells.push(<View key="row-last" style={styles.calendarRow}>{currentRow}</View>);
    }

    return cells;
  };

  return (
    <Screen NoHeader style={styles.scrollContainer}>
      {/* Header Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetText}>Welcome Back,</Text>
          <Text style={styles.nameText}>{user?.fname || 'Intern'} {user?.lname || ''}</Text>
          <Text style={[styles.deptText, {color: colors.primary}]}>
            {user?.department || 'Tech'} Division Intern
          </Text>
        </View>
        <Avatar.Text
          size={55}
          label={(user?.fname?.[0] || 'I') + (user?.lname?.[0] || '')}
          style={{backgroundColor: colors.primaryContainer}}
          color={colors.onPrimaryContainer}
        />
      </View>

      {/* Verification Gate / Onboarding Status Card */}
      {internStatus !== 'Approved' ? (
        <Card style={{ marginVertical: 12, backgroundColor: '#FFF9C4', borderWidth: 1, borderColor: '#FBC02D' }}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Icon name="shield-lock-outline" size={54} color="#F57F17" />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#E65100', marginTop: 12, marginBottom: 8, textAlign: 'center' }}>
              🔒 Verification Required
            </Text>
            <Text style={{ fontSize: 13, color: '#5D4037', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
              Your internship profile is pending approval. Please navigate to your Profile tab to upload your Official Offer Letter. Your Supervisor/TL will review it to grant full access.
            </Text>
            <Button 
              mode="contained" 
              buttonColor="#F57F17"
              textColor="#fff"
              onPress={() => navigation.navigate('InternProfile')}
            >
              Go to Profile
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <>
          {/* Key Metrics Overview */}
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, {backgroundColor: colors.elevation.level2}]}>
              <Card.Content style={styles.statContent}>
                <Icon name="calendar-check" size={24} color={colors.primary} />
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{daysCompleted} {daysCompleted === 1 ? 'Day' : 'Days'}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </Card.Content>
            </Card>
            <Card 
              style={[styles.statCard, {backgroundColor: colors.elevation.level2}]}
              onPress={() => navigation.navigate('InternTasks')}
              activeOpacity={0.7}
            >
              <Card.Content style={styles.statContent}>
                <Icon name="clipboard-check-outline" size={24} color={colors.primary} />
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{tasksDone} / {tasks.length || '—'}</Text>
                  <Text style={styles.statLabel}>Tasks Done</Text>
                </View>
              </Card.Content>
            </Card>
          </View>

          {/* Daily Check-in Card */}
          <Card style={{ marginVertical: 12, borderRadius: 16, elevation: 3, backgroundColor: '#fff' }}>
            <Card.Content style={{ paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Icon name="clock-check-outline" size={22} color={colors.primary} />
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>Daily Check-in</Text>
                <View style={{ 
                  marginLeft: 'auto', 
                  backgroundColor: !attendanceToday ? '#FFEBEE' : attendanceToday.status === 'Full' ? '#E8F5E9' : '#FFF8E1',
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 
                }}>
                  <Text style={{ 
                    fontSize: 12, fontWeight: '600',
                    color: !attendanceToday ? '#C62828' : attendanceToday.status === 'Full' ? '#2E7D32' : '#F9A825'
                  }}>
                    {!attendanceToday ? '❌ Absent' : attendanceToday.status === 'Full' ? '✅ Full Day' : '🟡 Half Day'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  disabled={!!attendanceToday?.morning_marked_at || markingAttendance || new Date().getHours() < 7 || new Date().getHours() >= 12}
                  onPress={() => markAttendance('morning')}
                  style={{
                    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                    backgroundColor: attendanceToday?.morning_marked_at ? '#E8F5E9' : (new Date().getHours() < 7 || new Date().getHours() >= 12) ? '#F5F5F5' : '#E3F2FD',
                    borderWidth: 1,
                    borderColor: attendanceToday?.morning_marked_at ? '#66BB6A' : (new Date().getHours() < 7 || new Date().getHours() >= 12) ? '#E0E0E0' : '#42A5F5',
                  }}
                >
                  <Icon 
                    name={attendanceToday?.morning_marked_at ? 'check-circle' : 'weather-sunny'} 
                    size={28} 
                    color={attendanceToday?.morning_marked_at ? '#2E7D32' : (new Date().getHours() < 7 || new Date().getHours() >= 12) ? '#BDBDBD' : '#1565C0'} 
                  />
                  <Text style={{ 
                    fontSize: 13, fontWeight: '600', marginTop: 6,
                    color: attendanceToday?.morning_marked_at ? '#2E7D32' : (new Date().getHours() < 7 || new Date().getHours() >= 12) ? '#9E9E9E' : '#1565C0'
                  }}>
                    {attendanceToday?.morning_marked_at ? 'Morning ✓' : new Date().getHours() >= 12 ? 'Closed' : new Date().getHours() < 7 ? 'After 7 AM' : '☀️ Morning'}
                  </Text>
                  {attendanceToday?.morning_marked_at && (
                    <Text style={{ fontSize: 10, color: '#66BB6A', marginTop: 2 }}>
                      {new Date(attendanceToday.morning_marked_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!!attendanceToday?.evening_marked_at || markingAttendance || new Date().getHours() < 16 || new Date().getHours() >= 22}
                  onPress={() => markAttendance('evening')}
                  style={{
                    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                    backgroundColor: attendanceToday?.evening_marked_at ? '#E8F5E9' : (new Date().getHours() < 16 || new Date().getHours() >= 22) ? '#F5F5F5' : '#F3E5F5',
                    borderWidth: 1,
                    borderColor: attendanceToday?.evening_marked_at ? '#66BB6A' : (new Date().getHours() < 16 || new Date().getHours() >= 22) ? '#E0E0E0' : '#AB47BC',
                  }}
                >
                  <Icon 
                    name={attendanceToday?.evening_marked_at ? 'check-circle' : 'weather-night'} 
                    size={28} 
                    color={attendanceToday?.evening_marked_at ? '#2E7D32' : (new Date().getHours() < 16 || new Date().getHours() >= 22) ? '#BDBDBD' : '#7B1FA2'} 
                  />
                  <Text style={{ 
                    fontSize: 13, fontWeight: '600', marginTop: 6,
                    color: attendanceToday?.evening_marked_at ? '#2E7D32' : (new Date().getHours() < 16 || new Date().getHours() >= 22) ? '#9E9E9E' : '#7B1FA2'
                  }}>
                    {attendanceToday?.evening_marked_at ? 'Evening ✓' : new Date().getHours() >= 22 ? 'Closed' : new Date().getHours() < 16 ? 'After 4 PM' : '🌙 Evening'}
                  </Text>
                  {attendanceToday?.evening_marked_at && (
                    <Text style={{ fontSize: 10, color: '#66BB6A', marginTop: 2 }}>
                      {new Date(attendanceToday.evening_marked_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          {/* Monthly Calendar & Leaves Hub */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Attendance & Leaves</Text>
            <Button mode="text" compact onPress={() => setLeaveModal(true)} labelStyle={{ fontSize: 13, fontWeight: 'bold' }}>
              + Apply Leave
            </Button>
          </View>
          <Card style={{ marginVertical: 8, elevation: 2, backgroundColor: colors.elevation.level1, borderRadius: 12 }}>
            <Card.Content>
              {renderCalendar()}
              
              {leaveRequests.length > 0 && (
                <View style={{ marginTop: 24 }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.onSurface, marginBottom: 12 }}>Recent Leaves</Text>
                  {leaveRequests.slice(0,3).map(l => (
                    <View key={l.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant }}>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.onSurface }}>{l.dates}</Text>
                        <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>{l.reason}</Text>
                      </View>
                      <Text style={{ 
                        fontSize: 12, fontWeight: 'bold', alignSelf: 'center',
                        color: l.status === 'Approved' ? '#4CAF50' : l.status === 'Rejected' ? '#F44336' : '#FF9800' 
                      }}>
                        {l.status}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Core Hub Buttons (Styled with beautiful custom images like Student role) */}
          <Text style={styles.sectionTitle}>Intern Workspace Hubs</Text>
          <View style={styles.hubGrid}>
            
            {/* AI Productivity Hub */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('InternAiHub')}
              style={[styles.personalBanner, {backgroundColor: '#e0f2f1', borderColor: '#b2dfdb'}]}>
              <View style={styles.personalTextContainer}>
                <Text style={[styles.personalSubtitle, {color: '#00796b'}]}>AI tools & automation</Text>
                <Text style={styles.personalTitle}>AI Productivity Hub</Text>
                <View style={[styles.personalBtn, {backgroundColor: '#00796b'}]}>
                  <Text style={styles.personalBtnText}>Open AI Hub</Text>
                  <Icon name="chevron-right" size={13} color="#ffffff" style={{marginLeft: 2}} />
                </View>
              </View>
              <Image
                source={require('../../../Assets/Images/ai_productivity_hub.jpg')}
                style={styles.personalImage}
              />
            </TouchableOpacity>

            {/* Reports Submission */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('InternReports')}
              style={[styles.personalBanner, {backgroundColor: '#e3f2fd', borderColor: '#bbdefb'}]}>
              <View style={styles.personalTextContainer}>
                <Text style={[styles.personalSubtitle, {color: '#1976d2'}]}>EOD logs & submissions</Text>
                <Text style={styles.personalTitle}>Performance Reports</Text>
                <View style={[styles.personalBtn, {backgroundColor: '#1976d2'}]}>
                  <Text style={styles.personalBtnText}>Submit Report</Text>
                  <Icon name="chevron-right" size={13} color="#ffffff" style={{marginLeft: 2}} />
                </View>
              </View>
              <Image
                source={require('../../../Assets/Images/reports_submission.jpg')}
                style={styles.personalImage}
              />
            </TouchableOpacity>

            {/* Learning & Training Hub */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('InternLearningHub')}
              style={[styles.personalBanner, {backgroundColor: '#f3e5f5', borderColor: '#e1bee7'}]}>
              <View style={styles.personalTextContainer}>
                <Text style={[styles.personalSubtitle, {color: '#7b1fa2'}]}>Recorded webinars & files</Text>
                <Text style={styles.personalTitle}>Learning Hub</Text>
                <View style={[styles.personalBtn, {backgroundColor: '#7b1fa2'}]}>
                  <Text style={styles.personalBtnText}>Start Learning</Text>
                  <Icon name="chevron-right" size={13} color="#ffffff" style={{marginLeft: 2}} />
                </View>
              </View>
              <Image
                source={require('../../../Assets/Images/learning_hub.jpg')}
                style={styles.personalImage}
              />
            </TouchableOpacity>

            {/* Careers & Opportunities */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Careers')}
              style={[styles.personalBanner, {backgroundColor: '#e8eaf6', borderColor: '#c5cae9'}]}>
              <View style={styles.personalTextContainer}>
                <Text style={[styles.personalSubtitle, {color: '#3f51b5'}]}>Explore openings & pathways</Text>
                <Text style={styles.personalTitle}>Careers & Openings</Text>
                <View style={[styles.personalBtn, {backgroundColor: '#3f51b5'}]}>
                  <Text style={styles.personalBtnText}>Explore Jobs</Text>
                  <Icon name="chevron-right" size={13} color="#ffffff" style={{marginLeft: 2}} />
                </View>
              </View>
              <Image
                source={require('../../../Assets/Images/careers.png')}
                style={styles.personalImage}
              />
            </TouchableOpacity>

            {/* Brain Gym */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('BrainGym')}
              style={[styles.personalBanner, {backgroundColor: '#fff3e0', borderColor: '#ffe0b2'}]}>
              <View style={styles.personalTextContainer}>
                <Text style={[styles.personalSubtitle, {color: '#e65100'}]}>Mind exercises & games</Text>
                <Text style={styles.personalTitle}>Brain Gym</Text>
                <View style={[styles.personalBtn, {backgroundColor: '#e65100'}]}>
                  <Text style={styles.personalBtnText}>Play Games</Text>
                  <Icon name="chevron-right" size={13} color="#ffffff" style={{marginLeft: 2}} />
                </View>
              </View>
              <Image
                source={require('../../../Assets/Images/activities.jpg')}
                style={styles.personalImage}
              />
            </TouchableOpacity>

          </View>

          {/* Announcements / Upcoming Events */}
          <Text style={styles.sectionTitle}>Announcements & Events</Text>
          <Card style={[styles.annCard, {backgroundColor: colors.elevation.level1, marginBottom: 40}]}>
            <Card.Content>
              {announcements.length === 0 ? (
                <Text style={{color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 12}}>
                  No announcements or events posted yet.
                </Text>
              ) : (
                announcements.map((ann, idx) => (
                  <View key={ann.id}>
                    {idx > 0 && <View style={[styles.divider, {backgroundColor: colors.outlineVariant}]} />}
                    <View style={styles.annItem}>
                      <Icon name={ann.icon || (ann.type === 'Announcement' ? 'bullhorn-outline' : 'calendar-star')} size={24} color={ann.color || (ann.type === 'Announcement' ? '#FF9800' : '#2196F3')} style={styles.annIcon} />
                      <View style={styles.annTextContainer}>
                        <Text style={styles.annSubject}>{ann.title}</Text>
                        <Text style={styles.annBody}>{ann.body}</Text>
                        <Text style={styles.annTime}>{ann.time_text || ann.timeText}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </Card.Content>
          </Card>
        </>
      )}

      {/* Tasks are now in the dedicated Tasks tab (InternTasks screen) */}
        <Portal>
          <Dialog visible={leaveModal} onDismiss={() => setLeaveModal(false)} style={{ backgroundColor: colors.elevation.level3, borderRadius: 16 }}>
            <Dialog.Title style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Request Leave</Dialog.Title>
            <Dialog.Content>
              <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 16 }}>
                Submit a leave request. Your Team Leader will review it. Half days are automatically applied if only one shift is missed.
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={() => showLeaveDatePicker('startDate')} 
                  style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.onSurface, marginBottom: 4, fontWeight: 'bold' }}>Start Date</Text>
                  <View style={{ backgroundColor: colors.background, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.outlineVariant, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: leaveForm.startDate ? colors.onSurface : colors.outline, fontSize: 13 }}>
                      {leaveForm.startDate || 'YYYY-MM-DD'}
                    </Text>
                    <Icon name="calendar-month" size={18} color={colors.primary} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={() => showLeaveDatePicker('endDate')} 
                  style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.onSurface, marginBottom: 4, fontWeight: 'bold' }}>End Date</Text>
                  <View style={{ backgroundColor: colors.background, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.outlineVariant, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: leaveForm.endDate ? colors.onSurface : colors.outline, fontSize: 13 }}>
                      {leaveForm.endDate || 'YYYY-MM-DD'}
                    </Text>
                    <Icon name="calendar-month" size={18} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, color: colors.onSurface, marginBottom: 4, fontWeight: 'bold' }}>Reason for leave</Text>
              <TextInput 
                placeholder="Briefly explain your reason..."
                value={leaveForm.reason}
                onChangeText={t => setLeaveForm({...leaveForm, reason: t})}
                multiline
                numberOfLines={3}
                style={{ backgroundColor: colors.background, padding: 12, borderRadius: 8, color: colors.onSurface, borderWidth: 1, borderColor: colors.outlineVariant, minHeight: 80, textAlignVertical: 'top' }}
                placeholderTextColor={colors.outline}
              />
            </Dialog.Content>
            <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Button onPress={() => setLeaveModal(false)} textColor={colors.outline}>Cancel</Button>
              <Button mode="contained" onPress={submitLeave} style={{ borderRadius: 8 }}>Submit Request</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  greetText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  deptText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statInfo: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  hubGrid: {
    gap: 12,
    marginBottom: 24,
  },
  personalBanner: {
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  personalTextContainer: {
    flex: 1.25,
    paddingRight: 10,
  },
  personalSubtitle: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  personalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  personalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  personalBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  personalImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  annCard: {
    elevation: 1,
  },
  annItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  annIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  annTextContainer: {
    flex: 1,
  },
  annSubject: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  annBody: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
    lineHeight: 18,
  },
  annTime: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  taskDialog: {
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  taskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  addBtn: {
    height: 40,
    justifyContent: 'center',
    borderRadius: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskCheckWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  taskText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  emptyTasksText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    paddingVertical: 20,
  },
  taskCollabCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskTitlePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  taskInfoRow: {
    paddingLeft: 40,
    marginTop: -4,
    marginBottom: 8,
  },
  taskMetaText: {
    fontSize: 11,
    color: '#666',
    flexWrap: 'wrap',
  },
  helpBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  helpBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#C62828',
  },
  taskActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 40,
    marginTop: 4,
  },
  actionButton: {
    borderRadius: 6,
    height: 32,
    justifyContent: 'center',
  },
  collabNoteBox: {
    flexDirection: 'row',
    backgroundColor: '#E1F5FE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  collabNoteText: {
    fontSize: 11,
    color: '#01579B',
    flex: 1,
    lineHeight: 14,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calLabel: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    color: '#888',
    fontWeight: 'bold',
  },
  calCell: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calDayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calDayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default InternHome;
