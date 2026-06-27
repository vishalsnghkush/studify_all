import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useTheme,
  Card,
  Button as PaperButton,
  Portal,
  Dialog,
  ActivityIndicator,
} from 'react-native-paper';
import {Text} from '../../Components/Input';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Confetti} from '../../Components/Screen/Confetti';
import FlashMessage from '../../Components/Screen/FlashMessage';
import {claimReward} from '../../Redux/Slices/GamificationSlice';
import {
  syncGamificationToFirebase,
  fetchGlobalLeaderboard,
} from '../../Utils/GamificationSync';

const {width} = Dimensions.get('window');

const BADGES_LIST = [
  {
    id: 'first_quiz',
    title: 'Quiz Starter',
    description: 'Began your first online practice quiz',
    icon: 'chat-question-outline',
    color: '#0284c7',
    xpReward: 50,
  },
  {
    id: 'first_task',
    title: 'Task Solver',
    description: 'Completed your first study planner task',
    icon: 'checkbox-marked-circle-outline',
    color: '#10b981',
    xpReward: 50,
  },
  {
    id: 'streak_3',
    title: 'Streak Bronze',
    description: 'Maintained a 3-day learning streak',
    icon: 'fire',
    color: '#d97706',
    xpReward: 100,
  },
  {
    id: 'streak_7',
    title: 'Streak Silver',
    description: 'Maintained a 7-day learning streak',
    icon: 'fire-circle',
    color: '#94a3b8',
    xpReward: 250,
  },
  {
    id: 'streak_30',
    title: 'Streak Gold',
    description: 'Achieved a massive 30-day streak',
    icon: 'crown-outline',
    color: '#fbbf24',
    xpReward: 1000,
  },
  {
    id: 'test_creator',
    title: 'Test Conqueror',
    description: 'Generated an AI study test',
    icon: 'brain',
    color: '#8b5cf6',
    xpReward: 100,
  },
  {
    id: 'pdf_reader',
    title: 'Book Worm',
    description: 'Opened your first study notes PDF',
    icon: 'book-open-page-variant-outline',
    color: '#ec4899',
    xpReward: 50,
  },
  {
    id: 'xp_1000',
    title: 'Elite Student',
    description: 'Earned a total of 1000 XP points',
    icon: 'seal-variant',
    color: '#f43f5e',
    xpReward: 200,
  },
];

