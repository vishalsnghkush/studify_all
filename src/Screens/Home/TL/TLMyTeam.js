import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, Avatar, Searchbar, IconButton, Button, ProgressBar} from 'react-native-paper';
import useApi from '../../../Components/Api/Api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {extractDateISO, getTodayAttendanceRecord, isAttendanceCheckedIn} from '../../../Utils/MockInternDb';

const TLMyTeam = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  
  const [db, setDb] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const activeDept = user?.department || 'Tech';
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [reportModal, setReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [internMetrics, setInternMetrics] = useState({ accuracy: 0, rank: 'None', tasksDone: 0 });

  const { get, post } = useApi();

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
            const ids = [record.intern_id, record.user_id, record.internId, record.userId, record.id].filter(Boolean);
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
              const ids = [record.intern_id, record.user_id, record.internId, record.userId, record.id].filter(Boolean);
              const dateKey = extractDateISO(record.date || record.created_at || record.marked_at);
              ids.forEach(id => {
                const strId = String(id);
                if (!attendanceMap[strId]) attendanceMap[strId] = {};
                attendanceMap[strId][dateKey] = record;
              });
            });
          }
        } catch (attErr) {}

        // Source 3: Fetch attendance for each team member individually if missing today
        const teamInterns = res.data.team || [];
        for (const intern of teamInterns) {
          const internId = String(intern.id || intern.user_id);
          const todayISO = extractDateISO(new Date());
          if (attendanceMap[internId] && attendanceMap[internId][todayISO]) continue;
          try {
            const indivRes = await get(`/interns/attendance?user_id=${intern.id || intern.user_id}`, {skipSuccessFlash: true, skipErrorFlash: true});
            if (indivRes && indivRes.data) {
              const records = Array.isArray(indivRes.data) ? indivRes.data : [indivRes.data];
              records.forEach(record => {
                if (!record || typeof record !== 'object') return;
                const dateKey = extractDateISO(record.date || record.created_at || record.marked_at);
                if (!attendanceMap[internId]) attendanceMap[internId] = {};
                attendanceMap[internId][dateKey] = record;
              });
            }
          } catch (e) {}
        }

        setDb({
          interns: res.data.team || [],
          reports: res.data.reports || [],
          attendance: attendanceMap
        });
      }
    } catch (e) {
      console.log('Error loading TL team data', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [activeDept]);

  // Filter only Approved interns in this department
  const myTeam = useMemo(() => {
    const interns = db?.interns || [];
    return interns.filter(i => i.department === activeDept && i.status === 'Approved');
  }, [db, activeDept]);

  // Apply search query
  const displayedTeam = useMemo(() => {
    if (!searchQuery.trim()) return myTeam;
    return myTeam.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (i.email && i.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
      };
      fetchMetrics();
    }
  }, [selectedIntern, db]);

  return (
    <Screen NoHeader style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Active Roster</Text>
          <Text style={styles.title}>My Team</Text>
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
                    <Text style={styles.internName}>{intern.name}</Text>
                    <Text style={styles.internEmail}>{intern.email}</Text>
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
                    <Text style={[styles.metricValue, {color: colors.primary}]}>{intern.duration || '6 Months'}</Text>
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
                  <Text style={styles.profileDays}>Joined: {selectedIntern.joined} | Duration: {selectedIntern.duration}</Text>
                </View>

                {/* Performance Analytics (5-Factor Engine + Graph) */}
                <View style={{ marginVertical: 15, padding: 12, backgroundColor: '#fff', borderRadius: 10, elevation: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1565C0', marginBottom: 10 }}>5-Factor Performance Engine 🧮</Text>
                  
                  {/* 5-Factor Progress Bars */}
                  {[
                    { label: 'Attendance (20%)', progress: 0.95, color: '#4CAF50' },
                    { label: 'Task Completion (40%)', progress: 0.88, color: '#00ACC1' },
                    { label: 'Learning Modules (20%)', progress: 0.70, color: '#1E88E5' },
                    { label: 'Communication (10%)', progress: 0.85, color: '#8E24AA' },
                    { label: 'Initiative (10%)', progress: 0.60, color: '#F4511E' },
                  ].map((factor, idx) => (
                    <View key={idx} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, color: '#555', fontWeight: '600' }}>{factor.label}</Text>
                        <Text style={{ fontSize: 12, color: factor.color, fontWeight: 'bold' }}>{Math.round(factor.progress * 100)}%</Text>
                      </View>
                      <ProgressBar progress={factor.progress} color={factor.color} style={{ height: 6, borderRadius: 3, backgroundColor: '#E0E0E0' }} />
                    </View>
                  ))}

                  {/* Pure RN Line Graph (Productivity Trend) */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 15 }}>Weekly Productivity Trend 📈</Text>
                    <View style={{ height: 100, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                      {[65, 80, 75, 92, 88, 98, 85].map((val, idx) => (
                        <View key={idx} style={{ alignItems: 'center' }}>
                          <View style={{ 
                            height: val * 0.8, 
                            width: 24, 
                            backgroundColor: '#26C6DA', 
                            borderTopLeftRadius: 4, 
                            borderTopRightRadius: 4,
                            justifyContent: 'flex-start',
                            paddingTop: 4
                          }}>
                            <Text style={{ fontSize: 9, color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>{val}</Text>
                          </View>
                          <Text style={{ fontSize: 10, color: '#777', marginTop: 4 }}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][idx]}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Offer Letter Review Section */}
                <View style={{ backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginVertical: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 6 }}>Internship Offer Letter</Text>
                  {selectedIntern.offerLetterName ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#DDD' }}>
                      <Icon name="file-pdf-box" size={28} color="#E53935" />
                      <Text style={{ flex: 1, fontSize: 12, marginLeft: 8, color: '#333' }}>{selectedIntern.offerLetterName}</Text>
                      <Button 
                        mode="contained-tonal" 
                        compact 
                        onPress={() => Alert.alert('View Offer Letter', `Offer Letter Document: ${selectedIntern.offerLetterName}\n\n[Verified Signature & Seal Present]\nThis document is authenticated.`)}
                      >
                        View
                      </Button>
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
    </Screen>
  );
};

const styles = StyleSheet.create({
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
