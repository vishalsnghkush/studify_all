import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, Button, Portal, Dialog} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getInternDb, markInternPresent, addMockLeave} from '../../../Utils/MockInternDb';

const {width} = Dimensions.get('window');

const InternAttendance = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);

  // DB State
  const [db, setDb] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [internStatus, setInternStatus] = useState('Pending');

  // Leave Form state
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({startDate: '', endDate: '', type: 'Casual', reason: ''});

  const internId = user?.user_id || user?.email || 'guest';

  const loadData = async () => {
    const freshDb = await getInternDb();
    setDb(freshDb);
    const email = user?.email;
    const activeId = user?.user_id;
    // Match by user_id OR email (new interns registered by email)
    const baseAtt = (freshDb.attendance || {})[internId] || (freshDb.attendance || {})[email] || {};
    const myReports = (freshDb.reports || []).filter(
      r => r.internId === internId || (email && (r.internId === email)),
    );

    const mergedAtt = {...baseAtt};

    // Mark EOD-submitted days as Present (1)
    myReports.forEach(r => {
      if (r.date) {
        const parts = r.date.split('-');
        if (parts.length === 3) {
          const dayNum = parseInt(parts[2], 10);
          if (dayNum > 0 && dayNum <= 31) {
            mergedAtt[dayNum] = 1;
          }
        }
      }
    });

    // Auto-mark past working days with no status as Absent (3)
    const today = new Date();
    const isJuly2026 =
      today.getFullYear() === 2026 && today.getMonth() === 6;
    const lastDay = isJuly2026 ? today.getDate() - 1 : 31;
    for (let d = 1; d <= Math.min(lastDay, 31); d++) {
      const dayOfWeek = new Date(2026, 6, d).getDay();
      if (dayOfWeek === 0) continue; // Skip Sundays
      if (!mergedAtt[d]) {
        mergedAtt[d] = 3; // Absent
      }
    }

    setAttendanceData(mergedAtt);
    setLeaveRequests((freshDb.leaves || []).filter(
      l => l.internId === internId || (user?.email && l.internId === user.email)
    ));
    const myRecord = (freshDb.interns || []).find(
      i => i.id === internId || (user?.email && (i.email === user.email || i.id === user.email))
    );
    setInternStatus(myRecord?.status || 'Pending');
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);



  const submitLeave = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      return Alert.alert('Error', 'Please fill in all leave request fields.');
    }
    const newRequest = {
      id: Date.now().toString(),
      internId: internId,
      dates: `${leaveForm.startDate} - ${leaveForm.endDate}`,
      type: leaveForm.type + ' Leave',
      reason: leaveForm.reason,
      status: 'Pending',
    };
    await addMockLeave(newRequest);
    setLeaveForm({startDate: '', endDate: '', type: 'Casual', reason: ''});
    setLeaveModal(false);
    Alert.alert('Submitted', 'Leave request submitted to TL for approval.');
    loadData();
  };

  // Calendar Grid Renderer (July 2026)
  const renderCalendar = () => {
    const cells = [];
    for (let day = 1; day <= 31; day++) {
      const status = attendanceData[day] || 0; // 0 = unmarked, 1 = present, 2 = leave, 3 = absent
      const date = new Date(2026, 6, day);
      const isSun = date.getDay() === 0;
      
      const isDark = colors.background !== '#fff8fa';
      let bg = isDark ? colors.elevation.level2 : '#F5F5F5';
      let textCol = isDark ? colors.onSurface : '#333';
      
      if (isSun) {
        bg = isDark ? colors.elevation.level1 : '#ECEFF1';
        textCol = isDark ? colors.outline : '#90A4AE';
      } else if (status === 1) { 
        bg = isDark ? '#1B5E20' : '#E8F5E9'; textCol = isDark ? '#C8E6C9' : '#2E7D32'; 
      } else if (status === 2) { 
        bg = isDark ? '#E65100' : '#FFF3E0'; textCol = isDark ? '#FFE0B2' : '#EF6C00'; 
      } else if (status === 3) { 
        bg = isDark ? '#B71C1C' : '#FFEBEE'; textCol = isDark ? '#FFCDD2' : '#C62828'; 
      }

      cells.push(
        <View key={day} style={[styles.calCell, {backgroundColor: bg}]}>
          <Text style={[styles.calCellText, {color: textCol}]}>{day}</Text>
          {status !== 0 && !isSun && (
            <View
              style={[
                styles.dot,
                {backgroundColor: status === 1 ? '#4CAF50' : status === 2 ? '#FF9800' : '#F44336'}
              ]}
            />
          )}
        </View>
      );
    }
    return cells;
  };

  // Calculate metrics
  const presentDays = Object.keys(attendanceData).filter(dayStr => {
    const day = parseInt(dayStr, 10);
    const date = new Date(2026, 6, day);
    return attendanceData[day] === 1 && date.getDay() !== 0;
  }).length;

  const leavesTaken = leaveRequests.filter(l => l.status === 'Approved').length;

  // Calculate elapsed working days (excluding Sundays) in July 2026
  const today = new Date();
  const isJuly2026 = today.getFullYear() === 2026 && today.getMonth() === 6;
  const currentDay = isJuly2026 ? today.getDate() : 31;
  
  let elapsedWorkingDays = 0;
  for (let d = 1; d <= Math.min(currentDay, 31); d++) {
    if (new Date(2026, 6, d).getDay() !== 0) {
      elapsedWorkingDays++;
    }
  }

  const denominator = elapsedWorkingDays || 1;
  const attendanceRate = Math.round((presentDays / denominator) * 100) || 0;

  if (internStatus !== 'Approved') {
    return (
      <Screen NoHeader style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
        <Icon name="lock-outline" size={64} color="#999" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Verification Required</Text>
        <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
          Attendance tracking is locked. Please upload your Internship Offer Letter in your Profile and await TL approval to unlock it.
        </Text>
        <Button mode="contained" onPress={() => navigation.navigate('InternProfile')}>
          Go to Profile
        </Button>
      </Screen>
    );
  }

  return (
    <Screen NoHeader style={styles.container}>
        {/* Analytics Card */}
        <Text style={styles.sectionTitle}>Attendance Analytics</Text>
        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{attendanceRate > 100 ? 100 : attendanceRate}%</Text>
              <Text style={styles.statLbl}>Attendance Rate</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{presentDays} Days</Text>
              <Text style={styles.statLbl}>Present Days</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{leavesTaken} Days</Text>
              <Text style={styles.statLbl}>Leaves Approved</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Calendar Grid */}
        <Text style={styles.sectionTitle}>Attendance Calendar (July 2026)</Text>
        <Card style={styles.calCard}>
          <Card.Content>
            <View style={styles.calLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#4CAF50'}]} />
                <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#FF9800'}]} />
                <Text style={styles.legendText}>Leave</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#F44336'}]} />
                <Text style={styles.legendText}>Absent</Text>
              </View>
            </View>
            <View style={styles.calGrid}>{renderCalendar()}</View>
          </Card.Content>
        </Card>

        {/* Leaves section */}
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Leave Requests</Text>
          <Button mode="contained-tonal" icon="plus" onPress={() => setLeaveModal(true)}>
            Apply Leave
          </Button>
        </View>

        {leaveRequests.length === 0 ? (
          <Text style={styles.emptyText}>No leaves requested yet.</Text>
        ) : (
          leaveRequests.map((req) => (
            <Card key={req.id} style={styles.leaveCard}>
              <Card.Content style={styles.leaveContentRow}>
                <View style={{flex: 1, paddingRight: 8}}>
                  <Text style={styles.leaveType}>{req.type}</Text>
                  <Text style={styles.leaveDates}>📅 {req.dates}</Text>
                  <Text style={styles.leaveReason}>Reason: {req.reason}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  {backgroundColor: req.status === 'Approved' ? '#E8F5E9' : req.status === 'Denied' ? '#FFEBEE' : '#FFF3E0'}
                ]}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: 'bold',
                    color: req.status === 'Approved' ? '#2E7D32' : req.status === 'Denied' ? '#C62828' : '#EF6C00'
                  }}>
                    {req.status}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        {/* Leave application dialog */}
        <Portal>
          <Dialog visible={leaveModal} onDismiss={() => setLeaveModal(false)} style={[styles.dialog, {backgroundColor: colors.elevation.level3}]}>
            <Dialog.Title style={{ color: colors.onSurface }}>Apply for Leave</Dialog.Title>
            <Dialog.Content>
              <Text style={[styles.formLabel, {color: colors.onSurface}]}>Start Date</Text>
              <TextInput
                value={leaveForm.startDate}
                onChangeText={v => setLeaveForm({...leaveForm, startDate: v})}
                placeholder="E.g., July 28"
                style={[styles.formInput, {borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface}]}
                placeholderTextColor="#999"
              />
              <Text style={[styles.formLabel, {color: colors.onSurface}]}>End Date</Text>
              <TextInput
                value={leaveForm.endDate}
                onChangeText={v => setLeaveForm({...leaveForm, endDate: v})}
                placeholder="E.g., July 29"
                style={[styles.formInput, {borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface}]}
                placeholderTextColor="#999"
              />
              <Text style={[styles.formLabel, {color: colors.onSurface}]}>Leave Type</Text>
              <View style={styles.leaveTypesRow}>
                {['Casual', 'Sick', 'Maternity'].map(t => (
                  <Button
                    key={t}
                    mode={leaveForm.type === t ? 'contained' : 'outlined'}
                    onPress={() => setLeaveForm({...leaveForm, type: t})}
                    style={styles.typeBtn}>
                    {t}
                  </Button>
                ))}
              </View>
              <Text style={[styles.formLabel, {color: colors.onSurface}]}>Reason</Text>
              <TextInput
                value={leaveForm.reason}
                onChangeText={v => setLeaveForm({...leaveForm, reason: v})}
                placeholder="Explain reason here..."
                style={[styles.formInput, {height: 60, textAlignVertical: 'top', borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface}]}
                multiline
                placeholderTextColor="#999"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setLeaveModal(false)}>Cancel</Button>
              <Button onPress={submitLeave}>Submit</Button>
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
  clockCard: {
    marginBottom: 24,
    elevation: 3,
  },
  clockContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  clockHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  clockSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  markBtn: {
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsCard: {
    marginBottom: 20,
    elevation: 2,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLbl: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  calCard: {
    marginBottom: 20,
    elevation: 2,
  },
  calLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  calCell: {
    width: (width - 80) / 7,
    height: (width - 80) / 7,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calCellText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  leaveCard: {
    marginBottom: 12,
    elevation: 1,
  },
  leaveContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveType: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  leaveDates: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  leaveReason: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dialog: {
    borderRadius: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
    color: '#333',
  },
  leaveTypesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBtn: {
    flex: 1,
    marginHorizontal: 3,
  },
  emptyText: {
    color: '#888',
    fontSize: 13,
    padding: 10,
  },
});

export default InternAttendance;
