import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_KEY = '@studify_mock_intern_db';
const DB_VERSION = 'v4'; // bump this to force-reset on new APK install
const DB_VERSION_KEY = '@studify_mock_intern_db_version';

const initialDb = {
  interns: [
    {
      id: 'alice_123',
      name: 'Alice Watson',
      email: 'alice.watson@studifysuccess.com',
      department: 'Tech',
      duration: '3 Months',
      progress: 0.5,
      joined: '2026-07-01',
      status: 'Pending',
      timeLeft: 'Awaiting Review',
      avatar: 'AW',
      offerLetterName: null,
    },
    {
      id: 'bob_456',
      name: 'Bob Jenkins',
      email: 'bob.jenkins@studifysuccess.com',
      department: 'Tech',
      duration: '3 Months',
      progress: 0.75,
      joined: '2026-07-01',
      status: 'Pending',
      timeLeft: 'Awaiting Review',
      avatar: 'BJ',
      offerLetterName: null,
    },
    {
      id: 'charlie_789',
      name: 'Charlie Smith',
      email: 'charlie.smith@studifysuccess.com',
      department: 'HR',
      duration: '6 Months',
      progress: 0.2,
      joined: '2026-07-10',
      status: 'Pending',
      timeLeft: 'Awaiting Review',
      avatar: 'CS',
      offerLetterName: null,
    },
  ],
  reports: [],
  leaves: [],
  meetings: [
    {
      id: 'm1',
      title: 'Weekly Q&A and Code Grooming',
      type: 'Training',
      department: 'Tech',
      date: 'July 28',
      time: '4:30 PM',
      link: 'https://meet.google.com/abc-defg-hij',
      createdBy: 'Team Lead',
    },
    {
      id: 'm2',
      title: 'CI/CD Pipeline Configurations',
      type: 'Training',
      department: 'Tech',
      date: 'July 30',
      time: '2:00 PM',
      link: 'https://meet.google.com/xyz-pdqr-lmn',
      createdBy: 'Team Lead',
    },
    {
      id: 'm3',
      title: 'Daily Standup & Sync',
      type: 'Discussion',
      department: 'Tech',
      date: 'Daily',
      time: '10:00 AM',
      link: 'https://meet.google.com/abc-defg-hij',
      createdBy: 'Team Lead',
    },
  ],
  attendance: {},
  announcements: [
    {
      id: 'a1',
      title: 'Welcome to StudifySuccess Internship!',
      body: 'Upload your offer letter in your Profile to unlock all features including chat, attendance, and reports.',
      type: 'Announcement',
      timeText: 'Just now',
      icon: 'bullhorn-outline',
      color: '#FF9800',
    },
  ],
  feedbacks: [],
};

export const getInternDb = async () => {
  try {
    // Check version — reset DB if version mismatch (new APK install)
    const savedVersion = await AsyncStorage.getItem(DB_VERSION_KEY);
    if (savedVersion !== DB_VERSION) {
      await AsyncStorage.setItem(DB_KEY, JSON.stringify(initialDb));
      await AsyncStorage.setItem(DB_VERSION_KEY, DB_VERSION);
      return JSON.parse(JSON.stringify(initialDb));
    }
    const data = await AsyncStorage.getItem(DB_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      let updated = false;
      if (!parsed.meetings) { parsed.meetings = initialDb.meetings; updated = true; }
      if (!parsed.announcements) { parsed.announcements = initialDb.announcements; updated = true; }
      if (!parsed.attendance) { parsed.attendance = {}; updated = true; }
      if (!parsed.reports) { parsed.reports = []; updated = true; }
      if (!parsed.leaves) { parsed.leaves = []; updated = true; }
      if (!parsed.feedbacks) { parsed.feedbacks = []; updated = true; }
      if (updated) { await AsyncStorage.setItem(DB_KEY, JSON.stringify(parsed)); }
      return parsed;
    }
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(initialDb));
    return JSON.parse(JSON.stringify(initialDb));
  } catch (e) {
    return JSON.parse(JSON.stringify(initialDb));
  }
};

export const saveInternDb = async (db) => {
  try {
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save mock intern db', e);
  }
};

// Force reset entire DB (used on fresh signup/wipe)
export const resetInternDb = async () => {
  try {
    await AsyncStorage.removeItem(DB_KEY);
    await AsyncStorage.removeItem(DB_VERSION_KEY);
  } catch (e) {}
};

export const addMockReport = async (report) => {
  const db = await getInternDb();
  db.reports = [report, ...(db.reports || [])];
  await saveInternDb(db);
};

export const addMockLeave = async (leave) => {
  const db = await getInternDb();
  db.leaves = [leave, ...(db.leaves || [])];
  await saveInternDb(db);
};

export const updateMockLeaveStatus = async (leaveId, status) => {
  const db = await getInternDb();
  db.leaves = db.leaves.map(l => l.id === leaveId ? {...l, status} : l);
  await saveInternDb(db);
};

