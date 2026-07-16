import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

const ENGAGEMENT_KEY = '@studify_subject_engagement';
const FEATURE_USAGE_KEY = '@studify_feature_usage';
const PINNED_SUBJECT_KEY = '@studify_pinned_subject';
const INCOGNITO_KEY = '@studify_incognito_mode';
const LAST_DECAY_KEY = '@studify_last_decay_date';
const RECENT_NOTE_KEY = '@studify_recent_note';

/**
 * Checks if tracking is paused (Incognito Mode)
 */
export const isIncognito = async () => {
  try {
    const value = await AsyncStorage.getItem(INCOGNITO_KEY);
    return value === 'true';
  } catch {
    return false;
  }
};

/**
 * Sets Incognito Mode toggle
 */
export const setIncognito = async (value) => {
  try {
    await AsyncStorage.setItem(INCOGNITO_KEY, value ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting incognito:', error);
  }
};

/**
 * Track user interaction with a subject and feature type
 */
export const trackEngagement = async (subjectName, featureType) => {
  try {
    const incognito = await isIncognito();
    if (incognito) return; // Skip tracking in incognito mode

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

    // 3. Auto-schedule a local smart notification suggestion
    await schedulePersonalizedReminder();
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
    const subjectName = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);

    const channelId = await notifee.createChannel({
      id: 'personalization',
      name: 'Personalized Study Reminders',
      importance: AndroidImportance.DEFAULT,
    });

    await notifee.displayNotification({
      title: `Ready for some ${subjectName} revision? 🧠`,
      body: `Jump back into your personalized study path for ${subjectName} on Studify.`,
      android: {
        channelId,
        largeIcon: 'https://www.studifysuccess.com/images/apple-touch-icon.webp',
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
