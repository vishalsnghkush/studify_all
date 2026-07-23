import {createSlice} from '@reduxjs/toolkit';

// Format date as YYYY-MM-DD in local time
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if date2 is exactly the day after date1
export const isNextDay = (date1Str, date2Str) => {
  if (!date1Str) {
    return false;
  }
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  // Reset time portions to compare days
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

const xpPerLevel = 200; // XP needed to level up

const initialState = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  streakHistory: [], // Holds last 14 days of active status
  badges: [], // IDs of earned badges
  rewardsClaimed: [], // IDs of claimed rewards
  lastBrainGymDate: null,
  lastBrainGymDates: {}, // Tracks daily dates per individual game: { [gameId]: 'YYYY-MM-DD' }
};

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    checkStreak(state) {
      const today = getLocalDateString();
      const lastActive = state.lastActiveDate;

      // Update streak history to keep it bounded to last 7 days
      if (!state.streakHistory) {
        state.streakHistory = [];
      }

      if (!lastActive) {
        // First time
        state.streak = 1;
        state.lastActiveDate = today;
        if (!state.streakHistory.includes(today)) {
          state.streakHistory.push(today);
        }
      } else if (lastActive === today) {
        // Already active today, do nothing
      } else if (isNextDay(lastActive, today)) {
        // Consecutive day
        state.streak += 1;
        state.lastActiveDate = today;
        if (!state.streakHistory.includes(today)) {
          state.streakHistory.push(today);
        }
      } else {
        // Streak broken
        state.streak = 1;
        state.lastActiveDate = today;
        if (!state.streakHistory.includes(today)) {
          state.streakHistory.push(today);
        }
      }

      // Keep streak history to maximum last 14 items
      if (state.streakHistory.length > 14) {
        state.streakHistory = state.streakHistory.slice(-14);
      }

      // Check for streak milestones
      if (state.streak >= 3 && !state.badges.includes('streak_3')) {
        state.badges.push('streak_3');
        state.xp += 100;
      }
      if (state.streak >= 7 && !state.badges.includes('streak_7')) {
        state.badges.push('streak_7');
        state.xp += 250;
      }
      if (state.streak >= 30 && !state.badges.includes('streak_30')) {
        state.badges.push('streak_30');
        state.xp += 1000;
      }

      // Recalculate level
      state.level = Math.floor(state.xp / xpPerLevel) + 1;
    },

    awardXP(state, action) {
      const {amount} = action.payload;
      state.xp += amount;

      // Calculate level
      const newLevel = Math.floor(state.xp / xpPerLevel) + 1;
      state.level = newLevel;

      // Check XP milestones
      if (state.xp >= 1000 && !state.badges.includes('xp_1000')) {
        state.badges.push('xp_1000');
        state.xp += 200;
      }
    },

    triggerActivity(state, action) {
      const activity = action.payload; // e.g., 'task_completed', 'test_generated'
      let xpEarned = 0;

      switch (activity) {
        case 'task_completed':
          xpEarned = 20;
          if (!state.badges.includes('first_task')) {
            state.badges.push('first_task');
            state.xp += 50; // First task bonus
          }
          break;
        case 'test_generated':
          xpEarned = 30;
          if (!state.badges.includes('test_creator')) {
            state.badges.push('test_creator');
            state.xp += 100; // First test bonus
          }
          break;
        case 'quiz_started':
          xpEarned = 15;
          if (!state.badges.includes('first_quiz')) {
            state.badges.push('first_quiz');
            state.xp += 50; // First quiz bonus
          }
          break;
        case 'pdf_read':
          xpEarned = 15;
          if (!state.badges.includes('pdf_reader')) {
            state.badges.push('pdf_reader');
            state.xp += 50; // First PDF bonus
          }
          break;
        default:
          break;
      }

      state.xp += xpEarned;
      state.level = Math.floor(state.xp / xpPerLevel) + 1;

      // Check XP milestone
      if (state.xp >= 1000 && !state.badges.includes('xp_1000')) {
        state.badges.push('xp_1000');
        state.xp += 200;
        state.level = Math.floor(state.xp / xpPerLevel) + 1;
      }
    },

    claimReward(state, action) {
      const rewardId = action.payload;
      if (!state.rewardsClaimed) {
        state.rewardsClaimed = [];
      }

      if (!state.rewardsClaimed.includes(rewardId)) {
        state.rewardsClaimed.push(rewardId);

        // Award XP bonuses for claiming consistency rewards
        if (rewardId === 'reward_3_day') {
          state.xp += 100;
        } else if (rewardId === 'reward_7_day') {
          state.xp += 250;
        } else if (rewardId === 'reward_14_day') {
          state.xp += 500;
        } else if (rewardId === 'reward_30_day') {
          state.xp += 1000;
        }

        state.level = Math.floor(state.xp / xpPerLevel) + 1;
      }
    },

    completeDailyGame(state, action) {
      const gameId = action.payload || 'math_quest';
      const today = getLocalDateString();
      
      // Update legacy field for compatibility
      state.lastBrainGymDate = today;
      
      if (!state.lastBrainGymDates) {
        state.lastBrainGymDates = {};
      }
      state.lastBrainGymDates[gameId] = today;
      state.xp += 5;
      state.level = Math.floor(state.xp / xpPerLevel) + 1;
    },

    resetGamification(state) {
      return initialState;
    },
  },
});

export const {
  checkStreak,
  awardXP,
  triggerActivity,
  claimReward,
  resetGamification,
  completeDailyGame,
} = gamificationSlice.actions;

export default gamificationSlice.reducer;