const REWARDS_LIST = [
  {
    id: 'reward_3_day',
    title: 'Bronze Consistency Pack',
    description: 'Unlocks at 3-day study streak',
    requirement: 3,
    rewardDesc: '+100 XP Points & Bronze Medal',
    icon: 'trophy-award',
    color: '#d97706',
  },
  {
    id: 'reward_7_day',
    title: 'Silver Consistency Pack',
    description: 'Unlocks at 7-day study streak',
    requirement: 7,
    rewardDesc: '+250 XP Points & Emerald Green Dashboard Theme',
    icon: 'gift-outline',
    color: '#10b981',
  },
  {
    id: 'reward_14_day',
    title: 'Gold Course Discount',
    description: 'Unlocks at 14-day study streak',
    requirement: 14,
    rewardDesc: '+500 XP Points & 20% Discount Coupon (Code: STUDY20)',
    icon: 'ticket-percent-outline',
    color: '#fbbf24',
  },
  {
    id: 'reward_30_day',
    title: 'Diamond Legend Pack',
    description: 'Unlocks at 30-day study streak',
    requirement: 30,
    rewardDesc: '+1000 XP Points & Studify Premium Scholar Certificate',
    icon: 'crown-outline',
    color: '#a855f7',
  },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function GamificationDashboard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const {colors} = theme;

  const {xp, level, streak, streakHistory, badges, rewardsClaimed} =
    useSelector(
      state =>
        state.gamification || {
          xp: 0,
          level: 1,
          streak: 0,
          streakHistory: [],
          badges: [],
          rewardsClaimed: [],
        },
    );
  const {user} = useSelector(state => state.initial);
  const gamificationState = useSelector(state => state.gamification);

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'badges' | 'leaderboard'
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badgeDialogVisible, setBadgeDialogVisible] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const xpPerLevel = 200;
  const currentLevelProgress = xp % xpPerLevel;
  const progressPercent = Math.max(
    0.02,
    Math.min(1.0, currentLevelProgress / xpPerLevel),
  );

  // Sync state on change
  useEffect(() => {
    if (user && user.email && gamificationState) {
      syncGamificationToFirebase(user, gamificationState);
    }
  }, [gamificationState, user]);

  // Fetch leaderboard on tab select
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      const loadLeaderboard = async () => {
        setLoadingLeaderboard(true);
        const data = await fetchGlobalLeaderboard();
        if (data && data.length > 0) {
          // Map isUser dynamically
          const mapped = data.map(item => ({
            ...item,
            isUser: item.email === user.email,
          }));

          // Check if current user is in list, if not append them
          const userInList = mapped.some(item => item.email === user.email);
          if (!userInList && user.email) {
            mapped.push({
              email: user.email,
              name: user.fname ? `${user.fname} ${user.lname}` : 'You',
              xp: xp,
              avatar: (user.fname?.[0] || 'Y') + (user.lname?.[0] || ''),
              isUser: true,
              level: level,
              streak: streak,
            });
          }

          mapped.sort((a, b) => b.xp - a.xp);
          setGlobalLeaderboard(mapped);
        } else {
          setGlobalLeaderboard([]);
        }
        setLoadingLeaderboard(false);
      };

      loadLeaderboard();
    }
  }, [activeTab, xp, user, level, streak]);

  // Fallback leaderboard contains only the current user (no dummy/simulated data)
  const displayLeaderboard =
    globalLeaderboard.length > 0
      ? globalLeaderboard
      : [
          {
            email: user.email || 'you@studify.com',
            name: user.fname ? `${user.fname} ${user.lname}` : 'You',
            xp: xp,
            avatar: (user.fname?.[0] || 'Y') + (user.lname?.[0] || ''),
            isUser: true,
            level: level,
            streak: streak,
          },
        ];

  // Weekly streak calendar helpers
  const getStreakDayStatus = dayIndex => {
    // dayIndex 0 (Mon) to 6 (Sun)
    // Find matching date from streakHistory
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const adjustedDay = currentDay === 0 ? 6 : currentDay - 1; // Map 0-6 to Mon=0...Sun=6

    // Get date of this dayIndex in the current week
    const diff = dayIndex - adjustedDay;
    const targetDateObj = new Date(now);
    targetDateObj.setDate(now.getDate() + diff);

    const year = targetDateObj.getFullYear();
    const month = String(targetDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(targetDateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isToday = dayIndex === adjustedDay;
    const isCompleted = streakHistory && streakHistory.includes(dateStr);
    const isPast = dayIndex < adjustedDay;

    return {isCompleted, isToday, isPast};
  };

  const handleClaim = (rewardId, requirement) => {
    if (streak < requirement) {
      FlashMessage({
        message: `Keep studying! Streak needs to be ${requirement} days to claim this reward.`,
        type: 'error',
      });
      return;
    }
    if (rewardsClaimed && rewardsClaimed.includes(rewardId)) {
      FlashMessage({message: 'Reward already claimed!', type: 'success'});
      return;
    }
    dispatch(claimReward(rewardId));
    setCelebrating(true);
    FlashMessage({
      message: 'Reward claimed successfully! Bonus XP awarded 🎉',
      type: 'success',
    });
  };

  const showBadgeInfo = badge => {
    setSelectedBadge(badge);
    setBadgeDialogVisible(true);
  };

  // Render Streak Item Bubble
  const renderStreakBubble = (day, index) => {
    const {isCompleted, isToday, isPast} = getStreakDayStatus(index);

    let bubbleBg = colors.surfaceVariant;
    let iconColor = 'transparent';
    let borderWidth = 0;
    let borderCol = 'transparent';

    if (isCompleted) {
      bubbleBg = '#f97316';
      iconColor = '#ffffff';
    } else if (isToday) {
      bubbleBg = theme.dark ? 'rgba(0,139,139,0.2)' : 'rgba(0,139,139,0.1)';
      borderWidth = 2;
      borderCol = '#008b8b';
    }

    return (
      <View key={index} style={styles.streakBubbleCol}>
        <View
          style={[
            styles.streakBubble,
            {backgroundColor: bubbleBg, borderWidth, borderColor: borderCol},
          ]}>
          {isCompleted ? (
            <Micon name="fire" size={18} color={iconColor} />
          ) : isToday ? (
            <Micon name="dots-horizontal" size={16} color="#008b8b" />
          ) : (
            <Micon
              name="checkbox-blank-circle-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
          )}
        </View>
        <Text
          style={[
            styles.streakDayText,
            isToday && {fontWeight: 'bold', color: '#008b8b'},
          ]}>
          {day}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <Confetti
        active={celebrating}
        count={80}
        onComplete={() => setCelebrating(false)}
      />

      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.outlineVariant}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Micon name="arrow-left" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.onBackground}]}>
          Gamification Arena
        </Text>
        <View style={{width: 40}} />
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          {backgroundColor: theme.dark ? '#1e1e1e' : '#f0f5f5'},
        ]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'dashboard' && [
              styles.activeTabButton,
              {backgroundColor: colors.background},
            ],
          ]}
          onPress={() => setActiveTab('dashboard')}>
          <Micon
            name="view-dashboard-outline"
            size={18}
            color={
              activeTab === 'dashboard' ? '#008b8b' : colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'dashboard'
                    ? '#008b8b'
                    : colors.onSurfaceVariant,
              },
            ]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'badges' && [
              styles.activeTabButton,
              {backgroundColor: colors.background},
            ],
          ]}
          onPress={() => setActiveTab('badges')}>
          <Micon
            name="seal-outline"
            size={18}
            color={activeTab === 'badges' ? '#008b8b' : colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'badges' ? '#008b8b' : colors.onSurfaceVariant,
              },
            ]}>
            Badges
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'leaderboard' && [
              styles.activeTabButton,
              {backgroundColor: colors.background},
            ],
          ]}
          onPress={() => setActiveTab('leaderboard')}>
          <Micon
            name="trophy-outline"
            size={18}
            color={
              activeTab === 'leaderboard' ? '#008b8b' : colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'leaderboard'
                    ? '#008b8b'
                    : colors.onSurfaceVariant,
              },
            ]}>
            Rankings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <View>
            {/* Level & Progress Card */}
            <Card
              style={[
                styles.card,
                {backgroundColor: theme.dark ? colors.surface : '#ffffff'},
              ]}>
              <Card.Content>
                <View style={styles.levelHeader}>
                  <View>
                    <Text style={styles.levelSubtitle}>STUDENT STANDING</Text>
                    <Text style={[styles.levelTitle, {color: colors.primary}]}>
                      Level {level}
                    </Text>
                  </View>
                  <View
                    style={[styles.levelBadge, {backgroundColor: '#eab308'}]}>
                    <Micon name="lightning-bolt" size={24} color="#ffffff" />
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBarBg,
                      {backgroundColor: colors.surfaceVariant},
                    ]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progressPercent * 100}%`,
                          backgroundColor: '#008b8b',
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text
                      style={[
                        styles.progressText,
                        {color: colors.onSurfaceVariant},
                      ]}>
                      {currentLevelProgress} / {xpPerLevel} XP to Lvl{' '}
                      {level + 1}
                    </Text>
                    <Text
                      style={[
                        styles.totalXpText,
                        {color: colors.onSurfaceVariant},
                      ]}>
                      Total: {xp} XP
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Daily Streak Card */}
            <Card
              style={[
                styles.card,
                {backgroundColor: theme.dark ? colors.surface : '#ffffff'},
              ]}>
              <Card.Content>
                <View style={styles.streakHeader}>
                  <View style={styles.streakHeadingCol}>
                    <Micon name="fire" size={28} color="#f97316" />
                    <Text
                      style={[styles.streakTitle, {color: colors.onSurface}]}>
                      {streak} Day Streak
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.streakDesc,
                      {color: colors.onSurfaceVariant},
                    ]}>
                    Study daily to keep the fire burning!
                  </Text>
                </View>

                {/* 7 Days bubbles */}
                <View style={styles.streakCalendar}>
                  {WEEK_DAYS.map((day, index) =>
                    renderStreakBubble(day, index),
                  )}
                </View>
              </Card.Content>
            </Card>

            {/* Consistency Rewards */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, {color: colors.onBackground}]}>
                Consistency Rewards
              </Text>
              <Micon
                name="gift-outline"
                size={20}
                color={colors.onBackground}
              />
            </View>

            {REWARDS_LIST.map(reward => {
              const isClaimed =
                rewardsClaimed && rewardsClaimed.includes(reward.id);
              const canClaim = streak >= reward.requirement;

              return (
                <Card
                  key={reward.id}
                  style={[
                    styles.rewardCard,
                    {backgroundColor: theme.dark ? colors.surface : '#ffffff'},
                  ]}>
                  <Card.Content style={styles.rewardContent}>
                    <View
                      style={[
                        styles.rewardIconContainer,
                        {backgroundColor: reward.color + '15'},
                      ]}>
                      <Micon
                        name={reward.icon}
                        size={28}
                        color={reward.color}
                      />
                    </View>
                    <View style={styles.rewardDetails}>
                      <Text style={styles.rewardTitle}>{reward.title}</Text>
                      <Text
                        style={[
                          styles.rewardReqText,
                          {color: colors.onSurfaceVariant},
                        ]}>
                        {reward.description}
                      </Text>
                      <Text
                        style={[styles.rewardBenefit, {color: reward.color}]}>
                        {reward.rewardDesc}
                      </Text>
                    </View>
                    <View style={styles.rewardAction}>
                      {isClaimed ? (
                        <View style={styles.claimedBadge}>
                          <Micon
                            name="check-circle"
                            size={16}
                            color="#10b981"
                          />
                          <Text style={styles.claimedText}>Claimed</Text>
                        </View>
                      ) : canClaim ? (
                        <TouchableOpacity
                          onPress={() =>
                            handleClaim(reward.id, reward.requirement)
                          }
                          style={[
                            styles.claimBtn,
                            {backgroundColor: '#008b8b'},
                          ]}>
                          <Text style={styles.claimBtnText}>Claim</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.lockedBtn}>
                          <Micon
                            name="lock-outline"
                            size={14}
                            color={colors.onSurfaceVariant}
                          />
                          <Text
                            style={[
                              styles.lockedBtnText,
                              {color: colors.onSurfaceVariant},
                            ]}>
                            {streak}/{reward.requirement}d
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}

        {/* BADGES TAB */}
        {activeTab === 'badges' && (
          <View>
            <Text style={[styles.badgesTabTitle, {color: colors.onBackground}]}>
              Achievements & Badges ({badges.length}/{BADGES_LIST.length})
            </Text>

            <View style={styles.badgesGrid}>
              {BADGES_LIST.map(badge => {
                const isEarned = badges && badges.includes(badge.id);
                return (
                  <TouchableOpacity
                    key={badge.id}
                    onPress={() => showBadgeInfo(badge)}
                    style={[
                      styles.badgeItem,
                      {
                        backgroundColor: theme.dark
                          ? colors.surface
                          : '#ffffff',
                      },
                      isEarned
                        ? {borderColor: badge.color, borderWidth: 1}
                        : {opacity: 0.5},
                    ]}>
                    <View
                      style={[
                        styles.badgeIconCircle,
                        {
                          backgroundColor: isEarned
                            ? badge.color + '18'
                            : 'rgba(0,0,0,0.06)',
                        },
                      ]}>
                      <Micon
                        name={isEarned ? badge.icon : 'lock'}
                        size={32}
                        color={isEarned ? badge.color : colors.onSurfaceVariant}
                      />
                    </View>
                    <Text
                      style={[styles.badgeTitle, {color: colors.onSurface}]}>
                      {badge.title}
                    </Text>
                    {isEarned ? (
                      <View style={styles.badgeEarnedLabel}>
                        <Micon name="check-circle" size={12} color="#10b981" />
                        <Text style={styles.badgeEarnedText}>Earned</Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.badgeRewardLabel,
                          {color: colors.onSurfaceVariant},
                        ]}>
                        +{badge.xpReward} XP
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <View>
            <Card
              style={[
                styles.card,
                styles.rankSummaryCard,
                {backgroundColor: colors.primaryContainer},
              ]}>
              <Card.Content style={styles.rankSummaryContent}>
                <View style={styles.rankSummaryTextCol}>
                  <Text
                    style={[
                      styles.rankSummaryTitle,
                      {color: colors.onPrimaryContainer},
                    ]}>
                    Current Leaderboard Placement
                  </Text>
                  <Text
                    style={[
                      styles.rankSummaryDesc,
                      {color: colors.onPrimaryContainer},
                    ]}>
                    Keep learning, completing tasks, and starting quizzes to
                    climb the ranks!
                  </Text>
                </View>
                <View style={styles.rankBadgeCircle}>
                  <Micon name="trophy" size={32} color="#ffffff" />
                </View>
              </Card.Content>
            </Card>

            {loadingLeaderboard && (
              <ActivityIndicator
                animating={true}
                color="#008b8b"
                size="large"
                style={{marginVertical: 24}}
              />
            )}

            <View style={styles.leaderboardList}>
              {displayLeaderboard.map((item, index) => {
                const rank = index + 1;
                let rankIcon = null;
                if (rank === 1) {
                  rankIcon = <Text style={styles.rankEmoji}>🥇</Text>;
                } else if (rank === 2) {
                  rankIcon = <Text style={styles.rankEmoji}>🥈</Text>;
                } else if (rank === 3) {
                  rankIcon = <Text style={styles.rankEmoji}>🥉</Text>;
                } else {
                  rankIcon = (
                    <Text
                      style={[
                        styles.rankNumberText,
                        {color: colors.onSurfaceVariant},
                      ]}>
                      {rank}
                    </Text>
                  );
                }

                return (
                  <View
                    key={index}
                    style={[
                      styles.leaderboardItem,
                      {
                        backgroundColor: theme.dark
                          ? colors.surface
                          : '#ffffff',
                      },
                      item.isUser && [
                        styles.userLeaderboardItem,
                        {borderColor: '#008b8b', borderWidth: 2},
                      ],
                    ]}>
                    <View style={styles.leaderboardRankCol}>{rankIcon}</View>
                    <View
                      style={[
                        styles.leaderboardAvatar,
                        {
                          backgroundColor: item.isUser
                            ? '#008b8b'
                            : colors.surfaceVariant,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.leaderboardAvatarText,
                          {
                            color: item.isUser
                              ? '#ffffff'
                              : colors.onSurfaceVariant,
                          },
                        ]}>
                        {item.avatar}
                      </Text>
                    </View>
                    <View style={styles.leaderboardInfoCol}>
                      <Text
                        style={[
                          styles.leaderboardName,
                          item.isUser && {fontWeight: 'bold', color: '#008b8b'},
                        ]}>
                        {item.name} {item.isUser && '(You)'}
                      </Text>
                    </View>
                    <View style={styles.leaderboardXpCol}>
                      <Text style={styles.leaderboardXpVal}>
                        {item.xp}{' '}
                        <Text style={styles.leaderboardXpUnit}>XP</Text>
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Dialog for Badge Details */}
      <Portal>
        <Dialog
          visible={badgeDialogVisible}
          onDismiss={() => setBadgeDialogVisible(false)}
          style={{backgroundColor: theme.dark ? '#1c1c1c' : '#ffffff'}}>
          <Dialog.Content style={styles.badgeDialogContent}>
            {selectedBadge && (
              <View style={{alignItems: 'center', padding: 8}}>
                <View
                  style={[
                    styles.dialogBadgeCircle,
                    {
                      backgroundColor: selectedBadge.color + '18',
                      borderColor: selectedBadge.color,
                      borderWidth: 1,
                    },
                  ]}>
                  <Micon
                    name={selectedBadge.icon}
                    size={48}
                    color={selectedBadge.color}
                  />
                </View>
                <Text
                  style={[styles.dialogTitle, {color: colors.onBackground}]}>
                  {selectedBadge.title}
                </Text>
                <Text
                  style={[styles.dialogDesc, {color: colors.onSurfaceVariant}]}>
                  {selectedBadge.description}
                </Text>

                <View
                  style={[
                    styles.dialogRewardBadge,
                    {backgroundColor: colors.surfaceVariant},
                  ]}>
                  <Micon name="lightning-bolt" size={16} color="#eab308" />
                  <Text
                    style={[
                      styles.dialogRewardText,
                      {color: colors.onSurface},
                    ]}>
                    Reward: +{selectedBadge.xpReward} XP
                  </Text>
                </View>

                {badges && badges.includes(selectedBadge.id) ? (
                  <View style={styles.dialogStatusBoxEarned}>
                    <Micon name="check-circle" size={18} color="#10b981" />
                    <Text style={styles.dialogStatusTextEarned}>
                      Earned & Claimed
                    </Text>
                  </View>
                ) : (
                  <View style={styles.dialogStatusBoxLocked}>
                    <Micon
                      name="lock"
                      size={18}
                      color={colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.dialogStatusTextLocked,
                        {color: colors.onSurfaceVariant},
                      ]}>
                      Complete requirements to unlock this badge
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton
              textColor="#008b8b"
              onPress={() => setBadgeDialogVisible(false)}>
              Close
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelSubtitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    opacity: 0.6,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalXpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakHeader: {
    marginBottom: 16,
  },
  streakHeadingCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakDesc: {
    fontSize: 13,
  },
  streakCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  streakBubbleCol: {
    alignItems: 'center',
    gap: 6,
  },
  streakBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakDayText: {
    fontSize: 11,
    opacity: 0.7,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardCard: {
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rewardReqText: {
    fontSize: 11,
    marginTop: 1,
  },
  rewardBenefit: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 3,
  },
  rewardAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  claimBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  claimedText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  lockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  lockedBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgesTabTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: 12,
    marginLeft: 4,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  badgeEarnedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeEarnedText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeRewardLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  rankSummaryCard: {
    backgroundColor: '#008b8b',
    borderRadius: 16,
    marginBottom: 16,
  },
  rankSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankSummaryTextCol: {
    flex: 1,
  },
  rankSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankSummaryDesc: {
    fontSize: 12,
    opacity: 0.9,
    marginTop: 4,
    lineHeight: 16,
  },
  rankBadgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardList: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  userLeaderboardItem: {
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  leaderboardRankCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankEmoji: {
    fontSize: 20,
  },
  rankNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaderboardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  leaderboardAvatarText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  leaderboardInfoCol: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '500',
  },
  leaderboardXpCol: {
    alignItems: 'flex-end',
  },
  leaderboardXpVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#008b8b',
  },
  leaderboardXpUnit: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  badgeDialogContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBadgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dialogDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  dialogRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  dialogRewardText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dialogStatusBoxEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  dialogStatusTextEarned: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dialogStatusBoxLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  dialogStatusTextLocked: {
    fontSize: 13,
    fontWeight: '500',
  },
});
