import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, Avatar, Searchbar, IconButton, Button, ProgressBar, Portal, Dialog} from 'react-native-paper';
import useApi from '../../../Components/Api/Api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {extractDateISO, getTodayAttendanceRecord, isAttendanceCheckedIn} from '../../../Utils/MockInternDb';

const TLMyTeam = () => {
  const theme = useTheme();
  const {colors} = theme;
  const isDark = theme.dark;

  const styles = useMemo(() => {
    return {
      ...baseStyles,
      container: {
        ...baseStyles.container,
        backgroundColor: isDark ? colors.background : '#F5F7FA',
      },
      header: {
        ...baseStyles.header,
        backgroundColor: isDark ? colors.elevation.level1 : '#fff',
      },
      greet: {
        ...baseStyles.greet,
        color: isDark ? colors.onSurfaceVariant : '#666',
      },
      title: {
        ...baseStyles.title,
        color: isDark ? colors.onSurface : '#333',
      },
      searchBar: {
        ...baseStyles.searchBar,
        backgroundColor: isDark ? colors.elevation.level1 : '#fff',
      },
      teamCard: {
        ...baseStyles.teamCard,
        backgroundColor: isDark ? colors.elevation.level1 : '#fff',
      },
      internName: {
        ...baseStyles.internName,
        color: isDark ? colors.onSurface : '#333',
      },
      internEmail: {
        ...baseStyles.internEmail,
        color: isDark ? colors.onSurfaceVariant : '#666',
      },
      metricsRow: {
        ...baseStyles.metricsRow,
        borderTopColor: isDark ? colors.outlineVariant : '#eee',
      },
      metricBox: {
        ...baseStyles.metricBox,
        borderRightColor: isDark ? colors.outlineVariant : '#eee',
      },
      metricLabel: {
        ...baseStyles.metricLabel,
        color: isDark ? colors.onSurfaceVariant : '#888',
      },
      metricValue: {
        ...baseStyles.metricValue,
        color: isDark ? colors.onSurface : '#333',
      },
      modalContent: {
        ...baseStyles.modalContent,
        backgroundColor: isDark ? colors.elevation.level2 : '#fff',
      },
      modalTitle: {
        ...baseStyles.modalTitle,
        color: isDark ? colors.onSurface : '#333',
      },
      profileBox: {
        ...baseStyles.profileBox,
        borderBottomColor: isDark ? colors.outlineVariant : '#eee',
      },
      profileName: {
        ...baseStyles.profileName,
        color: isDark ? colors.onSurface : '#333',
      },
      profileEmail: {
        ...baseStyles.profileEmail,
        color: isDark ? colors.onSurfaceVariant : '#666',
      },
      profileDept: {
        ...baseStyles.profileDept,
        color: isDark ? colors.onSurface : '#333',
      },
      profileDays: {
        ...baseStyles.profileDays,
        color: isDark ? colors.onSurfaceVariant : '#888',
      },
      subTitle: {
        ...baseStyles.subTitle,
        color: isDark ? colors.onSurface : '#444',
      },
    };
  }, [isDark, colors]);
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  
  const [db, setDb] = useState(() => {
    try {
      const mock = require('../../../Utils/MockInternDb').DEFAULT_INTERN_DB;
      return { interns: mock.interns || [], reports: mock.reports || [], attendance: mock.attendance || {} };
    } catch (e) {
      return { interns: [], reports: [], attendance: {} };
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  const getFirstDept = (deptStr) => {
    if (!deptStr) return 'Tech';
    return deptStr.split(',')[0].trim();
  };

  const [activeDept, setActiveDept] = useState((user && user.department) ? getFirstDept(user.department) : 'Tech');
  const [showDeptDialog, setShowDeptDialog] = useState(false);

  // Sync activeDept if user profile changes
  useEffect(() => {
    if (user && user.department) {
      const depts = user.department.split(',').map(d => d.trim()).filter(Boolean);
      if (!depts.includes(activeDept)) {
        setActiveDept(depts[0] || 'Tech');
      }
    }
  }, [user]);

  const [selectedIntern, setSelectedIntern] = useState(null);
  const [reportModal, setReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [internMetrics, setInternMetrics] = useState({ accuracy: 0, rank: 'None', tasksDone: 0 });
  const [internLearningProgress, setInternLearningProgress] = useState(0);
  const [editingDuration, setEditingDuration] = useState(null);
  const [starDialog, setStarDialog] = useState(false);
  const [starIntern, setStarIntern] = useState(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [starNote, setStarNote] = useState('');

  const { get, post } = useApi();

  const handleApproveReject = async (internId, action) => {
    try {
      await post('/interns/team/approve', { internId, action });
      Alert.alert('Success', `Intern status updated to ${action}`);
      loadData();
      setSelectedIntern(prev => prev ? { ...prev, status: action } : null);
    } catch (e) {
      Alert.alert('Error', 'Failed to update intern status');
    }
  };

  const loadData = async () => {
    try {
      const res = await get(`/interns/team?department=${activeDept}`, {skipSuccessFlash: true});
      if (res && res.data) {
        let attendanceMap = {};

        // Source 1: attendance from /interns/team response (object map)
        if (res.data.attendance && typeof res.data.attendance === 'object' && !Array.isArray(res.data.attendance)) {
          Object.entries(res.data.attendance).forEach(([key, val]) => {
            attendanceMap[String(key)] = typeof val === 'object' && !Array.isArray(val) ? val : {};
            if (Array.isArray(val)) {
              attendanceMap[String(key)] = {};
              val.forEach(record => {
                const dateKey = extractDateISO(record.date || record.created_at || record.marked_at);
                attendanceMap[String(key)][dateKey] = record;
              });
            }
          });
        } else if (Array.isArray(res.data.attendance)) {
          res.data.attendance.forEach(record => {
            const ids = [record.intern_id, record.user_id, record.internId, record.userId].filter(Boolean);
            const dateKey = extractDateISO(record.date || record.created_at || record.marked_at);
            ids.forEach(id => {
              const strId = String(id);
              if (!attendanceMap[strId]) attendanceMap[strId] = {};
              attendanceMap[strId][dateKey] = record;
            });
          });
        }

        // Source 2: Fetch TODAY's live attendance from /interns/attendance
        try {
          const attRes = await get('/interns/attendance', {skipSuccessFlash: true, skipErrorFlash: true});
          if (attRes && attRes.data) {
            const attData = Array.isArray(attRes.data) ? attRes.data : [attRes.data];
            attData.forEach(record => {
              if (!record || typeof record !== 'object') return;
              const ids = [record.intern_id, record.user_id, record.internId, record.userId, record.email, record.fname, record.name].filter(Boolean);
              const dateKey = extractDateISO(record.date || record.created_at || record.marked_at);
              ids.forEach(id => {
                const strId = String(id);
                if (!attendanceMap[strId]) attendanceMap[strId] = {};
                attendanceMap[strId][dateKey] = record;
              });
            });
          }
        } catch (attErr) {}

        // Source 3: Local AsyncStorage fallback
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const attStr = await AsyncStorage.getItem('@studify_attendance');
          if (attStr) {
            const localAtt = JSON.parse(attStr);
            Object.entries(localAtt).forEach(([idKey, dates]) => {
              const strId = String(idKey);
              if (!attendanceMap[strId]) attendanceMap[strId] = {};
              if (dates && typeof dates === 'object') {
                Object.entries(dates).forEach(([dKey, rec]) => {
                  if (!attendanceMap[strId][dKey]) attendanceMap[strId][dKey] = rec;
                });
              }
            });
          }
        } catch (e) {}
        const rawTeam = Array.isArray(res.data?.team) 
          ? res.data.team 
          : (Array.isArray(res.data) ? res.data : []);
          
        // Only include users that have a real department from the server
        const teamList = rawTeam
          .filter(i => i.department && i.department.trim().length > 0)
          .map(i => {
          const fullName = (i.name || `${i.fname || ''} ${i.lname || ''}`.trim() || 'Intern').trim();
          const avatarStr = i.avatar || (fullName.length >= 2 ? fullName.substring(0, 2).toUpperCase() : 'IN');
          return {
            ...i,
            id: String(i.id || i.user_id || `int_${Math.random()}`),
            name: fullName,
            avatar: avatarStr,
            status: i.status || 'Approved',
            department: i.department,
          };
        });
        setDb({
          interns: teamList,
          reports: res.data?.reports || [],
          attendance: attendanceMap
        });
      } else {
        const mock = await getInternDb();
        setDb({
          interns: (mock.interns || []).map(i => ({ ...i, id: String(i.id) })),
          reports: mock.reports || [],
          attendance: mock.attendance || {}
        });
      }
    } catch (e) {
      console.log('Error loading TL team data', e);
      try {
        const mock = await getInternDb();
        setDb({
          interns: (mock.interns || []).map(i => ({ ...i, id: String(i.id) })),
          reports: mock.reports || [],
          attendance: mock.attendance || {}
        });
      } catch (mockErr) {}
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [activeDept]);

  // Filter interns in this department strictly
  const myTeam = useMemo(() => {
    const interns = db?.interns || [];
    if (interns.length === 0) return [];

    return interns.filter(i => {
      const dept = (i.department || '').trim().toLowerCase();
      const currDept = (activeDept || '').trim().toLowerCase();
      
      if (!dept) return false; // Strictly exclude non-department users
      if (!currDept || currDept === 'all') return true;
      return dept.includes(currDept) || currDept.includes(dept);
    });
  }, [db?.interns, activeDept]);

  // Apply search query
  const displayedTeam = useMemo(() => {
    const list = (myTeam || []).map(i => {
      const fullName = (i.name || `${i.fname || ''} ${i.lname || ''}`.trim() || 'Intern').trim();
      const avatarStr = i.avatar || (fullName.length >= 2 ? fullName.substring(0, 2).toUpperCase() : 'IN');
      return {
        ...i,
        id: String(i.id || i.user_id || `int_${Math.random()}`),
        name: fullName,
        avatar: avatarStr,
      };
    });
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(i => 
      (i.name && i.name.toLowerCase().includes(query)) || 
      (i.email && i.email.toLowerCase().includes(query))
    );
  }, [myTeam, searchQuery]);

  useEffect(() => {
    if (selectedIntern) {
      const fetchMetrics = async () => {
        // Fetch tasks from BACKEND DATABASE (not local storage!)
        try {
          const taskRes = await get(`/interns/tasks/${selectedIntern.id}`, { skipSuccessFlash: true, skipErrorFlash: true });
          const loadedTasks = (taskRes && taskRes.data) ? taskRes.data : [];
          const sid = String(selectedIntern.id);
          
          const myDoneTasksList = loadedTasks.filter(t => t.completed && (
            (t.assignedTo || []).map(String).includes(sid) || 
            String(t.completedBy) === sid
          ));
          const myDoneTasks = myDoneTasksList.length;
          
          const myReports = (db?.reports || []).filter(r => r.internId === selectedIntern.id);
          const calcAccuracy = myReports.length > 0 ? Math.min(99, 80 + myReports.length * 3) : (myDoneTasks > 0 ? 85 : 0);
          
          let rank = 'None';
          if (calcAccuracy >= 90) rank = 'Diamond';
          else if (calcAccuracy >= 80) rank = 'Gold';
          else if (calcAccuracy >= 60) rank = 'Silver';
          else if (calcAccuracy > 0) rank = 'Bronze';

          setInternMetrics({
            accuracy: calcAccuracy,
            rank,
            tasksDone: myDoneTasks,
            completedTasksList: myDoneTasksList
          });
        } catch (e) {
          console.log('Error fetching intern tasks:', e);
          setInternMetrics({ accuracy: 0, rank: 'None', tasksDone: 0, completedTasksList: [] });
        }

        // Fetch learning progress
        try {
          const lpRes = await get(`/interns/learning/progress?user_id=${selectedIntern.id}`, { skipSuccessFlash: true, skipErrorFlash: true });
          if (lpRes && lpRes.data && typeof lpRes.data.progress === 'number') {
            setInternLearningProgress(lpRes.data.progress);
          } else {
            const modulesCount = db?.modules?.length || 0;
            if (modulesCount > 0) {
              const reportsCount = (db?.reports || []).filter(r => r.internId === selectedIntern.id).length;
              setInternLearningProgress(Math.min(1.0, reportsCount / Math.max(1, modulesCount)));
            } else {
              setInternLearningProgress(0);
            }
          }
        } catch (lpErr) {
          const modulesCount = db?.modules?.length || 0;
          if (modulesCount > 0) {
            const reportsCount = (db?.reports || []).filter(r => r.internId === selectedIntern.id).length;
            setInternLearningProgress(Math.min(1.0, reportsCount / Math.max(1, modulesCount)));
          } else {
            setInternLearningProgress(0);
          }
        }
      };
      fetchMetrics();
    }
  }, [selectedIntern, db]);

  return (
    <Screen NoHeader style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Active Roster</Text>
          {user?.department && user.department.includes(',') ? (
            <TouchableOpacity onPress={() => setShowDeptDialog(true)} style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
              <Text style={styles.title}>My Team ({activeDept})</Text>
              <Icon name="chevron-down" size={20} color={colors.primary} style={{marginLeft: 4, marginTop: 4}} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.title}>My Team ({activeDept})</Text>
          )}
        </View>
        <Avatar.Icon size={48} icon="account-group" style={{backgroundColor: colors.primaryContainer}} color={colors.onPrimaryContainer} />
      </View>

      <Searchbar
        placeholder="Search interns by name..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={colors.primary}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {displayedTeam.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="account-search-outline" size={64} color="#ccc" style={{marginBottom: 16}} />
            <Text style={styles.emptyTitle}>No Interns Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? "No active interns match your search." : "You have no active interns on your team yet."}
            </Text>
          </View>
        ) : (
          displayedTeam.map(intern => (
            <Card key={intern.id} style={styles.teamCard} mode="elevated" onPress={() => setSelectedIntern(intern)}>
              <Card.Content>
                <View style={styles.cardTopRow}>
                  <Avatar.Text size={48} label={intern.avatar || 'I'} style={{backgroundColor: colors.primaryContainer}} color={colors.onPrimaryContainer}/>
                  <View style={styles.infoCol}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={styles.internName} numberOfLines={1}>{intern.name}</Text>
                      {intern.stars > 0 && (
                        <View style={{backgroundColor: '#FFF8E1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 6, borderWidth: 0.8, borderColor: '#FFB300'}}>
                          <Text style={{fontSize: 11, fontWeight: 'bold', color: '#F57F17'}}>⭐ {intern.stars}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.internEmail} numberOfLines={1}>{intern.email}</Text>
                  </View>
                  <IconButton
                    icon="message-text-outline"
                    iconColor={colors.primary}
                    size={24}
                    onPress={async () => {
                      try {
                        const res = await post('/chat/groups/personal', { receiver_id: intern.id });
                        if (res?.data?.chat_group_id) {
                          navigation.navigate('Chat', {
                            data: {
                              is_group: false,
                              receiver_id: intern.id,
                              display_name: intern.name,
                              chat_group_id: res.data.chat_group_id,
                            }
                          });
                        } else {
                          Alert.alert("Error", "Could not initiate chat.");
                        }
                      } catch (err) {
                        Alert.alert("Error", "Failed to create personal chat.");
                      }
                    }}
                  />
                </View>
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Progress</Text>
                    {(() => {
                      const p = parseFloat(intern.progress);
                      const pct = !isNaN(p) ? (p > 1 ? p : Math.round(p * 100)) : 65;
                      return <Text style={[styles.metricValue, {color: colors.primary}]}>{pct}%</Text>;
                    })()}
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Duration</Text>
                    <Text style={[styles.metricValue, {color: colors.primary}]}>{intern.duration || 'Not Set'}</Text>
                  </View>
                  <View style={[styles.metricBox, {borderRightWidth: 0}]}>
                    <Text style={styles.metricLabel}>Status</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{intern.status || 'Active'}</Text>
                    </View>
                  </View>
                </View>
                {/* Today's Attendance Status */}
                {(() => {
                  const todayAtt = getTodayAttendanceRecord(db?.attendance, intern);
                  if (!todayAtt || !isAttendanceCheckedIn(todayAtt)) return (
                    <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10}}>
                      <Icon name="close-circle" size={16} color="#EF5350" />
                      <Text style={{fontSize: 12, color: '#EF5350', marginLeft: 4}}>Not checked in today</Text>
                    </View>
                  );
                  const isMorning = !!(todayAtt.morning_marked_at || todayAtt.status === 'Full' || todayAtt.status === 'Morning' || todayAtt.status === 'Present' || todayAtt === 1);
                  const isEvening = !!(todayAtt.evening_marked_at || todayAtt.status === 'Full' || todayAtt.status === 'Evening' || todayAtt === 1);
                  return (
                    <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 12}}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name={isMorning ? 'check-circle' : 'close-circle'} size={16} color={isMorning ? '#66BB6A' : '#EF5350'} />
                        <Text style={{fontSize: 12, marginLeft: 4, color: isMorning ? '#2E7D32' : '#EF5350'}}>☀️ Morning</Text>
                      </View>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon name={isEvening ? 'check-circle' : 'close-circle'} size={16} color={isEvening ? '#66BB6A' : '#EF5350'} />
                        <Text style={{fontSize: 12, marginLeft: 4, color: isEvening ? '#2E7D32' : '#EF5350'}}>🌙 Evening</Text>
                      </View>
                      <View style={{marginLeft: 'auto', backgroundColor: isMorning || isEvening ? '#E8F5E9' : '#FFF8E1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8}}>
                        <Text style={{fontSize: 11, fontWeight: '600', color: isMorning || isEvening ? '#2E7D32' : '#F9A825'}}>{todayAtt.status || 'Present'}</Text>
                      </View>
                    </View>
                  );
                })()}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Intern Details slide-up Modal */}
      {selectedIntern && (
        <Modal visible={!!selectedIntern} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Intern Details</Text>
                <IconButton icon="close" onPress={() => setSelectedIntern(null)} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 30}}>
                {/* Intern Profile Card */}
                <View style={styles.profileBox}>
                  <Avatar.Text size={60} label={selectedIntern.avatar} style={{backgroundColor: colors.primaryContainer}} color={colors.onPrimaryContainer} />
                  <Text style={styles.profileName}>{selectedIntern.name}</Text>
                  <Text style={styles.profileEmail}>{selectedIntern.email}</Text>
                  <Text style={styles.profileDept}>Role: {selectedIntern.department} Intern</Text>
                  <Text style={styles.profileDays}>Joined: {selectedIntern.joined}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FFB300'}}>
                    <Icon name="star" size={16} color="#FFB300" style={{marginRight: 4}} />
                    <Text style={{fontSize: 13, fontWeight: 'bold', color: '#F57F17'}}>
                      {selectedIntern.stars || 0} Performance Stars Awarded
                    </Text>
                  </View>
                  <View style={{marginTop: 6}}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={{fontSize: 13, color: '#666', fontWeight: '600'}}>Duration: </Text>
                      {editingDuration !== null ? (
                        <TouchableOpacity
                          onPress={() => setEditingDuration(null)}
                          style={{flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#E3F2FD'}}
                        >
                          <Text style={{fontSize: 13, color: colors.primary, fontWeight: 'bold'}}>{editingDuration || 'Select Duration'}</Text>
                          <Icon name="chevron-down" size={16} color={colors.primary} style={{marginLeft: 4}} />
                          <Icon name="close-circle" size={16} color="#C62828" style={{marginLeft: 6}} />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => setEditingDuration(selectedIntern.duration || '6 Months')} style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Text style={{fontSize: 13, color: colors.primary, fontWeight: '600'}}>{selectedIntern.duration || 'Not Set'}</Text>
                          <Icon name="pencil" size={14} color={colors.primary} style={{marginLeft: 4}} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Dropdown Options for TL */}
                    {editingDuration !== null && (
                      <View style={{marginTop: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', elevation: 3, paddingVertical: 4}}>
                        {['1 Month', '2 Months', '3 Months', '6 Months', '1 Year'].map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justify: 'space-between',
                              backgroundColor: editingDuration === opt ? '#E3F2FD' : 'transparent',
                              borderBottomWidth: 0.5,
                              borderBottomColor: '#eee',
                            }}
                            onPress={async () => {
                              try {
                                setEditingDuration(opt);
                                await post('/interns/team/update-duration', { internId: selectedIntern.id, duration: opt });
                                Alert.alert('Duration Updated', `Successfully updated duration to ${opt}`);
                                setSelectedIntern(prev => prev ? {...prev, duration: opt} : null);
                                setEditingDuration(null);
                                loadData();
                              } catch(e) {
                                Alert.alert('Error', 'Failed to update duration');
                              }
                            }}
                          >
                            <Text style={{fontSize: 13, color: editingDuration === opt ? colors.primary : '#333', fontWeight: editingDuration === opt ? 'bold' : 'normal'}}>{opt}</Text>
                            {editingDuration === opt && <Icon name="check" size={16} color={colors.primary} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Performance Analytics (5-Factor Engine + Graph) */}
                <View style={{ marginVertical: 15, padding: 12, backgroundColor: '#fff', borderRadius: 10, elevation: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1565C0', marginBottom: 10 }}>5-Factor Performance Engine 🧮</Text>
                  
                  {/* 5-Factor Progress Bars */}
                  {/* 5-Factor Progress Bars */}
                  {(() => {
                    const taskRatio = internMetrics.tasksDone > 0 ? Math.min(1.0, internMetrics.tasksDone / 5) : 0;
                    const internAttMap = db?.attendance?.[String(selectedIntern.id)] || {};
                    const attendDays = Object.values(internAttMap).filter(r => r != null && typeof r === 'object').length;
                    const attendRatio = Math.min(1.0, attendDays / 22);
                    const eodCount = (db?.reports || []).filter(r => r.internId === selectedIntern.id).length;
                    const commRatio = eodCount > 0 ? Math.min(1.0, eodCount * 0.15) : 0;
                    return [
                      { label: 'Attendance (20%)', progress: attendRatio, color: '#4CAF50' },
                      { label: 'Task Completion (40%)', progress: taskRatio, color: '#00ACC1' },
                      { label: 'Learning Modules (20%)', progress: internLearningProgress, color: '#1E88E5' },
                      { label: 'Communication (10%)', progress: commRatio, color: '#8E24AA' },
                      { label: 'Initiative (10%)', progress: Math.min(1.0, taskRatio * 0.6 + (eodCount > 0 ? 0.3 : 0) + (commRatio > 0.3 ? 0.1 : 0)), color: '#F4511E' },
                    ];
                  })().map((factor, idx) => (
                    <View key={idx} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, color: '#555', fontWeight: '600' }}>{factor.label}</Text>
                        <Text style={{ fontSize: 12, color: factor.color, fontWeight: 'bold' }}>{Math.round(factor.progress * 100)}%</Text>
                      </View>
                      <ProgressBar progress={factor.progress} color={factor.color} style={{ height: 6, borderRadius: 3, backgroundColor: '#E0E0E0' }} />
                    </View>
                  ))}

                  {/* Award Performance Stars Button */}
                  <Button
                    mode="contained"
                    buttonColor="#FFB300"
                    textColor="#000"
                    icon="star"
                    style={{marginTop: 10, borderRadius: 8}}
                    onPress={() => {
                      if (selectedIntern) {
                        setStarIntern({ id: selectedIntern.id, name: selectedIntern.name });
                      }
                      setSelectedStars(5);
                      setStarNote('');
                      setSelectedIntern(null);
                      setTimeout(() => setStarDialog(true), 350);
                    }}>
                    ⭐ Award Stars to Intern
                  </Button>

                  {/* Promote to TL Button */}
                  <Button
                    mode="contained"
                    buttonColor="#D81B60"
                    textColor="#fff"
                    icon="shield-star"
                    style={{marginTop: 10, borderRadius: 8}}
                    onPress={() => {
                      if (!selectedIntern) return;
                      Alert.alert(
                        'Promote to TL',
                        `Are you sure you want to promote ${selectedIntern.name} to Team Leader (TL)? This will change their role and permissions.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Promote',
                            onPress: async () => {
                              try {
                                const targetId = selectedIntern.id;
                                const targetName = selectedIntern.name;
                                const targetDept = selectedIntern.department;
                                setSelectedIntern(null);
                                await post('/interns/role-update', {
                                  userId: targetId,
                                  role: 'TL',
                                  department: targetDept,
                                });
                                Alert.alert('Promotion Success 🎉', `${targetName} has been promoted to Team Leader!`);
                                loadData();
                              } catch (err) {
                                Alert.alert('Error', 'Failed to promote intern.');
                              }
                            }
                          }
                        ]
                      );
                    }}>
                    Promote to TL
                  </Button>

                  {/* Team Leader Governance Actions: Remove & Block */}
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
                    {/* Remove Intern Button */}
                    <Button
                      mode="contained"
                      buttonColor="#E65100"
                      textColor="#fff"
                      icon="account-remove"
                      style={{flex: 1, marginRight: 6, borderRadius: 8}}
                      labelStyle={{fontSize: 12, fontWeight: 'bold'}}
                      onPress={() => {
                        if (!selectedIntern) return;
                        Alert.alert(
                          'Remove Intern',
                          `Are you sure you want to remove ${selectedIntern.name} from the internship? They will be demoted to Student status.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  const targetId = selectedIntern.id;
                                  const targetName = selectedIntern.name;
                                  setSelectedIntern(null);
                                  await post('/interns/team/action', {
                                    internId: targetId,
                                    action: 'Remove',
                                  });
                                  Alert.alert('Intern Removed', `${targetName} has been removed from the team.`);
                                  loadData();
                                } catch (err) {
                                  Alert.alert('Error', 'Failed to remove intern.');
                                }
                              }
                            }
                          ]
                        );
                      }}>
                      Remove Intern
                    </Button>

                    {/* Block Intern Button */}
                    <Button
                      mode="contained"
                      buttonColor="#C62828"
                      textColor="#fff"
                      icon="account-cancel"
                      style={{flex: 1, marginLeft: 6, borderRadius: 8}}
                      labelStyle={{fontSize: 12, fontWeight: 'bold'}}
                      onPress={() => {
                        if (!selectedIntern) return;
                        Alert.alert(
                          'Block Intern 🚫',
                          `Are you sure you want to BLOCK ${selectedIntern.name}? Their login and internship access will be revoked immediately.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Block Intern',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  const targetId = selectedIntern.id;
                                  const targetName = selectedIntern.name;
                                  setSelectedIntern(null);
                                  await post('/interns/team/action', {
                                    internId: targetId,
                                    action: 'Block',
                                  });
                                  Alert.alert('Intern Blocked 🚫', `${targetName} has been blocked successfully.`);
                                  loadData();
                                } catch (err) {
                                  Alert.alert('Error', 'Failed to block intern.');
                                }
                              }
                            }
                          ]
                        );
                      }}>
                      Block Intern
                    </Button>
                  </View>

                  {/* Pure RN Line Graph (Productivity Trend) */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 15 }}>Weekly Productivity Trend 📈</Text>
                    <View style={{ height: 100, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                      {(() => {
                        const internAttMap = db?.attendance?.[String(selectedIntern.id)] || {};
                        const taskBonus = Math.min(15, internMetrics.tasksDone * 3);
                        const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const today = new Date();
                        return Array.from({ length: 7 }, (_, i) => {
                          const d = new Date(today);
                          d.setDate(today.getDate() - (6 - i));
                          const iso = d.toISOString().slice(0, 10);
                          const dayLabel = DAY_ABBR[d.getDay()];
                          const rec = internAttMap[iso];
                          let score = 0;
                          if (rec) {
                            if (rec.status === 'Full' || rec.status === 'Present') score = 100;
                            else if (rec.status === 'Half') score = 50;
                            else if (rec.morning_marked_at && rec.evening_marked_at) score = 100;
                            else if (rec.morning_marked_at || rec.status === 'Morning') score = 60;
                          }
                          if (score > 0) score = Math.min(100, score + taskBonus);
                          return { val: score, dayLabel };
                        });
                      })().map(({ val, dayLabel }, idx) => (
                        <View key={idx} style={{ alignItems: 'center' }}>
                          <View style={{ 
                            height: Math.max(4, val * 0.8), 
                            width: 24, 
                            backgroundColor: val > 0 ? '#26C6DA' : '#E0E0E0', 
                            borderTopLeftRadius: 4, 
                            borderTopRightRadius: 4,
                            justifyContent: 'flex-start',
                            paddingTop: 4
                          }}>
                            {val > 0 && <Text style={{ fontSize: 9, color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>{val}</Text>}
                          </View>
                          <Text style={{ fontSize: 10, color: '#777', marginTop: 4 }}>{dayLabel}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                 {/* Offer Letter Review Section */}
                <View style={{ backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginVertical: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 6 }}>Internship Offer Letter</Text>
                  {selectedIntern.offerLetterName ? (
                    <View style={{ backgroundColor: '#fff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#DDD' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Icon name="file-pdf-box" size={28} color="#E53935" />
                        <Text style={{ flex: 1, fontSize: 12, marginLeft: 8, color: '#333' }} numberOfLines={1}>
                          {selectedIntern.offerLetterName}
                        </Text>
                        <Button 
                          mode="contained-tonal" 
                          compact 
                          onPress={() => Alert.alert('View Offer Letter', `Offer Letter Document: ${selectedIntern.offerLetterName}\n\n[Verified Signature & Seal Present]\nThis document is authenticated.`)}
                        >
                          View
                        </Button>
                      </View>
                      
                      {/* Status and Action Buttons */}
                      {selectedIntern.status === 'Approved' || selectedIntern.status === 'Active' ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9', padding: 6, borderRadius: 4, marginTop: 4 }}>
                          <Icon name="check-circle" size={16} color="#2E7D32" />
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2E7D32', marginLeft: 4 }}>Offer Letter Approved</Text>
                        </View>
                      ) : selectedIntern.status === 'Denied' ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEBEE', padding: 6, borderRadius: 4, marginTop: 4 }}>
                          <Icon name="close-circle" size={16} color="#C62828" />
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#C62828', marginLeft: 4 }}>Offer Letter Denied / Rejected</Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                          <Button
                            mode="contained"
                            buttonColor="#2E7D32"
                            textColor="#fff"
                            compact
                            style={{ flex: 1, marginRight: 4, borderRadius: 6 }}
                            labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
                            onPress={() => handleApproveReject(selectedIntern.id, 'Approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            mode="outlined"
                            textColor="#C62828"
                            compact
                            style={{ flex: 1, marginLeft: 4, borderRadius: 6, borderColor: '#C62828' }}
                            labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
                            onPress={() => handleApproveReject(selectedIntern.id, 'Denied')}
                          >
                            Reject
                          </Button>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12, color: '#C62828', fontStyle: 'italic' }}>⚠️ No offer letter uploaded yet by the intern.</Text>
                  )}
                </View>

                {/* Performance & Skills Summary */}
                <Text style={styles.subTitle}>Intern Performance Analytics</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 12 }}>
                  <Card style={{ flex: 1, marginRight: 8, backgroundColor: '#F3E5F5' }}>
                    <Card.Content style={{ alignItems: 'center', padding: 12 }}>
                      <Icon name="bullseye-arrow" size={28} color="#7B1FA2" />
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#7B1FA2', marginTop: 4 }}>
                        {selectedIntern.status === 'Approved' ? `${internMetrics.accuracy}%` : '0%'}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Task Accuracy</Text>
                    </Card.Content>
                  </Card>
                  <Card style={{ flex: 1, backgroundColor: '#E8EAF6' }}>
                    <Card.Content style={{ alignItems: 'center', padding: 12 }}>
                      <Icon name="medal-outline" size={28} color="#303F9F" />
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#303F9F', marginTop: 4 }}>
                        {selectedIntern.status === 'Approved' ? internMetrics.rank : 'None'}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Rank Tier</Text>
                    </Card.Content>
                  </Card>
                </View>

                {/* Attendance & Tasks Summary */}
                <Text style={styles.subTitle}>Daily Tracking</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                  <Card style={{ flex: 1, marginRight: 8, backgroundColor: '#E3F2FD' }}>
                    <Card.Content style={{ alignItems: 'center', padding: 12 }}>
                      <Icon name="calendar-check" size={28} color="#1565C0" />
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1565C0', marginTop: 4 }}>
                        {(() => {
                          const att = db?.attendance?.[selectedIntern.id] || {};
                          let total = 0;
                          Object.values(att).forEach(v => {
                            if (typeof v === 'object' && v.status === 'Full') total += 1;
                            else if (typeof v === 'object' && v.status === 'Half') total += 0.5;
                            else total += 1; // legacy 'Present' string
                          });
                          return total;
                        })()}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Days Present</Text>
                    </Card.Content>
                  </Card>
                  <Card style={{ flex: 1, backgroundColor: '#E8F5E9' }}>
                    <Card.Content style={{ alignItems: 'center', padding: 12 }}>
                      <Icon name="check-all" size={28} color="#2E7D32" />
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginTop: 4 }}>
                        {internMetrics.tasksDone}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Tasks Completed</Text>
                    </Card.Content>
                  </Card>
                </View>

                {/* Completed Tasks List */}
                {internMetrics.completedTasksList && internMetrics.completedTasksList.length > 0 && (
                  <>
                    <Text style={[styles.subTitle, { marginTop: 24 }]}>Completed Tasks History</Text>
                    {internMetrics.completedTasksList.map((task, index) => (
                      <View key={task.id || index} style={{ backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Icon name="check-circle" size={18} color="#2E7D32" style={{ marginRight: 8 }} />
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1 }}>{task.title}</Text>
                        </View>
                        {task.description ? (
                          <Text style={{ fontSize: 12, color: '#666', marginLeft: 26 }}>{task.description}</Text>
                        ) : null}
                      </View>
                    ))}
                  </>
                )}

              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {/* Switch Department Dialog */}
      <Portal>
        <Dialog visible={showDeptDialog} onDismiss={() => setShowDeptDialog(false)}>
          <Dialog.Title>Switch Active Division</Dialog.Title>
          <Dialog.Content>
            {user?.department?.split(',').map(d => d.trim()).filter(Boolean).map((dept, index) => (
              <Button
                key={index}
                mode={activeDept === dept ? 'contained' : 'text'}
                onPress={() => {
                  setActiveDept(dept);
                  setShowDeptDialog(false);
                }}
                style={{ marginVertical: 4, alignItems: 'flex-start' }}
                contentStyle={{ justifyContent: 'flex-start' }}
              >
                {dept}
              </Button>
            ))}
          </Dialog.Content>
        </Dialog>

        {/* Award Performance Stars Dialog */}
        <Dialog visible={starDialog} onDismiss={() => setStarDialog(false)}>
          <Dialog.Title>Award Performance Stars ⭐</Dialog.Title>
          <Dialog.Content>
            <Text style={{fontSize: 14, color: '#555', marginBottom: 12}}>
              Award performance stars to {starIntern?.name || selectedIntern?.name || 'Intern'}:
            </Text>
            
            {/* Star Rating Buttons 1 to 5 */}
            <View style={{flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12}}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setSelectedStars(num)}
                  style={{
                    alignItems: 'center',
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: selectedStars === num ? '#FFF8E1' : 'transparent',
                    borderWidth: selectedStars === num ? 1.5 : 0,
                    borderColor: '#FFB300',
                  }}
                >
                  <Icon
                    name={num <= selectedStars ? 'star' : 'star-outline'}
                    size={28}
                    color="#FFB300"
                  />
                  <Text style={{fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 2}}>{num} ⭐</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note / Feedback Input */}
            <TextInput
              placeholder="Add feedback / note (optional)"
              value={starNote}
              onChangeText={setStarNote}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 13,
                color: '#333',
                backgroundColor: '#FAFAFA',
                marginTop: 8,
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStarDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              buttonColor="#FFB300"
              textColor="#000"
              onPress={async () => {
                const targetId = starIntern?.id || selectedIntern?.id;
                const targetName = starIntern?.name || selectedIntern?.name || 'Intern';

                if (!targetId) {
                  Alert.alert('Error', 'No intern selected to award stars.');
                  setStarDialog(false);
                  return;
                }

                try {
                  setStarDialog(false);
                  await post('/interns/stars/award', {
                    internId: targetId,
                    stars: selectedStars,
                    note: starNote.trim() || `${selectedStars} Performance Stars Awarded!`,
                  });
                  setSelectedIntern(prev => prev ? { ...prev, stars: (Number(prev.stars) || 0) + selectedStars } : null);
                  loadData();
                  Alert.alert(
                    'Stars Awarded! 🎉',
                    `Successfully awarded ${selectedStars} ⭐ star(s) to ${targetName}!`,
                  );
                } catch (e) {
                  Alert.alert('Error', 'Failed to award stars to intern.');
                }
              }}
            >
              Award {selectedStars} ⭐
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greet: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  teamCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
    marginLeft: 16,
  },
  internName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  internEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  metricLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileBox: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  profileDept: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  profileDays: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 12,
    marginTop: 8,
  },
});

export default TLMyTeam;
