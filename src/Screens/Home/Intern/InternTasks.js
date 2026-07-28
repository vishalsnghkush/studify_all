import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  useTheme,
  Card,
  Button,
  IconButton,
  Badge,
  Divider,
  Chip,
  FAB,
} from 'react-native-paper';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {getInternDb, getInternTasks, saveInternTasks} from '../../../Utils/MockInternDb';

const STARTER_TASKS = [
  {
    id: 'starter_1',
    title: 'Complete Onboarding & Environment Setup',
    description: 'Set up your development environment, install all required tools and review onboarding docs.',
    priority: 'High',
    completed: false,
    assignedTo: [],
    helpNeeded: false,
    completedBy: null,
    createdBy: 'system',
    createdByName: 'System',
  },
  {
    id: 'starter_2',
    title: 'Review Project Guidelines & Coding Standards',
    description: 'Go through the coding conventions, Git workflow, and project architecture documentation.',
    priority: 'Medium',
    completed: false,
    assignedTo: [],
    helpNeeded: false,
    completedBy: null,
    createdBy: 'system',
    createdByName: 'System',
  },
  {
    id: 'starter_3',
    title: 'Schedule Introduction Call with TL',
    description: 'Book a 30-minute intro call with your Team Leader to understand expectations and goals.',
    priority: 'High',
    completed: false,
    assignedTo: [],
    helpNeeded: false,
    completedBy: null,
    createdBy: 'system',
    createdByName: 'System',
  },
  {
    id: 'starter_4',
    title: 'Complete First Weekly Progress Report',
    description: 'Submit your first weekly report via the Reports tab summarising your progress.',
    priority: 'Medium',
    completed: false,
    assignedTo: [],
    helpNeeded: false,
    completedBy: null,
    createdBy: 'system',
    createdByName: 'System',
  },
  {
    id: 'starter_5',
    title: 'Join Department Communication Channel',
    description: 'Navigate to Discussion tab, set your department, and join the chat group.',
    priority: 'Low',
    completed: false,
    assignedTo: [],
    helpNeeded: false,
    completedBy: null,
    createdBy: 'system',
    createdByName: 'System',
  },
];

const PRIORITY_COLOR = {
  High: '#E53935',
  Medium: '#FB8C00',
  Low: '#43A047',
};

