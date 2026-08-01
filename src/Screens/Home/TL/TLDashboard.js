import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, Avatar, Button, IconButton, Dialog, Portal, SegmentedButtons} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DropDown from 'react-native-paper-dropdown';
import useApi from '../../../Components/Api/Api';
import {getInternDb, addMockMeeting, addMockAnnouncement, isMeetingExpired} from '../../../Utils/MockInternDb';
import {useNavigation} from '@react-navigation/native';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {useSelector} from 'react-redux';

const {width} = Dimensions.get('window');

const TLDashboard = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const {user} = useSelector(state => state.initial);
  const { get, post } = useApi();
  const [db, setDb] = useState(null);
  const [activeDept, setActiveDept] = useState(user?.department || 'Tech');
  
  // Sync activeDept if user changes it in profile
  useEffect(() => {
    if (user?.department) {
      setActiveDept(user.department);
    }
  }, [user?.department]);

  const [leaveTab, setLeaveTab] = useState('Pending');
  const [deptDialogVisible, setDeptDialogVisible] = useState(false);

  // Selected intern details modal
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportModal, setReportModal] = useState(false);
  const [internMetrics, setInternMetrics] = useState({ accuracy: 0, rank: 'None', tasksDone: 0, daysPresent: 0 });

  // Meet scheduler states
  const [meetModalVisible, setMeetModalVisible] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetType, setMeetType] = useState('Discussion'); // Training or Discussion
  const [meetLink, setMeetLink] = useState('https://meet.google.com/abc-defg-hij');
  const [meetDate, setMeetDate] = useState('July 28');
  const [meetTime, setMeetTime] = useState('4:30 PM');
  const [meetAudience, setMeetAudience] = useState('Dept'); // 'Dept' or 'All'

  const showTlMeetDatePicker = () => {
    let initDate = new Date();
    DateTimePickerAndroid.open({
      value: initDate,
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          setMeetDate(formatted);
        }
      },
    });
  };

  const showTlMeetTimePicker = () => {
    let initTime = new Date();
    DateTimePickerAndroid.open({
      value: initTime,
      mode: 'time',
      is24Hour: false,
      onChange: (event, time) => {
        if (event.type === 'set' && time) {
          const formatted = time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          setMeetTime(formatted);
        }
      },
    });
  };

  // Announcement scheduler states
  const [annModalVisible, setAnnModalVisible] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annType, setAnnType] = useState('Announcement'); // Announcement or Event
  const [annTimeText, setAnnTimeText] = useState('Just now');

  // Training Module States
  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [modTitle, setModTitle] = useState('');
  const [modInstructor, setModInstructor] = useState('');
  const [modDuration, setModDuration] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modVideo, setModVideo] = useState('');

  const deptList = [
    {label: 'Academics', value: 'Academics'},
    {label: 'Campus Ambassador', value: 'Campus Ambassador'},
    {label: 'Career Counsellor', value: 'Career Counsellor'},
    {label: 'Communication And Engagement', value: 'Communication And Engagement'},
    {label: 'Content Writing', value: 'Content Writing'},
    {label: 'Customer Support', value: 'Customer Support'},
    {label: 'Data Analysis', value: 'Data Analysis'},
    {label: 'Digital Marketing', value: 'Digital Marketing'},
    {label: 'Finance', value: 'Finance'},
    {label: 'Graphics Design', value: 'Graphics Design'},
    {label: 'Human Resource', value: 'Human Resource'},
    {label: 'Operations And Growth', value: 'Operations And Growth'},
    {label: 'Project Management', value: 'Project Management'},
    {label: 'Public Relations', value: 'Public Relations'},
    {label: 'Research And Dev', value: 'Research And Dev'},
    {label: 'Sales And Marketing', value: 'Sales And Marketing'},
    {label: 'Social Media Management', value: 'Social Media Management'},
    {label: 'Teaching', value: 'Teaching'},
    {label: 'Tech', value: 'Tech'},
    {label: 'Video Editing', value: 'Video Editing'},
    {label: 'TL Program', value: 'TL Program'},
    {label: 'Partner Program', value: 'Partner Program'},
  ];

  const loadData = async () => {
    try {
      const res = await get(`/interns/team?department=${activeDept}`, {skipSuccessFlash: true});
      if (res && res.data) {
        const liveData = {
          interns: res.data.team || [],
          leaves: res.data.leaves || [],
          reports: res.data.reports || []
        };
        const mock = await getInternDb();
        const activeMeetings = (mock.meetings || []).filter(m => !isMeetingExpired(m.date, m.time));
        setDb({
          ...liveData,
          meetings: activeMeetings,
          announcements: mock.announcements || [],
          departmentTasks: mock.departmentTasks || {},
          attendance: res.data.attendance || {}
        });
      }
    } catch (e) {
      console.log('Error fetching TL Dashboard Data', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

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
            daysPresent: Object.keys(db?.attendance?.[selectedIntern.id] || {}).length,
            completedTasksList: myDoneTasksList
          });
        } catch (e) {
          console.log('Error fetching intern tasks:', e);
          setInternMetrics({ accuracy: 0, rank: 'None', tasksDone: 0, daysPresent: 0, completedTasksList: [] });
        }
      };
      fetchMetrics();
    }
  }, [selectedIntern, db]);

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await post('/interns/team/leave', { leaveId, action: status });
      Alert.alert('Success', `Leave request has been ${status.toLowerCase()}.`);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to update leave request.');
    }
  };

  const handleApprovalAction = async (internId, status) => {
    try {
      await post('/interns/team/approve', { internId, action: status });
      Alert.alert('Profile Updated', `Intern status set to ${status}.`);
      if (selectedIntern && selectedIntern.id === internId) {
        setSelectedIntern(prev => ({...prev, status, timeLeft: '0d 0h'}));
      }
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to update intern profile.');
    }
  };

  const handleCreateMeeting = async () => {
    if (!meetTitle.trim()) {
      return Alert.alert('Validation Error', 'Please enter a meeting title.');
    }
    if (!meetLink.trim() || !meetLink.startsWith('http')) {
      return Alert.alert('Validation Error', 'Please enter a valid HTTP meeting URL (e.g. Google Meet).');
    }

    if (meetType === 'Training') {
      try {
        await post('/interns/trainings/live', {
          department: meetAudience === 'All' ? 'All' : activeDept,
          title: meetTitle.trim(),
          topic: '', // Can add topic input later
          scheduled_time: `${meetDate.trim()} ${meetTime.trim()}`,
          meeting_link: meetLink.trim()
        });
        Alert.alert('Training Scheduled', `Live training session "${meetTitle}" has been scheduled for ${meetAudience === 'All' ? 'all departments' : `department ${activeDept}`}.`);
      } catch (e) {
        Alert.alert('Error', 'Failed to schedule live training session.');
      }
    } else {
      const newMeeting = {
        title: meetTitle.trim(),
        type: meetType,
        department: meetAudience === 'All' ? 'All' : activeDept,
        date: meetDate.trim(),
        time: meetTime.trim(),
        link: meetLink.trim(),
        createdBy: 'Team Lead',
      };
      const res = await addMockMeeting(newMeeting);
      if (res) {
        Alert.alert('Meeting Scheduled', `Discussion meeting "${meetTitle}" has been scheduled for ${meetAudience === 'All' ? 'all departments' : `department ${activeDept}`}.`);
      }
    }

    setMeetTitle('');
    setMeetModalVisible(false);
    setMeetAudience('Dept');
    loadData();
  };

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim()) {
      return Alert.alert('Validation Error', 'Please enter a title.');
    }
    if (!annBody.trim()) {
      return Alert.alert('Validation Error', 'Please enter message details.');
    }

    const autoTimeText = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    try {
      await post('/interns/announcements', {
        department: activeDept,
        title: annTitle.trim(),
        body: annBody.trim(),
        type: annType,
        timeText: autoTimeText
      });
      Alert.alert('Success', `${annType} published successfully.`);
      setAnnTitle('');
      setAnnBody('');
      setAnnModalVisible(false);
      loadData();
    } catch (e) {
      Alert.alert('Notice', 'Announcement logged.');
      setAnnModalVisible(false);
    }
  };

  const handlePublishModule = async () => {
    if (!modTitle.trim() || !modInstructor.trim() || !modDuration.trim() || !modVideo.trim()) {
      return Alert.alert('Validation Error', 'Title, Instructor, Duration, and Video URL are required.');
    }

    try {
      await post('/interns/trainings/modules', {
        department: activeDept,
        title: modTitle.trim(),
        instructor: modInstructor.trim(),
        duration: modDuration.trim(),
        description: modDesc.trim(),
        video_url: modVideo.trim()
      });
      Alert.alert('Module Published', `Training module "${modTitle}" is now live in the Learning Hub.`);
      setModTitle('');
      setModInstructor('');
      setModDuration('');
      setModDesc('');
      setModVideo('');
      setModuleModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to publish training module.');
    }
  };

  const filteredInterns = (db?.interns || []).filter(i => i.status !== 'Approved');
  const filteredLeaves = (db?.leaves || []).filter(l => 
    leaveTab === 'Pending' ? l.status === 'Pending' : (l.status === 'Approved' || l.status === 'Denied')
  );

  return (
    <Screen NoHeader style={styles.container}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>Supervisor Panel</Text>
            <Text style={styles.title}>Team Lead Dashboard</Text>
          </View>
          <Avatar.Icon size={48} icon="shield-account" style={{backgroundColor: colors.primaryContainer}} color={colors.onPrimaryContainer} />
        </View>

        {/* Department Selection Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setDeptDialogVisible(true)}
          style={[styles.deptSelectBtn, {backgroundColor: colors.elevation.level2, borderColor: colors.outline}]}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Icon name="office-building" size={20} color={colors.primary} />
            <View style={{marginLeft: 10, flex: 1}}>
              <Text style={{fontSize: 10, color: colors.outline, fontWeight: 'bold'}}>ACTIVE DEPARTMENT</Text>
              <Text style={{fontSize: 14, fontWeight: 'bold', color: colors.onSurface}}>{activeDept}</Text>
            </View>
          </View>
          <Button mode="contained-tonal" compact labelStyle={{fontSize: 11}}>Change</Button>
        </TouchableOpacity>

        <View style={{flexDirection: 'column', gap: 10, marginTop: 15, marginBottom: 20}}>
          <Button
            mode="contained"
            icon="video"
            onPress={() => setMeetModalVisible(true)}
            style={{backgroundColor: '#00695C', borderRadius: 8, paddingVertical: 4}}
            labelStyle={{fontSize: 15}}>
            Schedule Meet
          </Button>
          <Button
            mode="contained-tonal"
            icon="play-box-multiple"
            onPress={() => setModuleModalVisible(true)}
            style={{backgroundColor: '#E3F2FD', borderRadius: 8, paddingVertical: 4}}
            labelStyle={{color: '#1565C0', fontSize: 15}}>
            Post Training Module
          </Button>
          <Button
            mode="contained-tonal"
            icon="bullhorn-outline"
            onPress={() => setAnnModalVisible(true)}
            style={{backgroundColor: '#BBDEFB', borderRadius: 8, paddingVertical: 4}}
            labelStyle={{color: '#1565C0', fontSize: 15}}>
            Publish Announcement
          </Button>
        </View>

        {/* Section 1: Interns List */}
        <Text style={styles.sectionTitle}>Action Required: Pending Approvals ({activeDept})</Text>
        {filteredInterns.length === 0 ? (
          <View style={styles.emptyContent}>
            <Icon name="check-decagram-outline" size={48} color="#4CAF50" />
            <Text style={[styles.emptyText, {color: '#4CAF50', fontWeight: 'bold'}]}>All caught up!</Text>
            <Text style={styles.emptyText}>No pending onboarding tasks for this department.</Text>
          </View>
        ) : (
          filteredInterns.map(intern => (
            <Card key={intern.id} style={styles.internCard} onPress={() => setSelectedIntern(intern)}>
              <Card.Content style={styles.internRow}>
                <Avatar.Text size={42} label={intern.avatar} style={{backgroundColor: colors.secondaryContainer}} color={colors.onSecondaryContainer} />
                <View style={styles.internInfo}>
                  <Text style={styles.internName}>{intern.name}</Text>
                  <Text style={styles.internEmail}>{intern.email}</Text>
                  <View style={styles.statusBadgeRow}>
                    <View style={[styles.badge, {
                      backgroundColor: intern.status === 'Approved' ? '#E8F5E9' : intern.status === 'Denied' ? '#FFEBEE' : '#FFF3E0'
                    }]}>
                      <Text style={[styles.badgeText, {
                        color: intern.status === 'Approved' ? '#2E7D32' : intern.status === 'Denied' ? '#C62828' : '#EF6C00'
                      }]}>
                        {intern.status}
                      </Text>
                    </View>
                    {intern.status === 'Pending' && (
                      <Text style={[styles.countdown, {color: colors.primary}]}>🕒 Pending TL Review</Text>
                    )}
                  </View>
                </View>
                <IconButton icon="chevron-right" size={24} />
              </Card.Content>
            </Card>
          ))
        )}

        {/* Section 2: Pending Leaves */}
        <Text style={[styles.sectionTitle, {marginTop: 24, marginBottom: 12}]}>Leave Requests ({activeDept})</Text>
        <SegmentedButtons
          value={leaveTab}
          onValueChange={setLeaveTab}
          buttons={[
            { value: 'Pending', label: 'Pending' },
            { value: 'History', label: 'History' },
          ]}
          style={{marginBottom: 16, marginHorizontal: 20}}
        />
        {filteredLeaves.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name={leaveTab === 'Pending' ? "calendar-check" : "calendar-blank"} size={40} color="#888" />
              <Text style={styles.emptyText}>
                {leaveTab === 'Pending' ? "No pending leave requests." : "No leave history found."}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredLeaves.map(leave => {
            const intern = db.interns.find(i => i.id === leave.internId);
            return (
              <Card key={leave.id} style={styles.leaveCard}>
                <Card.Content>
                  <View style={styles.leaveHeader}>
                    <Text style={styles.leaveIntern}>{intern?.name || 'Intern'}</Text>
                    <View style={[styles.badge, {
                      backgroundColor: leave.status === 'Approved' ? '#E8F5E9' : leave.status === 'Denied' ? '#FFEBEE' : '#FFF3E0'
                    }]}>
                      <Text style={[styles.badgeText, {
                        color: leave.status === 'Approved' ? '#2E7D32' : leave.status === 'Denied' ? '#C62828' : '#EF6C00'
                      }]}>
                        {leave.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.leaveDates}>📅 {leave.start} to {leave.end}</Text>
                  <Text style={styles.leaveReason}>Reason: "{leave.reason}"</Text>

                  {leave.status === 'Pending' && (
                    <View style={styles.leaveActions}>
                      <Button mode="outlined" textColor="#C62828" onPress={() => handleLeaveAction(leave.id, 'Denied')} style={styles.leaveBtn}>
                        Deny
                      </Button>
                      <Button mode="contained" buttonColor={colors.primary} onPress={() => handleLeaveAction(leave.id, 'Approved')} style={styles.leaveBtn}>
                        Approve
                      </Button>
                    </View>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}

        {/* Section 3: Anonymous Feedback */}
        <Text style={[styles.sectionTitle, {marginTop: 24}]}>Anonymous Feedback ({activeDept})</Text>
        {(db?.feedbacks || []).filter(f => f.department === activeDept).length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="message-alert-outline" size={40} color="#888" />
              <Text style={styles.emptyText}>No feedback reports submitted.</Text>
            </Card.Content>
          </Card>
        ) : (
          (db?.feedbacks || []).filter(f => f.department === activeDept).map(feed => (
            <Card key={feed.id} style={styles.leaveCard}>
              <Card.Content>
                <View style={styles.leaveHeader}>
                  <Text style={[styles.leaveIntern, {color: colors.primary}]}>{feed.category}</Text>
                  <Text style={styles.reportDate}>{feed.date}</Text>
                </View>
                <Text style={[styles.leaveReason, {marginTop: 6, fontStyle: 'normal'}]}>
                  "{feed.text}"
                </Text>
              </Card.Content>
            </Card>
          ))
        )}

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
                          onPress={() => Alert.alert('View Offer Letter', `Offer Letter Document: ${selectedIntern.offerLetterName}\n\n[Verified Signature & Seal Present]\nThis document is authenticated and ready for approval.`)}
                        >
                          View
                        </Button>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: '#C62828', fontStyle: 'italic' }}>⚠️ No offer letter uploaded yet by the intern.</Text>
                    )}
                  </View>

                  {/* Profile Approval options */}
                  <View style={styles.approvalSection}>
                    <Text style={styles.approvalHeader}>Internship Profile Status</Text>
                    <Text style={styles.approvalSub}>
                      {selectedIntern.status === 'Pending'
                        ? `Awaiting supervisor review for internship approval.`
                        : `This intern profile is currently ${selectedIntern.status.toLowerCase()}.`}
                    </Text>
                    {selectedIntern.status === 'Pending' && (
                      <View style={styles.approvalButtons}>
                        <Button mode="outlined" textColor="#C62828" onPress={() => handleApprovalAction(selectedIntern.id, 'Denied')} style={styles.apprBtn}>
                          Deny Internship
                        </Button>
                        <Button 
                          mode="contained" 
                          buttonColor={colors.primary} 
                          onPress={() => {
                            if (!selectedIntern.offerLetterName) {
                              return Alert.alert('Onboarding Blocked', 'You cannot approve an intern profile without reviewing their uploaded Offer Letter first.');
                            }
                            handleApprovalAction(selectedIntern.id, 'Approved');
                          }} 
                          style={styles.apprBtn}
                        >
                          Approve Profile
                        </Button>
                      </View>
                    )}
                  </View>

                  {/* Submitted Reports */}
                  <Text style={styles.subTitle}>Submitted EOD Logs</Text>
                  {(db?.reports || []).filter(r => r.internId === selectedIntern.id).length === 0 ? (
                    <Text style={styles.emptyText}>No reports submitted yet.</Text>
                  ) : (
                    (db?.reports || []).filter(r => r.internId === selectedIntern.id).map(report => (
                      <Card key={report.id} style={styles.reportLogItem} onPress={() => {
                        setSelectedReport(report);
                        setReportModal(true);
                      }}>
                        <Card.Content style={styles.reportRow}>
                          <View style={{flex: 1}}>
                            <Text style={styles.reportType}>{report.type}</Text>
                            <Text style={styles.reportDate}>{report.date}</Text>
                            <Text style={styles.reportSummary} numberOfLines={1}>{report.summary}</Text>
                          </View>
                          <IconButton icon="eye-outline" size={20} />
                        </Card.Content>
                      </Card>
                    ))
                  )}

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
                          {internMetrics.daysPresent}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Days Present</Text>
                      </Card.Content>
                    </Card>
                    <Card style={{ flex: 1, backgroundColor: '#E8F5E9' }}>
                      <Card.Content style={{ alignItems: 'center', padding: 12 }}>
                        <Icon name="checkbox-marked-circle-outline" size={28} color="#2E7D32" />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginTop: 4 }}>
                          {internMetrics.tasksDone}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Tasks Completed</Text>
                      </Card.Content>
                    </Card>
                  </View>

                  {/* Active Tasks List */}
                  <Text style={styles.subTitle}>Recent Task Activity</Text>
                  {(db?.departmentTasks?.[activeDept] || []).filter(t => t.completedBy === selectedIntern.id || t.assignedTo?.includes(selectedIntern.id)).length === 0 ? (
                     <Text style={styles.emptyText}>No active or completed tasks assigned to this intern.</Text>
                  ) : (
                     (db?.departmentTasks?.[activeDept] || []).filter(t => t.completedBy === selectedIntern.id || t.assignedTo?.includes(selectedIntern.id)).slice(0, 3).map(task => (
                       <Card key={task.id} style={{ marginBottom: 8, marginHorizontal: 4, elevation: 1 }}>
                         <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
                           <Icon name={task.completed ? "check-circle" : "progress-clock"} size={24} color={task.completed ? "#2E7D32" : "#F57C00"} />
                           <View style={{ flex: 1, marginLeft: 12 }}>
                             <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>{task.title}</Text>
                             <Text style={{ fontSize: 12, color: '#666' }}>{task.completed ? 'Completed' : 'In Progress'}</Text>
                           </View>
                         </Card.Content>
                       </Card>
                     ))
                  )}

                  {/* Chat Button */}
                  <Button
                    mode="contained-tonal"
                    icon="chat"
                    onPress={() => {
                      setSelectedIntern(null);
                      navigation.navigate('InternCommunication');
                    }}
                    style={{marginTop: 20}}>
                    Message Intern
                  </Button>
                  {/* Department Selection Dialog */}
        <Portal>
          <Dialog visible={deptDialogVisible} onDismiss={() => setDeptDialogVisible(false)} style={[styles.dialog, {backgroundColor: colors.elevation.level3}]}>
            <Dialog.Title style={{color: colors.onSurface}}>Select Department</Dialog.Title>
            <Dialog.Content style={{maxHeight: 320}}>
              <ScrollView contentContainerStyle={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
                {deptList.map(item => (
                  <Button
                    key={item.value}
                    mode={activeDept === item.value ? 'contained' : 'outlined'}
                    compact
                    style={{margin: 2}}
                    labelStyle={{fontSize: 11}}
                    onPress={() => {
                      setActiveDept(item.value);
                      setDeptDialogVisible(false);
                    }}>
                    {item.label}
                  </Button>
                ))}
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeptDialogVisible(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Report review Dialog */}
        <Portal>
          <Dialog visible={reportModal} onDismiss={() => setReportModal(false)} style={styles.dialog}>
            <Dialog.Title>EOD Submission Details</Dialog.Title>
            <Dialog.Content>
              {selectedReport && (
                <View>
                  <Text style={styles.repLabel}>Log Date</Text>
                  <Text style={styles.repVal}>{selectedReport.date} ({selectedReport.type})</Text>

                  {Object.keys(selectedReport.details).map(key => (
                    <View key={key} style={{marginTop: 10}}>
                      <Text style={styles.repLabel}>{key.toUpperCase()}</Text>
                      <Text style={styles.repVal}>{selectedReport.details[key]}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setReportModal(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Schedule Meeting Dialog */}
        <Portal>
          <Dialog visible={meetModalVisible} onDismiss={() => setMeetModalVisible(false)} style={styles.dialog}>
            <Dialog.Title>Schedule Department Meeting</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.formLabel}>Meeting Title</Text>
              <TextInput
                value={meetTitle}
                onChangeText={setMeetTitle}
                placeholder="E.g., Weekly Q&A or Sprint Sync"
                style={styles.formInput}
                placeholderTextColor="#999"
              />
              <Text style={styles.formLabel}>Meeting Type</Text>
              <View style={styles.typeSelector}>
                {['Training', 'Discussion'].map(t => (
                  <Button
                    key={t}
                    mode={meetType === t ? 'contained' : 'outlined'}
                    onPress={() => setMeetType(t)}
                    style={styles.typeBtn}>
                    {t === 'Training' ? 'Training' : 'Discussion'}
                  </Button>
                ))}
              </View>

              <Text style={styles.formLabel}>Audience Visibility</Text>
              <View style={styles.typeSelector}>
                <Button
                  mode={meetAudience === 'Dept' ? 'contained' : 'outlined'}
                  onPress={() => setMeetAudience('Dept')}
                  style={styles.typeBtn}
                  compact
                  labelStyle={{fontSize: 11}}
                >
                  This Dept ({activeDept})
                </Button>
                <Button
                  mode={meetAudience === 'All' ? 'contained' : 'outlined'}
                  onPress={() => setMeetAudience('All')}
                  style={styles.typeBtn}
                  compact
                  labelStyle={{fontSize: 11}}
                >
                  All Depts
                </Button>
              </View>

              <Text style={styles.formLabel}>Google Meet / Video Link</Text>
              <TextInput
                value={meetLink}
                onChangeText={setMeetLink}
                placeholder="https://meet.google.com/abc-defg-hij"
                style={styles.formInput}
                placeholderTextColor="#999"
              />

              <View style={styles.rowInputs}>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={showTlMeetDatePicker} 
                  style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.formLabel}>Date</Text>
                  <View style={[styles.formInput, {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12}]}>
                    <Text style={{color: meetDate ? colors.onSurface : '#999', fontSize: 13}}>
                      {meetDate || 'YYYY-MM-DD'}
                    </Text>
                    <Icon name="calendar-month" size={20} color={colors.primary} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={showTlMeetTimePicker} 
                  style={{flex: 1}}>
                  <Text style={styles.formLabel}>Time</Text>
                  <View style={[styles.formInput, {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12}]}>
                    <Text style={{color: meetTime ? colors.onSurface : '#999', fontSize: 13}}>
                      {meetTime || 'e.g. 4:30 PM'}
                    </Text>
                    <Icon name="clock-outline" size={20} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setMeetModalVisible(false)}>Cancel</Button>
              <Button onPress={handleCreateMeeting}>Schedule</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Schedule Announcement Dialog */}
        <Portal>
          <Dialog visible={annModalVisible} onDismiss={() => setAnnModalVisible(false)} style={styles.dialog}>
            <Dialog.Title>Publish Announcement / Event</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                value={annTitle}
                onChangeText={setAnnTitle}
                placeholder="E.g., Mid-Term Internship Review"
                style={styles.formInput}
                placeholderTextColor="#999"
              />
              <Text style={styles.formLabel}>Publish Type</Text>
              <View style={styles.typeSelector}>
                {['Announcement', 'Event'].map(t => (
                  <Button
                    key={t}
                    mode={annType === t ? 'contained' : 'outlined'}
                    onPress={() => setAnnType(t)}
                    style={styles.typeBtn}>
                    {t}
                  </Button>
                ))}
              </View>

              <Text style={styles.formLabel}>Message details</Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={annBody}
                onChangeText={setAnnBody}
                placeholder="All interns are requested to..."
                style={[styles.formInput, {height: 60, textAlignVertical: 'top'}]}
                placeholderTextColor="#999"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setAnnModalVisible(false)}>Cancel</Button>
              <Button onPress={handleCreateAnnouncement}>Publish</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Upload Training Module Dialog */}
        <Portal>
          <Dialog visible={moduleModalVisible} onDismiss={() => setModuleModalVisible(false)} style={styles.dialog}>
            <Dialog.Title>Publish Training Module</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.formLabel}>Module Title</Text>
              <TextInput
                value={modTitle}
                onChangeText={setModTitle}
                placeholder="E.g., Advanced React Native"
                style={styles.formInput}
                placeholderTextColor="#999"
              />
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.formLabel}>Instructor</Text>
                  <TextInput
                    value={modInstructor}
                    onChangeText={setModInstructor}
                    placeholder="E.g., John Doe"
                    style={styles.formInput}
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.formLabel}>Duration</Text>
                  <TextInput
                    value={modDuration}
                    onChangeText={setModDuration}
                    placeholder="E.g., 45 mins"
                    style={styles.formInput}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                multiline
                numberOfLines={2}
                value={modDesc}
                onChangeText={setModDesc}
                placeholder="Briefly describe what this module covers..."
                style={[styles.formInput, {height: 50, textAlignVertical: 'top'}]}
                placeholderTextColor="#999"
              />

              <Text style={styles.formLabel}>Video Link (YouTube/MP4)</Text>
              <TextInput
                value={modVideo}
                onChangeText={setModVideo}
                placeholder="https://youtube.com/watch?v=..."
                style={styles.formInput}
                placeholderTextColor="#999"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setModuleModalVisible(false)}>Cancel</Button>
              <Button onPress={handlePublishModule}>Publish</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  actionsRow: {
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtnItem: {
    flex: 1,
    borderRadius: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 10,
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
  },
  rowInputs: {
    flexDirection: 'row',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greet: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyCard: {
    elevation: 1,
    marginBottom: 16,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
  },
  internCard: {
    marginBottom: 12,
    elevation: 2,
  },
  internRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  internInfo: {
    flex: 1,
    marginLeft: 12,
  },
  internName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  internEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  countdown: {
    fontSize: 11,
    color: '#E53935',
    marginLeft: 10,
    fontWeight: '500',
  },
  deptSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  leaveCard: {
    marginBottom: 12,
    elevation: 2,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  leaveIntern: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaveDates: {
    fontSize: 12,
    color: '#555',
  },
  leaveReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  leaveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  leaveBtn: {
    height: 36,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileBox: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  profileDept: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007171',
    marginTop: 4,
  },
  profileDays: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  approvalSection: {
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    marginBottom: 16,
  },
  approvalHeader: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  approvalSub: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  approvalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  apprBtn: {
    flex: 1,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reportLogItem: {
    marginBottom: 10,
    elevation: 1,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportType: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  reportDate: {
    fontSize: 11,
    color: '#888',
  },
  reportSummary: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dialog: {
    borderRadius: 12,
  },
  repLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#777',
    textTransform: 'uppercase',
  },
  repVal: {
    fontSize: 14,
    color: '#111',
    marginTop: 2,
    marginBottom: 10,
  },
});

export default TLDashboard;
