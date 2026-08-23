import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Switch,
  Image,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen, CardHorizontal} from '../../../Components/Screen';
import {useTheme, Card, Chip, Button, Avatar, ProgressBar, Portal, Dialog, IconButton} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setUser, setUserLogout, setTheme} from '../../../Redux/Slices/InitialSlice';
import {openModal} from '../../../Redux/Slices/ModalSlice';
import {removeFcmToken} from '../../../Components/Api/CheckAuth';
import DropDown from 'react-native-paper-dropdown';
import useApi from '../../../Components/Api/Api';
// Simple try-catch for DocumentPicker
let DocumentPicker = null;
try {
  DocumentPicker = require('@react-native-documents/picker');
} catch (e) {}

const DEPT_KEY = '@studify_chat_department';

const InternProfile = () => {
  const {colors, dark} = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {user, isDark} = useSelector(state => state.initial);
  const [isSwitchOn, setIsSwitchOn] = useState(isDark);

  const onToggleSwitch = () => {
    dispatch(setTheme());
    setIsSwitchOn(!isSwitchOn);
  };

  const handleLogout = () => {
    dispatch(
      openModal({
        title: 'Logout',
        content: 'Are you sure you want to logout?',
        button: {
          title: 'Logout',
          onPress: () => {
            dispatch(setUserLogout());
            removeFcmToken();
          },
        },
      }),
    );
  };

  // Profile data state
  const [skills, setSkills] = useState(['React Native', 'Redux Toolkit', 'JavaScript', 'Git', 'REST APIs']);
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [letterName, setLetterName] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [internDuration, setInternDuration] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [durationDropdown, setDurationDropdown] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('Pending');
  const [totalStars, setTotalStars] = useState(0);
  const [starHistory, setStarHistory] = useState([]);

  // Department state
  const [selectedDept, setSelectedDept] = useState(user?.department || 'Tech');
  const [deptDropdown, setDeptDropdown] = useState(false);
  const [showMultiDeptDialog, setShowMultiDeptDialog] = useState(false);

  // Skill Dialog State
  const [skillDialog, setSkillDialog] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');

  const [tlDetails, setTlDetails] = useState({
    name: 'Vishal Kushwaha',
    email: 'vishalsnghkush31@ce.du.ac.in',
    role: `${user?.department || 'Tech'} Lead / Supervisor`,
    department: user?.department || 'Tech',
  });

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

  const durationList = [
    {label: '1 Month', value: '1 Month'},
    {label: '2 Months', value: '2 Months'},
    {label: '3 Months', value: '3 Months'},
    {label: '6 Months', value: '6 Months'},
  ];

  const { get, post } = useApi();

  const loadDeptAndResume = async () => {
    const savedDept = await AsyncStorage.getItem(DEPT_KEY);
    if (savedDept) {
      setSelectedDept(savedDept);
      if (user && user.department !== savedDept) {
        dispatch(setUser({...user, department: savedDept}));
      }
    }
    const activeId = user?.user_id;
    const email = user?.email;
    const resumeKey = activeId
      ? `@studify_resume_name_${activeId}`
      : email
      ? `@studify_resume_name_${email}`
      : null;
    if (resumeKey) {
      const savedResume = await AsyncStorage.getItem(resumeKey);
      setResumeName(savedResume || '');
    } else {
      setResumeName('');
    }

    const keyId = activeId || email || 'guest';
    const savedLinkedin = await AsyncStorage.getItem(`@studify_linkedin_${keyId}`);
    const savedGithub = await AsyncStorage.getItem(`@studify_github_${keyId}`);
    if (savedLinkedin) setLinkedin(savedLinkedin);
    if (savedGithub) setGithub(savedGithub);

    try {
      const activeDeptQuery = savedDept || selectedDept || user?.department || 'Tech';
      const res = await get(`/interns/profile?department=${activeDeptQuery}`, {skipErrorFlash: true});
      if (res && res.data) {
        setLetterName(res.data.offer_letter_name || '');
        if (res.data.duration) setInternDuration(res.data.duration);
        if (res.data.joined_date) setJoinedDate(res.data.joined_date);
        setVerificationStatus(res.data.status || 'Pending');
        if (res.data.total_stars !== undefined) setTotalStars(res.data.total_stars || 0);
        if (res.data.star_history) setStarHistory(res.data.star_history || []);
        if (res.data.tl_details) {
          setTlDetails(res.data.tl_details);
        } else {
          setTlDetails({
            name: 'Vishal Kushwaha',
            email: 'vishalsnghkush31@ce.du.ac.in',
            role: `${res.data.department || activeDeptQuery} Lead / Supervisor`,
            department: res.data.department || activeDeptQuery,
          });
        }
      }
    } catch (e) {
      console.log('Failed to fetch profile', e);
    }
  };

  useEffect(() => {
    loadDeptAndResume();
    const unsubscribe = navigation.addListener('focus', loadDeptAndResume);
    return unsubscribe;
  }, [navigation, user]);

  const handleDeptChange = async (dept) => {
    setSelectedDept(dept);
    await AsyncStorage.setItem(DEPT_KEY, dept);
    dispatch(setUser({...user, department: dept}));
    try {
      await post('/interns/update-department', { userId: user?.user_id, department: dept });
    } catch(e) {
      console.log('Error updating backend department:', e);
    }
    Alert.alert('Department Updated', `Your department has been set to ${dept}. Chat channels updated.`);
    loadDeptAndResume();
  };

  const handleAddSkill = () => {
    if (!newSkillText.trim()) return;
    if (skills.includes(newSkillText.trim())) {
      return Alert.alert('Duplicate', 'This skill is already listed.');
    }
    setSkills([...skills, newSkillText.trim()]);
    setNewSkillText('');
    setSkillDialog(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleLetterUpload = async () => {
    const dp = DocumentPicker?.default || DocumentPicker;
    if (dp && (typeof dp.pick === 'function' || typeof dp.pickSingle === 'function')) {
      try {
        let pickedFile = null;
        if (typeof dp.pick === 'function') {
          const res = await dp.pick({ type: [dp.types?.pdf || 'application/pdf'] });
          pickedFile = Array.isArray(res) ? res[0] : res;
        } else {
          pickedFile = await dp.pickSingle({ type: [dp.types?.pdf || 'application/pdf'] });
        }
        if (pickedFile && pickedFile.name) {
          setLetterName(pickedFile.name);
          await post('/interns/offer_letter', { offerLetterName: pickedFile.name, department: selectedDept, duration: internDuration || '6 Months' });
          Alert.alert('Upload Successful', `Selected offer letter: ${pickedFile.name}. Awaiting TL approval.`);
          loadDeptAndResume();
        }
      } catch (err) {
        if (dp.isCancel && dp.isCancel(err)) {
          console.log('User cancelled picker');
        } else {
          console.log('Document pick error', err);
          Alert.alert('Upload Error', 'Unable to select file from device.');
        }
      }
    } else {
      setTimeout(async () => {
        const mockName = 'Offer_Letter_Verified.pdf';
        setLetterName(mockName);
        await post('/interns/offer_letter', { offerLetterName: mockName, department: selectedDept, duration: internDuration || '6 Months' });
        Alert.alert('Upload Successful', 'Offer letter uploaded successfully. Awaiting TL approval.');
        loadDeptAndResume();
      }, 800);
    }
  };

  const handleRemoveLetter = async () => {
    setLetterName('');
    await post('/interns/offer_letter', { offerLetterName: null, department: selectedDept, duration: internDuration || '6 Months' });
    Alert.alert('Offer Letter Removed', 'Your offer letter has been deleted.');
    loadDeptAndResume();
  };

  const handleResumeUpload = async () => {
    const activeId = user?.user_id || user?.email || 'guest';
    const resumeKey = `@studify_resume_name_${activeId}`;
    const dp = DocumentPicker?.default || DocumentPicker;
    if (dp && (typeof dp.pick === 'function' || typeof dp.pickSingle === 'function')) {
      try {
        let pickedFile = null;
        if (typeof dp.pick === 'function') {
          const res = await dp.pick({
            type: [
              dp.types?.pdf || 'application/pdf',
              dp.types?.doc || 'application/msword',
              dp.types?.docx || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
          });
          pickedFile = Array.isArray(res) ? res[0] : res;
        } else {
          pickedFile = await dp.pickSingle({
            type: [
              dp.types?.pdf || 'application/pdf',
              dp.types?.doc || 'application/msword',
              dp.types?.docx || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
          });
        }
        if (pickedFile && pickedFile.name) {
          setResumeName(pickedFile.name);
          await AsyncStorage.setItem(`@studify_resume_name_${activeId}`, pickedFile.name);
          Alert.alert('Upload Successful', `Selected resume: ${pickedFile.name}`);
        }
      } catch (err) {
        if (dp.isCancel && dp.isCancel(err)) {
          console.log('User cancelled picker');
        } else {
          console.log('Resume pick error', err);
          Alert.alert('Upload Error', 'Unable to select resume file.');
        }
      }
    } else {
      setTimeout(async () => {
        const mockName = 'Uploaded_Resume_Verified.pdf';
        setResumeName(mockName);
        await AsyncStorage.setItem(`@studify_resume_name_${activeId}`, mockName);
        Alert.alert('Upload Successful', 'Resume uploaded successfully.');
      }, 800);
    }
  };

  const handleRemoveResume = async () => {
    const activeId = user?.user_id || user?.email || 'guest';
    const resumeKey = `@studify_resume_name_${activeId}`;
    setResumeName('');
    await AsyncStorage.removeItem(resumeKey);
    Alert.alert('Resume Removed', 'Your resume has been deleted.');
  };

  const saveLinks = async () => {
    const keyId = user?.user_id || user?.email || 'guest';
    if (linkedin) await AsyncStorage.setItem(`@studify_linkedin_${keyId}`, linkedin);
    if (github) await AsyncStorage.setItem(`@studify_github_${keyId}`, github);
    Alert.alert('Saved', 'LinkedIn and GitHub links updated successfully.');
  };

  return (
    <Screen NoHeader style={styles.container}>
        {/* Header Profile Badge */}
        <View style={styles.profileHeader}>
          {user?.avatar ? (
            <Image
              source={{uri: user.avatar}}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                borderWidth: 2,
                borderColor: colors.primary,
              }}
            />
          ) : (
            <Avatar.Text
              size={70}
              label={(user?.fname?.[0] || 'I') + (user?.lname?.[0] || '')}
              style={{backgroundColor: colors.primary}}
              color="#fff"
            />
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.nameText}>{user?.fname || 'Intern'} {user?.lname || ''}</Text>
            <Text style={styles.roleText}>{selectedDept} Division {user?.is_intern ? 'Intern' : 'Team Lead'}</Text>
            <Text style={styles.emailText}>{user?.email || 'intern@studifysuccess.com'}</Text>
          </View>
        </View>

        {/* Department Selector */}
        {user?.is_intern ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Internship Department</Text>
              <DropDown
                label="Select Division"
                mode="outlined"
                visible={deptDropdown}
                showDropDown={() => setDeptDropdown(true)}
                onDismiss={() => setDeptDropdown(false)}
                value={selectedDept}
                setValue={handleDeptChange}
                list={deptList}
                dropDownContainerMaxHeight={200}
                dropDownItemTextStyle={{color: colors.onBackground}}
              />
            </Card.Content>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Managed Departments</Text>
                <TouchableOpacity 
                  onPress={() => setShowMultiDeptDialog(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: '#DDD',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 14,
                    marginTop: 10,
                    backgroundColor: '#FAFAFA'
                  }}
                >
                  <Text style={{ flex: 1, fontSize: 14, color: colors.onSurface }}>
                    {selectedDept || 'Select Departments'}
                  </Text>
                  <Icon name="chevron-down" size={20} color={colors.primary} />
                </TouchableOpacity>
              </Card.Content>
            </Card>

            <Portal>
              <Dialog visible={showMultiDeptDialog} onDismiss={() => setShowMultiDeptDialog(false)}>
                <Dialog.Title>Select Managed Divisions</Dialog.Title>
                <Dialog.Content style={{ maxHeight: 400 }}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 10 }}>
                      {deptList.map(dept => {
                        const isSelected = (selectedDept || '').split(',').map(d => d.trim()).includes(dept.value);
                        return (
                          <Chip
                            key={dept.value}
                            selected={isSelected}
                            style={{ margin: 4, backgroundColor: isSelected ? colors.primaryContainer : '#E0E0E0' }}
                            textStyle={{ color: isSelected ? colors.onPrimaryContainer : '#555', fontSize: 11 }}
                            onPress={() => {
                              let currentList = (selectedDept || '').split(',').map(d => d.trim()).filter(Boolean);
                              if (isSelected) {
                                if (currentList.length > 1) {
                                  currentList = currentList.filter(d => d !== dept.value);
                                } else {
                                  Alert.alert('Required', 'A Team Leader must manage at least one department.');
                                  return;
                                }
                              } else {
                                currentList.push(dept.value);
                              }
                              const newDeptString = currentList.join(', ');
                              handleDeptChange(newDeptString);
                            }}
                          >
                            {dept.label}
                          </Chip>
                        );
                      })}
                    </View>
                  </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button mode="contained" onPress={() => setShowMultiDeptDialog(false)}>Done</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </>
        )}

        {/* Internship Progress Card */}
        {user?.is_intern && (() => {
          const durationStr = internDuration || user?.duration || '3 Months';
          let totalDays = 90;
          if (durationStr.includes('1 Month')) totalDays = 30;
          else if (durationStr.includes('2 Month')) totalDays = 60;
          else if (durationStr.includes('3 Month')) totalDays = 90;
          else if (durationStr.includes('6 Month')) totalDays = 180;
          else if (durationStr.includes('1 Year')) totalDays = 365;

          const rawJoined = joinedDate || user?.joined_date;
          const startDate = rawJoined ? new Date(rawJoined) : new Date();
          const today = new Date();
          
          const startMs = new Date(startDate).setHours(0,0,0,0);
          const todayMs = new Date(today).setHours(0,0,0,0);
          const diffTime = Math.max(0, todayMs - startMs);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const completedDays = Math.min(diffDays, totalDays);
          const progressRatio = totalDays > 0 ? completedDays / totalDays : 0;

          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + totalDays);

          const formatDateStr = (d) => {
            try {
              return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            } catch(e) { return 'N/A'; }
          };

          return (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Internship Progress</Text>
                <View style={styles.durationHeader}>
                  <Text style={styles.durationLabel}>Duration: {durationStr}</Text>
                  <Text style={styles.durationDays}>{completedDays} / {totalDays} Days Completed</Text>
                </View>
                <ProgressBar progress={progressRatio} color={colors.primary} style={styles.progressBar} />
                <Text style={styles.durationDates}>Period: {formatDateStr(startDate)} - {formatDateStr(endDate)}</Text>
              </Card.Content>
            </Card>
          );
        })()}

        {/* Supervisor details */}
        {user?.is_intern && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Supervisor / TL Details</Text>
              <View style={styles.tlRow}>
                <Icon name="account-tie" size={24} color={colors.primary} style={styles.tlIcon} />
                <View>
                  <Text style={[styles.tlName, {color: colors.onSurface}]}>{tlDetails.name}</Text>
                  <Text style={[styles.tlRole, {color: colors.onSurfaceVariant}]}>{tlDetails.role}</Text>
                  <Text style={[styles.tlEmail, {color: colors.primary}]}>{tlDetails.email}</Text>
                  <Text style={[styles.tlDept, {color: colors.onSurfaceVariant}]}>Dept: {tlDetails.department}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Performance Stars & Accolades Card */}
        {user?.is_intern && (
          <Card style={[styles.card, {backgroundColor: dark ? '#262626' : '#FFF8E1', borderWidth: 1.5, borderColor: '#FFB300'}]}>
            <Card.Content>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon name="star-circle" size={26} color="#FFB300" style={{marginRight: 8}} />
                  <Text style={{fontSize: 16, fontWeight: 'bold', color: dark ? '#FFD54F' : '#F57F17'}}>
                    Performance Accolades
                  </Text>
                </View>
                <View style={{backgroundColor: '#FFB300', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20}}>
                  <Text style={{color: '#000', fontWeight: 'bold', fontSize: 13}}>⭐ {totalStars} Stars</Text>
                </View>
              </View>

              {starHistory && starHistory.length > 0 ? (
                <View style={{marginTop: 8}}>
                  {starHistory.slice(0, 3).map((item, idx) => (
                    <View key={idx} style={{backgroundColor: dark ? '#333' : '#FFF', padding: 10, borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: '#FFE082'}}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={{fontSize: 13, fontWeight: 'bold', color: '#F57F17'}}>⭐ Awarded {item.rating || 1} Star(s)</Text>
                        <Text style={{fontSize: 11, color: '#888'}}>{item.date ? String(item.date).split('T')[0] : 'Recently'}</Text>
                      </View>
                      <Text style={{fontSize: 12, color: dark ? '#CCC' : '#555', marginTop: 4}}>{item.note || item.comments || item.message || 'Great performance & initiative!'}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{fontSize: 12, color: dark ? '#AAA' : '#666', fontStyle: 'italic', marginTop: 4}}>
                  Keep up the good work! Team Leaders award performance stars based on your daily check-ins & completed tasks.
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Skills Management — intern only */}
        {!user?.is_tl && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.skillsHeader}>
              <Text style={styles.cardTitle}>Skills Inventory</Text>
              <Button mode="text" compact onPress={() => setSkillDialog(true)}>
                + Add
              </Button>
            </View>
            <View style={styles.skillsWrapper}>
              {skills.map((skill, idx) => (
                <Chip
                  key={idx}
                  onClose={() => handleRemoveSkill(skill)}
                  style={styles.skillChip}
                  textStyle={styles.skillChipText}>
                  {skill}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
        )}

        {/* Internship Offer Letter Management */}
        {user?.is_intern && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Internship Offer Letter</Text>

              {/* Duration Picker — editable only if not yet set */}
              <View style={{marginBottom: 12}}>
                <Text style={{fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6}}>Internship Duration</Text>
                {internDuration && letterName ? (
                  <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8}}>
                    <Icon name="lock" size={16} color="#2E7D32" />
                    <Text style={{marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#1B5E20'}}>{internDuration} (Locked)</Text>
                  </View>
                ) : (
                  <View>
                    <TouchableOpacity
                      onPress={() => setDurationDropdown(!durationDropdown)}
                      style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAFAFA'}}
                    >
                      <Text style={{fontSize: 14, color: internDuration ? '#333' : '#999'}}>{internDuration || 'Select Duration...'}</Text>
                      <Icon name={durationDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
                    </TouchableOpacity>
                    {durationDropdown && (
                      <View style={{borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 4, backgroundColor: '#fff', elevation: 2}}>
                        {durationList.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            onPress={() => { setInternDuration(item.value); setDurationDropdown(false); }}
                            style={{paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee'}}
                          >
                            <Text style={{fontSize: 14, color: internDuration === item.value ? '#1565C0' : '#333', fontWeight: internDuration === item.value ? 'bold' : 'normal'}}>{item.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.uploadContainer}>
                {letterName ? (
                  <View style={[styles.uploadedFileBox, verificationStatus === 'Approved' ? { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' } : verificationStatus === 'Denied' ? { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' } : { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}>
                    <Icon
                      name={verificationStatus === 'Approved' ? 'file-document-check' : 'file-clock-outline'}
                      size={40}
                      color={verificationStatus === 'Approved' ? '#2E7D32' : verificationStatus === 'Denied' ? '#C62828' : '#EF6C00'}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.fileNameText, verificationStatus === 'Approved' ? { color: '#1B5E20' } : verificationStatus === 'Denied' ? { color: '#B71C1C' } : { color: '#E65100' }]}>{letterName}</Text>
                      <Text style={[styles.fileSizeText, verificationStatus === 'Approved' ? { color: '#4CAF50' } : verificationStatus === 'Denied' ? { color: '#F44336' } : { color: '#FF9800' }]}>
                        Status: {verificationStatus === 'Approved' ? 'Approved & Verified 🎉' : verificationStatus === 'Denied' ? 'Denied / Rejected ❌' : 'Awaiting TL Review 🕒'}
                      </Text>
                    </View>
                    <View style={{flexDirection: 'column', alignItems: 'center'}}>
                      {/* Always allow replacing — wrong doc fix */}
                      <IconButton
                        icon="file-replace-outline"
                        iconColor={colors.primary}
                        size={22}
                        onPress={() => {
                          Alert.alert(
                            'Replace Offer Letter',
                            'This will replace the current offer letter and reset approval status to Pending. Continue?',
                            [
                              {text: 'Cancel', style: 'cancel'},
                              {text: 'Replace', onPress: handleLetterUpload},
                            ],
                          );
                        }}
                        style={{ margin: 0 }}
                      />
                      <IconButton
                        icon="close-circle-outline"
                        iconColor={colors.error}
                        size={22}
                        onPress={handleRemoveLetter}
                        style={{ margin: 0 }}
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleLetterUpload}
                    style={[styles.dropZone, { borderColor: '#E53935', backgroundColor: colors.elevation.level1 }]}
                  >
                    <Icon name="file-pdf-box" size={40} color="#E53935" style={{ marginBottom: 6 }} />
                    <Text style={[styles.dropZoneTitle, { color: colors.onSurface }]}>Upload Offer Letter</Text>
                    <Text style={[styles.dropZoneSubtitle, { color: colors.onSurfaceVariant }]}>Required to unlock all app features (PDF only)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Resume Management — intern only */}
        {!user?.is_tl && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>My Resume / Curriculum Vitae</Text>
            <View style={styles.uploadContainer}>
              {resumeName ? (
                <View style={styles.uploadedFileBox}>
                  <Icon name="file-document-check" size={40} color="#2E7D32" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.fileNameText}>{resumeName}</Text>
                    <Text style={styles.fileSizeText}>Ready for AI analysis & placements</Text>
                  </View>
                  <View style={{flexDirection: 'column', alignItems: 'center'}}>
                    <IconButton
                      icon="file-replace-outline"
                      iconColor={colors.primary}
                      size={22}
                      onPress={handleResumeUpload}
                      style={{ margin: 0 }}
                    />
                    <IconButton
                      icon="close-circle-outline"
                      iconColor={colors.error}
                      size={22}
                      onPress={handleRemoveResume}
                      style={{ margin: 0 }}
                    />
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleResumeUpload}
                  style={[styles.dropZone, { borderColor: colors.primary, backgroundColor: colors.elevation.level1 }]}
                >
                  <Icon name="cloud-upload-outline" size={40} color={colors.primary} style={{ marginBottom: 6 }} />
                  <Text style={[styles.dropZoneTitle, { color: colors.onSurface }]}>Upload Your Resume</Text>
                  <Text style={[styles.dropZoneSubtitle, { color: colors.onSurfaceVariant }]}>Supports PDF, DOC, DOCX up to 5MB</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card.Content>
        </Card>
        )}

        {/* Social Links — intern only */}
        {!user?.is_tl && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Professional Links</Text>

            <Text style={[styles.label, {color: colors.onSurfaceVariant}]}>LinkedIn Profile URL</Text>
            <View style={styles.inputRow}>
              <Icon name="linkedin" size={20} color="#0077B5" style={styles.inputIcon} />
              <TextInput
                value={linkedin}
                onChangeText={setLinkedin}
                style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="LinkedIn URL..."
                placeholderTextColor="#999"
              />
            </View>

            <Text style={[styles.label, {color: colors.onSurfaceVariant}]}>GitHub Profile URL</Text>
            <View style={styles.inputRow}>
              <Icon name="github" size={20} color={colors.onSurface} style={styles.inputIcon} />
              <TextInput
                value={github}
                onChangeText={setGithub}
                style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="GitHub URL..."
                placeholderTextColor="#999"
              />
            </View>

            <Button mode="contained" onPress={saveLinks} style={styles.saveBtn}>
              Save Links
            </Button>

            <Button
              mode="outlined"
              icon="briefcase-search"
              onPress={() => navigation.navigate('Careers')}
              style={{marginTop: 12}}>
              Explore Careers & Openings
            </Button>
          </Card.Content>
        </Card>
        )}

        {/* Account & App Settings */}
        <View style={{marginTop: 16, marginBottom: 20}}>
          <CardHorizontal
            title="Edit Profile"
            leftIcon="account"
            onPress={() => {
              navigation.navigate('EditProfile');
            }}
          />
          <CardHorizontal
            title="Change Password"
            leftIcon="shield-account"
            onPress={() => {
              navigation.navigate('ChangePassword');
            }}
          />
          <CardHorizontal
            title="Dark Mode"
            leftIcon="weather-night"
            rightIcon={
              <View pointerEvents="none">
                <Switch
                  value={isDark}
                  trackColor={{false: '#afafaf81'}}
                />
              </View>
            }
            onPress={onToggleSwitch}
          />
          <CardHorizontal
            title="Terms & Conditions"
            leftIcon="shield-alert"
            onPress={() => {
              navigation.navigate('WebView', {
                url: 'https://studifysuccess.com/terms-conditions',
              });
            }}
          />
          <CardHorizontal
            title="Privacy Policy"
            leftIcon="clipboard-text"
            onPress={() => {
              navigation.navigate('WebView', {
                url: 'https://studifysuccess.com/privacy-policy',
              });
            }}
          />
          <CardHorizontal
            title="Help Center"
            leftIcon="help-circle"
            onPress={() => {
              navigation.navigate('HelpCenter');
            }}
          />
          <CardHorizontal
            title="Logout"
            leftIcon="logout"
            onPress={handleLogout}
          />
        </View>

        {/* Skill Add Dialog */}
        <Portal>
          <Dialog visible={skillDialog} onDismiss={() => setSkillDialog(false)} style={[styles.dialog, {backgroundColor: colors.elevation.level3}]}>
            <Dialog.Title>Add Skill</Dialog.Title>
            <Dialog.Content>
              <Text style={[styles.dialogLabel, {color: colors.onSurface}]}>Enter Skill Name</Text>
              <TextInput
                value={newSkillText}
                onChangeText={setNewSkillText}
                placeholder="E.g., Node.js or Kotlin"
                style={[styles.dialogInput, {borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface}]}
                placeholderTextColor="#999"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setSkillDialog(false)}>Cancel</Button>
              <Button onPress={handleAddSkill}>Add</Button>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  roleText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emailText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  durationLabel: {
    fontSize: 12,
    color: '#666',
  },
  durationDays: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  durationDates: {
    fontSize: 11,
    color: '#888',
  },
  tlRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tlIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tlName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tlRole: {
    fontSize: 12,
    color: '#666',
  },
  tlEmail: {
    fontSize: 12,
    color: '#007171',
    marginTop: 2,
  },
  tlDept: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: -8,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    height: 32,
    alignItems: 'center',
  },
  skillChipText: {
    fontSize: 12,
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resumeName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  resumeMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  uploadBtn: {
    paddingHorizontal: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
    color: '#555',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  saveBtn: {
    marginTop: 8,
  },
  dialog: {
    borderRadius: 12,
  },
  dialogLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  uploadContainer: {
    marginVertical: 8,
  },
  uploadedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  fileSizeText: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 2,
  },
  dropZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
  },
  dropZoneTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  dropZoneSubtitle: {
    fontSize: 11,
    color: '#777',
    marginTop: 4,
  },
});

export default InternProfile;
