import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import {
  useTheme,
  IconButton,
  Card,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Screen} from '../../Components/Screen';
import {Text} from '../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const StudyPlanner = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'tasks'

  // State for Tasks
  const [tasks, setTasks] = useState([]);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSubj, setTaskSubj] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium'); // 'High' | 'Medium' | 'Low'
  const [taskFilter, setTaskFilter] = useState('All'); // 'All' | 'Pending' | 'Completed'

  // State for Planner Slots
  const [slots, setSlots] = useState([]);
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [slotTime, setSlotTime] = useState('');
  const [slotDuration, setSlotDuration] = useState('');
  const [slotSubj, setSlotSubj] = useState('');
  const [slotTopic, setSlotTopic] = useState('');

  // Load Data
  const loadData = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('studify_tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
      const storedSlots = await AsyncStorage.getItem('studify_slots');
      if (storedSlots) {
        setSlots(JSON.parse(storedSlots));
      }
    } catch (e) {
      console.log('Failed to load study planner data', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, []),
  );

  // Sync state to storage
  const saveTasks = async (newTasks) => {
    try {
      await AsyncStorage.setItem('studify_tasks', JSON.stringify(newTasks));
    } catch (e) {
      console.log('Failed to save tasks', e);
    }
  };

  const saveSlots = async (newSlots) => {
    try {
      await AsyncStorage.setItem('studify_slots', JSON.stringify(newSlots));
    } catch (e) {
      console.log('Failed to save slots', e);
    }
  };

  // Task Actions
  const handleAddTask = () => {
    if (!taskDesc.trim() || !taskSubj.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      description: taskDesc.trim(),
      subject: taskSubj.trim(),
      priority: taskPriority,
      completed: false,
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    
    // Reset Form
    setTaskDesc('');
    setTaskSubj('');
    setTaskPriority('Medium');
    setTaskModalVisible(false);
  };

  const handleToggleTask = (id) => {
    const updated = tasks.map(t =>
      t.id === id ? {...t, completed: !t.completed} : t
    );
    setTasks(updated);
    saveTasks(updated);
  };

  const handleDeleteTask = (id) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this study task?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = tasks.filter(t => t.id !== id);
          setTasks(updated);
          saveTasks(updated);
        },
      },
    ]);
  };

  // Planner Slot Actions
  const handleAddSlot = () => {
    if (!slotTime.trim() || !slotDuration.trim() || !slotSubj.trim() || !slotTopic.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const newSlot = {
      id: Date.now().toString(),
      time: slotTime.trim(),
      duration: slotDuration.trim(),
      subject: slotSubj.trim(),
      topic: slotTopic.trim(),
    };
    const sorted = [...slots, newSlot].sort((a, b) => {
      // Very simple string time sort (e.g. "09:00" vs "14:00")
      return a.time.localeCompare(b.time);
    });
    setSlots(sorted);
    saveSlots(sorted);

    // Reset Form
    setSlotTime('');
    setSlotDuration('');
    setSlotSubj('');
    setSlotTopic('');
    setSlotModalVisible(false);
  };

  const handleDeleteSlot = (id) => {
    Alert.alert('Delete Study Block', 'Are you sure you want to delete this study block?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = slots.filter(s => s.id !== id);
          setSlots(updated);
          saveSlots(updated);
        },
      },
    ]);
  };

  const handleClearSlots = () => {
    Alert.alert('Clear Scheduler', 'Delete all scheduled study blocks for today?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => {
          setSlots([]);
          saveSlots([]);
        },
      },
    ]);
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'Pending') return !t.completed;
    if (taskFilter === 'Completed') return t.completed;
    return true;
  });

  const getPriorityColor = (p) => {
    if (p === 'High') return '#ff3b30';
    if (p === 'Medium') return '#ff9500';
    return '#007171';
  };

  return (
    <Screen NoHeader style={{marginBottom: 20}}>
      {/* Custom Premium Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('planner')}
          style={[
            styles.tabButton,
            activeTab === 'planner' && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}>
          <Icon
            name="calendar-clock"
            size={20}
            color={activeTab === 'planner' ? '#ffffff' : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'planner' && {color: '#ffffff', fontWeight: 'bold'},
            ]}>
            Daily Planner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('tasks')}
          style={[
            styles.tabButton,
            activeTab === 'tasks' && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}>
          <Icon
            name="clipboard-text-play"
            size={20}
            color={activeTab === 'tasks' ? '#ffffff' : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'tasks' && {color: '#ffffff', fontWeight: 'bold'},
            ]}>
            Task Manager
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Daily Scheduler Timeline */}
      {activeTab === 'planner' && (
        <View style={styles.contentContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text size="large" style={styles.sectionTitle}>
                Study Timeline
              </Text>
              <Text style={styles.sectionSubtitle}>
                Structure your day into blocks of focused learning.
              </Text>
            </View>
            {slots.length > 0 && (
              <TouchableOpacity onPress={handleClearSlots} style={styles.clearBtn}>
                <Text style={{color: '#ff3b30', fontSize: 13, fontWeight: 'bold'}}>
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {slots.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Icon name="calendar-blank" size={60} color="#007171" style={{alignSelf: 'center'}} />
              <Text style={styles.emptyText}>No study blocks scheduled today.</Text>
              <Text style={styles.emptySubtext}>
                Schedule blocks to map your revision, practice mock tests, or reading schedules!
              </Text>
              <TouchableOpacity
                onPress={() => setSlotModalVisible(true)}
                style={[styles.addBtn, {backgroundColor: theme.colors.primary}]}>
                <Icon name="plus" size={18} color="white" />
                <Text style={styles.addBtnText}>Schedule First Block</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View>
              {slots.map((item, index) => (
                <View key={item.id} style={styles.timelineRow}>
                  {/* Visual Left Line */}
                  <View style={styles.timelineLeft}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <Text style={styles.durationText}>{item.duration}m</Text>
                    <View style={styles.timelineLine} />
                    <View
                      style={[
                        styles.timelineDot,
                        {backgroundColor: theme.colors.primary},
                      ]}
                    />
                  </View>

                  {/* Right Content Card */}
                  <Card style={styles.timelineCard}>
                    <View style={styles.timelineCardContent}>
                      <View style={{flex: 1}}>
                        <View style={styles.badgeRow}>
                          <View
                            style={[
                              styles.subjectBadge,
                              {backgroundColor: theme.colors.primaryContainer},
                            ]}>
                            <Text
                              style={[
                                styles.subjectBadgeText,
                                {color: theme.colors.onPrimaryContainer},
                              ]}>
                              {item.subject}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.slotTopicText}>{item.topic}</Text>
                      </View>
                      <IconButton
                        icon="trash-can-outline"
                        iconColor="#ff3b30"
                        size={20}
                        onPress={() => handleDeleteSlot(item.id)}
                      />
                    </View>
                  </Card>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setSlotModalVisible(true)}
                style={[
                  styles.addBtnFloating,
                  {backgroundColor: theme.colors.primary},
                ]}>
                <Icon name="plus" size={20} color="white" />
                <Text style={styles.addBtnText}>Add Study Block</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Tab 2: Task Manager Checklist */}
      {activeTab === 'tasks' && (
        <View style={styles.contentContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text size="large" style={styles.sectionTitle}>
                Study Checklist
              </Text>
              <Text style={styles.sectionSubtitle}>
                Add specific tasks to guide your learning and mock tests.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setTaskModalVisible(true)}
              style={[styles.smallAddBtn, {backgroundColor: theme.colors.primary}]}>
              <Icon name="plus" size={16} color="white" />
              <Text style={{color: 'white', fontWeight: 'bold', fontSize: 13}}>New Task</Text>
            </TouchableOpacity>
          </View>

          {/* Task Filters */}
          <View style={styles.filterRow}>
            {['All', 'Pending', 'Completed'].map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setTaskFilter(f)}
                style={[
                  styles.filterPill,
                  taskFilter === f && {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}>
                <Text
                  style={[
                    styles.filterPillText,
                    taskFilter === f && {
                      color: theme.colors.onPrimaryContainer,
                      fontWeight: 'bold',
                    },
                  ]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredTasks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Icon name="checkbox-multiple-marked-outline" size={60} color="#007171" style={{alignSelf: 'center'}} />
              <Text style={styles.emptyText}>No tasks found in "{taskFilter}".</Text>
              <Text style={styles.emptySubtext}>
                Create academic tasks like completing worksheets, reviewing slides, or finishing full length mock tests!
              </Text>
            </Card>
          ) : (
            <View>
              {filteredTasks.map((item) => (
                <Card key={item.id} style={styles.taskCard}>
                  <View style={styles.taskCardContent}>
                    {/* Checkbox Trigger */}
                    <TouchableOpacity
                      onPress={() => handleToggleTask(item.id)}
                      style={styles.checkboxContainer}>
                      <Icon
                        name={item.completed ? 'checkbox-marked-circle' : 'minus-circle-outline'}
                        size={26}
                        color={item.completed ? '#007171' : '#b0bec5'}
                      />
                    </TouchableOpacity>

                    {/* Text Area */}
                    <View style={{flex: 1, paddingLeft: 10}}>
                      <Text
                        style={[
                          styles.taskDescription,
                          item.completed && {
                            textDecorationLine: 'line-through',
                            color: '#90a4ae',
                          },
                        ]}>
                        {item.description}
                      </Text>
                      
                      <View style={styles.taskMetaRow}>
                        <View style={styles.miniSubjectTag}>
                          <Text style={styles.miniSubjectTagText}>
                            {item.subject}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.priorityTag,
                            {borderColor: getPriorityColor(item.priority)},
                          ]}>
                          <Text
                            style={[
                              styles.priorityTagText,
                              {color: getPriorityColor(item.priority)},
                            ]}>
                            {item.priority}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Delete Trigger */}
                    <IconButton
                      icon="close-circle-outline"
                      iconColor="#ff3b30"
                      size={20}
                      onPress={() => handleDeleteTask(item.id)}
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Task Creation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={taskModalVisible}
        onRequestClose={() => setTaskModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text size="medium" style={styles.modalTitle}>
                Add Study Task
              </Text>
              <IconButton
                icon="close"
                size={22}
                onPress={() => setTaskModalVisible(false)}
              />
            </View>

            <PaperTextInput
              label="What do you need to study?"
              placeholder="e.g. Revise Calculus Chapter 4"
              value={taskDesc}
              onChangeText={setTaskDesc}
              mode="outlined"
              style={styles.modalInput}
              outlineColor="#b0bec5"
              activeOutlineColor="#007171"
            />

            <PaperTextInput
              label="Subject"
              placeholder="e.g. Math"
              value={taskSubj}
              onChangeText={setTaskSubj}
              mode="outlined"
              style={styles.modalInput}
              outlineColor="#b0bec5"
              activeOutlineColor="#007171"
            />

            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.prioritySelector}>
              {['Low', 'Medium', 'High'].map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setTaskPriority(p)}
                  style={[
                    styles.priorityBtn,
                    taskPriority === p && {
                      backgroundColor: theme.colors.primaryContainer,
                      borderColor: theme.colors.primary,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.priorityBtnText,
                      {color: getPriorityColor(p)},
                      taskPriority === p && {fontWeight: 'bold'},
                    ]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleAddTask}
              style={[
                styles.modalSubmitBtn,
                {backgroundColor: theme.colors.primary},
              ]}>
              <Text style={styles.modalSubmitBtnText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Planner Slot Creation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={slotModalVisible}
        onRequestClose={() => setSlotModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text size="medium" style={styles.modalTitle}>
                Schedule Study Block
              </Text>
              <IconButton
                icon="close"
                size={22}
                onPress={() => setSlotModalVisible(false)}
              />
            </View>

            <PaperTextInput
              label="Time"
              placeholder="e.g. 09:30 AM"
              value={slotTime}
              onChangeText={setSlotTime}
              mode="outlined"
              style={styles.modalInput}
              outlineColor="#b0bec5"
              activeOutlineColor="#007171"
            />

            <PaperTextInput
              label="Duration (minutes)"
              placeholder="e.g. 45"
              keyboardType="numeric"
              value={slotDuration}
              onChangeText={slotDuration => setSlotDuration(slotDuration.replace(/[^0-9]/g, ''))}
              mode="outlined"
              style={styles.modalInput}
              outlineColor="#b0bec5"
              activeOutlineColor="#007171"
            />

            <PaperTextInput
              label="Subject"
              placeholder="e.g. Physics"
              value={slotSubj}
              onChangeText={slotSubj}
              mode="outlined"
              style={styles.modalInput}
              outlineColor="#b0bec5"
              activeOutlineColor="#007171"
            />

            <PaperTextInput
              label="Specific Study Topic"
              placeholder="e.g. Newton's Laws of Motion"
              value={slotTopic}
              onChangeText={slotTopic}
              mode="outlined"
              style={styles.modalInput}
              outlineColor="#b0bec5"
              activeOutlineColor="#007171"
            />

            <TouchableOpacity
              onPress={handleAddSlot}
              style={[
                styles.modalSubmitBtn,
                {backgroundColor: theme.colors.primary},
              ]}>
              <Text style={styles.modalSubmitBtnText}>Add to Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'transparent',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#555555',
  },
  contentContainer: {
    paddingHorizontal: 15,
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1d1d',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    elevation: 3,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007171',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  addBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  addBtnFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 15,
    gap: 8,
    elevation: 2,
  },
  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineLeft: {
    width: 65,
    alignItems: 'center',
    position: 'relative',
    paddingTop: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#007171',
  },
  durationText: {
    fontSize: 10,
    color: '#90a4ae',
    marginTop: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 55,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#eceff1',
  },
  timelineDot: {
    position: 'absolute',
    left: 51,
    top: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  timelineCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginLeft: 10,
    elevation: 2,
  },
  timelineCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  subjectBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  slotTopicText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#263238',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#b0bec5',
    backgroundColor: '#ffffff',
  },
  filterPillText: {
    fontSize: 13,
    color: '#546e7a',
  },
  taskCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    elevation: 2,
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  taskDescription: {
    fontSize: 15,
    color: '#263238',
    fontWeight: '500',
  },
  taskMetaRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  miniSubjectTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#eceff1',
  },
  miniSubjectTagText: {
    fontSize: 10,
    color: '#546e7a',
    fontWeight: 'bold',
  },
  priorityTag: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#263238',
  },
  modalInput: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#546e7a',
    marginTop: 5,
    marginBottom: 8,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  priorityBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalSubmitBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default StudyPlanner;