export default function InternTasks() {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  const activeId = user?.user_id || 'alice_123';

  const [tasks, setTasks] = useState([]);
  const [db, setDb] = useState(null);
  const [filter, setFilter] = useState('All'); // All | Mine | Help | Done
  const [addMode, setAddMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const dbData = await getInternDb();
      setDb(dbData);
      const loaded = await getInternTasks(activeId);
      setTasks(loaded);
    } catch (e) {
      console.error('Error loading tasks:', e);
    }
  }, [activeId]);

  useEffect(() => {
    loadTasks();
    const unsub = navigation.addListener('focus', loadTasks);
    return unsub;
  }, [navigation, loadTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const saveTasks = async (updated) => {
    setTasks(updated);
    await saveInternTasks(activeId, updated);
  };

  const handleAddTask = async () => {
    if (!newTitle.trim()) {
      return Alert.alert('Required', 'Please enter a task title.');
    }
    const newTask = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      completed: false,
      assignedTo: [],
      helpNeeded: false,
      completedBy: null,
      createdBy: activeId,
      createdByName: `${user?.fname || 'Intern'} ${user?.lname || ''}`.trim(),
    };
    await saveTasks([...tasks, newTask]);
    setNewTitle('');
    setNewDesc('');
    setNewPriority('Medium');
    setAddMode(false);
  };

  const handleClaimOrLeave = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.assignedTo.includes(activeId)) {
      // Leave
      const updated = tasks.map(t =>
        t.id === taskId
          ? {...t, assignedTo: t.assignedTo.filter(id => id !== activeId), helpNeeded: t.assignedTo.length <= 1 ? false : t.helpNeeded}
          : t,
      );
      await saveTasks(updated);
    } else {
      // Join check: max 3 ongoing tasks
      const ongoing = tasks.filter(t => !t.completed && t.assignedTo.includes(activeId)).length;
      if (ongoing >= 3) {
        return Alert.alert('Limit Reached', 'You cannot work on more than 3 ongoing tasks at once.');
      }
      // Check if task is taken but help not needed
      if (task.assignedTo.length > 0 && !task.helpNeeded) {
        return Alert.alert('Claimed', 'This task is already being worked on. You can only join if "Help Needed" is marked.');
      }
      const updated = tasks.map(t =>
        t.id === taskId ? {...t, assignedTo: [...t.assignedTo, activeId]} : t,
      );
      await saveTasks(updated);
    }
  };

  const handleToggleHelp = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.assignedTo.includes(activeId)) {
      return Alert.alert('Access Denied', 'Only interns working on this task can toggle help.');
    }
    const updated = tasks.map(t =>
      t.id === taskId ? {...t, helpNeeded: !t.helpNeeded} : t,
    );
    await saveTasks(updated);
  };

  const handleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.assignedTo.includes(activeId)) {
      return Alert.alert('Access Denied', 'Only interns currently working on this task can mark it complete.');
    }
    const updated = tasks.map(t =>
      t.id === taskId
        ? {...t, completed: !t.completed, completedBy: !t.completed ? activeId : null}
        : t,
    );
    await saveTasks(updated);
  };

  const handleDelete = async (taskId) => {
    Alert.alert('Delete Task', 'Are you sure you want to remove this task?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await saveTasks(tasks.filter(t => t.id !== taskId));
        },
      },
    ]);
  };

  const handleSeedTasks = async () => {
    Alert.alert(
      'Seed Starter Tasks',
      'This will add department starter tasks to your board. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Add Tasks',
          onPress: async () => {
            const merged = [...tasks, ...STARTER_TASKS.filter(s => !tasks.find(t => t.id === s.id))];
            await saveTasks(merged);
          },
        },
      ],
    );
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'Mine') return t.assignedTo.includes(activeId);
    if (filter === 'Help') return t.helpNeeded && !t.completed;
    if (filter === 'Done') return t.completed;
    return true;
  });

  const myOngoing = tasks.filter(t => !t.completed && t.assignedTo.includes(activeId)).length;
  const totalDone = tasks.filter(t => t.completed).length;

  const getName = (id) => {
    if (id === activeId) return 'You';
    return db?.interns?.find(i => i.id === id)?.name || id;
  };

  const renderTask = ({item}) => {
    const isWorking = item.assignedTo.includes(activeId);
    const isTaken = item.assignedTo.length > 0;
    const canJoin = !isTaken || item.helpNeeded;

    return (
      <Card
        style={[
          styles.taskCard,
          {
            backgroundColor: item.completed
              ? colors.elevation.level1
              : colors.elevation.level2,
            borderLeftWidth: 4,
            borderLeftColor: item.completed
              ? colors.outline
              : PRIORITY_COLOR[item.priority] || colors.primary,
            opacity: item.completed ? 0.75 : 1,
          },
        ]}>
        <Card.Content style={styles.taskCardContent}>
          {/* Priority + Status Row */}
          <View style={styles.taskTopRow}>
            <View style={[styles.priorityBadge, {backgroundColor: item.completed ? '#9E9E9E' : PRIORITY_COLOR[item.priority] || colors.primary}]}>
              <Text style={styles.priorityText}>{item.completed ? 'Done' : (item.priority || 'Medium')}</Text>
            </View>
            {item.helpNeeded && !item.completed && (
              <View style={[styles.helpBadge, {backgroundColor: colors.errorContainer}]}>
                <Icon name="hand-wave" size={11} color={colors.error} />
                <Text style={[styles.helpBadgeText, {color: colors.error}]}>  Help Needed</Text>
              </View>
            )}
            <View style={{flex: 1}} />
            <IconButton
              icon="trash-can-outline"
              iconColor={colors.error}
              size={18}
              onPress={() => handleDelete(item.id)}
              style={{margin: 0}}
            />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.taskTitle,
              {
                color: item.completed ? colors.outline : colors.onSurface,
                textDecorationLine: item.completed ? 'line-through' : 'none',
              },
            ]}>
            {item.title}
          </Text>

          {/* Description */}
          {!!item.description && (
            <Text style={[styles.taskDesc, {color: colors.onSurfaceVariant}]}>
              {item.description}
            </Text>
          )}

          {/* Assignees */}
          <View style={styles.assigneeRow}>
            <Icon name="account-group-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={[styles.assigneeText, {color: colors.onSurfaceVariant}]}>
              {'  '}
              {item.completed
                ? `✅ Completed by ${getName(item.completedBy)}`
                : isTaken
                ? `🏃 ${item.assignedTo.map(getName).join(', ')}`
                : '💤 Unassigned — grab this task!'}
            </Text>
          </View>

          {/* Created by */}
          {item.createdByName && (
            <Text style={[styles.createdText, {color: colors.outline}]}>
              Added by {item.createdByName}
            </Text>
          )}

          <Divider style={{marginVertical: 10, backgroundColor: colors.outlineVariant}} />

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {!item.completed && (
              <>
                <Button
                  mode={isWorking ? 'contained-tonal' : canJoin ? 'contained' : 'outlined'}
                  onPress={() => handleClaimOrLeave(item.id)}
                  style={styles.actionBtn}
                  labelStyle={styles.actionBtnLabel}
                  icon={isWorking ? 'exit-to-app' : 'play-circle-outline'}>
                  {isWorking ? 'Leave Task' : isTaken ? 'Help Out' : 'Start Work'}
                </Button>

                {isWorking && (
                  <Button
                    mode={item.helpNeeded ? 'contained' : 'outlined'}
                    buttonColor={item.helpNeeded ? colors.error : undefined}
                    textColor={item.helpNeeded ? '#fff' : undefined}
                    onPress={() => handleToggleHelp(item.id)}
                    style={styles.actionBtn}
                    labelStyle={styles.actionBtnLabel}
                    icon={item.helpNeeded ? 'hand-wave-outline' : 'help-circle-outline'}>
                    {item.helpNeeded ? 'Cancel Help' : 'Need Help'}
                  </Button>
                )}

                {isWorking && (
                  <Button
                    mode="contained"
                    buttonColor="#4CAF50"
                    textColor="#fff"
                    onPress={() => handleComplete(item.id)}
                    style={styles.actionBtn}
                    labelStyle={styles.actionBtnLabel}
                    icon="check-circle-outline">
                    Complete
                  </Button>
                )}
              </>
            )}

            {item.completed && isWorking && (
              <Button
                mode="outlined"
                onPress={() => handleComplete(item.id)}
                style={styles.actionBtn}
                labelStyle={styles.actionBtnLabel}
                icon="undo">
                Mark Incomplete
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <Screen NoHeader style={{padding: 0}}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.elevation.level2}]}>
        <View>
          <Text style={[styles.headerTitle, {color: colors.onSurface}]}>🗂️ Department Tasks</Text>
          <Text style={[styles.headerSub, {color: colors.onSurfaceVariant}]}>
            Shared board · {tasks.length} tasks · {totalDone} completed
          </Text>
        </View>
        <View style={[styles.ongoingBadge, {backgroundColor: myOngoing >= 3 ? colors.errorContainer : colors.primaryContainer}]}>
          <Text style={[styles.ongoingText, {color: myOngoing >= 3 ? colors.error : colors.onPrimaryContainer}]}>
            {myOngoing}/3{'\n'}Ongoing
          </Text>
        </View>
      </View>

      {/* Top Action Row: Add New Task */}
      {!addMode && (
        <View style={{paddingHorizontal: 16, marginTop: 4, marginBottom: 8}}>
          <Button
            mode="contained"
            icon="plus-circle"
            onPress={() => setAddMode(true)}
            style={{borderRadius: 10, backgroundColor: colors.primary}}
            labelStyle={{fontSize: 13, fontWeight: 'bold', color: '#fff'}}>
            ➕ Add New Department Task
          </Button>
        </View>
      )}

      {/* Shared board notice */}
      <View style={[styles.sharedBanner, {backgroundColor: colors.primaryContainer}]}>
        <Icon name="information-outline" size={14} color={colors.onPrimaryContainer} />
        <Text style={[styles.sharedBannerText, {color: colors.onPrimaryContainer}]}>
          {'  '}This board is shared with all interns & TLs of your department. Anyone can add tasks, claim work, or request help!
        </Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {['All', 'Mine', 'Help', 'Done'].map(f => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && {backgroundColor: colors.primaryContainer}]}
            textStyle={[styles.filterChipText, {color: filter === f ? colors.onPrimaryContainer : colors.onSurface}]}>
            {f === 'Help' ? '🚨 Help' : f === 'Done' ? '✅ Done' : f}
          </Chip>
        ))}
      </View>

      {/* Add Task Panel */}
      {addMode && (
        <View style={[styles.addPanel, {backgroundColor: colors.elevation.level3}]}>
          <Text style={[styles.addPanelTitle, {color: colors.onSurface}]}>➕ New Task</Text>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Task title (required)..."
            placeholderTextColor="#999"
            style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface}]}
          />
          <TextInput
            value={newDesc}
            onChangeText={setNewDesc}
            placeholder="Short description (optional)..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={2}
            style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level1, color: colors.onSurface, height: 60, textAlignVertical: 'top'}]}
          />
          <View style={styles.priorityRow}>
            <Text style={[styles.priorityLabel, {color: colors.onSurface}]}>Priority:</Text>
            {['High', 'Medium', 'Low'].map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setNewPriority(p)}
                style={[
                  styles.priorityOption,
                  {
                    backgroundColor: newPriority === p ? PRIORITY_COLOR[p] : colors.elevation.level1,
                    borderColor: PRIORITY_COLOR[p],
                  },
                ]}>
                <Text style={{fontSize: 11, color: newPriority === p ? '#fff' : PRIORITY_COLOR[p], fontWeight: 'bold'}}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.addPanelActions}>
            <Button mode="outlined" onPress={() => {setAddMode(false); setNewTitle(''); setNewDesc('');}} style={{flex: 1, marginRight: 8}}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleAddTask} style={{flex: 1}}>
              Add Task
            </Button>
          </View>
        </View>
      )}

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-text-outline" size={64} color={colors.outline} />
            <Text style={[styles.emptyTitle, {color: colors.onSurface}]}>
              {filter === 'Mine' ? "You haven't claimed any tasks yet." :
               filter === 'Help' ? 'No tasks need help right now! \uD83C\uDF89' :
               filter === 'Done' ? 'No completed tasks yet.' :
               'No tasks on the board yet.'}
            </Text>
            {filter === 'All' && (
              <Button
                mode="contained"
                onPress={handleSeedTasks}
                style={{marginTop: 16}}
                icon="plus-circle-outline">
                I Want Tasks!
              </Button>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB to add task */}
      {!addMode && (
        <FAB
          icon="plus"
          label="Add Task"
          style={[styles.fab, {backgroundColor: colors.primary}]}
          color="#fff"
          onPress={() => setAddMode(true)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  ongoingBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  ongoingText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sharedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sharedBannerText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    height: 32,
  },
  filterChipText: {
    fontSize: 12,
  },
  addPanel: {
    margin: 12,
    borderRadius: 12,
    padding: 14,
    elevation: 4,
  },
  addPanelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 10,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  priorityOption: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addPanelActions: {
    flexDirection: 'row',
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  taskCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  taskCardContent: {
    paddingVertical: 12,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  helpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  helpBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 20,
  },
  taskDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  assigneeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  createdText: {
    fontSize: 10,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    borderRadius: 8,
  },
  actionBtnLabel: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    borderRadius: 16,
  },
});
