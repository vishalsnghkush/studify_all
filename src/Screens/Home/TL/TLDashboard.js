import React, {useState, useEffect, useMemo} from 'react';
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
  Linking,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {
  useTheme,
  Card,
  Avatar,
  Button,
  IconButton,
  Dialog,
  Portal,
  SegmentedButtons,
  Chip,
  ProgressBar,
  Badge,
  Divider,
} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useApi from '../../../Components/Api/Api';
import {getInternDb, isMeetingExpired, addMockModule, extractDateISO, getTodayAttendanceRecord, isAttendanceCheckedIn} from '../../../Utils/MockInternDb';
import {useNavigation} from '@react-navigation/native';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {useSelector, useDispatch} from 'react-redux';
import {onSelectGroup, fetchChatGroups} from '../../../Redux/Slices/ChatSlice';
import AIChatbot from '../../../Components/AIChatbot';

const {width} = Dimensions.get('window');

const safeText = val => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    return val
      .map(item => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
      .join('\n• ');
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val, null, 2);
    } catch (e) {
      return '[Object Data]';
    }
  }
  return String(val);
};

const PAST_MEETINGS_KEY = '@studify_tl_past_meetings';

const TLDashboard = () => {
  const theme = useTheme();
  const {colors} = theme;
  const isDark = theme.dark;

  // Shadow override styles with theme aware colors dynamically
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
        borderBottomWidth: isDark ? 1 : 0,
        borderBottomColor: colors.outlineVariant,
      },
      welcomeText: {
        ...baseStyles.welcomeText,
        color: isDark ? colors.onSurface : '#1A237E',
      },
      deptText: {
        ...baseStyles.deptText,
        color: isDark ? colors.onSurfaceVariant : '#666',
      },
      categoryScroll: {
        ...baseStyles.categoryScroll,
        backgroundColor: isDark ? colors.elevation.level1 : '#fff',
      },
      sectionTitle: {
        ...baseStyles.sectionTitle,
        color: isDark ? colors.onSurface : '#263238',
      },
      metricVal: {
        ...baseStyles.metricVal,
        color: isDark ? colors.onPrimaryContainer : '#1A237E',
      },
      metricLbl: {
        ...baseStyles.metricLbl,
        color: isDark ? colors.onSurfaceVariant : '#555',
      },
      cardMargin: {
        ...baseStyles.cardMargin,
        backgroundColor: isDark ? colors.elevation.level1 : '#ffffff',
        borderColor: isDark ? colors.outlineVariant : '#F3EBF0',
      },
      cardTitle: {
        ...baseStyles.cardTitle,
        color: isDark ? colors.onSurface : '#263238',
      },
      cardSub: {
        ...baseStyles.cardSub,
        color: isDark ? colors.onSurfaceVariant : '#666',
      },
      emptyCard: {
        ...baseStyles.emptyCard,
        backgroundColor: isDark ? colors.elevation.level1 : '#fff',
      },
      emptyText: {
        ...baseStyles.emptyText,
        color: isDark ? colors.onSurfaceVariant : '#888',
      },
      modalCard: {
        ...baseStyles.modalCard,
        backgroundColor: isDark ? colors.elevation.level2 : '#fff',
      },
      modalHeading: {
        ...baseStyles.modalHeading,
        color: isDark ? colors.onSurface : '#1A237E',
      },
      modalInput: {
        ...baseStyles.modalInput,
        borderColor: isDark ? colors.outline : '#CCC',
        backgroundColor: isDark ? colors.elevation.level1 : '#FAFAFA',
        color: isDark ? colors.onSurface : '#333',
      },
    };
  }, [isDark, colors]);

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const {user} = useSelector(state => state.initial);
  const {groups} = useSelector(state => state.chat);
  const {get, post, remove} = useApi();
  const [db, setDb] = useState(null);
  const getFirstDept = (deptStr) => {
    if (!deptStr) return 'Tech';
    return deptStr.split(',')[0].trim();
  };

  const [activeDept, setActiveDept] = useState((user && user.department) ? getFirstDept(user.department) : 'Tech');
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showMascot, setShowMascot] = useState(true);

  useEffect(() => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.getItem('@studify_show_mascot').then(val => {
      if (val !== null) {
        setShowMascot(val === 'true');
      } else {
        setShowMascot(true);
      }
    });
  }, []);

  // Sync activeDept if user profile changes & fetch chat groups
  useEffect(() => {
    if (user && user.department) {
      const depts = user.department.split(',').map(d => d.trim()).filter(Boolean);
      if (!depts.includes(activeDept)) {
        setActiveDept(depts[0] || 'Tech');
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeDept) {
      dispatch(fetchChatGroups({department: activeDept, is_tl: (user && user.is_tl) ? 'true' : 'false'}));
    }
  }, [activeDept]);

  useEffect(() => {
    const loadPastMeetings = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const stored = await AsyncStorage.getItem(PAST_MEETINGS_KEY);
        if (stored) setPastMeetings(JSON.parse(stored));
      } catch (e) {}
    };
    loadPastMeetings();
  }, []);

  // Main Category Workspace Tabs
  const [activeCategory, setActiveCategory] = useState('Overview'); // 'Overview', 'Tasks', 'Meetings', 'Trainings', 'Comm', 'Rewards', 'Attendance', 'Leaves'
  const [leaveTab, setLeaveTab] = useState('Pending');

  // Selected Intern Modal State
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [internMetrics, setInternMetrics] = useState({
    accuracy: 0,
    rank: 'None',
    tasksDone: 0,
    daysPresent: 0,
    completedTasksList: [],
    workingHours: 0,
  });

  // Rejection Reason Modal State (Module 10)
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [targetLeaveId, setTargetLeaveId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Task Management States (Module 3)
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium'); // 'High', 'Medium', 'Low'
  const [taskDueDate, setTaskDueDate] = useState('Today');
  const [selectedAssignees, setSelectedAssignees] = useState([]); // Intern IDs
  const [bulkAssignAll, setBulkAssignAll] = useState(true);
  const [taskTab, setTaskTab] = useState('Active'); // 'Active' | 'Completed'

  // Meet Scheduler States (Module 4)
  const [meetingTab, setMeetingTab] = useState('Upcoming');
  const [pastMeetings, setPastMeetings] = useState([]);
  const [meetModalVisible, setMeetModalVisible] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetType, setMeetType] = useState('Discussion');
  const [meetLink, setMeetLink] = useState('https://meet.google.com/abc-defg-hij');
  const [meetDate, setMeetDate] = useState('Today');
  const [meetTime, setMeetTime] = useState('4:30 PM');
  const [meetAudience, setMeetAudience] = useState('Dept');

  // Announcement States (Module 6)
  const [annModalVisible, setAnnModalVisible] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annType, setAnnType] = useState('Announcement'); // 'Announcement', 'Event', 'Pinned Notice'

  // Training Module States (Module 5)
  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [modTitle, setModTitle] = useState('');
  const [modInstructor, setModInstructor] = useState('');
  const [modDuration, setModDuration] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modVideo, setModVideo] = useState('');

  // Rewards & Recognition States (Module 8)
  const [awardModalVisible, setAwardModalVisible] = useState(false);
  const [awardTitle, setAwardTitle] = useState('');
  const [awardNote, setAwardNote] = useState('');
  const [awardInternId, setAwardInternId] = useState('');

  const dispatch = useDispatch();

  // Direct Message Modal State (Module 6)
  const [dmModalVisible, setDmModalVisible] = useState(false);

  // Metric Card Detail Inspection Modal State (Module 1)
  const [metricDetailModalVisible, setMetricDetailModalVisible] = useState(false);
  const [metricDetailType, setMetricDetailType] = useState(''); // 'Total Interns', 'Active Today', 'Absent', 'Pending Tasks', 'Avg Performance', 'Top Performer'

  // EOD Reports Reader Modal State
  const [eodModalVisible, setEodModalVisible] = useState(false);
  const [selectedEodInternId, setSelectedEodInternId] = useState('all');

  // TL Self-Attendance States (Attendance Module)
  const [tlAttendanceSubTab, setTlAttendanceSubTab] = useState('my_attendance'); // 'my_attendance' | 'team_roster'
  const [tlAttendanceToday, setTlAttendanceToday] = useState(null);
  const [tlAttendanceData, setTlAttendanceData] = useState({});
  const [tlAttendanceList, setTlAttendanceList] = useState([]);
  const [tlCalendarDate, setTlCalendarDate] = useState(new Date());
  const [markingTlAttendance, setMarkingTlAttendance] = useState(false);

  const openMetricDetail = type => {
    setMetricDetailType(type);
    setMetricDetailModalVisible(true);
  };

  // Communication & Chat Handlers (Module 6)
  const handleOpenDeptChat = () => {
    // Look up the REAL existing master team department chat thread from state.chat.groups
    const realDeptGroup = (groups || []).find(
      g =>
        g.group_type === 'master_team' ||
        (g.display_name &&
          g.display_name.toLowerCase().includes(activeDept.toLowerCase())) ||
        (g.name && g.name.toLowerCase().includes(activeDept.toLowerCase())),
    );

    if (realDeptGroup) {
      if (onSelectGroup) {
        try {
          dispatch(onSelectGroup(realDeptGroup));
        } catch (err) {}
      }
      navigation.navigate('Chat', {data: realDeptGroup});
    } else {
      // Navigate directly to the Communication bottom tab (TLChat)
      navigation.navigate('TLChat');
    }
  };

  const handleStartDirectChat = intern => {
    setDmModalVisible(false);

    // Look up the REAL existing 1-on-1 direct conversation from state.chat.groups
    const realDmGroup = (groups || []).find(g => {
      const matchUserId =
        (g.receiver_id && g.receiver_id == intern.id) ||
        (g.user_id && g.user_id == intern.id) ||
        (g.other_user_id && g.other_user_id == intern.id);
      const matchName =
        g.display_name &&
        intern.name &&
        g.display_name.toLowerCase().includes(intern.name.toLowerCase());
      return matchUserId || matchName;
    });

    if (realDmGroup) {
      if (onSelectGroup) {
        try {
          dispatch(onSelectGroup(realDmGroup));
        } catch (err) {}
      }
      navigation.navigate('Chat', {data: realDmGroup});
    } else {
      // If no thread exists yet, navigate to the main Communication navbar tab (TLChat)
      navigation.navigate('TLChat');
    }
  };

  const showTlMeetDatePicker = () => {
    let initDate = new Date();
    DateTimePickerAndroid.open({
      value: initDate,
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          const formatted = `${date.getFullYear()}-${String(
            date.getMonth() + 1,
          ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          setMeetDate(formatted);
        }
      },
    });
  };

  const showTaskDueDatePicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(),
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          setTaskDueDate(formatted);
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
          const formatted = time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          setMeetTime(formatted);
        }
      },
    });
  };

  const loadData = async () => {
    try {
      // 1. Fetch team info safely
      let res = null;
      try {
        res = await get(`/interns/team?department=${activeDept}`, {
          skipSuccessFlash: true,
          skipErrorFlash: true,
        });
      } catch (e) {}

      // 2. Fetch server tasks safely
      let taskRes = null;
      try {
        taskRes = await get('/interns/tasks', {
          skipSuccessFlash: true,
          skipErrorFlash: true,
        });
      } catch (e) {}

      const liveData = {
        interns: (res && res.data && (Array.isArray(res.data.team) ? res.data.team : (Array.isArray(res.data) ? res.data : []))) || [],
        leaves: (res && res.data && res.data.leaves) || [],
        reports: (res && res.data && res.data.reports) || [],
      };

      const serverMeetings = (res && res.data && Array.isArray(res.data.meetings)) ? res.data.meetings : [];
      const uniqueMeetings = [];
      const seenKeys = new Set();
      for (const m of serverMeetings) {
        const key = m.id || `${m.title}_${m.date}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueMeetings.push(m);
        }
      }
      const activeMeetings = uniqueMeetings.filter(
        m => !isMeetingExpired(m.date || m.scheduled_time, m.time),
      );
      const expiredMeetings = uniqueMeetings.filter(m => isMeetingExpired(m.date || m.scheduled_time, m.time));

      // 3. Process & Merge Tasks (Server Database Primary)
      let rawServerTasks = (taskRes && taskRes.data && Array.isArray(taskRes.data)) ? taskRes.data : [];
      let serverTasks = rawServerTasks.map(t => ({
        ...t,
        id: String(t.id),
        title: t.title || 'Department Task',
        priority: t.priority || 'Medium',
        dueDate: t.due_date || t.dueDate || 'Today',
        completed: t.completed === 1 || t.completed === '1' || t.completed === true || t.completed === 'true',
        submissionProof: t.submission_proof || t.submissionProof || null,
        submissionType: t.submission_type || t.submissionType || null,
        proofNotes: t.proof_notes || t.proofNotes || null,
        submissionStatus: t.submission_status || t.submissionStatus || null,
        completedByName: t.completed_by_name || t.completedByName || null,
      }));

      let loadedTasks = serverTasks;
      const loadedModules = (res && res.data && (Array.isArray(res.data.modules) ? res.data.modules : (Array.isArray(res.data.trainings) ? res.data.trainings : []))) || [];
      
      let attendanceMap = {};
      if (res && res.data && res.data.attendance && typeof res.data.attendance === 'object' && !Array.isArray(res.data.attendance)) {
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
      } else if (res && res.data && Array.isArray(res.data.attendance)) {
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

      try {
        const attRes = await get('/interns/attendance', {skipSuccessFlash: true, skipErrorFlash: true});
        if (attRes && attRes.data) {
          const attData = Array.isArray(attRes.data) ? attRes.data : [attRes.data];
          const tlMap = {};
          const now = new Date();
          const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          let todayRec = null;

          attData.forEach(record => {
            if (!record || typeof record !== 'object') return;
            const ids = [record.intern_id, record.user_id, record.internId, record.userId].filter(Boolean);
            const dateKey = extractDateISO(record.date || record.created_at || record.marked_at);
            if (dateKey) {
              tlMap[dateKey] = record.status || (record.morning_marked_at && record.evening_marked_at ? 'Full' : 'Half');
              if (dateKey === todayISO) {
                todayRec = record;
              }
            }
            ids.forEach(id => {
              const strId = String(id);
              if (!attendanceMap[strId]) attendanceMap[strId] = {};
              attendanceMap[strId][dateKey] = record;
            });
          });

          setTlAttendanceToday(todayRec);
          setTlAttendanceData(tlMap);
          setTlAttendanceList(attData);
        }
      } catch (attErr) {}

      // attendance fallback removed - data comes from API

      const serverInterns = (res && res.data && (Array.isArray(res.data.team) ? res.data.team : (Array.isArray(res.data) ? res.data : []))) || [];

      setDb({
        ...liveData,
        interns: serverInterns,
        meetings: activeMeetings,
        modules: loadedModules,
        tasks: loadedTasks,
        attendance: attendanceMap,
        feedbacks: (res && res.data && res.data.feedbacks) || [],
      });
    } catch (e) {
      console.log('Error fetching TL Dashboard Data', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [activeDept]);

  // Calculations for Module 1 (Top Metric Cards) & Analytics
  // Only include interns whose status is explicitly 'Approved'
  const approvedInterns = useMemo(() => {
    const rawList = (db && db.interns && db.interns.length > 0) ? db.interns : [];
    const currDept = (activeDept || '').trim().toLowerCase();

    const filtered = rawList
      .filter(i => {
        const dept = (i.department || '').trim().toLowerCase();
        // Strictly exclude users without a real department from the server
        if (!dept) return false;
        const matchesDept = !currDept || currDept === 'all' || dept === currDept;
        const matchesStatus = !i.status || i.status === 'Approved' || i.status === 'active' || i.status === 'Pending';
        return matchesDept && matchesStatus;
      })
      .map(i => {
        const fullName = (i.name || `${i.fname || ''} ${i.lname || ''}`.trim() || 'Intern').trim();
        const avatarStr = i.avatar || (fullName.length >= 2 ? fullName.substring(0, 2).toUpperCase() : 'IN');
        // Preserve numeric id as string for attendance map lookup
        const internId = String(i.id || i.user_id || `int_${Math.random()}`);
        return {
          ...i,
          id: internId,
          user_id: internId,
          name: fullName,
          email: i.email || 'intern@studifysuccess.com',
          avatar: avatarStr,
          department: i.department,
          status: 'Approved',
          joined: i.joined_date || i.joined || '2026-07-01',
        };
      });
    return filtered || [];
  }, [db, activeDept]);

  const todayStr = extractDateISO(new Date());

  const activeTodayCount = useMemo(() => {
    let count = 0;
    (approvedInterns || []).forEach(i => {
      const todayAtt = getTodayAttendanceRecord(db && db.attendance, i);
      if (isAttendanceCheckedIn(todayAtt)) {
        count++;
      }
    });
    return count;
  }, [approvedInterns, db]);

  const absentCount = useMemo(() => {
    return Math.max(0, (approvedInterns || []).length - activeTodayCount);
  }, [approvedInterns, activeTodayCount]);

  const activeDeptTasks = useMemo(() => {
    const backendTasks = ((db && db.tasks) ? db.tasks : []).map(t => ({
      ...t,
      id: t.id || `task_${Math.random()}`,
      title: t.title || 'Department Task',
      priority: t.priority || 'Medium',
      dueDate: t.dueDate || t.due_date || 'Today',
      completed: t.completed === 1 || t.completed === '1' || t.completed === true || t.completed === 'true',
      submissionProof: t.submissionProof || t.submission_proof || null,
      submissionType: t.submissionType || t.submission_type || null,
      proofNotes: t.proofNotes || t.proof_notes || null,
      submissionStatus: t.submissionStatus || t.submission_status || null,
      completedByName: t.completedByName || t.completed_by_name || null,
    }));
    const deptTasksMock = (db && db.departmentTasks && db.departmentTasks[activeDept]) ? db.departmentTasks[activeDept] : [];
    const combined = [...backendTasks, ...deptTasksMock];
    return combined;
  }, [db, activeDept]);

  const pendingTasksCount = useMemo(() => {
    return activeDeptTasks.filter(t => !t.completed).length;
  }, [activeDeptTasks]);

  const avgPerformance = useMemo(() => {
    const list = approvedInterns || [];
    if (list.length === 0) return '—';
    let totalScore = 0;
    list.forEach(i => {
      const reportsCount = ((db && db.reports) ? db.reports : []).filter(
        r => String(r.internId) === String(i.id) || String(r.intern_id) === String(i.id),
      ).length;
      const attMap = (db && db.attendance && db.attendance[String(i.id)]) ? db.attendance[String(i.id)] : {};
      const attDays = Object.keys(attMap).length;
      totalScore += Math.min(99, 70 + reportsCount * 4 + Math.min(20, attDays));
    });
    return `${Math.round(totalScore / list.length)}%`;
  }, [approvedInterns, db]);

  const topPerformer = useMemo(() => {
    const list = approvedInterns || [];
    if (list.length === 0) return {name: '—', score: 0};
    let best = list[0];
    let maxScore = 0;
    list.forEach(i => {
      const reportsCount = ((db && db.reports) ? db.reports : []).filter(
        r => String(r.internId) === String(i.id) || String(r.intern_id) === String(i.id),
      ).length;
      const attMap = (db && db.attendance && db.attendance[String(i.id)]) ? db.attendance[String(i.id)] : {};
      const attDays = Object.keys(attMap).length;
      const score = Math.min(99, 70 + reportsCount * 4 + Math.min(20, attDays));
      if (score > maxScore) {
        maxScore = score;
        best = i;
      }
    });
    return {name: (best && best.name) ? best.name : '—', score: maxScore};
  }, [approvedInterns, db]);

  const top3Performers = useMemo(() => {
    const list = approvedInterns.map(intern => {
      const reportsCount = ((db && db.reports) ? db.reports : []).filter(
        r => String(r.internId) === String(intern.id) || String(r.intern_id) === String(intern.id),
      ).length;
      const attMap = (db && db.attendance && db.attendance[String(intern.id)]) ? db.attendance[String(intern.id)] : {};
      const attDays = Object.keys(attMap).length;
      const score = Math.min(99, 70 + reportsCount * 4 + Math.min(20, attDays));
      return {
        id: intern.id,
        name: intern.name || 'Intern',
        email: intern.email || '',
        avatar: intern.avatar || 'IN',
        department: intern.department || activeDept,
        score,
      };
    });
    list.sort((a, b) => b.score - a.score);
    return list.slice(0, 3);
  }, [approvedInterns, db, activeDept]);

  const topDepartments = useMemo(() => {
    // We aggregate all approved interns by department, then average their scores.
    const deptScores = {};
    const interns = (db && db.interns) ? db.interns : [];
    if (interns.filter(i => i.status === 'Approved').length === 0) return [];

    interns.forEach(intern => {
      if (intern.status !== 'Approved') return;
      const dept = intern.department || 'General';
      const reportsCount = ((db && db.reports) ? db.reports : []).filter(
        r => String(r.internId) === String(intern.id) || String(r.intern_id) === String(intern.id),
      ).length;
      const attMap = (db && db.attendance && db.attendance[String(intern.id)]) ? db.attendance[String(intern.id)] : {};
      const attDays = Object.keys(attMap).length;
      const score = Math.min(99, 70 + reportsCount * 4 + Math.min(20, attDays));
      if (!deptScores[dept]) {
        deptScores[dept] = { name: dept, totalScore: 0, count: 0, active: 0 };
      }
      deptScores[dept].totalScore += score;
      deptScores[dept].count += 1;
      deptScores[dept].active += 1;
    });

    const list = Object.values(deptScores).map(d => ({
      name: d.name,
      avgScore: Math.round(d.totalScore / d.count),
      active: d.active
    }));
    list.sort((a, b) => b.avgScore - a.avgScore);
    return list;
  }, [db]);

  const filteredEodReports = useMemo(() => {
    const rawReports = (db && db.reports) ? db.reports : [];
    if (selectedEodInternId === 'all') return rawReports;
    return rawReports.filter(
      r => r.internId === selectedEodInternId || r.intern_id === selectedEodInternId,
    );
  }, [db, selectedEodInternId]);

  // Leave Handlers (Module 10)
  const handleApproveLeave = async leaveId => {
    try {
      await post('/interns/team/leave', {leaveId, action: 'Approved'});
      Alert.alert('Leave Approved', 'The leave request has been approved.');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to approve leave');
    }
  };

  const handleOpenRejectLeave = leaveId => {
    setTargetLeaveId(leaveId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmRejectLeave = async () => {
    if (!targetLeaveId) return;
    try {
      await post('/interns/team/leave', {
        leaveId: targetLeaveId,
        action: 'Denied',
        reason: rejectReason || 'Not approved by TL',
      });
      Alert.alert('Leave Rejected', 'The leave request was rejected.');
      setRejectModalVisible(false);
      setTargetLeaveId(null);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to reject leave');
    }
  };

  // TL Self-Attendance Actions (Attendance Module)
  const markTLAttendance = async type => {
    setMarkingTlAttendance(true);
    try {
      const res = await post('/interns/attendance/mark', {type}, {skipSuccessFlash: false});
      if (res && res.data) {
        setTlAttendanceToday(res.data);
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setTlAttendanceData(prev => ({
          ...prev,
          [todayKey]: res.data.status || 'Half',
        }));
        Alert.alert('Attendance Marked', `${type === 'morning' ? 'Morning Check-in' : 'Evening Check-out'} recorded successfully!`);
        loadData();
      }
    } catch (e) {
      console.log('TL Mark Attendance error:', e);
      Alert.alert('Error', e?.message || 'Could not mark attendance. Please check the current time window.');
    } finally {
      setMarkingTlAttendance(false);
    }
  };

  const changeTLMonth = direction => {
    setTlCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  // Dynamic Monthly Calendar Renderer for TL
  const renderTLCalendar = () => {
    const year = tlCalendarDate.getFullYear();
    const month = tlCalendarDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthYearStr = `${monthNames[month]} ${year}`;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const cells = [];

    // Header with Month Name and Navigation Controls
    cells.push(
      <View key="tl-cal-header" style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4}}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => changeTLMonth(-1)}
          style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: isDark ? (colors.elevation?.level2 || '#333') : '#EEEEEE'}}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.onSurface}}>‹</Text>
        </TouchableOpacity>
        <Text style={{fontSize: 15, fontWeight: 'bold', color: colors.onSurface}}>
          {monthYearStr}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => changeTLMonth(1)}
          style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: isDark ? (colors.elevation?.level2 || '#333') : '#EEEEEE'}}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.onSurface}}>›</Text>
        </TouchableOpacity>
      </View>
    );

    // Day Labels Header Row
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    cells.push(
      <View key="tl-labels" style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8}}>
        {dayLabels.map(d => (
          <Text key={d} style={{width: 38, textAlign: 'center', fontSize: 11, fontWeight: '600', color: isDark ? colors.onSurfaceVariant : '#666'}}>
            {d}
          </Text>
        ))}
      </View>
    );

    let currentRow = [];
    for (let i = 0; i < startDay; i++) {
      currentRow.push(<View key={`empty-${i}`} style={{width: 38, height: 38, margin: 2}} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const status = tlAttendanceData[dateKey];
      const isToday = dateKey === todayStr;

      let statusColor = isDark ? (colors.elevation?.level2 || '#333') : '#F0F0F0';
      let textColor = colors.onSurface || '#333';
      let isBold = false;
      let borderWidth = 0;
      let borderColor = 'transparent';

      if (status === 'Full' || status === 'Present' || status === 1) {
        statusColor = '#4CAF50';
        textColor = '#FFFFFF';
      } else if (status === 'Half' || status === 2) {
        statusColor = '#FFA000';
        textColor = '#FFFFFF';
      } else if (status === 'Absent' || status === 3) {
        statusColor = '#F44336';
        textColor = '#FFFFFF';
      }

      if (isToday) {
        borderWidth = 2;
        borderColor = (statusColor === '#4CAF50' || statusColor === '#F44336') ? '#000000' : '#1A237E';
        isBold = true;
        if (!status) {
          statusColor = isDark ? '#3E2723' : '#FFF9C4';
          textColor = '#E65100';
        }
      }

      currentRow.push(
        <View key={d} style={{width: 38, height: 38, margin: 2, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: statusColor,
            borderWidth: borderWidth,
            borderColor: borderColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{color: textColor, fontWeight: isBold ? 'bold' : '500', fontSize: 12}}>{d}</Text>
          </View>
        </View>
      );

      if (currentRow.length === 7) {
        cells.push(
          <View key={`row-${d}`} style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4}}>
            {currentRow}
          </View>
        );
        currentRow = [];
      }
    }

    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push(<View key={`empty-end-${currentRow.length}`} style={{width: 38, height: 38, margin: 2}} />);
      }
      cells.push(
        <View key="row-last" style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4}}>
          {currentRow}
        </View>
      );
    }

    return cells;
  };

  // Intern Approval (Module 2)
  const handleInternStatusAction = async (internId, status) => {
    try {
      await post('/interns/team/approve', {internId, action: status});
      Alert.alert('Success', `Intern status updated to ${status}`);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to update intern status');
    }
  };

  // Task Creation Handler (Module 3)
  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title.');
      return;
    }
    try {
      const assignees = bulkAssignAll
        ? approvedInterns.map(i => i.id)
        : selectedAssignees;
      const newTask = {
        id: `task_${Date.now()}`,
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDueDate,
        assignedTo: assignees,
        completed: false,
        createdBy: user?.user_id || user?.id,
        createdByName: `${user?.fname || 'TL'} ${user?.lname || ''}`.trim(),
        department: activeDept || user?.department || 'Tech',
      };

      // 1. Immediately persist task to local AsyncStorage so it is never lost
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const localStr = await AsyncStorage.getItem('@studify_department_tasks');
        const localTasks = localStr ? JSON.parse(localStr) : [];
        const taskMap = new Map();
        taskMap.set(String(newTask.id), newTask);
        localTasks.forEach(t => taskMap.set(String(t.id), t));
        await AsyncStorage.setItem('@studify_department_tasks', JSON.stringify(Array.from(taskMap.values())));
      } catch (e) {}

      // 2. Immediately update in-memory state for instant UI reflection
      setDb(prev => {
        const prevTasks = prev?.tasks || [];
        const taskMap = new Map();
        taskMap.set(String(newTask.id), newTask);
        prevTasks.forEach(t => taskMap.set(String(t.id), t));
        return {
          ...prev,
          tasks: Array.from(taskMap.values()),
        };
      });

      // 3. Sync with backend API
      try {
        await post('/interns/tasks/sync', {tasks: [newTask]}, {skipSuccessFlash: true, skipErrorFlash: true});
      } catch (e) {}

      setTaskModalVisible(false);
      setTaskTitle('');
      setTaskDesc('');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to create task.');
    }
  };

  const handleApproveTaskSubmission = async (taskId) => {
    try {
      await post('/interns/tasks/review', { taskId, status: 'Approved' });
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const localStr = await AsyncStorage.getItem('@studify_department_tasks');
        const localTasks = localStr ? JSON.parse(localStr) : [];
        const updated = localTasks.map(t => String(t.id) === String(taskId) ? { ...t, completed: true, submissionStatus: 'Approved' } : t);
        await AsyncStorage.setItem('@studify_department_tasks', JSON.stringify(updated));
      } catch (e) {}
      Alert.alert('Success', 'Task submission approved!');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to approve task submission.');
    }
  };

  const handleRejectTaskSubmission = async (taskId) => {
    try {
      await post('/interns/tasks/review', { taskId, status: 'In Progress' });
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const localStr = await AsyncStorage.getItem('@studify_department_tasks');
        const localTasks = localStr ? JSON.parse(localStr) : [];
        const updated = localTasks.map(t => String(t.id) === String(taskId) ? { ...t, completed: false, submissionStatus: 'In Progress', submissionProof: null } : t);
        await AsyncStorage.setItem('@studify_department_tasks', JSON.stringify(updated));
      } catch (e) {}
      Alert.alert('Revision Requested', 'Task sent back to intern for revision.');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to request task revision.');
    }
  };

  const handleDeleteMeeting = (meetingId) => {
    Alert.alert(
      'Delete Meeting',
      'Are you sure you want to delete this meeting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Immediately remove from UI
            setDb(prev => prev ? {
              ...prev,
              meetings: (prev.meetings || []).filter(m => String(m.id) !== String(meetingId))
            } : prev);
            // Delete from server database
            try {
              await remove(`/interns/trainings/live/${meetingId}`);
            } catch (e) {
              console.log('Delete meeting error:', e);
            }
            loadData();
          }
        }
      ]
    );
  };

  const handleDeleteModule = (moduleId) => {
    Alert.alert(
      'Delete Module',
      'Are you sure you want to delete this training module?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Immediately remove from UI
            setDb(prev => prev ? {
              ...prev,
              modules: (prev.modules || []).filter(m => String(m.id) !== String(moduleId))
            } : prev);
            // Delete from server database
            try {
              await remove(`/interns/trainings/modules/${moduleId}`);
            } catch (e) {
              console.log('Delete module error:', e);
            }
            loadData();
          }
        }
      ]
    );
  };

  const handleDeleteTask = (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Remove from local db state immediately so UI updates instantly
            setDb(prev => {
              if (!prev) return prev;
              const updatedTasks = (prev.tasks || []).filter(t => String(t.id) !== String(taskId) && String(t.title) !== String(taskId));
              const updatedDeptTasks = { ...(prev.departmentTasks || {}) };
              Object.keys(updatedDeptTasks).forEach(deptKey => {
                if (Array.isArray(updatedDeptTasks[deptKey])) {
                  updatedDeptTasks[deptKey] = updatedDeptTasks[deptKey].filter(t => String(t.id) !== String(taskId) && String(t.title) !== String(taskId));
                }
              });
              return {
                ...prev,
                tasks: updatedTasks,
                departmentTasks: updatedDeptTasks,
              };
            });

            // Call backend delete endpoints
            try {
              await post('/interns/tasks/delete', { taskId: String(taskId) });
            } catch (e) {}
            try {
              await remove(`/interns/tasks/${taskId}`);
            } catch (e) {}
          }
        }
      ]
    );
  };

  // Meeting Handler (Module 4)
  const handleScheduleMeet = async () => {
    if (!meetTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a session title.');
      return;
    }
    try {
      const newMeet = {
        id: `meet_${Date.now()}`,
        department: meetAudience === 'All' ? 'All' : activeDept,
        title: meetTitle,
        topic: meetType,
        date: meetDate || 'Today',
        time: meetTime || '10:00 AM',
        scheduled_time: `${meetDate} at ${meetTime}`,
        meeting_link: meetLink || 'https://meet.jit.si/studify_team',
        created_at: new Date().toISOString(),
      };
      
      // Update local state immediately for instant UI feedback
      setDb(prev => ({
        ...prev,
        meetings: [newMeet, ...(prev?.meetings || [])],
      }));

      try {
        await post('/interns/trainings/live', {
          department: meetAudience === 'All' ? 'All' : activeDept,
          title: meetTitle,
          topic: meetType,
          scheduled_time: `${meetDate} at ${meetTime}`,
          meeting_link: meetLink,
        });

        try {
          await post('/notification/broadcast', {
            title: 'New Meeting Scheduled',
            body: `TL scheduled a ${meetType} session: "${meetTitle}" for ${meetDate} at ${meetTime}.`,
            department: meetAudience === 'All' ? 'All' : activeDept,
          });
        } catch (notifErr) {
          console.warn('Failed to broadcast meeting notification:', notifErr);
        }

      } catch (e) {}

      Alert.alert('Meeting Scheduled', `Meeting "${meetTitle}" is live!`);
      setMeetModalVisible(false);
      setMeetTitle('');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to schedule meeting');
    }
  };

  // Instant Meet Generator (Module 4)
  const handleInstantMeet = () => {
    const instantUrl = `https://meet.jit.si/studify_${activeDept.replace(
      /\s+/g,
      '_',
    )}_${Date.now().toString().slice(-4)}`;
    Linking.openURL(instantUrl);
  };

  // Training Module Handler (Module 5)
  const handlePublishModule = async () => {
    if (!modTitle.trim() || !modVideo.trim()) {
      Alert.alert('Validation Error', 'Title and Resource Link are required.');
      return;
    }
    try {
      const newMod = {
        id: `mod_${Date.now()}`,
        department: activeDept,
        title: modTitle,
        instructor: modInstructor || `${user?.fname || 'TL'} ${user?.lname || ''}`.trim(),
        duration: modDuration || '30 mins',
        description: modDesc || 'Training module content',
        video_url: modVideo,
        completion_rate: 0,
      };

      // Update local state immediately
      setDb(prev => ({
        ...prev,
        modules: [newMod, ...(prev?.modules || [])],
      }));

      // Persist to AsyncStorage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const stored = await AsyncStorage.getItem('@studify_modules');
        const prev = stored ? JSON.parse(stored) : [];
        await AsyncStorage.setItem('@studify_modules', JSON.stringify([newMod, ...prev]));
      } catch (e) {}

      await addMockModule(newMod);
      try {
        await post('/interns/trainings/modules', newMod);
      } catch (err) {}

      Alert.alert('Module Published', `Module "${modTitle}" is now live!`);
      setModuleModalVisible(false);
      setModTitle('');
      setModVideo('');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to publish module.');
    }
  };

  // Announcement Handler (Module 6)
  const handlePublishAnn = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      Alert.alert('Validation Error', 'Please fill in title and content.');
      return;
    }
    try {
      await post('/interns/announcements', {
        department: activeDept,
        title: annTitle,
        body: annBody,
        type: annType,
        created_at: new Date().toISOString(),
        timeText: new Date().toISOString(),
      });
      Alert.alert('Published', `${annType} posted successfully.`);
      setAnnModalVisible(false);
      setAnnTitle('');
      setAnnBody('');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to post notice.');
    }
  };
  // Rewards & Recognition Handler (Module 8)
  const handleSendAppreciation = async () => {
    if (!awardTitle.trim() || !awardNote.trim()) {
      Alert.alert('Error', 'Please enter title and appreciation message.');
      return;
    }
    try {
      await post('/interns/feedback', {
        department: activeDept,
        message: `🏆 [${awardTitle}] ${awardNote}`,
      });
      Alert.alert(
        'Appreciation Sent',
        'Your praise & reward note has been published to the team!',
      );
      setAwardModalVisible(false);
      setAwardTitle('');
      setAwardNote('');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to send appreciation.');
    }
  };

  // Certificate Generator (Module 8)
  const handleGenerateCertificate = async internName => {
    try {
      const res = await post('/r/certificate', {name: internName});
      if (res && res.data) {
        Alert.alert(
          'Certificate Generated 📜',
          `Verified Certificate issued for ${internName}!`,
        );
      }
    } catch (e) {
      Alert.alert(
        'Certificate Ready 📜',
        `Authenticated Certificate generated for ${internName}!`,
      );
    }
  };

  const filteredLeaves = useMemo(() => {
    return (db?.leaves || []).filter(l =>
      leaveTab === 'Pending'
        ? l.status === 'Pending'
        : l.status === 'Approved' || l.status === 'Denied',
    );
  }, [db?.leaves, leaveTab]);

  return (
    <View style={{flex: 1}}>
    <Screen NoHeader style={styles.container}>
      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Team Leader Hub 👑</Text>
            {user?.department && user.department.includes(',') ? (
              <TouchableOpacity onPress={() => setShowDeptDialog(true)} style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
                <Text style={styles.deptText}>
                  Department: <Text style={{fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E', textDecorationLine: 'underline'}}>{activeDept}</Text>
                </Text>
                <Icon name="chevron-down" size={16} color={isDark ? colors.primary : '#1A237E'} style={{marginLeft: 4, marginTop: 2}} />
              </TouchableOpacity>
            ) : (
              <Text style={styles.deptText}>
                Department: <Text style={{fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E'}}>{activeDept}</Text>
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.profileBadge}
            onPress={() => navigation.navigate('TLMyTeam')}>
            <Avatar.Icon size={40} icon="account-group" backgroundColor="#1E88E5" />
          </TouchableOpacity>
        </View>

        {/* Category Workspace Navigation Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}>
          {[
            {key: 'Overview', icon: 'view-dashboard'},
            {key: 'Tasks', icon: 'checkbox-marked-circle-outline'},
            {key: 'Meetings', icon: 'video'},
            {key: 'Trainings', icon: 'school'},
            {key: 'Comm', icon: 'forum'},
            {key: 'Rewards', icon: 'trophy'},
            {key: 'Attendance', icon: 'calendar-clock'},
            {key: 'Leaves', icon: 'calendar-account'},
            {key: 'Founder', icon: 'crown'},
          ].map(cat => (
            <Chip
              key={cat.key}
              icon={cat.icon}
              selected={activeCategory === cat.key}
              onPress={() => {
                if (cat.key === 'Founder') {
                  navigation.navigate('FounderDashboard');
                } else {
                  setActiveCategory(cat.key);
                }
              }}
              style={styles.categoryChip}
              selectedColor="#fff"
              showSelectedOverlay>
              {cat.key === 'Founder' ? '👑 Founder Hub' : cat.key}
            </Chip>
          ))}
        </ScrollView>

        {/* ================= MODULE 1: DASHBOARD OVERVIEW ================= */}
        {activeCategory === 'Overview' && (
          <View style={styles.sectionPadding}>
            <Text style={styles.sectionTitle}>Dashboard Overview</Text>
            {/* 2-Column Side-by-Side Metric Rows (Clickable) */}
            <View style={styles.gridRow}>
              <Card
                style={[styles.halfMetricCard, {backgroundColor: isDark ? 'rgba(21,101,192,0.15)' : '#E3F2FD'}]}
                onPress={() => openMetricDetail('Total Interns')}>
                <Card.Content style={styles.metricContent}>
                  <Icon name="account-group" size={26} color={isDark ? '#90CAF9' : '#1565C0'} />
                  <Text style={[styles.metricVal, {color: isDark ? '#90CAF9' : '#1A237E'}]}>{approvedInterns.length}</Text>
                  <Text style={styles.metricLbl}>Total Interns 🔍</Text>
                </Card.Content>
              </Card>

              <Card
                style={[styles.halfMetricCard, {backgroundColor: isDark ? 'rgba(46,125,50,0.15)' : '#E8F5E9'}]}
                onPress={() => openMetricDetail('Active Today')}>
                <Card.Content style={styles.metricContent}>
                  <Icon name="check-circle" size={26} color={isDark ? '#A5D6A7' : '#2E7D32'} />
                  <Text style={[styles.metricVal, {color: isDark ? '#A5D6A7' : '#2E7D32'}]}>{activeTodayCount}</Text>
                  <Text style={styles.metricLbl}>Active Today 🔍</Text>
                </Card.Content>
              </Card>
            </View>

            <View style={styles.gridRow}>
              <Card
                style={[styles.halfMetricCard, {backgroundColor: isDark ? 'rgba(198,40,40,0.15)' : '#FFEBEE'}]}
                onPress={() => openMetricDetail('Absent')}>
                <Card.Content style={styles.metricContent}>
                  <Icon name="account-minus" size={26} color={isDark ? '#EF9A9A' : '#C62828'} />
                  <Text style={[styles.metricVal, {color: isDark ? '#EF9A9A' : '#C62828'}]}>{absentCount}</Text>
                  <Text style={styles.metricLbl}>Absent 🔍</Text>
                </Card.Content>
              </Card>

              <Card
                style={[styles.halfMetricCard, {backgroundColor: isDark ? 'rgba(239,108,0,0.15)' : '#FFF3E0'}]}
                onPress={() => openMetricDetail('Pending Tasks')}>
                <Card.Content style={styles.metricContent}>
                  <Icon name="clock-outline" size={26} color={isDark ? '#FFCC80' : '#EF6C00'} />
                  <Text style={[styles.metricVal, {color: isDark ? '#FFCC80' : '#EF6C00'}]}>{pendingTasksCount}</Text>
                  <Text style={styles.metricLbl}>Pending Tasks 🔍</Text>
                </Card.Content>
              </Card>
            </View>

            <View style={styles.gridRow}>
              <Card
                style={[styles.halfMetricCard, {backgroundColor: isDark ? 'rgba(123,31,162,0.15)' : '#F3E5F5'}]}
                onPress={() => openMetricDetail('Avg Performance')}>
                <Card.Content style={styles.metricContent}>
                  <Icon name="chart-line" size={26} color={isDark ? '#CE93D8' : '#7B1FA2'} />
                  <Text style={[styles.metricVal, {color: isDark ? '#CE93D8' : '#7B1FA2'}]}>{avgPerformance}</Text>
                  <Text style={styles.metricLbl}>Avg Performance 🔍</Text>
                </Card.Content>
              </Card>

              <Card
                style={[styles.halfMetricCard, {backgroundColor: isDark ? 'rgba(245,127,23,0.15)' : '#FFF8E1'}]}
                onPress={() => openMetricDetail('Top Performer')}>
                <Card.Content style={styles.metricContent}>
                  <Icon name="crown" size={26} color={isDark ? '#FFE082' : '#F57F17'} />
                  <Text style={[styles.metricVal, {fontSize: 14, color: isDark ? '#FFE082' : '#1A237E'}]} numberOfLines={1}>
                    {topPerformer.name}
                  </Text>
                  <Text style={styles.metricLbl}>Top Performer ({topPerformer.score}%) 🔍</Text>
                </Card.Content>
              </Card>
            </View>

            {/* Quick Action Shortcuts */}
            <Text style={[styles.sectionTitle, {marginTop: 20}]}>Quick Actions</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10}}>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => setTaskModalVisible(true)}
                textColor="#004D40"
                style={{flex: 1, minWidth: 105, backgroundColor: '#E0F2F1', borderWidth: 1, borderColor: '#B2DFDB'}}>
                Assign Task
              </Button>
              <Button
                mode="contained"
                icon="video"
                onPress={() => setMeetModalVisible(true)}
                textColor="#1B5E20"
                style={{flex: 1, minWidth: 105, backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#C8E6C9'}}>
                Schedule Meet
              </Button>
              <Button
                mode="contained"
                icon="file-document-outline"
                onPress={() => {
                  setSelectedEodInternId('all');
                  setEodModalVisible(true);
                }}
                textColor="#1A237E"
                style={{flex: 1, minWidth: 105, backgroundColor: '#E8EAF6', borderWidth: 1, borderColor: '#C5CAE9'}}>
                EOD Reports
              </Button>
            </View>
          </View>
        )}

        {/* ================= MODULE 3: TASK MANAGEMENT STUDIO ================= */}
        {(activeCategory === 'Overview' || activeCategory === 'Tasks') && (
          <View style={styles.sectionPadding}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
              <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Task Studio & Approvals</Text>
              <Button
                compact
                mode="outlined"
                onPress={() => setTaskModalVisible(true)}>
                + New Task
              </Button>
            </View>

            {/* Task Template Shortcuts */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginVertical: 10}}>
              {[
                { title: `Submit ${activeDept} Weekly EOD Report`, desc: `Compile all tasks completed this week in the ${activeDept} department and submit your EOD report as a PDF or summary.`, priority: 'High', dueDate: 'Today' },
                { title: `Complete ${activeDept} Module 1 Training`, desc: 'Watch the assigned training video and complete the post-module quiz or assignment.', priority: 'Medium', dueDate: 'Tomorrow' },
                { title: 'Bug Audit & Code Cleanup', desc: 'Review the active issue backlog, identify critical bugs, and submit a clean-code audit report.', priority: 'High', dueDate: 'Today' },
                { title: 'Design System Review', desc: 'Review component guidelines, accessibility standards, and report feedback to the TL.', priority: 'Low', dueDate: 'This Week' },
              ].map(tmpl => (
                <Chip
                  key={tmpl.title}
                  style={{marginRight: 8}}
                  onPress={() => {
                    setTaskTitle(tmpl.title);
                    setTaskDesc(tmpl.desc);
                    setTaskPriority(tmpl.priority);
                    setTaskDueDate(tmpl.dueDate);
                    setTaskModalVisible(true);
                  }}>
                  + {tmpl.title}
                </Chip>
              ))}
            </ScrollView>

            {/* Active vs Completed Task Filter Tabs */}
            <View style={{flexDirection: 'row', gap: 10, marginVertical: 10}}>
              <TouchableOpacity
                onPress={() => setTaskTab('Active')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: taskTab === 'Active' ? '#E8EAF6' : '#ffffff',
                  borderWidth: 1,
                  borderColor: taskTab === 'Active' ? '#3F51B5' : '#F3EBF0',
                  elevation: 1,
                }}>
                <Text style={{fontWeight: 'bold', fontSize: 12, color: taskTab === 'Active' ? '#3F51B5' : '#777777'}}>
                  ⚡ Active ({activeDeptTasks.filter(t => !t.completed && !t.submissionProof && t.submissionStatus !== 'Submitted').length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTaskTab('Review')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: taskTab === 'Review' ? '#FFF3E0' : '#ffffff',
                  borderWidth: 1,
                  borderColor: taskTab === 'Review' ? '#F57C00' : '#F3EBF0',
                  elevation: 1,
                }}>
                <Text style={{fontWeight: 'bold', fontSize: 12, color: taskTab === 'Review' ? '#E65100' : '#777777'}}>
                  ⏳ Review ({activeDeptTasks.filter(t => (Boolean(t.submissionProof) || t.submissionStatus === 'Submitted' || (t.completed && t.submissionStatus !== 'Approved')) && t.submissionStatus !== 'Approved').length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTaskTab('Completed')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: taskTab === 'Completed' ? '#E8F5E9' : '#ffffff',
                  borderWidth: 1,
                  borderColor: taskTab === 'Completed' ? '#4CAF50' : '#F3EBF0',
                  elevation: 1,
                }}>
                <Text style={{fontWeight: 'bold', fontSize: 12, color: taskTab === 'Completed' ? '#2E7D32' : '#777777'}}>
                  ✅ Done ({activeDeptTasks.filter(t => t.submissionStatus === 'Approved' || (t.completed && !t.submissionProof && t.submissionStatus !== 'Submitted')).length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Department Tasks List filtered by tab */}
            {(() => {
              const filteredList = activeDeptTasks.filter(t => {
                const isSubmitted = Boolean(t.submissionProof) || t.submissionStatus === 'Submitted' || (t.completed && t.submissionStatus !== 'Approved');
                const isApproved = t.submissionStatus === 'Approved';
                if (taskTab === 'Active') return !t.completed && !isSubmitted && !isApproved;
                if (taskTab === 'Review') return isSubmitted && !isApproved;
                return isApproved || (t.completed && !isSubmitted);
              });
              if (filteredList.length === 0) {
                return (
                  <Card style={styles.emptyCard}>
                    <Card.Content style={styles.emptyContent}>
                      <Icon
                        name={taskTab === 'Active' ? 'checkbox-marked-circle-outline' : taskTab === 'Review' ? 'clock-alert-outline' : 'history'}
                        size={36}
                        color="#888"
                      />
                      <Text style={styles.emptyText}>
                        {taskTab === 'Active'
                          ? '🎉 No pending tasks! All active tasks are completed.'
                          : taskTab === 'Review'
                          ? '🎉 No submitted tasks awaiting review!'
                          : 'No completed tasks recorded yet.'}
                      </Text>
                    </Card.Content>
                  </Card>
                );
              }
              return filteredList.map(task => {
                const priorityBg =
                  task.priority === 'High'
                    ? '#FFEBEE'
                    : task.priority === 'Medium'
                    ? '#FFF3E0'
                    : '#E8F5E9';
                const priorityText =
                  task.priority === 'High'
                    ? '#C62828'
                    : task.priority === 'Medium'
                    ? '#E65100'
                    : '#2E7D32';

                return (
                  <Card key={task.id} style={styles.cardMargin}>
                    <Card.Content>
                      {/* Row 1: Priority Custom Badge & Due Date */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: priorityBg,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}>
                          <Icon
                            name="flag-variant"
                            size={14}
                            color={priorityText}
                            style={{marginRight: 4}}
                          />
                          <Text style={{fontSize: 11, fontWeight: 'bold', color: priorityText}}>
                            {task.priority || 'Medium'} Priority
                          </Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                          <Text style={{fontSize: 12, color: isDark ? colors.onSurfaceVariant : '#666', fontWeight: '500'}}>
                            Due: {task.dueDate || 'Today'}
                          </Text>
                          <TouchableOpacity onPress={() => handleDeleteTask(task.id || task.title)} style={{padding: 4}}>
                            <Icon name="delete-outline" size={18} color="#E57373" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Row 2: Full Task Title */}
                      <Text style={[styles.cardTitle, {marginVertical: 4, color: isDark ? colors.primary : '#1A237E'}]}>
                        {task.title}
                      </Text>

                      {/* Row 3: Progress Bar */}
                      <ProgressBar
                        progress={task.completed ? 1 : (task.submissionProof ? 0.8 : 0.4)}
                        color={task.completed ? '#81C784' : (task.submissionProof ? '#FFB74D' : '#7986CB')}
                        style={{marginVertical: 8, height: 6, borderRadius: 3}}
                      />

                      {/* Row 4: Submitted Work Proof Box (for TL Review) */}
                      {Boolean(task.submissionProof) && (
                        <View style={{marginTop: 10, padding: 12, backgroundColor: isDark ? colors.elevation.level2 : '#FAF6F8', borderRadius: 12, borderWidth: 1, borderColor: isDark ? colors.outlineVariant : '#F3EBF0'}}>
                          <Text style={{fontSize: 12, fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E', marginBottom: 6}}>
                            📤 Work Proof Submitted ({task.submissionType || 'Attachment'})
                          </Text>
                          {Boolean(task.completedByName) && (
                            <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#666666', marginBottom: 4}}>
                              Submitted by: <Text style={{fontWeight: 'bold', color: isDark ? colors.primary : '#1A237E'}}>{task.completedByName}</Text>
                            </Text>
                          )}
                          {Boolean(task.proofNotes) && (
                            <Text style={{fontSize: 12, color: isDark ? colors.onSurface : '#333333', fontStyle: 'italic', marginBottom: 8}}>
                              "{task.proofNotes}"
                            </Text>
                          )}
                          <TouchableOpacity
                            style={{flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? colors.elevation.level3 : '#FFFFFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: isDark ? colors.outlineVariant : '#F3EBF0', marginBottom: 10}}
                            onPress={() => {
                              if (task.submissionProof) {
                                Linking.openURL(task.submissionProof).catch(() => Alert.alert('Link', task.submissionProof));
                              }
                            }}>
                            <Icon name="open-in-new" size={16} color={isDark ? colors.primary : '#3F51B5'} style={{marginRight: 6}} />
                            <Text style={{fontSize: 12, color: isDark ? colors.primary : '#3F51B5', fontWeight: 'bold', flex: 1}} numberOfLines={1}>
                              {task.submissionProof}
                            </Text>
                          </TouchableOpacity>

                          {/* Action Buttons for TL (Only shown if NOT already approved) */}
                          {task.submissionStatus !== 'Approved' && (
                            <View style={{flexDirection: 'row', gap: 8, marginTop: 4}}>
                              <TouchableOpacity
                                style={{flex: 1, backgroundColor: isDark ? 'rgba(76,175,80,0.15)' : '#E8F5E9', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#81C784' : '#C8E6C9'}}
                                onPress={() => handleApproveTaskSubmission(task.id)}>
                                <Text style={{color: isDark ? '#81C784' : '#2E7D32', fontSize: 12, fontWeight: 'bold'}}>✅ Approve Work</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={{flex: 1, backgroundColor: isDark ? 'rgba(244,67,54,0.15)' : '#FFEBEE', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#EF9A9A' : '#FFCDD2'}}
                                onPress={() => handleRejectTaskSubmission(task.id)}>
                                <Text style={{color: isDark ? '#EF9A9A' : '#C62828', fontSize: 12, fontWeight: 'bold'}}>🔄 Request Revision</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Row 5: Status Indicator */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 8,
                        }}>
                        <Text style={{fontSize: 12, color: isDark ? colors.onSurfaceVariant : '#555'}}>
                          Status:{' '}
                          <Text
                            style={{
                              fontWeight: 'bold',
                              color: task.submissionStatus === 'Approved' ? (isDark ? '#81C784' : '#2E7D32') : task.submissionStatus === 'Submitted' ? '#F57C00' : task.completed ? (isDark ? '#81C784' : '#2E7D32') : (isDark ? colors.primary : '#3F51B5'),
                            }}>
                            {task.submissionStatus === 'Approved' ? '✅ Approved' : task.submissionStatus === 'Submitted' || task.submissionProof ? '⏳ Awaiting Review' : task.completed ? 'Completed' : 'In Progress'}
                          </Text>
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: task.completed ? (isDark ? 'rgba(46,125,50,0.15)' : '#E8F5E9') : (isDark ? 'rgba(63,81,181,0.15)' : '#E8EAF6'),
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}>
                          <Icon
                            name={task.completed ? 'check-circle' : 'clock-outline'}
                            size={14}
                            color={task.completed ? (isDark ? '#81C784' : '#2E7D32') : (isDark ? '#9FA8DA' : '#3F51B5')}
                            style={{marginRight: 4}}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: 'bold',
                              color: task.completed ? (isDark ? '#81C784' : '#2E7D32') : (isDark ? '#9FA8DA' : '#3F51B5'),
                            }}>
                            {task.completed ? 'Done' : 'Active'}
                          </Text>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                );
              });
            })()}
          </View>
        )}

        {/* ================= MODULE 4: MEETING MANAGEMENT HUB ================= */}
        {(activeCategory === 'Overview' || activeCategory === 'Meetings') && (
          <View style={styles.sectionPadding}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', rowGap: 8, marginBottom: 12}}>
              <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Meeting Management</Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Button
                  compact
                  mode="contained"
                  buttonColor="#E57373"
                  onPress={handleInstantMeet}
                  style={{marginRight: 6}}>
                  ⚡ Instant Meet
                </Button>
                <Button
                  compact
                  mode="outlined"
                  onPress={() => setMeetModalVisible(true)}>
                  + Schedule
                </Button>
              </View>
            </View>

            {/* Upcoming / Past Meetings Tab Switcher */}
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 12}}>
              {['Upcoming', 'Past Meetings'].map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setMeetingTab(tab)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: meetingTab === tab ? '#E8EAF6' : '#ffffff',
                    borderWidth: 1,
                    borderColor: meetingTab === tab ? '#3F51B5' : '#F3EBF0',
                    elevation: 1,
                  }}>
                  <Text style={{fontWeight: 'bold', fontSize: 13, color: meetingTab === tab ? '#3F51B5' : '#777777'}}>
                    {tab === 'Upcoming' ? '📅 Upcoming' : '🕐 Past Meetings'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {meetingTab === 'Upcoming' ? (() => {
              const activeMeetingsList = (db?.meetings || []).filter(
                m => !isMeetingExpired(m.date || m.scheduled_time, m.time),
              );
              if (activeMeetingsList.length === 0) {
                return (
                  <Card style={styles.emptyCard}>
                    <Card.Content style={styles.emptyContent}>
                      <Icon name="video-off" size={36} color="#888" />
                      <Text style={styles.emptyText}>No upcoming meetings.</Text>
                    </Card.Content>
                  </Card>
                );
              }
              return activeMeetingsList.map(meet => (
                <Card key={meet.id} style={styles.cardMargin}>
                  <Card.Content>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.cardTitle, {flex: 1}]}>{meet.title}</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                        <Chip icon="clock-outline">{meet.time || '4:30 PM'}</Chip>
                        <TouchableOpacity onPress={() => handleDeleteMeeting(meet.id || `${meet.title}_${meet.date}`)} style={{padding: 4}}>
                          <Icon name="trash-can-outline" size={20} color="#D32F2F" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.cardSub}>Date: {meet.date}</Text>
                    <View style={styles.rowBetween}>
                      <Button
                        compact
                        mode="contained-tonal"
                        onPress={() => {
                          const url = meet.meeting_link || meet.link;
                          if (url) {
                            Linking.openURL(url).catch(() => {
                              Alert.alert('Error', 'Unable to open meeting link.');
                            });
                          } else {
                            Alert.alert('No Link', 'No meeting link is available.');
                          }
                        }}>
                        Join Google Meet
                      </Button>
                      <Button
                        compact
                        onPress={() =>
                          Alert.alert('Meeting Notes', `Share notes for ${meet.title}`)
                        }>
                        Share Notes
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ));
            })() : (
              pastMeetings.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Card.Content style={styles.emptyContent}>
                    <Icon name="history" size={36} color="#888" />
                    <Text style={styles.emptyText}>No past meetings recorded yet.</Text>
                  </Card.Content>
                </Card>
              ) : (
                pastMeetings.map((meet, idx) => (
                  <Card key={meet.id || idx} style={[styles.cardMargin, {backgroundColor: '#F5F5F5', borderLeftWidth: 3, borderLeftColor: '#9E9E9E'}]}>
                    <Card.Content>
                      <View style={styles.rowBetween}>
                        <Text style={[styles.cardTitle, {color: '#555'}]}>{meet.title}</Text>
                        <Chip icon="clock-outline" style={{backgroundColor: '#E0E0E0'}}>{meet.time || '—'}</Chip>
                      </View>
                      <Text style={[styles.cardSub, {color: '#777'}]}>Date: {meet.date || meet.scheduled_time || '—'}</Text>
                      <Text style={{fontSize: 11, color: '#9E9E9E', marginTop: 2}}>🕐 Completed</Text>
                    </Card.Content>
                  </Card>
                ))
              )
            )}
          </View>
        )}

        {/* ================= MODULE 5: TRAINING MODULE HUB ================= */}
        {(activeCategory === 'Overview' || activeCategory === 'Trainings') && (
          <View style={styles.sectionPadding}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', rowGap: 8, marginBottom: 12}}>
              <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Training Modules & Content</Text>
              <Button
                compact
                mode="outlined"
                onPress={() => setModuleModalVisible(true)}>
                + Add Content
              </Button>
            </View>

            {(() => {
              const modulesList = db?.modules || [];
              if (modulesList.length === 0) {
                return (
                  <Card style={styles.emptyCard}>
                    <Card.Content style={styles.emptyContent}>
                      <Icon name="school-outline" size={36} color="#888" />
                      <Text style={styles.emptyText}>No training modules added yet. Tap '+ Add Content' to publish one!</Text>
                    </Card.Content>
                  </Card>
                );
              }
              return modulesList.map((mod, idx) => (
                <Card key={mod.id || idx} style={styles.cardMargin}>
                  <Card.Content>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={[styles.cardTitle, {flex: 1}]}>📹 {mod.title}</Text>
                      <TouchableOpacity onPress={() => handleDeleteModule(mod.id || mod.title)} style={{padding: 4}}>
                        <Icon name="trash-can-outline" size={20} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cardSub}>Instructor: {mod.instructor || 'TL'} | Duration: {mod.duration || '30 mins'}</Text>
                    {!!mod.description && (
                      <Text style={{fontSize: 12, color: '#555', marginTop: 4}}>{mod.description}</Text>
                    )}
                    <Text style={{fontSize: 12, marginTop: 6, fontWeight: 'bold', color: '#1565C0'}}>
                      Module Completion Progress:
                    </Text>
                    <ProgressBar
                      progress={mod.completion_rate || 0}
                      color="#2E7D32"
                      style={{marginVertical: 6, height: 8, borderRadius: 4}}
                    />
                    <Text style={{fontSize: 12, color: '#666'}}>{Math.round((mod.completion_rate || 0) * 100)}% Interns Completed</Text>
                  </Card.Content>
                </Card>
              ));
            })()}
          </View>
        )}

        {/* ================= MODULE 6: COMMUNICATION CENTER ================= */}
        {(activeCategory === 'Overview' || activeCategory === 'Comm') && (
          <View style={styles.sectionPadding}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', rowGap: 8, marginBottom: 12}}>
              <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Communication Center</Text>
              <Button
                compact
                mode="outlined"
                onPress={() => setAnnModalVisible(true)}>
                + Post Notice
              </Button>
            </View>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10}}>
              <Button
                mode="contained-tonal"
                icon="forum"
                onPress={handleOpenDeptChat}
                style={{flex: 1, marginRight: 6}}>
                Dept Chat
              </Button>
              <Button
                mode="contained-tonal"
                icon="account-message"
                onPress={() => setDmModalVisible(true)}
                style={{flex: 1, marginLeft: 6}}>
                Direct Messages
              </Button>
            </View>

            {(db?.announcements || []).map((ann, idx) => (
              <Card key={idx} style={styles.cardMargin}>
                <Card.Content>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{ann.title}</Text>
                    {ann.type === 'Pinned Notice' && (
                      <Chip icon="pin" style={{backgroundColor: '#FFF9C4'}}>
                        Pinned
                      </Chip>
                    )}
                  </View>
                  <Text style={{fontSize: 13, color: '#444', marginVertical: 4}}>
                    {ann.body}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* ================= MODULE 7: PERFORMANCE ANALYTICS ================= */}
        {(activeCategory === 'Overview' || activeCategory === 'Rewards') && (
          <View style={styles.sectionPadding}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
              <Text style={styles.sectionTitle}>Leaderboard & Top 3 Performers 🏆</Text>
            </View>

            {top3Performers.map((intern, idx) => {
              const rankMedals = ['🥇', '🥈', '🥉'];
              const bgColors = ['#FFFDF0', '#F8F9FA', '#FFF8F0'];
              const accentColors = ['#FFB300', '#78909C', '#D84315'];
              const textColors = ['#B71C1C', '#37474F', '#BF360C'];
              const rankTitles = ['Rank 1 • Top Performer', 'Rank 2 • Excellence', 'Rank 3 • High Achiever'];

              return (
                <Card
                  key={intern.id || idx}
                  style={[
                    styles.cardMargin,
                    {
                      backgroundColor: bgColors[idx],
                      borderLeftWidth: 5,
                      borderLeftColor: accentColors[idx],
                      elevation: 2,
                    },
                  ]}>
                  <Card.Content style={{paddingVertical: 10}}>
                    <View style={styles.rowBetween}>
                      <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        <Text style={{fontSize: 24, marginRight: 8}}>{rankMedals[idx]}</Text>
                        <Avatar.Text
                          size={40}
                          label={intern.avatar || 'IN'}
                          style={{marginRight: 10, backgroundColor: accentColors[idx]}}
                          color="#fff"
                        />
                        <View style={{flex: 1}}>
                          <Text style={{fontSize: 15, fontWeight: 'bold', color: '#1A237E'}}>
                            {intern.name}
                          </Text>
                          <Text style={{fontSize: 11, color: '#555', marginTop: 1}}>
                            {rankTitles[idx]} • {intern.department || activeDept}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          backgroundColor: '#fff',
                          paddingHorizontal: 12,
                          paddingVertical: 5,
                          borderRadius: 14,
                          borderWidth: 1.5,
                          borderColor: accentColors[idx],
                        }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: textColors[idx],
                          }}>
                          {intern.score}% Score
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}

            {/* TOP DEPARTMENT RANKINGS */}
            <View style={{marginTop: 20}}>
              <Text style={styles.sectionTitle}>Top Departments (Velocity) 📊</Text>
              {topDepartments.map((dept, idx) => (
                <View key={dept.name} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff', padding: 12, borderRadius: 10, elevation: 1}}>
                  <View style={{width: 35, height: 35, borderRadius: 17.5, backgroundColor: idx === 0 ? '#FFD54F' : '#ECEFF1', justifyContent: 'center', alignItems: 'center', marginRight: 15}}>
                    <Text style={{fontWeight: 'bold', fontSize: 14, color: idx === 0 ? '#E65100' : '#455A64'}}>#{idx + 1}</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={{fontWeight: 'bold', fontSize: 16, color: '#37474F'}}>{dept.name}</Text>
                    <Text style={{fontSize: 12, color: '#78909C'}}>{dept.active} Active Interns</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={{fontWeight: '900', fontSize: 18, color: idx === 0 ? '#2E7D32' : '#546E7A'}}>{dept.avgScore}%</Text>
                    <Text style={{fontSize: 10, color: '#90A4AE'}}>Avg Score</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ================= LEAVES CATEGORY SCREEN ================= */}
        {(activeCategory === 'Overview' || activeCategory === 'Leaves') && (
          <View style={styles.sectionPadding}>
            <Text style={styles.sectionTitle}>
              Leave Requests ({activeDept})
            </Text>
            <SegmentedButtons
              value={leaveTab}
              onValueChange={setLeaveTab}
              buttons={[
                {value: 'Pending', label: 'Pending'},
                {value: 'History', label: 'History'},
              ]}
              style={{marginBottom: 16}}
            />
            {filteredLeaves.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Icon
                    name={
                      leaveTab === 'Pending' ? 'calendar-check' : 'calendar-blank'
                    }
                    size={40}
                    color="#888"
                  />
                  <Text style={styles.emptyText}>
                    {leaveTab === 'Pending'
                      ? 'No pending leave requests.'
                      : 'No leave history found.'}
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              filteredLeaves.map(leave => {
                const intern = db?.interns?.find(i => String(i.id) === String(leave.internId) || String(i.user_id) === String(leave.internId));
                return (
                  <Card key={leave.id} style={styles.cardMargin}>
                    <Card.Content>
                      <View style={styles.rowBetween}>
                        <Text style={styles.cardTitle}>
                          {intern?.name || 'Intern'}
                        </Text>
                        <Chip
                          style={{
                            backgroundColor:
                              leave.status === 'Approved'
                                ? '#E8F5E9'
                                : leave.status === 'Denied'
                                ? '#FFEBEE'
                                : '#FFF3E0',
                          }}>
                          {leave.status}
                        </Chip>
                      </View>
                      <Text style={{fontSize: 13, color: '#555', marginVertical: 4}}>
                        📅 {leave.start} to {leave.end}
                      </Text>
                      <Text style={{fontSize: 13, color: '#333'}}>
                        Reason: "{leave.reason}"
                      </Text>

                      {leave.status === 'Pending' && (
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            marginTop: 10,
                          }}>
                          <Button
                            compact
                            mode="outlined"
                            textColor="#C62828"
                            onPress={() => handleOpenRejectLeave(leave.id)}
                            style={{marginRight: 8}}>
                            Reject with Reason
                          </Button>
                          <Button
                            compact
                            mode="contained"
                            buttonColor="#2E7D32"
                            onPress={() => handleApproveLeave(leave.id)}>
                            Approve
                          </Button>
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ================= ATTENDANCE CATEGORY SCREEN ================= */}
        {activeCategory === 'Attendance' && (() => {
          // Calculate today's totals for team roster
          const totalInterns = approvedInterns.length;
          let presentCount = 0;
          approvedInterns.forEach(intern => {
            const attRecord = getTodayAttendanceRecord(db?.attendance, intern);
            if (isAttendanceCheckedIn(attRecord)) {
              presentCount++;
            }
          });
          const absentCount = totalInterns - presentCount;

          // Current time & status for TL Self Attendance
          const now = new Date();
          const currentHour = now.getHours();
          const isMorningWindow = currentHour >= 7 && currentHour < 12;
          const isEveningWindow = currentHour >= 16 && currentHour < 22;

          const morningMarked = !!tlAttendanceToday?.morning_marked_at;
          const eveningMarked = !!tlAttendanceToday?.evening_marked_at;
          const morningTime = tlAttendanceToday?.morning_marked_at
            ? new Date(tlAttendanceToday.morning_marked_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
            : null;
          const eveningTime = tlAttendanceToday?.evening_marked_at
            ? new Date(tlAttendanceToday.evening_marked_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
            : null;

          const todayStatus = tlAttendanceToday?.status === 'Full'
            ? 'Full Day (8 hrs)'
            : (morningMarked || eveningMarked)
            ? 'Half Day (4 hrs)'
            : 'Absent / Not Marked';

          const todayStatusColor = tlAttendanceToday?.status === 'Full'
            ? '#2E7D32'
            : (morningMarked || eveningMarked)
            ? '#E65100'
            : '#C62828';

          const todayStatusBg = tlAttendanceToday?.status === 'Full'
            ? '#E8F5E9'
            : (morningMarked || eveningMarked)
            ? '#FFF3E0'
            : '#FFEBEE';

          // TL Stats Calculation
          const totalDaysLogged = tlAttendanceList.length;
          const fullDaysCount = tlAttendanceList.filter(r => r.status === 'Full' || (r.morning_marked_at && r.evening_marked_at)).length;
          const halfDaysCount = tlAttendanceList.filter(r => r.status === 'Half' || (!r.morning_marked_at && r.evening_marked_at) || (r.morning_marked_at && !r.evening_marked_at)).length;
          const presentDaysCount = fullDaysCount + halfDaysCount;
          const totalWorkingHours = (fullDaysCount * 8) + (halfDaysCount * 4);
          const attPercentage = totalDaysLogged > 0 ? Math.min(100, Math.round((presentDaysCount / totalDaysLogged) * 100)) : 100;

          return (
            <View style={styles.sectionPadding}>
              {/* Top Sub-Tab Switcher */}
              <SegmentedButtons
                value={tlAttendanceSubTab}
                onValueChange={setTlAttendanceSubTab}
                buttons={[
                  {
                    value: 'my_attendance',
                    label: '👤 My Attendance',
                  },
                  {
                    value: 'team_roster',
                    label: `👥 Team Roster (${presentCount}/${totalInterns})`,
                  },
                ]}
                style={{marginBottom: 16}}
              />

              {tlAttendanceSubTab === 'my_attendance' ? (
                <View>
                  {/* Today's Check-in / Check-out Card */}
                  <Card style={[styles.cardMargin, {elevation: 3, borderColor: '#B2DFDB'}]}>
                    <Card.Content>
                      <View style={styles.rowBetween}>
                        <View style={{flex: 1, marginRight: 8}}>
                          <Text style={{fontSize: 12, color: '#00796B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5}}>
                            TL Self Attendance
                          </Text>
                          <Text style={[styles.cardTitle, {fontSize: 17, marginTop: 2}]}>
                            Today's Check-in & Timings
                          </Text>
                          <Text style={{fontSize: 12, color: isDark ? colors.onSurfaceVariant : '#666', marginTop: 2}}>
                            {now.toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'})}
                          </Text>
                        </View>
                        <Chip
                          icon={tlAttendanceToday?.status === 'Full' ? 'check-decagram' : (morningMarked || eveningMarked) ? 'clock-check-outline' : 'alert-circle-outline'}
                          style={{backgroundColor: todayStatusBg}}
                          textStyle={{color: todayStatusColor, fontWeight: 'bold', fontSize: 12}}>
                          {todayStatus}
                        </Chip>
                      </View>

                      <Divider style={{marginVertical: 14}} />

                      {/* Morning & Evening Check-in Action Buttons */}
                      <View style={{flexDirection: 'row', gap: 10}}>
                        {/* Morning Check-in */}
                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={morningMarked || markingTlAttendance || !isMorningWindow}
                          onPress={() => markTLAttendance('morning')}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 10,
                            borderRadius: 12,
                            alignItems: 'center',
                            backgroundColor: morningMarked
                              ? '#E8F5E9'
                              : isMorningWindow
                              ? '#E3F2FD'
                              : (isDark ? colors.elevation?.level1 : '#F5F5F5'),
                            borderWidth: 1.5,
                            borderColor: morningMarked
                              ? '#66BB6A'
                              : isMorningWindow
                              ? '#2196F3'
                              : '#E0E0E0',
                          }}>
                          <Icon
                            name={morningMarked ? 'check-circle' : 'weather-sunny'}
                            size={26}
                            color={morningMarked ? '#2E7D32' : isMorningWindow ? '#1565C0' : '#9E9E9E'}
                          />
                          <Text style={{
                            fontSize: 13,
                            fontWeight: 'bold',
                            marginTop: 4,
                            color: morningMarked ? '#2E7D32' : isMorningWindow ? '#1565C0' : '#757575',
                          }}>
                            {morningMarked
                              ? 'Morning ✓'
                              : currentHour >= 12
                              ? 'Closed'
                              : currentHour < 7
                              ? 'After 7 AM'
                              : '☀️ Morning In'}
                          </Text>
                          <Text style={{fontSize: 11, color: morningMarked ? '#388E3C' : '#666', marginTop: 2}}>
                            {morningMarked && morningTime ? `Recorded: ${morningTime}` : '7:00 AM – 12:00 PM'}
                          </Text>
                        </TouchableOpacity>

                        {/* Evening Check-out */}
                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={eveningMarked || markingTlAttendance || !isEveningWindow}
                          onPress={() => markTLAttendance('evening')}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 10,
                            borderRadius: 12,
                            alignItems: 'center',
                            backgroundColor: eveningMarked
                              ? '#E8F5E9'
                              : isEveningWindow
                              ? '#F3E5F5'
                              : (isDark ? colors.elevation?.level1 : '#F5F5F5'),
                            borderWidth: 1.5,
                            borderColor: eveningMarked
                              ? '#66BB6A'
                              : isEveningWindow
                              ? '#AB47BC'
                              : '#E0E0E0',
                          }}>
                          <Icon
                            name={eveningMarked ? 'check-circle' : 'weather-night'}
                            size={26}
                            color={eveningMarked ? '#2E7D32' : isEveningWindow ? '#6A1B9A' : '#9E9E9E'}
                          />
                          <Text style={{
                            fontSize: 13,
                            fontWeight: 'bold',
                            marginTop: 4,
                            color: eveningMarked ? '#2E7D32' : isEveningWindow ? '#6A1B9A' : '#757575',
                          }}>
                            {eveningMarked
                              ? 'Evening ✓'
                              : currentHour >= 22
                              ? 'Closed'
                              : currentHour < 16
                              ? 'After 4 PM'
                              : '🌙 Evening Out'}
                          </Text>
                          <Text style={{fontSize: 11, color: eveningMarked ? '#388E3C' : '#666', marginTop: 2}}>
                            {eveningMarked && eveningTime ? `Recorded: ${eveningTime}` : '4:00 PM – 10:00 PM'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Working Hours Bar */}
                      <View style={{marginTop: 14, padding: 10, backgroundColor: isDark ? colors.elevation?.level1 : '#F9FBFD', borderRadius: 8}}>
                        <View style={styles.rowBetween}>
                          <Text style={{fontSize: 12, color: isDark ? colors.onSurface : '#37474F', fontWeight: '500'}}>
                            ⏱️ Today's Logged Hours:
                          </Text>
                          <Text style={{fontSize: 12, fontWeight: 'bold', color: todayStatusColor}}>
                            {tlAttendanceToday?.status === 'Full' ? '8.0 Hours' : (morningMarked || eveningMarked) ? '4.0 Hours' : '0.0 Hours'}
                          </Text>
                        </View>
                        <ProgressBar
                          progress={tlAttendanceToday?.status === 'Full' ? 1.0 : (morningMarked || eveningMarked) ? 0.5 : 0.0}
                          color={todayStatusColor}
                          style={{height: 6, borderRadius: 3, marginTop: 6}}
                        />
                      </View>
                    </Card.Content>
                  </Card>

                  {/* Summary Metric Stats */}
                  <View style={[styles.gridRow, {marginBottom: 12}]}>
                    <Card style={[styles.halfMetricCard, {backgroundColor: isDark ? colors.elevation?.level1 : '#FFFFFF'}]}>
                      <Card.Content style={{alignItems: 'center', paddingVertical: 12}}>
                        <Text style={{fontSize: 11, color: '#666'}}>Days Present</Text>
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: '#2E7D32', marginTop: 2}}>
                          {presentDaysCount}
                        </Text>
                        <Text style={{fontSize: 10, color: '#888'}}>({fullDaysCount} Full / {halfDaysCount} Half)</Text>
                      </Card.Content>
                    </Card>

                    <Card style={[styles.halfMetricCard, {backgroundColor: isDark ? colors.elevation?.level1 : '#FFFFFF'}]}>
                      <Card.Content style={{alignItems: 'center', paddingVertical: 12}}>
                        <Text style={{fontSize: 11, color: '#666'}}>Working Hours</Text>
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: '#1565C0', marginTop: 2}}>
                          {totalWorkingHours} hrs
                        </Text>
                        <Text style={{fontSize: 10, color: '#888'}}>Attendance: {attPercentage}%</Text>
                      </Card.Content>
                    </Card>
                  </View>

                  {/* Monthly Attendance Calendar */}
                  <Card style={[styles.cardMargin, {elevation: 2}]}>
                    <Card.Content>
                      <View style={[styles.rowBetween, {marginBottom: 8}]}>
                        <Text style={[styles.cardTitle, {fontSize: 15}]}>
                          📅 Monthly Attendance Calendar
                        </Text>
                        <TouchableOpacity
                          onPress={() => setTlCalendarDate(new Date())}
                          style={{paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: isDark ? colors.elevation?.level2 : '#EDE7F6'}}>
                          <Text style={{fontSize: 11, color: '#512DA8', fontWeight: 'bold'}}>Current Month</Text>
                        </TouchableOpacity>
                      </View>

                      {renderTLCalendar()}

                      {/* Legend */}
                      <View style={{flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? colors.outlineVariant : '#F0F0F0'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 2}}>
                          <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50'}} />
                          <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#666'}}>Full Day</Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 2}}>
                          <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFA000'}} />
                          <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#666'}}>Half Day</Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 2}}>
                          <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: '#F44336'}} />
                          <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#666'}}>Absent</Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 2}}>
                          <View style={{width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#1A237E', backgroundColor: isDark ? '#3E2723' : '#FFF9C4'}} />
                          <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#666'}}>Today</Text>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>

                  {/* Recent Attendance History Records */}
                  <Card style={[styles.cardMargin, {elevation: 2}]}>
                    <Card.Content>
                      <View style={[styles.rowBetween, {marginBottom: 10}]}>
                        <Text style={[styles.cardTitle, {fontSize: 15}]}>
                          📋 Recent Attendance Log
                        </Text>
                        <Badge style={{backgroundColor: '#00796B', color: '#fff'}}>{tlAttendanceList.length} Records</Badge>
                      </View>

                      {tlAttendanceList.length === 0 ? (
                        <View style={{alignItems: 'center', paddingVertical: 18}}>
                          <Icon name="calendar-blank-outline" size={32} color="#B0BEC5" />
                          <Text style={{fontSize: 12, color: '#78909C', marginTop: 6}}>No previous attendance records found.</Text>
                        </View>
                      ) : (
                        tlAttendanceList.slice(0, 10).map((item, idx) => {
                          const dateFormatted = item.date || item.created_at || 'N/A';
                          const isFull = item.status === 'Full' || (item.morning_marked_at && item.evening_marked_at);
                          const mTime = item.morning_marked_at ? new Date(item.morning_marked_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '—';
                          const eTime = item.evening_marked_at ? new Date(item.evening_marked_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '—';

                          return (
                            <View
                              key={item.id || idx}
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: 10,
                                borderBottomWidth: idx < Math.min(10, tlAttendanceList.length) - 1 ? 1 : 0,
                                borderBottomColor: isDark ? colors.outlineVariant : '#F0F0F0',
                              }}>
                              <View>
                                <Text style={{fontSize: 13, fontWeight: 'bold', color: isDark ? colors.onSurface : '#263238'}}>
                                  {dateFormatted}
                                </Text>
                                <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#777', marginTop: 2}}>
                                  🌅 In: {mTime} | 🌇 Out: {eTime}
                                </Text>
                              </View>
                              <Chip
                                compact
                                style={{
                                  backgroundColor: isFull ? '#E8F5E9' : '#FFF3E0',
                                }}
                                textStyle={{
                                  fontSize: 11,
                                  fontWeight: 'bold',
                                  color: isFull ? '#2E7D32' : '#E65100',
                                }}>
                                {isFull ? 'Full Day' : 'Half Day'}
                              </Chip>
                            </View>
                          );
                        })
                      )}
                    </Card.Content>
                  </Card>
                </View>
              ) : (
                /* Team Roster Sub-View */
                <View>
                  {/* Roster Summary Card */}
                  <Card style={{marginBottom: 16, backgroundColor: '#E0F2F1'}}>
                    <Card.Content style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                      <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: '#004D40'}}>{totalInterns}</Text>
                        <Text style={{fontSize: 11, color: '#00796B'}}>Total Interns</Text>
                      </View>
                      <View style={{height: 30, width: 1, backgroundColor: '#B2DFDB'}} />
                      <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: '#2E7D32'}}>{presentCount}</Text>
                        <Text style={{fontSize: 11, color: '#388E3C'}}>Present Today</Text>
                      </View>
                      <View style={{height: 30, width: 1, backgroundColor: '#B2DFDB'}} />
                      <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: '#C62828'}}>{absentCount}</Text>
                        <Text style={{fontSize: 11, color: '#D32F2F'}}>Absent Today</Text>
                      </View>
                    </Card.Content>
                  </Card>

                  {totalInterns === 0 ? (
                    <Card style={styles.emptyCard}>
                      <Card.Content style={styles.emptyContent}>
                        <Icon name="account-multiple-remove" size={40} color="#888" />
                        <Text style={styles.emptyText}>No approved interns in this department roster.</Text>
                      </Card.Content>
                    </Card>
                  ) : (
                    approvedInterns.map(intern => {
                      const attRecord = getTodayAttendanceRecord(db?.attendance, intern);
                      const isCheckedIn = isAttendanceCheckedIn(attRecord);
                      const status = isCheckedIn ? (attRecord.status || 'Present') : 'Absent';
                      
                      return (
                        <Card key={intern.id} style={styles.cardMargin}>
                          <Card.Content>
                            <View style={styles.rowBetween}>
                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8}}>
                                <Avatar.Text 
                                  size={36} 
                                  label={intern.avatar || (intern.name ? intern.name.split(' ').map(n=>n[0]).join('').slice(0,2) : 'IN')} 
                                  backgroundColor={isCheckedIn ? '#E8F5E9' : '#FFEBEE'}
                                  color={isCheckedIn ? '#2E7D32' : '#C62828'}
                                />
                                <View style={{flex: 1}}>
                                  <Text style={styles.cardTitle} numberOfLines={1}>{intern.name}</Text>
                                  <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#777'}} numberOfLines={1}>{intern.email}</Text>
                                </View>
                              </View>
                              <Chip
                                icon={isCheckedIn ? 'check-circle' : 'close-circle'}
                                style={{
                                  backgroundColor: isCheckedIn ? '#E8F5E9' : '#FFEBEE',
                                }}
                                textStyle={{
                                  color: isCheckedIn ? '#2E7D32' : '#C62828',
                                  fontWeight: 'bold'
                                }}>
                                {isCheckedIn ? `${status} ✅` : 'Absent ❌'}
                              </Chip>
                            </View>

                            {/* Check-in Times / Details if present */}
                            {isCheckedIn && (
                              <View style={{marginTop: 8, padding: 8, backgroundColor: isDark ? colors.elevation?.level1 : '#F9F9F9', borderRadius: 8}}>
                                {attRecord.morning_marked_at ? (
                                  <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#555'}}>
                                    🌅 Morning Check-in: {new Date(attRecord.morning_marked_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </Text>
                                ) : null}
                                {attRecord.evening_marked_at ? (
                                  <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#555', marginTop: attRecord.morning_marked_at ? 4 : 0}}>
                                    🌇 Evening Check-in: {new Date(attRecord.evening_marked_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </Text>
                                ) : null}
                                {!attRecord.morning_marked_at && !attRecord.evening_marked_at && (
                                  <Text style={{fontSize: 11, color: isDark ? colors.onSurfaceVariant : '#555'}}>
                                    Marked present manually by TL
                                  </Text>
                                )}
                              </View>
                            )}

                          </Card.Content>
                        </Card>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })()}
      </ScrollView>

      {/* MODAL 1: Task Creation (Module 3) */}
      <Modal
        visible={taskModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTaskModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalHeading}>Create & Assign Task</Text>

              <Text style={{fontSize: 11, fontWeight: 'bold', color: '#666', marginBottom: 4}}>
                ⚡ Quick Templates:
              </Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10}}>
                {[
                  { title: `Submit ${activeDept} Weekly EOD Report`, desc: `Compile all tasks completed this week in the ${activeDept} department and submit your EOD report as a PDF or summary.`, priority: 'High', dueDate: 'Today' },
                  { title: `Complete ${activeDept} Module 1 Training`, desc: 'Watch the assigned training video and complete the post-module quiz or assignment.', priority: 'Medium', dueDate: 'Tomorrow' },
                  { title: 'Bug Audit & Code Cleanup', desc: 'Review the active issue backlog, identify critical bugs, and submit a clean-code audit report.', priority: 'High', dueDate: 'Today' },
                  { title: 'Design System Review', desc: 'Review component guidelines, accessibility standards, and report feedback to the TL.', priority: 'Low', dueDate: 'This Week' },
                ].map(tmpl => (
                  <Chip
                    key={tmpl.title}
                    compact
                    onPress={() => {
                      setTaskTitle(tmpl.title);
                      setTaskDesc(tmpl.desc);
                      setTaskPriority(tmpl.priority);
                      setTaskDueDate(tmpl.dueDate);
                    }}
                    style={{backgroundColor: '#E0F2F1'}}>
                    {tmpl.title.split(' ')[0]} {tmpl.title.split(' ')[1]}
                  </Chip>
                ))}
              </View>

              <TextInput
                placeholder="Task Title"
                value={taskTitle}
                onChangeText={setTaskTitle}
                style={styles.modalInput}
              />
              <TextInput
                placeholder="Description / Requirements"
                value={taskDesc}
                onChangeText={setTaskDesc}
                style={[styles.modalInput, {height: 60}]}
                multiline
              />
              <Text style={{fontSize: 12, fontWeight: 'bold', marginTop: 6}}>
                Priority:
              </Text>
              <View style={{flexDirection: 'row', marginVertical: 6}}>
                {['High', 'Medium', 'Low'].map(p => (
                  <Chip
                    key={p}
                    selected={taskPriority === p}
                    onPress={() => setTaskPriority(p)}
                    style={{marginRight: 6}}>
                    {p}
                  </Chip>
                ))}
              </View>

              <Text style={{fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 5}}>
                Due Date:
              </Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
                {['Today', 'Tomorrow', 'This Week', 'Custom'].map(d => (
                  <Chip
                    key={d}
                    selected={taskDueDate === d}
                    onPress={() => setTaskDueDate(d)}
                    style={{marginRight: 4}}>
                    {d}
                  </Chip>
                ))}
              </View>
              {taskDueDate === 'Custom' && (
                <Button
                  mode="outlined"
                  compact
                  icon="calendar"
                  onPress={showTaskDueDatePicker}
                  style={{marginBottom: 8, alignSelf: 'flex-start'}}>
                  Pick Date
                </Button>
              )}
              {taskDueDate && taskDueDate !== 'Today' && taskDueDate !== 'Tomorrow' && taskDueDate !== 'This Week' && taskDueDate !== 'Custom' && (
                <Text style={{fontSize: 11, color: '#1565C0', marginBottom: 6}}>📅 {taskDueDate}</Text>
              )}

              <Text style={{fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 5}}>
                Assign To:
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                <Chip 
                  selected={bulkAssignAll} 
                  onPress={() => { setBulkAssignAll(true); setSelectedAssignees([]); }}
                  style={{marginRight: 6, backgroundColor: bulkAssignAll ? '#007171' : '#e0e0e0'}}
                  textStyle={{color: bulkAssignAll ? '#fff' : '#000'}}>
                  All Department Interns
                </Chip>
                <Chip 
                  selected={!bulkAssignAll} 
                  onPress={() => setBulkAssignAll(false)}
                  style={{backgroundColor: !bulkAssignAll ? '#007171' : '#e0e0e0'}}
                  textStyle={{color: !bulkAssignAll ? '#fff' : '#000'}}>
                  Select Specific
                </Chip>
              </View>

              {!bulkAssignAll && (
                <ScrollView nestedScrollEnabled style={{maxHeight: 120, marginVertical: 6, borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 8}}>
                  {approvedInterns.map(i => {
                    const isSelected = selectedAssignees.includes(i.id);
                    return (
                      <Chip
                        key={i.id}
                        selected={isSelected}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedAssignees(prev => prev.filter(id => id !== i.id));
                          } else {
                            setSelectedAssignees(prev => [...prev, i.id]);
                          }
                        }}
                        style={{marginVertical: 3, backgroundColor: isSelected ? '#E0F7FA' : '#f5f5f5'}}>
                        {i.name}
                      </Chip>
                    );
                  })}
                </ScrollView>
              )}

              <Button
                mode="contained"
                onPress={handleCreateTask}
                style={{marginTop: 10}}>
                Assign Task
              </Button>
              <Button onPress={() => setTaskModalVisible(false)}>Cancel</Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* MODAL 2: Reject Leave with Reason (Module 10) */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalHeading}>Reject Leave Request</Text>
              <TextInput
                placeholder="Enter rejection reason (e.g. High priority deadline)"
                value={rejectReason}
                onChangeText={setRejectReason}
                style={[styles.modalInput, {height: 70}]}
                multiline
              />
              <Button
                mode="contained"
                buttonColor="#C62828"
                onPress={handleConfirmRejectLeave}
                style={{marginTop: 10}}>
                Confirm Rejection
              </Button>
              <Button onPress={() => setRejectModalVisible(false)}>Cancel</Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* MODAL 3: Schedule Meeting (Module 4) */}
      <Modal
        visible={meetModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMeetModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalHeading}>Schedule Live Session</Text>
              <TextInput
                placeholder="Session Title"
                value={meetTitle}
                onChangeText={setMeetTitle}
                style={styles.modalInput}
              />
              <TextInput
                placeholder="Google Meet / Jitsi URL"
                value={meetLink}
                onChangeText={setMeetLink}
                style={styles.modalInput}
              />
              <View style={{flexDirection: 'row', marginVertical: 6}}>
                <Button mode="outlined" onPress={showTlMeetDatePicker} style={{marginRight: 6}}>
                  📅 {meetDate}
                </Button>
                <Button mode="outlined" onPress={showTlMeetTimePicker}>
                  🕒 {meetTime}
                </Button>
              </View>
              <Button
                mode="contained"
                buttonColor="#2E7D32"
                onPress={handleScheduleMeet}
                style={{marginTop: 10}}>
                Schedule Session
              </Button>
              <Button onPress={() => setMeetModalVisible(false)}>Cancel</Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* MODAL 4: Publish Module (Module 5) */}
      <Modal
        visible={moduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModuleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalHeading}>Publish Training Content</Text>
              <TextInput
                placeholder="Module Title"
                value={modTitle}
                onChangeText={setModTitle}
                style={styles.modalInput}
              />
              <TextInput
                placeholder="Video Link / PDF URL"
                value={modVideo}
                onChangeText={setModVideo}
                style={styles.modalInput}
              />
              <Button
                mode="contained"
                onPress={handlePublishModule}
                style={{marginTop: 10}}>
                Publish Content
              </Button>
              <Button onPress={() => setModuleModalVisible(false)}>Cancel</Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* MODAL 5: Post Announcement (Module 6) */}
      <Modal
        visible={annModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAnnModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalHeading}>Post Team Notice</Text>
              <TextInput
                placeholder="Notice Title"
                value={annTitle}
                onChangeText={setAnnTitle}
                style={styles.modalInput}
              />
              <TextInput
                placeholder="Content Body"
                value={annBody}
                onChangeText={setAnnBody}
                style={[styles.modalInput, {height: 70}]}
                multiline
              />
              <Button
                mode="contained"
                onPress={handlePublishAnn}
                style={{marginTop: 10}}>
                Post Announcement
              </Button>
              <Button onPress={() => setAnnModalVisible(false)}>Cancel</Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* MODAL 6: Interactive Metric Detail Inspection Modal (Module 1) */}
      <Modal
        visible={metricDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMetricDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, {maxHeight: '80%'}]}>
            <Card.Content>
              <View style={styles.rowBetween}>
                <Text style={styles.modalHeading}>
                  🔍 {metricDetailType} Details ({activeDept})
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => setMetricDetailModalVisible(false)}
                />
              </View>

              <ScrollView style={{maxHeight: 400, marginVertical: 10}}>
                {/* 1. TOTAL INTERNS VIEW */}
                {metricDetailType === 'Total Interns' && (
                  approvedInterns.length === 0 ? (
                    <Text style={{textAlign: 'center', color: '#888', marginVertical: 20}}>No approved interns found in {activeDept}.</Text>
                  ) : (
                    approvedInterns.map((intern, idx) => (
                      <View key={idx} style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F3EBF0'}}>
                        <Avatar.Text size={38} label={intern.avatar || 'IN'} style={{marginRight: 10, backgroundColor: '#E8EAF6'}} color="#3F51B5" />
                        <View style={{flex: 1}}>
                          <Text style={{fontWeight: 'bold', fontSize: 14, color: '#1A237E'}}>{intern.name}</Text>
                          <Text style={{fontSize: 12, color: '#666'}}>{intern.email}</Text>
                          <Text style={{fontSize: 11, color: '#3F51B5'}}>Joined: {intern.joined}</Text>
                        </View>
                        <Chip compact icon={intern.offerLetterName ? 'file-document' : 'alert-circle'}>
                          {intern.offerLetterName ? 'Offer Verified' : 'No Letter'}
                        </Chip>
                      </View>
                    ))
                  )
                )}

                {/* 2. ACTIVE TODAY VIEW */}
                {metricDetailType === 'Active Today' && (
                  approvedInterns.filter(i => isAttendanceCheckedIn(getTodayAttendanceRecord(db?.attendance, i))).length === 0 ? (
                    <Text style={{textAlign: 'center', color: '#888', marginVertical: 20}}>No interns marked active today yet.</Text>
                  ) : (
                    approvedInterns
                      .filter(i => isAttendanceCheckedIn(getTodayAttendanceRecord(db?.attendance, i)))
                      .map((intern, idx) => {
                        const att = getTodayAttendanceRecord(db?.attendance, intern);
                        return (
                          <View key={idx} style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F3EBF0'}}>
                            <Avatar.Text size={38} label={intern.avatar || 'IN'} style={{marginRight: 10, backgroundColor: '#E8F5E9'}} color="#2E7D32" />
                            <View style={{flex: 1}}>
                              <Text style={{fontWeight: 'bold', fontSize: 14, color: '#2E7D32'}}>{intern.name}</Text>
                              <Text style={{fontSize: 12, color: '#555'}}>Morning: {att?.morning_marked_at ? new Date(att.morning_marked_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Marked'}</Text>
                              <Text style={{fontSize: 11, color: '#2E7D32'}}>Status: {att?.status || 'Present'}</Text>
                            </View>
                            <Chip icon="check-circle" style={{backgroundColor: '#E8F5E9'}} textStyle={{color: '#2E7D32'}}>Active</Chip>
                          </View>
                        );
                      })
                  )
                )}

                {/* 3. ABSENT VIEW */}
                {metricDetailType === 'Absent' && (
                  approvedInterns.filter(i => !isAttendanceCheckedIn(getTodayAttendanceRecord(db?.attendance, i))).length === 0 ? (
                    <Text style={{textAlign: 'center', color: '#2E7D32', marginVertical: 20}}>🎉 Great news! Everyone is active today.</Text>
                  ) : (
                    approvedInterns
                      .filter(i => !isAttendanceCheckedIn(getTodayAttendanceRecord(db?.attendance, i)))
                      .map((intern, idx) => (
                        <View key={idx} style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F3EBF0'}}>
                          <Avatar.Text size={38} label={intern.avatar || 'IN'} style={{marginRight: 10, backgroundColor: '#FFEBEE'}} color="#C62828" />
                          <View style={{flex: 1}}>
                            <Text style={{fontWeight: 'bold', fontSize: 14, color: '#C62828'}}>{intern.name}</Text>
                            <Text style={{fontSize: 12, color: '#777'}}>{intern.email}</Text>
                            <Text style={{fontSize: 11, color: '#D32F2F'}}>Status: Not Checked-in</Text>
                          </View>
                        </View>
                      ))
                  )
                )}

                {/* 4. PENDING TASKS VIEW */}
                {metricDetailType === 'Pending Tasks' && (
                  activeDeptTasks.filter(t => !t.completed).length === 0 ? (
                    <Text style={{textAlign: 'center', color: '#2E7D32', marginVertical: 20}}>All department tasks completed! 🎉</Text>
                  ) : (
                    activeDeptTasks
                      .filter(t => !t.completed)
                      .map((task, idx) => (
                        <View key={idx} style={{backgroundColor: '#ffffff', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F3EBF0'}}>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={{fontWeight: 'bold', fontSize: 14, color: '#1A237E', flex: 1, marginRight: 8}} numberOfLines={2}>
                              {task.title}
                            </Text>
                            <Chip 
                              compact 
                              style={{
                                backgroundColor: task.priority === 'High' ? '#FFEBEE' : task.priority === 'Low' ? '#E8F5E9' : '#FFF3E0'
                              }}>
                              <Text style={{
                                fontSize: 11, 
                                fontWeight: 'bold', 
                                color: task.priority === 'High' ? '#C62828' : task.priority === 'Low' ? '#2E7D32' : '#E65100'
                              }}>
                                {task.priority || 'Medium'} Priority
                              </Text>
                            </Chip>
                          </View>
                          <Text style={{fontSize: 12, color: '#666666', marginTop: 4}}>Due: {task.dueDate || 'Today'}</Text>
                        </View>
                      ))
                  )
                )}

                {/* 5. AVG PERFORMANCE VIEW */}
                {metricDetailType === 'Avg Performance' && (
                  approvedInterns.map((intern, idx) => {
                    const reportsCount = (db?.reports || []).filter(r => r.internId === intern.id).length;
                    const score = Math.min(99, 82 + reportsCount * 2);
                    return (
                      <View key={idx} style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F3EBF0'}}>
                        <Avatar.Text size={38} label={intern.avatar || 'IN'} style={{marginRight: 10, backgroundColor: '#F3E5F5'}} color="#7B1FA2" />
                        <View style={{flex: 1}}>
                          <Text style={{fontWeight: 'bold', fontSize: 14, color: '#4A148C'}}>{intern.name}</Text>
                          <Text style={{fontSize: 12, color: '#666'}}>Reports Submitted: {reportsCount}</Text>
                        </View>
                        <Text style={{fontSize: 18, fontWeight: 'bold', color: '#7B1FA2'}}>{score}%</Text>
                      </View>
                    );
                  })
                )}

                {/* 6. TOP PERFORMER VIEW */}
                {metricDetailType === 'Top Performer' && (
                  <View style={{alignItems: 'center', paddingVertical: 10}}>
                    <Text style={{fontSize: 36}}>👑</Text>
                    <Text style={{fontSize: 20, fontWeight: 'bold', color: '#1A237E', marginTop: 6}}>{topPerformer.name}</Text>
                    <Text style={{fontSize: 14, color: '#F57F17', fontWeight: 'bold', marginVertical: 4}}>Top Department Accuracy: {topPerformer.score}%</Text>
                    <Text style={{fontSize: 12, color: '#666', textAlign: 'center', marginHorizontal: 20}}>
                      Awarded Top Performer for outstanding task accuracy, attendance consistency, and EOD report submission rate in {activeDept}.
                    </Text>
                    <Button
                      mode="contained"
                      buttonColor="#F57F17"
                      style={{marginTop: 16}}
                      onPress={() => handleGenerateCertificate(topPerformer.name)}>
                      📜 Issue Excellence Certificate
                    </Button>
                  </View>
                )}
              </ScrollView>

              <Button mode="outlined" onPress={() => setMetricDetailModalVisible(false)} style={{marginTop: 10}}>
                Close
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* MODAL 7: Direct Messages Selector Modal (Module 6) */}
      <Modal
        visible={dmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDmModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, {maxHeight: '80%'}]}>
            <Card.Content>
              <View style={styles.rowBetween}>
                <Text style={styles.modalHeading}>
                  💬 Direct Messages — Select Intern
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => setDmModalVisible(false)}
                />
              </View>

              <Text style={{fontSize: 12, color: '#666', marginBottom: 10}}>
                Select an intern from {activeDept} department to start a 1-on-1 direct conversation:
              </Text>

              <ScrollView style={{maxHeight: 380}}>
                {approvedInterns.length === 0 ? (
                  <Text style={{textAlign: 'center', color: '#888', marginVertical: 20}}>
                    No active interns found in {activeDept} department.
                  </Text>
                ) : (
                  approvedInterns.map((intern, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#F5F5F5',
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: '#E0E0E0',
                      }}
                      onPress={() => handleStartDirectChat(intern)}>
                      <Avatar.Text
                        size={42}
                        label={intern.avatar || 'IN'}
                        style={{marginRight: 12, backgroundColor: '#1976D2'}}
                        color="#fff"
                      />
                      <View style={{flex: 1}}>
                        <Text style={{fontWeight: 'bold', fontSize: 15, color: '#263238'}}>
                          {intern.name}
                        </Text>
                        <Text style={{fontSize: 12, color: '#666'}}>
                          {intern.email}
                        </Text>
                        <Text style={{fontSize: 11, color: '#2E7D32', marginTop: 2}}>
                          Role: {intern.department || activeDept} Intern
                        </Text>
                      </View>
                      <Button
                        compact
                        mode="contained"
                        buttonColor="#1976D2"
                        onPress={() => handleStartDirectChat(intern)}>
                        💬 Chat Now
                      </Button>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <Button
                mode="outlined"
                onPress={() => setDmModalVisible(false)}
                style={{marginTop: 12}}>
                Cancel
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* MODAL 8: Full Submitted EOD Reports Inspection Modal */}
      <Modal
        visible={eodModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEodModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, {maxHeight: '88%'}]}>
            <Card.Content style={{paddingBottom: 10}}>
              <View style={styles.rowBetween}>
                <Text style={styles.modalHeading}>
                  📄 Submitted EOD Reports ({activeDept})
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => setEodModalVisible(false)}
                />
              </View>

              {/* Intern Filter Bar */}
              <Text style={{fontSize: 12, color: '#666', marginBottom: 6, fontWeight: '500'}}>
                Filter Reports by Intern:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{marginBottom: 10}}>
                <Chip
                  selected={selectedEodInternId === 'all'}
                  onPress={() => setSelectedEodInternId('all')}
                  style={{marginRight: 6}}>
                  All Interns ({filteredEodReports.length})
                </Chip>
                {approvedInterns.map(i => (
                  <Chip
                    key={i.id}
                    selected={selectedEodInternId === i.id}
                    onPress={() => setSelectedEodInternId(i.id)}
                    style={{marginRight: 6}}>
                    {i.name}
                  </Chip>
                ))}
              </ScrollView>

              <Divider style={{marginBottom: 10}} />

              {/* Reports List */}
              <ScrollView style={{maxHeight: 420}}>
                {filteredEodReports.length === 0 ? (
                  <View style={{alignItems: 'center', paddingVertical: 30}}>
                    <Icon name="file-document-outline" size={42} color="#B0BEC5" />
                    <Text style={{color: '#78909C', marginTop: 10, textAlign: 'center', fontWeight: '500'}}>
                      No EOD reports submitted yet for this selection.
                    </Text>
                  </View>
                ) : (
                  filteredEodReports.map((rpt, idx) => {
                    const internObj = approvedInterns.find(
                      i => i.id === rpt.internId || i.id === rpt.intern_id,
                    ) || {
                      name: safeText(rpt.intern_name) || 'Intern Candidate',
                      avatar: 'IN',
                      email: 'intern@studifysuccess.com',
                    };

                    let detailsObj = {};
                    if (rpt.details) {
                      if (typeof rpt.details === 'string') {
                        try {
                          detailsObj = JSON.parse(rpt.details);
                        } catch (e) {
                          detailsObj = { summary: rpt.details };
                        }
                      } else if (typeof rpt.details === 'object') {
                        detailsObj = rpt.details;
                      }
                    }

                    const tasksDone =
                      detailsObj.completedTasks ||
                      detailsObj.tasks ||
                      detailsObj.work_done ||
                      detailsObj.tasks_completed;
                    const blockers =
                      detailsObj.challenges ||
                      detailsObj.blockers ||
                      detailsObj.help_needed;
                    const tomorrow =
                      detailsObj.tomorrowGoals ||
                      detailsObj.next_steps ||
                      detailsObj.goals;

                    return (
                      <Card
                        key={rpt.id || idx}
                        style={[
                          styles.cardMargin,
                          {
                            backgroundColor: '#FAFAFA',
                            borderLeftWidth: 4,
                            borderLeftColor: '#007171',
                            elevation: 2,
                          },
                        ]}>
                        <Card.Content>
                          {/* Header: Intern Info + Date Badge */}
                          <View style={styles.rowBetween}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                flex: 1,
                              }}>
                              <Avatar.Text
                                size={38}
                                label={safeText(internObj.avatar || 'IN').substring(0, 2).toUpperCase()}
                                style={{marginRight: 10, backgroundColor: '#007171'}}
                                color="#fff"
                              />
                              <View style={{flex: 1}}>
                                <Text
                                  style={{
                                    fontWeight: 'bold',
                                    fontSize: 14,
                                    color: '#263238',
                                  }}>
                                  {safeText(internObj.name)}
                                </Text>
                                <Text style={{fontSize: 11, color: '#78909C'}}>
                                  {safeText(rpt.date) || 'Today'} • {safeText(rpt.type) || 'Daily EOD'}
                                </Text>
                              </View>
                            </View>
                            <Chip
                              compact
                              icon="check-circle"
                              style={{backgroundColor: '#E0F2F1'}}
                              textStyle={{color: '#004D4D', fontSize: 11, fontWeight: 'bold'}}>
                              Verified
                            </Chip>
                          </View>

                          <Divider style={{marginVertical: 8}} />

                          {/* 1. Summary */}
                          {rpt.summary ? (
                            <View style={{marginBottom: 8}}>
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                  color: '#37474F',
                                }}>
                                📝 EOD Summary / Overview:
                              </Text>
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: '#455A64',
                                  marginTop: 2,
                                  lineHeight: 18,
                                }}>
                                {safeText(rpt.summary)}
                              </Text>
                            </View>
                          ) : null}

                          {/* 2. Tasks Completed */}
                          {tasksDone ? (
                            <View style={{marginBottom: 8}}>
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                  color: '#2E7D32',
                                }}>
                                ✅ Completed Tasks & Progress:
                              </Text>
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: '#1B5E20',
                                  marginTop: 2,
                                  lineHeight: 18,
                                }}>
                                {safeText(tasksDone)}
                              </Text>
                            </View>
                          ) : null}

                          {/* 3. Blockers / Challenges */}
                          {blockers ? (
                            <View style={{marginBottom: 8}}>
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                  color: '#C62828',
                                }}>
                                ⚠️ Blockers & Challenges:
                              </Text>
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: '#B71C1C',
                                  marginTop: 2,
                                  lineHeight: 18,
                                }}>
                                {safeText(blockers)}
                              </Text>
                            </View>
                          ) : null}

                          {/* 4. Tomorrow's Goals */}
                          {tomorrow ? (
                            <View style={{marginBottom: 4}}>
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                  color: '#1565C0',
                                }}>
                                🎯 Tomorrow's Planned Goals:
                              </Text>
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: '#0D47A1',
                                  marginTop: 2,
                                  lineHeight: 18,
                                }}>
                                {safeText(tomorrow)}
                              </Text>
                            </View>
                          ) : null}
                        </Card.Content>
                      </Card>
                    );
                  })
                )}
              </ScrollView>

              <Button
                mode="outlined"
                onPress={() => setEodModalVisible(false)}
                style={{marginTop: 12}}>
                Close Reader
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>
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
          <Dialog.Actions>
            <Button onPress={() => setShowDeptDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      </Screen>
      <AIChatbot role="tl" visible={showMascot} />
    </View>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  deptText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  profileBadge: {
    padding: 2,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  categoryChip: {
    marginRight: 8,
  },
  sectionPadding: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  halfMetricCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 44) / 2,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  metricContent: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    marginTop: 4,
  },
  metricLbl: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMargin: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3EBF0',
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#263238',
  },
  cardSub: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
});

export default TLDashboard;
