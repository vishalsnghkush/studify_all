import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_KEY = '@studify_mock_intern_db';
const DB_VERSION = 'v7'; // bump this to force-reset on new APK install
const DB_VERSION_KEY = '@studify_mock_intern_db_version';

/**
 * Converts any date value (string, Date, timestamp) to a YYYY-MM-DD ISO string.
 * Returns '' if the input is invalid or missing.
 */
export const extractDateISO = (val) => {
  if (!val) return '';
  try {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.substring(0, 10);
    }
    const d = (val instanceof Date) ? val : new Date(val);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}
  return '';
};

/**
 * Given an attendanceMap (keyed by intern ID string → { [dateISO]: record })
 * and an intern object, returns today's attendance record or null.
 *
 * Handles both numeric and string ID variants.
 */
export const getTodayAttendanceRecord = (attendanceMap, intern) => {
  if (!attendanceMap || !intern) return null;
  const todayISO = extractDateISO(new Date());
  if (!todayISO) return null;

  // Also check yesterday (UTC shift workaround - backend may index today's record under yesterday's UTC date)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = extractDateISO(yesterday);

  // Try all possible ID variants the API may use
  const ids = [
    intern.id,
    intern.user_id,
    intern.internId,
    intern.email,
    intern.fname,
    intern.name,
  ].filter(Boolean).map(String);

  for (const id of ids) {
    const internAtt = attendanceMap[id];
    if (!internAtt || typeof internAtt !== 'object') continue;

    // Direct key lookup — exact today date
    if (internAtt[todayISO]) return internAtt[todayISO];

    // UTC shift workaround — check yesterday's key
    if (yesterdayISO && internAtt[yesterdayISO]) {
      const rec = internAtt[yesterdayISO];
      // Verify the record's actual timestamp is from today (not genuinely yesterday)
      if (rec.morning_marked_at || rec.evening_marked_at) {
        const markedDate = extractDateISO(rec.morning_marked_at || rec.evening_marked_at);
        if (markedDate === todayISO || markedDate === yesterdayISO) return rec;
      } else {
        return rec;
      }
    }

    // Sometimes the map values are records themselves (not nested by date)
    if (internAtt.status || internAtt.morning_marked_at || internAtt.evening_marked_at) {
      const recDate = extractDateISO(
        internAtt.date || internAtt.created_at || internAtt.marked_at,
      );
      if (recDate === todayISO || recDate === yesterdayISO) return internAtt;
    }

    // Search through all date keys for today
    for (const dateKey of Object.keys(internAtt)) {
      if (extractDateISO(dateKey) === todayISO) return internAtt[dateKey];
    }
  }
  return null;
};

/**
 * Returns true if the attendance record indicates the intern has checked in today
 * (either morning, evening, or any present-like status).
 */
export const isAttendanceCheckedIn = (record) => {
  if (!record) return false;
  if (record === 1 || record === true) return true;
  if (typeof record !== 'object') return false;
  // Full / Half / Present / Morning / Evening → checked in
  if (
    record.status === 'Full' ||
    record.status === 'Half' ||
    record.status === 'Present' ||
    record.status === 'Morning' ||
    record.status === 'Evening'
  ) return true;
  // Has a morning or evening timestamp
  if (record.morning_marked_at || record.evening_marked_at) return true;
  return false;
};

export const isMeetingExpired = (dateStr, timeStr) => {
  if (!dateStr) return false;
  if (dateStr.toLowerCase() === 'daily') return false; // Daily standups don't expire

  const now = new Date();
  let meetDate = null;

  if (dateStr.includes('-')) {
    // Format YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      meetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  } else {
    // Format "July 28" or "August 14"
    const currentYear = now.getFullYear();
    meetDate = new Date(`${dateStr}, ${currentYear}`);
  }

  if (!meetDate || isNaN(meetDate.getTime())) return false;

  // Add time if available
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3];
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
      meetDate.setHours(hours, minutes, 59, 999);
    } else {
      meetDate.setHours(23, 59, 59, 999);
    }
  } else {
    meetDate.setHours(23, 59, 59, 999);
  }

  return meetDate < now;
};

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
      status: 'Approved',
      timeLeft: 'Active',
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
      status: 'Approved',
      timeLeft: 'Active',
      avatar: 'BJ',
      offerLetterName: null,
    },
    {
      id: 'charlie_789',
      name: 'Charlie Smith',
      email: 'charlie.smith@studifysuccess.com',
      department: 'HR',
      duration: '6 Months',
      progress: 0.8,
      joined: '2026-07-10',
      status: 'Approved',
      timeLeft: 'Active',
      avatar: 'CS',
      offerLetterName: null,
    },
    {
      id: 'david_101',
      name: 'David Miller',
      email: 'david.m@studifysuccess.com',
      department: 'Design',
      duration: '3 Months',
      progress: 0.6,
      joined: '2026-07-15',
      status: 'Approved',
      timeLeft: 'Active',
      avatar: 'DM',
      offerLetterName: null,
    },
    {
      id: 'eva_202',
      name: 'Eva Davis',
      email: 'eva.davis@studifysuccess.com',
      department: 'Marketing',
      duration: '3 Months',
      progress: 0.7,
      joined: '2026-07-12',
      status: 'Approved',
      timeLeft: 'Active',
      avatar: 'ED',
      offerLetterName: null,
    },
    {
      id: 'frank_303',
      name: 'Frank Ocean',
      email: 'frank.o@studifysuccess.com',
      department: 'Content',
      duration: '6 Months',
      progress: 0.85,
      joined: '2026-07-05',
      status: 'Approved',
      timeLeft: 'Active',
      avatar: 'FO',
      offerLetterName: null,
    },
  ],
  reports: [],
  leaves: [],
  meetings: [],
  attendance: {},
  announcements: [],
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

      // Clean expired and dummy meetings automatically
      const cleanMeetings = (parsed.meetings || []).filter(m => m.id !== 'm3' && m.title !== 'Daily Standup & Sync' && !isMeetingExpired(m.date, m.time));
      if (cleanMeetings.length !== (parsed.meetings || []).length) {
        parsed.meetings = cleanMeetings;
        updated = true;
      }

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

export const addMockModule = async (mod) => {
  const db = await getInternDb();
  if (!db.modules) db.modules = [];
  const newMod = {id: Date.now().toString(), ...mod};
  db.modules = [newMod, ...db.modules];
  await saveInternDb(db);
  return newMod;
};

export const addMockFeedback = async (feedback) => {
  const db = await getInternDb();
  if (!db.feedbacks) db.feedbacks = [];
  db.feedbacks = [feedback, ...db.feedbacks];
  await saveInternDb(db);
  return feedback;
};
