import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

const ENGAGEMENT_KEY = '@studify_subject_engagement';
const FEATURE_USAGE_KEY = '@studify_feature_usage';
const PINNED_SUBJECT_KEY = '@studify_pinned_subject';
const INCOGNITO_KEY = '@studify_incognito_mode';
const LAST_DECAY_KEY = '@studify_last_decay_date';
const RECENT_NOTE_KEY = '@studify_recent_note';

export const isIncognito = async () => false;
export const setIncognito = async () => {};

/**
 * Track user interaction with a subject and feature type
 */
export const trackEngagement = async (subjectName, featureType) => {
  try {

    if (!subjectName || !featureType) return;
    const formattedSubject = subjectName.trim().toLowerCase();

    // 1. Update Subject Engagement Counts & Timestamps
    const rawEngagement = await AsyncStorage.getItem(ENGAGEMENT_KEY);
    const engagementData = rawEngagement ? JSON.parse(rawEngagement) : {};
    
    if (!engagementData[formattedSubject]) {
      engagementData[formattedSubject] = { count: 0, lastOpenedTime: 0 };
    }
    
    engagementData[formattedSubject].count += 1;
    engagementData[formattedSubject].lastOpenedTime = Date.now();
    await AsyncStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(engagementData));

    // 2. Update Feature Usage Counts
    const rawFeature = await AsyncStorage.getItem(FEATURE_USAGE_KEY);
    const featureData = rawFeature ? JSON.parse(rawFeature) : { note: 0, quiz: 0, lecture: 0 };
    
    featureData[featureType] = (featureData[featureType] || 0) + 1;
    await AsyncStorage.setItem(FEATURE_USAGE_KEY, JSON.stringify(featureData));

    // 3. Auto-schedule a local smart notification — at most ONCE per day, not on every tap
    const today = new Date().toISOString().split('T')[0];
    const lastNotifDate = await AsyncStorage.getItem('@studify_last_notif_date');
    if (lastNotifDate !== today) {
      await schedulePersonalizedReminder();
      await AsyncStorage.setItem('@studify_last_notif_date', today);
    }
  } catch (error) {
    console.error('Error tracking engagement:', error);
  }
};

/**
 * Returns sorted list of subjects based on count, boosted by manual pinning
 */
export const getTopEngagedSubjects = async (limit = 3) => {
  try {
    const rawEngagement = await AsyncStorage.getItem(ENGAGEMENT_KEY);
    const engagementData = rawEngagement ? JSON.parse(rawEngagement) : {};

    const pinnedSubject = await getPinnedSubject();
    
    // Sort subjects by count descending, applying a boost if subject is pinned
    const sorted = Object.entries(engagementData).map(([name, data]) => {
      let score = data.count;
      if (pinnedSubject && name.toLowerCase() === pinnedSubject.toLowerCase()) {
        score += 50; // Give pinned subject a massive score boost
      }
      return { name, count: score, lastOpenedTime: data.lastOpenedTime };
    });

    // If pinned subject is not in engagement data yet, inject it manually
    if (pinnedSubject && !engagementData[pinnedSubject.toLowerCase()]) {
      sorted.push({ name: pinnedSubject.toLowerCase(), count: 50, lastOpenedTime: Date.now() });
    }

    return sorted
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.name);
  } catch (error) {
    console.error('Error getting top engaged subjects:', error);
    return [];
  }
};

/**
 * Fetch all subject stats for visualization
 */
export const getAllSubjectStats = async () => {
  try {
    const rawEngagement = await AsyncStorage.getItem(ENGAGEMENT_KEY);
    return rawEngagement ? JSON.parse(rawEngagement) : {};
  } catch {
    return {};
  }
};

/**
 * Pinned focus subject management
 */
export const getPinnedSubject = async () => {
  return await AsyncStorage.getItem(PINNED_SUBJECT_KEY);
};

export const setPinnedSubject = async (subjectName) => {
  if (subjectName) {
    await AsyncStorage.setItem(PINNED_SUBJECT_KEY, subjectName);
  } else {
    await AsyncStorage.removeItem(PINNED_SUBJECT_KEY);
  }
};

/**
 * Most recently studied note/lecture
 */
