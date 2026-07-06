import axios from 'axios';

/**
 * Sync local gamification data to backend MySQL database via Node.js API
 */
export const syncGamificationToFirebase = async (user, gamificationState) => {
  if (!user || !gamificationState) {
    return;
  }

  try {
    const payload = {
      xp: gamificationState.xp || 0,
      level: gamificationState.level || 1,
      streak: gamificationState.streak || 0,
    };
    
    // Call backend API instead of Firestore
    await axios.post('user/gamification/sync', payload);
    console.log('Gamification synced to backend successfully');
  } catch (error) {
    console.log(
      'Error syncing gamification to backend:',
      error?.response?.data || error.message,
    );
  }
};

/**
 * Fetch global leaderboard top 10 from backend
 */
export const fetchGlobalLeaderboard = async () => {
  try {
    // Call backend API instead of Firestore
    const response = await axios.get('user/gamification/leaderboard');
    // Response payload structure is { status: 200, message: null, data: [...] }
    const results = response.data?.data || [];
    return results;
  } catch (error) {
    console.log(
      'Error fetching global leaderboard:',
      error?.response?.data || error.message,
    );
    return [];
  }
};

/**
 * Fetch the user's actual rank by counting users with higher XP in MySQL
 */
export const fetchUserRank = async (userXp) => {
  try {
    // Call backend API instead of Firestore
    const response = await axios.get('user/gamification/rank');
    // Response payload structure is { status: 200, message: null, data: { rank: X } }
    if (response.data?.data?.rank) {
      return response.data.data.rank;
    }
    return 1;
  } catch (error) {
    console.log(
      'Error fetching user rank:',
      error?.response?.data || error.message
    );
    return 1;
  }
};
