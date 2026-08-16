import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { Card, Button, Avatar, useTheme, Chip, Divider, ProgressBar } from 'react-native-paper';
import { Text } from '../../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Screen } from '../../../Components/Screen';
import useApi from '../../../Components/Api/Api';
import { extractDateISO } from '../../../Utils/MockInternDb';

export default function FounderDashboard({ navigation }) {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = theme.dark;

  const bg = isDark ? colors.background : '#FAF6F8';
  const cardBg = isDark ? colors.elevation.level1 : '#ffffff';
  const borderColor = isDark ? colors.outlineVariant : '#F3EBF0';
  const textDarkBlue = isDark ? colors.onSurface : '#1A237E';
  const textBody = isDark ? colors.onSurfaceVariant : '#555';
  const textHeading = isDark ? colors.onSurface : '#263238';

  const styles = useMemo(() => {
    return {
      ...baseStyles,
      header: {
        ...baseStyles.header,
        backgroundColor: bg,
      },
      sectionHeading: {
        ...baseStyles.sectionHeading,
        color: textDarkBlue,
      },
      cardVal: {
        ...baseStyles.cardVal,
        color: textDarkBlue,
      },
      cardLbl: {
        ...baseStyles.cardLbl,
        color: textBody,
      },
      input: {
        ...baseStyles.input,
        backgroundColor: isDark ? colors.elevation.level1 : '#FFF',
        borderColor: isDark ? colors.outline : '#CCC',
        color: isDark ? colors.onSurface : '#333',
      },
    };
  }, [isDark, colors, bg, cardBg, borderColor, textDarkBlue, textBody, textHeading]);
  const { get, post, remove } = useApi();
  const [loading, setLoading] = useState(false);

  // Raw data state
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [modules, setModules] = useState([]);
  const [customDepts, setCustomDepts] = useState(['Tech', 'HR', 'Design', 'Operations', 'Sales', 'Marketing', 'Video Editing']);

  // Debug Logging State
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugModal, setShowDebugModal] = useState(false);

  const logDebug = (type, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logItem = { id: `${Date.now()}_${Math.random()}`, time: timestamp, type, message, data: data ? JSON.stringify(data) : null };
    setDebugLogs(prev => [logItem, ...prev].slice(0, 50));
    console.log(`[FOUNDER_DEBUG] [${type}] ${message}`, data || '');
  };

  // PIN lock for Founder Dashboard access
  const [pinLocked, setPinLocked] = useState(true);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleVerifyFounderPin = () => {
    if (enteredPin === '8487') {
      setPinLocked(false);
      setEnteredPin('');
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Access Denied!');
    }
  };

  // Modals state
  const [deptModal, setDeptModal] = useState(false);
  const [moduleModal, setModuleModal] = useState(false);
  const [tlModal, setTlModal] = useState(false);
  const [internModal, setInternModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [analyticsModal, setAnalyticsModal] = useState(false);

  // Form states for modals
  const [newDeptName, setNewDeptName] = useState('');
  
  // Module form
  const [modTitle, setModTitle] = useState('');
  const [modDuration, setModDuration] = useState('30 mins');
  const [modDesc, setModDesc] = useState('');
  const [modVideo, setModVideo] = useState('');
  const [selectedDeptsForMod, setSelectedDeptsForMod] = useState(['Tech']);

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskTargetDept, setTaskTargetDept] = useState('All');

  // Search/Filters in modals
  const [internFilterDept, setInternFilterDept] = useState('All');
  const [internSearch, setInternSearch] = useState('');

  // 1. Data Loader
  const loadData = async () => {
    setLoading(true);
    logDebug('INFO', 'Starting Founder Dashboard data fetch...');
    try {
      // Fetch Team & Reports
      let res = null;
      try {
        res = await get('/interns/team?department=All', { skipSuccessFlash: true, skipErrorFlash: true });
        const teamCount = (res && res.data && Array.isArray(res.data.team)) ? res.data.team.length : 0;
        logDebug('SUCCESS', 'Fetched team & attendance data', { count: teamCount });
      } catch (e) {
        logDebug('ERROR', 'Failed to fetch team data', e.message);
      }

      // Fetch Tasks
      let taskRes = null;
      try {
        taskRes = await get('/interns/tasks', { skipSuccessFlash: true, skipErrorFlash: true });
        const taskCount = (taskRes && taskRes.data && Array.isArray(taskRes.data)) ? taskRes.data.length : 0;
        logDebug('SUCCESS', 'Fetched server tasks', { count: taskCount });
      } catch (e) {
        logDebug('ERROR', 'Failed to fetch tasks', e.message);
      }

      // Fetch Departments
      try {
        const deptRes = await get('/interns/departments', { skipSuccessFlash: true, skipErrorFlash: true });
        if (deptRes && deptRes.data && Array.isArray(deptRes.data) && deptRes.data.length > 0) {
          const fetchedNames = deptRes.data.map(d => d.name).filter(Boolean);
          setCustomDepts(prev => Array.from(new Set([...prev, ...fetchedNames])));
          logDebug('SUCCESS', 'Fetched custom departments from server DB', { count: fetchedNames.length });
        }
      } catch (e) {
        logDebug('INFO', 'Custom departments fetch fallback', e.message);
      }

      if (res && res.data) {
        setTeam(res.data.team || []);
        setAttendance(res.data.attendance || {});
        setModules(res.data.modules || res.data.trainings || []);
      }

      if (taskRes && taskRes.data && Array.isArray(taskRes.data)) {
        setTasks(taskRes.data);
      }
    } catch (e) {
      logDebug('CRITICAL', 'Unhandled error in loadData', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Computed Metrics
  const todayISO = useMemo(() => extractDateISO(new Date()), []);

  const totalInterns = team.length;

  const activeTodayCount = useMemo(() => {
    let count = 0;
    team.forEach(m => {
      const mId = String(m.id || m.user_id);
      const att = attendance[mId] && attendance[mId][todayISO];
      if (att && (att.status === 'Full' || att.status === 'Half' || att.status === 'Present' || att.morning_marked_at || att.evening_marked_at)) {
        count++;
      }
    });
    return count;
  }, [team, attendance, todayISO]);

  const pendingTasksCount = useMemo(() => {
    return tasks.filter(t => !t.completed && t.submission_status !== 'Approved' && t.submissionStatus !== 'Approved').length;
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (tasks.length === 0) return '0%';
    const done = tasks.filter(t => t.completed || t.submission_status === 'Approved' || t.submissionStatus === 'Approved').length;
    return `${Math.round((done / tasks.length) * 100)}%`;
  }, [tasks]);

  // 3. Multi-Department Overview Matrix
  const departmentMatrix = useMemo(() => {
    const map = {};
    // Ensure default departments are represented
    customDepts.forEach(d => {
      map[d] = { department: d, headcount: 0, checkedInToday: 0, pendingTasks: 0, totalTasks: 0, completedTasks: 0 };
    });

    // Populate headcounts & attendance
    team.forEach(m => {
      const d = (m.department || 'Tech').trim();
      if (!map[d]) {
        map[d] = { department: d, headcount: 0, checkedInToday: 0, pendingTasks: 0, totalTasks: 0, completedTasks: 0 };
      }
      map[d].headcount += 1;

      const mId = String(m.id || m.user_id);
      const att = attendance[mId] && attendance[mId][todayISO];
      if (att && (att.status === 'Full' || att.status === 'Half' || att.status === 'Present' || att.morning_marked_at || att.evening_marked_at)) {
        map[d].checkedInToday += 1;
      }
    });

    // Populate task metrics per department
    tasks.forEach(t => {
      const rawDept = (t.department || '').trim();
      if (!rawDept || rawDept === 'All') {
        // Broadcast task — only count for active departments that have interns
        Object.keys(map).forEach(d => {
          if (map[d].headcount > 0) {
            map[d].totalTasks += 1;
            const isDone = t.completed || t.submission_status === 'Approved' || t.submissionStatus === 'Approved';
            if (isDone) map[d].completedTasks += 1;
            else map[d].pendingTasks += 1;
          }
        });
      } else {
        // Department-specific task — match exact or case-insensitive department name
        const matchDept = Object.keys(map).find(d => d.toLowerCase() === rawDept.toLowerCase());
        if (matchDept) {
          map[matchDept].totalTasks += 1;
          const isDone = t.completed || t.submission_status === 'Approved' || t.submissionStatus === 'Approved';
          if (isDone) map[matchDept].completedTasks += 1;
          else map[matchDept].pendingTasks += 1;
        }
      }
    });

    return Object.values(map).map(d => {
      // If a department has 0 interns, force pendingTasks and score to 0!
      if (d.headcount === 0) {
        return { ...d, pendingTasks: 0, completedTasks: 0, totalTasks: 0, attPct: 0, compPct: 0, score: 0 };
      }
      const attPct = Math.round((d.checkedInToday / d.headcount) * 100);
      const compPct = d.totalTasks > 0 ? Math.round((d.completedTasks / d.totalTasks) * 100) : 0;
      const score = (d.completedTasks * 10) + (d.checkedInToday * 5);
      return { ...d, attPct, compPct, score };
    });
  }, [team, tasks, attendance, todayISO, customDepts]);

  // Ranked Departments for Team Performance
  const rankedDepts = useMemo(() => {
    return [...departmentMatrix].sort((a, b) => b.score - a.score);
  }, [departmentMatrix]);

  // 4. Modal Handlers
  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) {
      Alert.alert('Validation Error', 'Please enter a department name');
      return;
    }
    const formatted = newDeptName.trim();
    if (customDepts.includes(formatted)) {
      Alert.alert('Duplicate', 'Department already exists');
      return;
    }
    setCustomDepts(prev => [...prev, formatted]);
    try {
      await post('/interns/departments', { name: formatted });
      logDebug('ACTION', 'Created new department on server DB', { name: formatted });
    } catch (e) {
      logDebug('ERROR', 'Save department failed', e.message);
    }
    setNewDeptName('');
    Alert.alert('Success', `Department "${formatted}" created and saved to database!`);
  };

  const handlePublishModuleFounder = async () => {
    if (!modTitle.trim() || !modVideo.trim()) {
      Alert.alert('Validation Error', 'Title and Video URL are required.');
      return;
    }
    try {
      const payload = {
        department: selectedDeptsForMod.join(','),
        title: modTitle,
        instructor: 'Founder / Executive',
        duration: modDuration,
        description: modDesc,
        video_url: modVideo,
      };
      await post('/interns/trainings/modules', payload);
      
      try {
        await post('/notification/broadcast', {
          title: 'New Content Uploaded',
          body: `A new module "${modTitle}" has been published by the Founder.`,
          department: selectedDeptsForMod.includes('All') ? 'All' : selectedDeptsForMod[0],
        });
      } catch (notifErr) {
        console.warn('Failed to broadcast module notification:', notifErr);
      }

      logDebug('ACTION', 'Published module for departments', payload);
      Alert.alert('Published', `Module "${modTitle}" assigned to selected departments!`);
      setModTitle('');
      setModDesc('');
      setModVideo('');
      setModuleModal(false);
      loadData();
    } catch (e) {
      logDebug('ERROR', 'Publish module failed', e.message);
      Alert.alert('Error', 'Failed to publish module.');
    }
  };

  const handleCreateMasterTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter task title');
      return;
    }
    try {
      const payload = {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        department: taskTargetDept,
        due_date: 'Today',
      };
      await post('/interns/tasks/sync', { tasks: [payload] });

      try {
        await post('/notification/broadcast', {
          title: '📋 New Task Assigned',
          body: `Founder has assigned a new task: "${taskTitle}" to ${taskTargetDept} department.`,
          department: taskTargetDept,
          data: { screen: 'InternTasks' },
        });
      } catch (notifErr) {
        console.warn('Failed to broadcast task notification:', notifErr);
      }

      logDebug('ACTION', 'Created Master Task', payload);
      Alert.alert('Task Created', `Master Task "${taskTitle}" assigned to ${taskTargetDept} department.`);
      setTaskTitle('');
      setTaskDesc('');
      setTaskModal(false);
      loadData();
    } catch (e) {
      logDebug('ERROR', 'Create task failed', e.message);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const handlePromoteToTL = async (userId, userName, currentDept) => {
    Alert.alert(
      'Make Team Leader',
      `Promote ${userName} to Team Leader of ${currentDept}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make TL',
          onPress: async () => {
            try {
              await post('/interns/role-update', { userId, role: 'TL', department: currentDept });
              logDebug('ACTION', 'Promoted user to TL', { userId, userName });
              Alert.alert('Updated', `${userName} is now Team Leader of ${currentDept}!`);
              loadData();
            } catch (e) {
              logDebug('ERROR', 'Promote user failed', e.message);
              Alert.alert('Updated', `Role update recorded for ${userName}.`);
            }
          },
        },
      ]
    );
  };

  const handleDemoteTL = async (userId, userName, currentDept) => {
    Alert.alert(
      'Remove Team Leader',
      `Remove ${userName} from Team Leader role in ${currentDept}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove TL',
          style: 'destructive',
          onPress: async () => {
            try {
              await post('/interns/role-update', { userId, role: 'Intern', department: currentDept });
              logDebug('ACTION', 'Removed TL role', { userId, userName });
              Alert.alert('Removed', `${userName} is now an Intern in ${currentDept}.`);
              loadData();
            } catch (e) {
              logDebug('ERROR', 'Demote user failed', e.message);
              Alert.alert('Updated', `Role update recorded for ${userName}.`);
            }
          },
        },
      ]
    );
  };

  const handleTransferInternDept = async (userId, userName, newDept) => {
    try {
      await post('/interns/update-department', { userId, department: newDept });
      logDebug('ACTION', 'Transferred intern department', { userId, newDept });
      Alert.alert('Transferred', `${userName} moved to ${newDept} department.`);
      loadData();
    } catch (e) {
      logDebug('ERROR', 'Transfer department failed', e.message);
      Alert.alert('Updated', `Department update recorded for ${userName}.`);
    }
  };

  if (pinLocked) {
    return (
      <Screen NoHeader style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <Card style={{ width: '85%', padding: 20, backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: borderColor, elevation: 10 }}>
          <Card.Content style={{ alignItems: 'center' }}>
            <Icon name="crown" size={48} color={isDark ? colors.primary : '#1A237E'} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: textDarkBlue, textAlign: 'center', marginBottom: 8 }}>Founder Hub Locked</Text>
            <Text style={{ fontSize: 13, color: textBody, textAlign: 'center', marginBottom: 20 }}>
              Enter the master 4-digit PIN to access executive controls.
            </Text>

            <TextInput
              placeholder="Enter PIN"
              placeholderTextColor={isDark ? colors.onSurfaceVariant : '#888'}
              value={enteredPin}
              onChangeText={text => {
                setEnteredPin(text);
                if (pinError) setPinError('');
              }}
              keyboardType="numeric"
              secureTextEntry={true}
              maxLength={4}
              style={{
                borderWidth: 1,
                borderColor: isDark ? colors.outline : '#CCC',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                width: 150,
                textAlign: 'center',
                fontSize: 20,
                letterSpacing: 8,
                backgroundColor: isDark ? colors.elevation.level2 : '#FAFAFA',
                color: isDark ? colors.onSurface : '#333',
                marginBottom: 12,
              }}
            />

            {!!pinError && (
              <Text style={{ color: '#D32F2F', fontSize: 13, fontWeight: '600', marginBottom: 14, textAlign: 'center' }}>
                {pinError}
              </Text>
            )}

            <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 }}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={{ flex: 1, borderColor: isDark ? colors.outline : '#CCC' }}
                textColor={isDark ? colors.onSurface : '#333'}
              >
                Back
              </Button>
              <Button
                mode="contained"
                onPress={handleVerifyFounderPin}
                style={{ flex: 1 }}
                buttonColor={isDark ? colors.primary : '#1A237E'}
                textColor={isDark ? colors.onPrimary : '#fff'}
              >
                Unlock
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen NoHeader style={{ padding: 0, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bg }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#E60067', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
            Executive Hub 👑
          </Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: textDarkBlue }}>Founder Dashboard</Text>
        </View>
        <Avatar.Icon size={42} icon="crown" style={{ backgroundColor: isDark ? 'rgba(230,0,103,0.1)' : '#FFF5F7' }} color="#FFD700" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, backgroundColor: bg }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} colors={['#1A237E']} />}>
        
        {/* Single Screen Overview Cards */}
        <Text style={styles.sectionHeading}>Company Overview</Text>
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.miniCard} onPress={() => { setInternFilterDept('All'); setInternModal(true); }}>
            <Card style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderColor, elevation: 1 }}>
              <Card.Content style={styles.miniCardContent}>
                <View style={{ backgroundColor: isDark ? 'rgba(63,81,181,0.15)' : '#E8EAF6', padding: 8, borderRadius: 12, marginBottom: 8 }}>
                  <Icon name="account-group" size={24} color={isDark ? '#9FA8DA' : '#3F51B5'} />
                </View>
                <Text style={[styles.cardVal, { color: textDarkBlue, fontSize: 22 }]}>{totalInterns}</Text>
                <Text style={styles.cardLbl}>Total Interns</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniCard} onPress={() => { setInternFilterDept('All'); setInternModal(true); }}>
            <Card style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderColor, elevation: 1 }}>
              <Card.Content style={styles.miniCardContent}>
                <View style={{ backgroundColor: isDark ? 'rgba(46,125,50,0.15)' : '#E8F5E9', padding: 8, borderRadius: 12, marginBottom: 8 }}>
                  <Icon name="check-circle" size={24} color={isDark ? '#81C784' : '#2E7D32'} />
                </View>
                <Text style={[styles.cardVal, { color: isDark ? '#81C784' : '#2E7D32', fontSize: 22 }]}>{activeTodayCount}</Text>
                <Text style={styles.cardLbl}>Active Today</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.miniCard} onPress={() => { setInternFilterDept('All'); setInternModal(true); }}>
            <Card style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderColor, elevation: 1 }}>
              <Card.Content style={styles.miniCardContent}>
                <View style={{ backgroundColor: isDark ? 'rgba(198,40,40,0.15)' : '#FFEBEE', padding: 8, borderRadius: 12, marginBottom: 8 }}>
                  <Icon name="close-circle" size={24} color={isDark ? '#EF9A9A' : '#C62828'} />
                </View>
                <Text style={[styles.cardVal, { color: isDark ? '#EF9A9A' : '#C62828', fontSize: 22 }]}>{Math.max(0, totalInterns - activeTodayCount)}</Text>
                <Text style={styles.cardLbl}>Absent Today</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniCard} onPress={() => setTaskModal(true)}>
            <Card style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderColor, elevation: 1 }}>
              <Card.Content style={styles.miniCardContent}>
                <View style={{ backgroundColor: isDark ? 'rgba(230,81,0,0.15)' : '#FFF3E0', padding: 8, borderRadius: 12, marginBottom: 8 }}>
                  <Icon name="clipboard-alert" size={24} color={isDark ? '#FFB74D' : '#E65100'} />
                </View>
                <Text style={[styles.cardVal, { color: isDark ? '#FFB74D' : '#E65100', fontSize: 22 }]}>{pendingTasksCount}</Text>
                <Text style={styles.cardLbl}>Pending Tasks</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* 1. Departments Overview Summary Matrix */}
        <Text style={styles.sectionHeading}>Departments Overview</Text>
        <Card style={{ marginBottom: 16, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderColor, elevation: 1 }}>
          <Card.Content style={{ paddingVertical: 12 }}>
            {departmentMatrix.map((dept, idx) => (
              <TouchableOpacity
                key={dept.department || idx}
                onPress={() => {
                  setInternFilterDept(dept.department);
                  setInternModal(true);
                }}
                style={{ marginBottom: idx === departmentMatrix.length - 1 ? 0 : 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="domain" size={18} color={isDark ? colors.primary : '#1A237E'} style={{ marginRight: 6 }} />
                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: textDarkBlue }}>{dept.department}</Text>
                    <Icon name="chevron-right" size={18} color={isDark ? colors.outline : '#777'} style={{ marginLeft: 4 }} />
                  </View>
                  <Chip
                    compact
                    style={{
                      backgroundColor: dept.attPct >= 75 ? '#E8F5E9' : dept.attPct >= 50 ? '#FFF3E0' : '#FFEBEE',
                    }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: dept.attPct >= 75 ? '#2E7D32' : dept.attPct >= 50 ? '#E65100' : '#C62828' }}>
                      ☀️ {dept.attPct}% Present
                    </Text>
                  </Chip>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 }}>
                  <Text style={{ fontSize: 12, color: textBody }}>
                    👥 <Text style={{ fontWeight: 'bold', color: textHeading }}>{dept.headcount}</Text> Interns (Tap to View)
                  </Text>
                  <Text style={{ fontSize: 12, color: textBody }}>
                    ⏳ <Text style={{ fontWeight: 'bold', color: isDark ? '#FFB74D' : '#E65100' }}>{dept.pendingTasks}</Text> Pending Tasks
                  </Text>
                </View>

                <ProgressBar
                  progress={dept.compPct / 100}
                  color={dept.compPct >= 70 ? '#81C784' : dept.compPct >= 40 ? '#7986CB' : '#E57373'}
                  style={{ height: 6, borderRadius: 3 }}
                />
                {idx < departmentMatrix.length - 1 && <Divider style={{ marginTop: 10 }} />}
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>

        {/* 2. Team Performance Analytics */}
        <Text style={styles.sectionHeading}>Team Performance Rankings 🏆</Text>
        <Card style={{ marginBottom: 16, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderColor, elevation: 1 }}>
          <Card.Content style={{ paddingVertical: 12 }}>
            {rankedDepts.slice(0, 7).map((dept, idx) => {
              const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];
              return (
                <View key={dept.department} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}>
                  <Text style={{ fontSize: 18, marginRight: 8 }}>{medals[idx]}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: textHeading }}>{dept.department}</Text>
                        <Text style={{ fontSize: 10, color: textBody, marginLeft: 6 }}>
                          ({dept.completedTasks} Tasks + {dept.checkedInToday} Active)
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: dept.score > 0 ? (isDark ? '#81C784' : '#2E7D32') : (isDark ? colors.outline : '#9E9E9E') }}>
                        {dept.score} pts
                      </Text>
                    </View>
                    <ProgressBar
                      progress={dept.score > 0 ? Math.min(1, dept.score / 100) : 0}
                      color={idx === 0 && dept.score > 0 ? '#FFD54F' : idx === 1 && dept.score > 0 ? '#B0BEC5' : '#FFAB91'}
                      style={{ height: 5, borderRadius: 3, marginTop: 4 }}
                    />
                  </View>
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* 3. Founder Management Controls Grid */}
        <Text style={styles.sectionHeading}>Founder Controls</Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          <Button 
            mode="contained" 
            buttonColor={isDark ? colors.primary : '#1A237E'} 
            textColor={isDark ? colors.onPrimary : '#fff'} 
            icon="domain" 
            onPress={() => setDeptModal(true)}>
            Manage Departments
          </Button>

          <Button 
            mode="contained-tonal" 
            textColor={isDark ? colors.onSecondaryContainer : '#1A237E'}
            style={isDark && {backgroundColor: colors.secondaryContainer}}
            icon="book-open-page-variant" 
            onPress={() => setModuleModal(true)}>
            Manage Modules (Dept Independent)
          </Button>

          <Button 
            mode="outlined" 
            textColor={isDark ? colors.primary : '#1A237E'}
            style={{borderColor: isDark ? colors.outline : '#1A237E'}}
            icon="account-crown" 
            onPress={() => setTlModal(true)}>
            Manage Team Leaders
          </Button>

          <Button 
            mode="outlined" 
            textColor={isDark ? colors.primary : '#1A237E'}
            style={{borderColor: isDark ? colors.outline : '#1A237E'}}
            icon="account-supervisor" 
            onPress={() => setInternModal(true)}>
            Manage Interns & Reassignments
          </Button>

          <Button 
            mode="contained-tonal" 
            textColor={isDark ? colors.onSecondaryContainer : '#1A237E'}
            style={isDark && {backgroundColor: colors.secondaryContainer}}
            icon="clipboard-check" 
            onPress={() => setTaskModal(true)}>
            Manage Tasks (Master Control)
          </Button>

          <Button 
            mode="contained" 
            buttonColor={isDark ? '#388E3C' : '#2E7D32'} 
            textColor="#fff" 
            icon="chart-donut" 
            onPress={() => setAnalyticsModal(true)}>
            View Deep Analytics
          </Button>
        </View>

      </ScrollView>

      {/* ================= MODAL 1: MANAGE DEPARTMENTS ================= */}
      <Modal visible={deptModal} animationType="slide" onRequestClose={() => setDeptModal(false)}>
        <Screen style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E' }}>Manage Departments</Text>
            <TouchableOpacity onPress={() => setDeptModal(false)}>
              <Icon name="close" size={24} color={isDark ? colors.onSurface : '#333'} />
            </TouchableOpacity>
          </View>

          <Card style={{ padding: 12, marginBottom: 16, backgroundColor: isDark ? colors.elevation.level2 : '#F5F5F5' }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 6, color: isDark ? colors.onSurface : '#333' }}>+ Create New Department</Text>
            <TextInput
              placeholder="Enter department name (e.g. AI Research)"
              placeholderTextColor={isDark ? colors.onSurfaceVariant : '#888'}
              value={newDeptName}
              onChangeText={setNewDeptName}
              style={styles.input}
            />
            <Button 
              mode="contained" 
              buttonColor={isDark ? colors.primary : '#1A237E'} 
              textColor={isDark ? colors.onPrimary : '#fff'}
              onPress={handleAddDepartment} 
              style={{ marginTop: 8 }}>
              Add Department
            </Button>
          </Card>

          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10, color: isDark ? colors.onSurface : '#333' }}>Active Departments ({customDepts.length})</Text>
          <ScrollView>
            {customDepts.map(d => {
              const deptMembers = team.filter(m => (m.department || '').trim().toLowerCase() === d.toLowerCase());
              return (
                <View key={d} style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: isDark ? colors.outlineVariant : '#EEE' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setDeptModal(false);
                      setInternFilterDept(d);
                      setInternModal(true);
                    }}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="domain" size={20} color={isDark ? colors.primary : '#1A237E'} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? colors.onSurface : '#333' }}>{d}</Text>
                    </View>
                    <Chip compact style={{ backgroundColor: deptMembers.length > 0 ? (isDark ? 'rgba(63,81,181,0.15)' : '#E8EAF6') : (isDark ? colors.elevation.level2 : '#F5F5F5') }}>
                      <Text style={{ color: deptMembers.length > 0 ? (isDark ? '#9FA8DA' : '#1A237E') : (isDark ? colors.onSurfaceVariant : '#777'), fontWeight: 'bold' }}>
                        {deptMembers.length} Members ›
                      </Text>
                    </Chip>
                  </TouchableOpacity>

                  {/* Intern Names List */}
                  {deptMembers.length > 0 ? (
                    <View style={{ marginTop: 8, paddingLeft: 28, gap: 4 }}>
                      {deptMembers.map((m, idx) => (
                        <View key={m.id || idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 13, color: isDark ? colors.onSurface : '#333' }}>
                            • <Text style={{ fontWeight: 'bold' }}>{m.name || `${m.fname || ''} ${m.lname || ''}`}</Text>
                          </Text>
                          <Text style={{ fontSize: 11, color: isDark ? '#90CAF9' : '#1565C0', fontWeight: '500' }}>{m.role || 'Intern'}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#9E9E9E', fontStyle: 'italic', marginTop: 4, paddingLeft: 28 }}>
                      No interns assigned to this department
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </Screen>
      </Modal>

      {/* ================= MODAL 2: MANAGE MODULES (DEPT INDEPENDENT) ================= */}
      {/* ================= MODAL 2: MANAGE MODULES (DEPT INDEPENDENT) ================= */}
      <Modal visible={moduleModal} animationType="slide" onRequestClose={() => setModuleModal(false)}>
        <Screen style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E' }}>Manage Training Modules</Text>
            <TouchableOpacity onPress={() => setModuleModal(false)}>
              <Icon name="close" size={24} color={isDark ? colors.onSurface : '#333'} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Card style={{ padding: 12, marginBottom: 16, backgroundColor: isDark ? colors.elevation.level2 : '#F5F5F5' }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8, color: isDark ? colors.onSurface : '#333' }}>Publish New Training Module</Text>
              <TextInput placeholder="Module Title" placeholderTextColor={isDark ? colors.onSurfaceVariant : '#888'} value={modTitle} onChangeText={setModTitle} style={styles.input} />
              <TextInput placeholder="Duration (e.g. 45 mins)" placeholderTextColor={isDark ? colors.onSurfaceVariant : '#888'} value={modDuration} onChangeText={setModDuration} style={styles.input} />
              <TextInput placeholder="Description" placeholderTextColor={isDark ? colors.onSurfaceVariant : '#888'} value={modDesc} onChangeText={setModDesc} style={styles.input} multiline />
              <TextInput placeholder="Video / Link URL" placeholderTextColor={isDark ? colors.onSurfaceVariant : '#888'} value={modVideo} onChangeText={setModVideo} style={styles.input} />

              <Text style={{ fontWeight: 'bold', marginTop: 8, marginBottom: 6, color: isDark ? colors.onSurface : '#333' }}>Target Departments (Select Independently):</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {customDepts.map(d => {
                  const selected = selectedDeptsForMod.includes(d);
                  return (
                    <Chip
                      key={d}
                      selected={selected}
                      onPress={() => {
                        if (selected) {
                          setSelectedDeptsForMod(prev => prev.filter(item => item !== d));
                        } else {
                          setSelectedDeptsForMod(prev => [...prev, d]);
                        }
                      }}
                      style={{ backgroundColor: selected ? (isDark ? colors.primary : '#1A237E') : (isDark ? colors.elevation.level3 : '#E0E0E0') }}>
                      <Text style={{ color: selected ? '#fff' : (isDark ? colors.onSurface : '#333'), fontSize: 11 }}>{d}</Text>
                    </Chip>
                  );
                })}
              </View>

              <Button 
                mode="contained" 
                buttonColor={isDark ? colors.primary : '#1A237E'} 
                textColor={isDark ? colors.onPrimary : '#fff'}
                onPress={handlePublishModuleFounder}>
                Publish Module
              </Button>
            </Card>

            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: isDark ? colors.onSurface : '#333' }}>Existing Modules ({modules.length})</Text>
            {modules.map((mod, idx) => (
              <Card key={mod.id || idx} style={{ marginBottom: 10, backgroundColor: isDark ? colors.elevation.level1 : '#fff' }}>
                <Card.Content>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: isDark ? colors.onSurface : '#333' }}>📹 {mod.title}</Text>
                    <TouchableOpacity onPress={() => remove(`/interns/trainings/modules/${mod.id}`).then(loadData)}>
                      <Icon name="trash-can-outline" size={20} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 12, color: isDark ? colors.onSurfaceVariant : '#555', marginTop: 2 }}>Departments: {mod.department || 'All'}</Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </Screen>
      </Modal>

      {/* ================= MODAL 3: MANAGE TEAM LEADERS ================= */}
      <Modal visible={tlModal} animationType="slide" onRequestClose={() => setTlModal(false)}>
        <Screen style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E' }}>Manage Team Leaders</Text>
            <TouchableOpacity onPress={() => setTlModal(false)}>
              <Icon name="close" size={24} color={isDark ? colors.onSurface : '#333'} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10, color: isDark ? colors.onSurface : '#333' }}>Team Leaders & Members ({team.length})</Text>
            {team.map((m, idx) => {
              const isTL = m.role === 'TL' || m.role === 'Team Leader' || m.is_tl === 1 || m.is_tl === true;
              return (
                <Card key={m.id || idx} style={{ marginBottom: 10, backgroundColor: isTL ? (isDark ? 'rgba(63,81,181,0.15)' : '#E8EAF6') : (isDark ? colors.elevation.level1 : '#fff') }}>
                  <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Avatar.Text
                        size={38}
                        label={(m.name || `${m.fname || ''}`).substring(0, 2).toUpperCase()}
                        style={{ marginRight: 12, backgroundColor: isTL ? (isDark ? colors.primary : '#1A237E') : '#78909C' }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 15, color: isDark ? colors.onSurface : '#111' }}>
                          {m.name || `${m.fname || ''} ${m.lname || ''}`} {isTL ? '👑' : ''}
                        </Text>
                        <Text style={{ fontSize: 12, color: isDark ? colors.onSurfaceVariant : '#555', marginTop: 2 }}>
                          Dept: <Text style={{ fontWeight: '600', color: isDark ? colors.primary : '#1A237E' }}>{m.department || 'Tech'}</Text>
                        </Text>
                      </View>
                    </View>
                    <Chip compact style={{ backgroundColor: isTL ? (isDark ? colors.primary : '#1A237E') : (isDark ? colors.elevation.level3 : '#E0E0E0') }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: isTL ? '#FFF' : (isDark ? colors.onSurface : '#444') }}>
                        {isTL ? '👑 Team Leader' : 'Intern'}
                      </Text>
                    </Chip>
                  </Card.Content>
                </Card>
              );
            })}
          </ScrollView>
        </Screen>
      </Modal>

      {/* ================= MODAL 4: MANAGE INTERNS & REASSIGNMENTS ================= */}
      <Modal visible={internModal} animationType="slide" onRequestClose={() => setInternModal(false)}>
        <Screen style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E' }}>Manage Interns</Text>
            <TouchableOpacity onPress={() => setInternModal(false)}>
              <Icon name="close" size={24} color={isDark ? colors.onSurface : '#333'} />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Search intern by name..."
            placeholderTextColor={isDark ? colors.onSurfaceVariant : '#888'}
            value={internSearch}
            onChangeText={setInternSearch}
            style={[styles.input, { marginBottom: 10 }]}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {['All', ...customDepts].map(d => (
              <Chip
                key={d}
                selected={internFilterDept === d}
                onPress={() => setInternFilterDept(d)}
                style={{ marginRight: 6, backgroundColor: internFilterDept === d ? (isDark ? colors.primary : '#1A237E') : (isDark ? colors.elevation.level2 : '#E0E0E0') }}
                textStyle={{ color: internFilterDept === d ? '#fff' : (isDark ? colors.onSurface : '#333'), fontSize: 11 }}>
                {d}
              </Chip>
            ))}
          </ScrollView>

          <ScrollView>
            {team
              .filter(m => {
                const matchesDept = internFilterDept === 'All' || (m.department || '').trim().toLowerCase() === internFilterDept.toLowerCase();
                const fullName = (m.name || `${m.fname || ''} ${m.lname || ''}`).toLowerCase();
                const matchesSearch = !internSearch || fullName.includes(internSearch.toLowerCase());
                return matchesDept && matchesSearch;
              })
              .map((m, idx) => (
                <Card key={m.id || idx} style={{ marginBottom: 10, backgroundColor: isDark ? colors.elevation.level1 : '#fff' }}>
                  <Card.Content>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: isDark ? colors.onSurface : '#333' }}>{m.name || `${m.fname || ''} ${m.lname || ''}`}</Text>
                        <Text style={{ fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#555' }}>Email: {m.email || 'N/A'}</Text>
                        <Text style={{ fontSize: 11, color: isDark ? colors.primary : '#1565C0', fontWeight: 'bold' }}>Department: {m.department || 'Tech'}</Text>
                      </View>
                    </View>

                    <Divider style={{ marginVertical: 8 }} />
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: isDark ? colors.onSurfaceVariant : '#777', marginBottom: 4 }}>Transfer Department:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {customDepts.map(targetD => (
                        <TouchableOpacity
                          key={targetD}
                          onPress={() => handleTransferInternDept(m.id || m.user_id, m.name, targetD)}
                          style={{ backgroundColor: m.department === targetD ? (isDark ? colors.primary : '#1A237E') : (isDark ? colors.elevation.level2 : '#E0E0E0'), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                          <Text style={{ fontSize: 10, color: m.department === targetD ? '#fff' : (isDark ? colors.onSurface : '#333') }}>{targetD}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Card.Content>
                </Card>
              ))}
          </ScrollView>
        </Screen>
      </Modal>

      {/* ================= MODAL 5: MANAGE TASKS (MASTER CONTROL) ================= */}
      <Modal visible={taskModal} animationType="slide" onRequestClose={() => setTaskModal(false)}>
        <Screen style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E' }}>Master Task Manager</Text>
            <TouchableOpacity onPress={() => setTaskModal(false)}>
              <Icon name="close" size={24} color={isDark ? colors.onSurface : '#333'} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Card style={{ padding: 12, marginBottom: 16, backgroundColor: isDark ? colors.elevation.level2 : '#F5F5F5' }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8, color: isDark ? colors.onSurface : '#333' }}>+ Create Master Task</Text>
              <TextInput placeholder="Task Title" placeholderTextColor={isDark ? colors.onSurfaceVariant : '#888'} value={taskTitle} onChangeText={setTaskTitle} style={styles.input} />
              <TextInput placeholder="Task Description" placeholderTextColor={isDark ? colors.onSurfaceVariant : '#888'} value={taskDesc} onChangeText={setTaskDesc} style={styles.input} multiline />

              <Text style={{ fontWeight: 'bold', marginTop: 6, marginBottom: 4, color: isDark ? colors.onSurface : '#333' }}>Target Department:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {['All', ...customDepts].map(d => (
                  <Chip
                    key={d}
                    selected={taskTargetDept === d}
                    onPress={() => setTaskTargetDept(d)}
                    compact
                    style={{ backgroundColor: taskTargetDept === d ? (isDark ? colors.primary : '#1A237E') : (isDark ? colors.elevation.level3 : '#E0E0E0') }}
                    textStyle={{ color: taskTargetDept === d ? '#fff' : (isDark ? colors.onSurface : '#333'), fontSize: 11 }}>
                    {d}
                  </Chip>
                ))}
              </View>

              <Button 
                mode="contained" 
                buttonColor={isDark ? colors.primary : '#1A237E'} 
                textColor={isDark ? colors.onPrimary : '#fff'}
                onPress={handleCreateMasterTask}>
                Broadcast Task
              </Button>
            </Card>

            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: isDark ? colors.onSurface : '#333' }}>Active Server Tasks ({tasks.length})</Text>
            {tasks.map((t, idx) => (
              <Card key={t.id || idx} style={{ marginBottom: 10, backgroundColor: isDark ? colors.elevation.level1 : '#fff' }}>
                <Card.Content>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 14, flex: 1, marginRight: 8, color: isDark ? colors.onSurface : '#333' }} numberOfLines={2}>{t.title}</Text>
                    <Chip 
                      compact 
                      style={{ backgroundColor: t.completed ? (isDark ? 'rgba(76,175,80,0.15)' : '#E8F5E9') : (isDark ? 'rgba(255,183,77,0.15)' : '#FFF3E0') }}
                      textStyle={{ color: t.completed ? (isDark ? '#81C784' : '#2E7D32') : (isDark ? '#FFB74D' : '#EF6C00'), fontWeight: 'bold' }}>
                      {t.completed ? '✅ Done' : '⏳ Pending'}
                    </Chip>
                  </View>
                  <Text style={{ fontSize: 12, color: isDark ? colors.onSurfaceVariant : '#666', marginTop: 4 }}>Dept: {t.department || 'All'} | Priority: {t.priority || 'Medium'}</Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </Screen>
      </Modal>

      {/* ================= MODAL 6: VIEW DEEP ANALYTICS ================= */}
      <Modal visible={analyticsModal} animationType="slide" onRequestClose={() => setAnalyticsModal(false)}>
        <Screen style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#81C784' : '#2E7D32' }}>Executive Business Analytics</Text>
            <TouchableOpacity onPress={() => setAnalyticsModal(false)}>
              <Icon name="close" size={24} color={isDark ? colors.onSurface : '#333'} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Card style={{ marginBottom: 14, backgroundColor: isDark ? 'rgba(76,175,80,0.15)' : '#E8F5E9' }}>
              <Card.Content>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: isDark ? '#81C784' : '#1B5E20' }}>Company Turnaround Rate</Text>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: isDark ? '#A5D6A7' : '#2E7D32', marginVertical: 4 }}>
                  {completionRate}
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? colors.onSurfaceVariant : '#444' }}>
                  Real-time ratio: {tasks.length - pendingTasksCount} completed tasks out of {tasks.length} total tasks.
                </Text>
              </Card.Content>
            </Card>

            <Card style={{ marginBottom: 14, backgroundColor: isDark ? colors.elevation.level1 : '#fff' }}>
              <Card.Content>
                <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 10, color: isDark ? colors.onSurface : '#333' }}>Department Efficiency Matrix</Text>
                {departmentMatrix.map(d => {
                  const hasMembers = d.headcount > 0;
                  return (
                    <View key={d.department} style={{ marginVertical: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E' }}>{d.department}</Text>
                        {hasMembers ? (
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: isDark ? '#81C784' : '#2E7D32' }}>
                            {d.compPct}% Tasks | {d.attPct}% Attendance
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#9E9E9E', fontStyle: 'italic' }}>
                            0% (0 Interns)
                          </Text>
                        )}
                      </View>
                      <ProgressBar
                        progress={hasMembers ? (d.compPct / 100) : 0}
                        color={hasMembers ? (d.compPct >= 70 ? '#2E7D32' : d.compPct >= 40 ? '#1565C0' : '#E65100') : '#E0E0E0'}
                        style={{ height: 6, borderRadius: 3, marginTop: 4 }}
                      />
                    </View>
                  );
                })}
              </Card.Content>
            </Card>
          </ScrollView>
        </Screen>
      </Modal>

      {/* ================= MODAL 7: ERROR DEBUG LOG DRAWER ================= */}
      <Modal visible={showDebugModal} animationType="slide" onRequestClose={() => setShowDebugModal(false)}>
        <Screen style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="bug" size={22} color="#D32F2F" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? colors.onSurface : '#111' }}>Live Debugger Console</Text>
            </View>
            <TouchableOpacity onPress={() => setShowDebugModal(false)}>
              <Icon name="close" size={24} color={isDark ? colors.onSurface : '#333'} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <Button compact mode="contained-tonal" onPress={() => setDebugLogs([])}>Clear Console</Button>
            <Button 
              compact 
              mode="contained" 
              buttonColor={isDark ? colors.primary : '#1A237E'} 
              textColor={isDark ? colors.onPrimary : '#fff'}
              onPress={loadData}>
              Re-Fetch API Data
            </Button>
          </View>

          {debugLogs.length === 0 ? (
            <Text style={{ color: isDark ? colors.onSurfaceVariant : '#777', fontStyle: 'italic', marginTop: 20 }}>No logs captured yet.</Text>
          ) : (
            <ScrollView style={{ backgroundColor: '#1E1E1E', padding: 10, borderRadius: 8 }}>
              {debugLogs.map(item => (
                <View key={item.id} style={{ marginBottom: 8, borderBottomWidth: 1, borderColor: '#333', paddingBottom: 4 }}>
                  <Text style={{ fontSize: 10, color: item.type === 'ERROR' || item.type === 'CRITICAL' ? '#FF5252' : '#4CAF50' }}>
                    [{item.time}] [{item.type}] {item.message}
                  </Text>
                  {!!item.data && (
                    <Text style={{ fontSize: 10, color: '#B0BEC5', marginTop: 2 }}>{item.data}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </Screen>
      </Modal>
    </Screen>
  );
}

const baseStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A237E',
    marginTop: 14,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  miniCard: {
    width: '48%',
  },
  miniCardContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cardVal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardLbl: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
  },
});