export const getRecentNote = async () => {
  const raw = await AsyncStorage.getItem(RECENT_NOTE_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setRecentNote = async (noteObj) => {
  try {
    const incognito = await isIncognito();
    if (incognito) return;
    await AsyncStorage.setItem(RECENT_NOTE_KEY, JSON.stringify({
      ...noteObj,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error setting recent note:', error);
  }
};

/**
 * Open recent note item based on type and screen parameters
 */
export const openRecentItem = (navigation, recentNote) => {
  if (!recentNote || !navigation) return;

  // 1. Explicit Screen Routing
  if (recentNote.screen) {
    if (recentNote.screen === 'Pdf') {
      if (recentNote.pdf_url) {
        navigation.navigate('Pdf', {
          url: recentNote.pdf_url,
          title: recentNote.name,
          subject: recentNote.subject,
          studentClass: recentNote.studentClass,
        });
        return;
      }
    } else if (recentNote.screen === 'AiNotesGenerator') {
      navigation.navigate('AiNotesGenerator', {
        board: recentNote.board || 'CBSE',
        subject: recentNote.subject || 'General',
        topic: recentNote.targetTopic || recentNote.name,
        subtopic: recentNote.subtopic || '',
        studentClass: recentNote.class || recentNote.studentClass || 'Class 10',
      });
      return;
    } else if (recentNote.screen === 'AiLecturePlayer') {
      navigation.navigate('AiLecturePlayer', {
        board: recentNote.board || 'CBSE',
        subject: recentNote.subject || 'General',
        topic: recentNote.topic || recentNote.name,
        subtopic: recentNote.subtopic || '',
        studentClass: recentNote.class || recentNote.studentClass || 'Class 10',
      });
      return;
    } else if (recentNote.screen === 'VoiceNotebook') {
      navigation.navigate('VoiceNotebook');
      return;
    } else if (recentNote.screen === 'WebView') {
      if (recentNote.url) {
        navigation.navigate('WebView', { url: recentNote.url });
        return;
      }
    }
  }

  // 2. Fallbacks based on properties
  if (recentNote.pdf_url) {
    navigation.navigate('Pdf', {
      url: recentNote.pdf_url,
      title: recentNote.name,
      subject: recentNote.subject,
      studentClass: recentNote.studentClass,
    });
  } else if (recentNote.url) {
    navigation.navigate('WebView', { url: recentNote.url });
  } else if (recentNote.type === 'lecture') {
    navigation.navigate('AiLecturePlayer', {
      board: recentNote.board || 'CBSE',
      subject: recentNote.subject || 'General',
      topic: recentNote.name,
      studentClass: recentNote.class || 'Class 10',
    });
  } else {
    // Default fallback for notes without PDF URL (AI Notes / Generated Notes)
    navigation.navigate('AiNotesGenerator', {
      board: recentNote.board || 'CBSE',
      subject: recentNote.subject || 'General',
      topic: recentNote.name,
      subtopic: recentNote.subtopic || '',
      studentClass: recentNote.class || 'Class 10',
    });
  }
};

/**
 * Calculate the user's Study Style Persona based on feature usage ratios
 */
export const getStudyStylePersona = async () => {
  try {
    const rawFeature = await AsyncStorage.getItem(FEATURE_USAGE_KEY);
    const featureData = rawFeature ? JSON.parse(rawFeature) : { note: 0, quiz: 0, lecture: 0 };
    
    const { note = 0, quiz = 0, lecture = 0 } = featureData;
    const total = note + quiz + lecture;
    if (total === 0) {
      return {
        title: 'Exploring Scholar',
        icon: 'compass-outline',
        desc: 'You are just beginning to explore the different learning features of Studify. Try generating some notes or quizzes!',
        color: '#607d8b',
        bg: '#eceff1'
      };
    }

    const noteRatio = note / total;
    const quizRatio = quiz / total;
    const lectureRatio = lecture / total;

    if (noteRatio > 0.5) {
      return {
        title: 'Visual Reader',
        icon: 'book-open-page-variant-outline',
        desc: 'You prefer structured reading, visual notes, and handwritten summaries to absorb concepts.',
        color: '#007171',
        bg: '#e0f2f2'
      };
    } else if (quizRatio > 0.4) {
      return {
        title: 'Active Tester',
        icon: 'brain',
        desc: 'You love testing your knowledge, using flashcards, and generating quizzes to recall chapters.',
        color: '#673ab7',
        bg: '#ede7f6'
      };
    } else if (lectureRatio > 0.4) {
      return {
        title: 'Auditory Learner',
        icon: 'headphones',
        desc: 'You study best by listening to interactive slides, audio playbacks, and narration.',
        color: '#e65100',
        bg: '#fff3e0'
      };
    }

    return {
      title: 'Versatile Achiever',
      icon: 'school-outline',
      desc: 'You use a balanced mix of visual reading, audio lectures, and practice testing for maximum retention.',
      color: '#4f46e5',
      bg: '#eef2ff'
    };
  } catch {
    return {
      title: 'Exploring Scholar',
      icon: 'compass-outline',
      desc: 'You are just beginning to explore the different learning features.',
      color: '#607d8b',
      bg: '#eceff1'
    };
  }
};

/**
 * Checks and applies 50% decay to all counts every 7 days
 */
export const checkAndApplyDecay = async () => {
  try {
    const rawLastDecay = await AsyncStorage.getItem(LAST_DECAY_KEY);
    const lastDecayDate = rawLastDecay ? new Date(rawLastDecay) : null;
    const now = new Date();
    
    // Check if 7 days (604800000 ms) have passed
    if (!lastDecayDate || (now - lastDecayDate) >= 7 * 24 * 60 * 60 * 1000) {
      const rawEngagement = await AsyncStorage.getItem(ENGAGEMENT_KEY);
      if (rawEngagement) {
        const data = JSON.parse(rawEngagement);
        Object.keys(data).forEach(key => {
          data[key].count = Math.max(0, Math.round(data[key].count * 0.5 * 10) / 10);
        });
        await AsyncStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(data));
      }

      const rawFeature = await AsyncStorage.getItem(FEATURE_USAGE_KEY);
      if (rawFeature) {
        const data = JSON.parse(rawFeature);
        Object.keys(data).forEach(key => {
          data[key] = Math.max(0, Math.round(data[key] * 0.5));
        });
        await AsyncStorage.setItem(FEATURE_USAGE_KEY, JSON.stringify(data));
      }

      await AsyncStorage.setItem(LAST_DECAY_KEY, now.toISOString());
      console.log('Successfully decayed local engagement counts by 50%.');
    }
  } catch (error) {
    console.error('Error applying decay:', error);
  }
};

/**
 * Clear all local engagement analytics
 */
export const clearAllEngagementData = async () => {
  try {
    await AsyncStorage.removeItem(ENGAGEMENT_KEY);
    await AsyncStorage.removeItem(FEATURE_USAGE_KEY);
    await AsyncStorage.removeItem(PINNED_SUBJECT_KEY);
    await AsyncStorage.removeItem(RECENT_NOTE_KEY);
    await AsyncStorage.removeItem(LAST_DECAY_KEY);
  } catch (error) {
    console.error('Error resetting analytics:', error);
  }
};

/**
 * Create a personalized notification tip based on top subject
 */
export const schedulePersonalizedReminder = async () => {
  try {
    const topSubjects = await getTopEngagedSubjects(1);
    if (topSubjects.length === 0) return;

    const rawSubject = topSubjects[0];
    // Skip if top subject is empty or 'general'
    if (!rawSubject || rawSubject.toLowerCase() === 'general') return;

    const subjectName = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);

    const channelId = await notifee.createChannel({
      id: 'personalization',
      name: 'Personalized Study Reminders',
      importance: AndroidImportance.DEFAULT,
    });

    await notifee.displayNotification({
      id: 'personalized_reminder', // Fixed ID ensures only 1 notification replaces itself
      title: `Ready for some ${subjectName} revision? 🧠`,
      body: `Jump back into your personalized study path for ${subjectName} on Studify.`,
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
        color: 'teal',
      },
    });
  } catch (error) {
    console.error('Error displaying local notification:', error);
  }
};

/**
 * Retrieve average test accuracy from test history
 */
export const getAverageTestAccuracy = async () => {
  try {
    const rawHistory = await AsyncStorage.getItem('@studify_test_history');
    if (!rawHistory) return null;
    const history = JSON.parse(rawHistory);
    if (!Array.isArray(history) || history.length === 0) return null;
    const totalAccuracy = history.reduce((sum, item) => sum + (item.accuracy || 0), 0);
    return Math.round(totalAccuracy / history.length);
  } catch (error) {
    console.error('Error getting average test accuracy:', error);
    return null;
  }
};

/**
 * Retrieve the last failed topic
 */
export const getLastFailedTopic = async () => {
  try {
    const rawFailed = await AsyncStorage.getItem('@studify_last_failed_topic');
    if (!rawFailed) return null;
    return JSON.parse(rawFailed);
  } catch (error) {
    console.error('Error getting last failed topic:', error);
    return null;
  }
};

/**
 * Retrieve feature usage counts
 */
export const getFeatureUsageStats = async () => {
  try {
    const rawFeature = await AsyncStorage.getItem(FEATURE_USAGE_KEY);
    return rawFeature ? JSON.parse(rawFeature) : { note: 0, quiz: 0, lecture: 0 };
  } catch (error) {
    console.error('Error getting feature usage stats:', error);
    return { note: 0, quiz: 0, lecture: 0 };
  }
};

/**
 * Log a learning study session universally
 */
export const logStudySession = async (subjectName, title, activityType, durationSeconds) => {
  try {
    const incognito = await isIncognito();
    if (incognito) return; // Skip if in incognito mode
    if (!subjectName || durationSeconds < 2) return;

    const sessionRecord = {
      subject: subjectName.trim(),
      title: title || 'Study Session',
      activityType: activityType, // "AI Notes" | "PDF Note" | "AI Lecture" | "Mock Test" | "Focus Timer" | "Voice Note"
      duration: durationSeconds,
      timestamp: Date.now(),
    };

    const existing = await AsyncStorage.getItem('@studify_study_sessions_history');
    const sessions = existing ? JSON.parse(existing) : [];
    sessions.push(sessionRecord);
    await AsyncStorage.setItem('@studify_study_sessions_history', JSON.stringify(sessions));

    // Also track standard engagement to update counts (so Learning Diet stays updated!)
    await trackEngagement(subjectName, activityType.toLowerCase());
  } catch (error) {
    console.error('Error logging study session:', error);
  }
};

/**
 * Retrieve the AI Focus Subject of the Day dynamically based on:
 * - Time Since Last Study (Forgetting Curve)
 * - Academic Weakness (Scores & Last Failed Quiz Topic)
 * - Exam Urgency (Countdown to Target Exam)
 */
export const getAIFocusSubject = async () => {
  try {
    const rawEngagement = await AsyncStorage.getItem(ENGAGEMENT_KEY);
    const engagementData = rawEngagement ? JSON.parse(rawEngagement) : {};
    
    const rawFailed = await AsyncStorage.getItem('@studify_last_failed_topic');
    const failedTopic = rawFailed ? JSON.parse(rawFailed) : null;

    const rawHistory = await AsyncStorage.getItem('@studify_test_history');
    const testHistory = rawHistory ? JSON.parse(rawHistory) : [];

    const rawTarget = await AsyncStorage.getItem('@studify_exam_target');
    const examTarget = rawTarget ? JSON.parse(rawTarget) : null;

    const subjectScores = {};

    // 1. Initialize tracked subjects
    Object.keys(engagementData).forEach(subj => {
      const formatted = subj.trim().toLowerCase();
      subjectScores[formatted] = { name: subj, score: 0, timeWeight: 0, weaknessWeight: 0, urgencyWeight: 0 };
    });

    // If failed topic has a subject not in tracked list, add it
    if (failedTopic && failedTopic.subject) {
      const formatted = failedTopic.subject.trim().toLowerCase();
      if (!subjectScores[formatted]) {
        subjectScores[formatted] = { name: failedTopic.subject, score: 0, timeWeight: 0, weaknessWeight: 0, urgencyWeight: 0 };
      }
    }

    const now = Date.now();

    // 2. Calculate Weights
    Object.keys(subjectScores).forEach(subjKey => {
      const data = engagementData[subjKey] || { lastOpenedTime: now };
      
      // A. Forgetting Curve (Time elapsed)
      const diffMs = now - (data.lastOpenedTime || now);
      const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const timeWeight = Math.min(10, daysElapsed) * 1.5; 
      subjectScores[subjKey].timeWeight = timeWeight;

      // B. Academic Weakness
      let weaknessWeight = 0;
      if (failedTopic && failedTopic.subject.trim().toLowerCase() === subjKey) {
        weaknessWeight += 15;
      }
      const subjTests = testHistory.filter(t => (t.subject || '').trim().toLowerCase() === subjKey);
      if (subjTests.length > 0) {
        const avgAcc = subjTests.reduce((sum, t) => sum + (t.accuracy || 0), 0) / subjTests.length;
        weaknessWeight += (100 - avgAcc) * 0.15;
      }
      subjectScores[subjKey].weaknessWeight = weaknessWeight;

      // C. Exam Urgency
      let urgencyWeight = 0;
      if (examTarget && examTarget.date) {
        const examDate = new Date(examTarget.date).getTime();
        const diffTime = examDate - now;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
          urgencyWeight += Math.min(20, Math.max(1, 100 / daysLeft));
        }
      }
      subjectScores[subjKey].urgencyWeight = urgencyWeight;

      // E. Combined Smart Score
      subjectScores[subjKey].score = timeWeight + weaknessWeight + urgencyWeight;
    });

    const sorted = Object.values(subjectScores).sort((a, b) => b.score - a.score);
    return sorted.length > 0 ? sorted[0].name : null;
  } catch (error) {
    console.error('Error calculating AI Focus Subject:', error);
    return null;
  }
};