export const updateInternApproval = async (internId, status) => {
  const db = await getInternDb();
  db.interns = db.interns.map(i =>
    i.id === internId ? {...i, status, timeLeft: status === 'Approved' ? '0d 0h' : i.timeLeft} : i
  );
  await saveInternDb(db);
};

export const updateOfferLetter = async (internId, offerLetterName) => {
  const db = await getInternDb();
  // Reset status to Pending whenever a new offer letter is uploaded/replaced
  db.interns = db.interns.map(i =>
    i.id === internId
      ? {...i, offerLetterName, status: offerLetterName ? 'Pending' : i.status}
      : i
  );
  await saveInternDb(db);
};

export const markInternPresent = async (internId, day) => {
  const db = await getInternDb();
  if (!db.attendance) db.attendance = {};
  if (!db.attendance[internId]) db.attendance[internId] = {};
  db.attendance[internId][day] = 1;
  await saveInternDb(db);
};

export const addMockMeeting = async (meeting) => {
  const db = await getInternDb();
  if (!db.meetings) db.meetings = [];
  const newMeeting = { id: Date.now().toString(), ...meeting };
  db.meetings = [newMeeting, ...db.meetings];
  await saveInternDb(db);
  return newMeeting;
};

export const addMockAnnouncement = async (ann) => {
  const db = await getInternDb();
  if (!db.announcements) db.announcements = [];
  const newAnn = { id: Date.now().toString(), ...ann };
  db.announcements = [newAnn, ...db.announcements];
  await saveInternDb(db);
  return newAnn;
};

const defaultTasks = [
  { id: '1', title: 'Complete onboarding documentation', completed: false },
  { id: '2', title: 'Setup development environment', completed: false },
  { id: '3', title: 'Review department guidelines & SOPs', completed: false },
  { id: '4', title: 'Attend orientation session', completed: false },
  { id: '5', title: 'Submit first weekly report', completed: false },
  { id: '6', title: 'Connect with team members', completed: false },
  { id: '7', title: 'Complete assigned module training', completed: false },
  { id: '8', title: 'Review and update LinkedIn profile', completed: false },
];

export const getInternTasks = async (internId) => {
  const db = await getInternDb();
  const intern = db.interns.find(i => i.id === internId || i.email === internId);
  const dept = intern?.department || 'Tech';
  if (!db.departmentTasks) db.departmentTasks = {};
  if (!db.departmentTasks[dept]) {
    db.departmentTasks[dept] = defaultTasks.map(t => ({
      ...t,
      assignedTo: [],
      helpNeeded: false,
      completedBy: null,
    }));
    await saveInternDb(db);
  }
  return db.departmentTasks[dept];
};

export const saveInternTasks = async (internId, tasks) => {
  const db = await getInternDb();
  const intern = db.interns.find(i => i.id === internId || i.email === internId);
  const dept = intern?.department || 'Tech';
  if (!db.departmentTasks) db.departmentTasks = {};
  db.departmentTasks[dept] = tasks;
  await saveInternDb(db);
};

export const syncInternProfile = async (user) => {
  if (!user || !user.is_intern) return;
  const db = await getInternDb();
  const userId = user.user_id || user.email;
  const existingIndex = db.interns.findIndex(
    i => i.id === userId || (user.email && i.email === user.email)
  );
  if (existingIndex >= 0) {
    // Update name/email if needed but DON'T change status — TL controls that
    db.interns[existingIndex] = {
      ...db.interns[existingIndex],
      name: `${user.fname || 'Intern'} ${user.lname || ''}`.trim(),
      email: user.email || db.interns[existingIndex].email,
    };
  } else {
    // New intern — always starts as Pending, TL must approve
    db.interns.push({
      id: userId,
      name: `${user.fname || 'Intern'} ${user.lname || ''}`.trim(),
      email: user.email || '',
      department: user.department || 'Tech',
      duration: '3 Months',
      progress: 0.0,
      joined: new Date().toISOString().split('T')[0],
      status: 'Pending',
      timeLeft: 'Awaiting Review',
      avatar: (user.fname?.[0] || 'I') + (user.lname?.[0] || ''),
      offerLetterName: null,
    });
  }
  await saveInternDb(db);
};

export const getInternInterviews = async (internId) => {
  const db = await getInternDb();
  if (!db.interviews) db.interviews = {};
  return db.interviews[internId] || [];
};

export const saveInternInterview = async (internId, domain, score) => {
  const db = await getInternDb();
  if (!db.interviews) db.interviews = {};
  if (!db.interviews[internId]) db.interviews[internId] = [];
  const newInterview = {
    id: Date.now().toString(),
    domain,
    score,
    date: new Date().toISOString().split('T')[0],
  };
  db.interviews[internId] = [newInterview, ...db.interviews[internId]];
  await saveInternDb(db);
  return newInterview;
};

export const addMockFeedback = async (feedback) => {
  const db = await getInternDb();
  if (!db.feedbacks) db.feedbacks = [];
  db.feedbacks = [feedback, ...db.feedbacks];
  await saveInternDb(db);
  return feedback;
};
