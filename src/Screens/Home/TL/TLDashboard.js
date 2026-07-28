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
import {useTheme, Card, Avatar, Button, IconButton, Dialog, Portal} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DropDown from 'react-native-paper-dropdown';
import {getInternDb, updateMockLeaveStatus, updateInternApproval, addMockMeeting, addMockAnnouncement} from '../../../Utils/MockInternDb';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

const TLDashboard = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [db, setDb] = useState(null);
  const [activeDept, setActiveDept] = useState('Tech');
  const [deptDialogVisible, setDeptDialogVisible] = useState(false);

  // Selected intern details modal
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportModal, setReportModal] = useState(false);

  // Meet scheduler states
  const [meetModalVisible, setMeetModalVisible] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetType, setMeetType] = useState('Discussion'); // Training or Discussion
  const [meetLink, setMeetLink] = useState('https://meet.google.com/abc-defg-hij');
  const [meetDate, setMeetDate] = useState('July 28');
  const [meetTime, setMeetTime] = useState('4:30 PM');
  const [meetAudience, setMeetAudience] = useState('Dept'); // 'Dept' or 'All'

  // Announcement scheduler states
  const [annModalVisible, setAnnModalVisible] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annType, setAnnType] = useState('Announcement'); // Announcement or Event
  const [annTimeText, setAnnTimeText] = useState('Just now');

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
    const data = await getInternDb();
    setDb(data);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const handleLeaveAction = async (leaveId, status) => {
    await updateMockLeaveStatus(leaveId, status);
    Alert.alert('Success', `Leave request has been ${status.toLowerCase()}.`);
    loadData();
  };

  const handleApprovalAction = async (internId, status) => {
    await updateInternApproval(internId, status);
    Alert.alert('Profile Updated', `Intern status set to ${status}.`);
    if (selectedIntern && selectedIntern.id === internId) {
      setSelectedIntern(prev => ({...prev, status, timeLeft: '0d 0h'}));
    }
    loadData();
  };

  const handleCreateMeeting = async () => {
    if (!meetTitle.trim()) {
      return Alert.alert('Validation Error', 'Please enter a meeting title.');
    }
    if (!meetLink.trim() || !meetLink.startsWith('http')) {
      return Alert.alert('Validation Error', 'Please enter a valid HTTP meeting URL (e.g. Google Meet).');
    }

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
      Alert.alert('Meeting Scheduled', `${meetType === 'Training' ? 'Training' : 'Discussion'} meeting "${meetTitle}" has been scheduled for ${meetAudience === 'All' ? 'all departments' : `department ${activeDept}`}.`);
      setMeetTitle('');
      setMeetModalVisible(false);
      setMeetAudience('Dept');
      loadData();
    } else {
      Alert.alert('Error', 'Unable to schedule meeting.');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim()) {
      return Alert.alert('Validation Error', 'Please enter a title.');
    }
    if (!annBody.trim()) {
      return Alert.alert('Validation Error', 'Please enter announcement details.');
    }

    const newAnn = {
      title: annTitle.trim(),
      body: annBody.trim(),
      type: annType,
      timeText: annTimeText.trim(),
      icon: annType === 'Announcement' ? 'bullhorn-outline' : 'video-outline',
      color: annType === 'Announcement' ? '#FF9800' : '#2196F3',
    };

    const res = await addMockAnnouncement(newAnn);
    if (res) {
      Alert.alert('Success', `Published ${annType.toLowerCase()} successfully.`);
      setAnnTitle('');
      setAnnBody('');
      setAnnModalVisible(false);
      loadData();
    } else {
      Alert.alert('Error', 'Unable to publish announcement.');
    }
  };

  const filteredInterns = (db?.interns || []).filter(i => i.department === activeDept);
  const filteredLeaves = (db?.leaves || []).filter(l => {
    const intern = (db?.interns || []).find(i => i.id === l.internId);
    return intern?.department === activeDept;
  });

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

        <View style={styles.actionsRow}>
          <Button
            mode="contained"
            icon="video-plus"
            onPress={() => setMeetModalVisible(true)}
            style={[styles.actionBtnItem, {marginRight: 6}]}>
            Schedule Meet
          </Button>
          <Button
            mode="contained-tonal"
            icon="bullhorn-plus"
            onPress={() => setAnnModalVisible(true)}
            style={styles.actionBtnItem}>
            Post Announcement
          </Button>
        </View>

        {/* Section 1: Interns List */}
        <Text style={styles.sectionTitle}>Interns list ({activeDept})</Text>
        {filteredInterns.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="account-search" size={40} color="#888" />
              <Text style={styles.emptyText}>No active interns in this department.</Text>
            </Card.Content>
          </Card>
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
        <Text style={[styles.sectionTitle, {marginTop: 24}]}>Leave Requests ({activeDept})</Text>
        {filteredLeaves.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="calendar-blank" size={40} color="#888" />
              <Text style={styles.emptyText}>No leave applications filed.</Text>
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
                  <Text style={styles.leaveDates}>📅 {leave.dates} | {leave.type}</Text>
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
                <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.formLabel}>Date</Text>
                  <TextInput
                    value={meetDate}
                    onChangeText={setMeetDate}
                    placeholder="E.g., July 28"
                    style={styles.formInput}
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.formLabel}>Time</Text>
                  <TextInput
                    value={meetTime}
                    onChangeText={setMeetTime}
                    placeholder="E.g., 4:30 PM"
                    style={styles.formInput}
                    placeholderTextColor="#999"
                  />
                </View>
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

              <Text style={styles.formLabel}>Time Info Text</Text>
              <TextInput
                value={annTimeText}
                onChangeText={setAnnTimeText}
                placeholder="E.g., Posted 2 hours ago or Friday, 3:00 PM"
                style={styles.formInput}
                placeholderTextColor="#999"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setAnnModalVisible(false)}>Cancel</Button>
              <Button onPress={handleCreateAnnouncement}>Publish</Button>
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
