import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {Screen} from '../../Components/Screen';
import {Text} from '../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Confetti, MiniBurst} from '../../Components/Screen/Confetti';

// Helper: Format date key for storage (YYYY-MM-DD)
const formatDateKey = date => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Helper: Format date for header display (e.g. Friday, Jun 5, 2026)
const formatDate = date => {
  const options = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

// Helper: Format Time object to string (e.g. 09:30 AM)
const formatTime = date => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  const hoursStr = hours < 10 ? '0' + hours : hours;
  return `${hoursStr}:${minutesStr} ${ampm}`;
};

// Helper: Parse AM/PM string to minutes from midnight for numerical sorting
const timeStringToMinutes = timeStr => {
  if (!timeStr) {
    return 0;
  }
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) {
    return 0;
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  }
  if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

const StudyPlanner = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'tasks'

  // Selected Date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedDateKey = formatDateKey(selectedDate);

  // State for Planner Slots
  const [slots, setSlots] = useState([]);
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [slotSubj, setSlotSubj] = useState('');
  const [slotTopic, setSlotTopic] = useState('');
  const [slotPriority, setSlotPriority] = useState('Medium'); // 'High' | 'Medium' | 'Low'

  const [activeMiniBurstId, setActiveMiniBurstId] = useState(null);
  const [showGrandConfetti, setShowGrandConfetti] = useState(false);

  // Subject filter dropdown state
  const [selectedSubjFilter, setSelectedSubjFilter] = useState('All');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Start & End Time picker states
  const [slotStart, setSlotStart] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [slotEnd, setSlotEnd] = useState(() => {
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d;
  });

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const storedSlots = await AsyncStorage.getItem('studify_slots');
      if (storedSlots) {
        setSlots(JSON.parse(storedSlots));
      } else {
        setSlots([]);
      }
    } catch (e) {
      console.log('Failed to load study planner data', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const saveSlots = async newSlots => {
    try {
      await AsyncStorage.setItem('studify_slots', JSON.stringify(newSlots));
    } catch (e) {
      console.log('Failed to save slots', e);
    }
  };

  // Toggle Slot Target Completion status
  const handleToggleTask = id => {
    const target = slots.find(s => s.id === id);
    if (!target) {
      return;
    }

    const checkingDone = !target.completed;

    if (checkingDone) {
      // Trigger mini checkbox burst immediately on the pending task card
      setActiveMiniBurstId(id);

      // Delay moving the task card to the completed list to allow animation to play fully
      setTimeout(() => {
        setSlots(prevSlots => {
          const updated = prevSlots.map(s => {
            if (s.id === id) {
              return {...s, completed: true};
            }
            return s;
          });
          saveSlots(updated);

          // Check if all today's slots are now completed
          const todaySlots = updated.filter(s => {
            const slotDate = s.date || formatDateKey(new Date());
            return slotDate === selectedDateKey;
          });
          const allDone =
            todaySlots.length > 0 && todaySlots.every(s => s.completed);
          if (allDone) {
            // Trigger grand celebration confetti after the final mini burst completes
            setShowGrandConfetti(true);
          }
          return updated;
        });
        setActiveMiniBurstId(null);
      }, 550);
    } else {
      // If unchecking, toggle immediately without animation delays
      const updated = slots.map(s => {
        if (s.id === id) {
          return {...s, completed: false};
        }
        return s;
      });
      setSlots(updated);
      saveSlots(updated);
    }
  };

  // Planner Slot Actions
  const handleAddSlot = () => {
    if (!slotSubj.trim() || !slotTopic.trim()) {
      Alert.alert('Error', 'Please enter a subject and study topic.');
      return;
    }
    const newSlot = {
      id: Date.now().toString(),
      date: selectedDateKey,
      startTime: formatTime(slotStart),
      endTime: formatTime(slotEnd),
      subject: slotSubj.trim(),
      topic: slotTopic.trim(),
      priority: slotPriority,
      completed: false,
    };
    const updated = [...slots, newSlot];
    setSlots(updated);
    saveSlots(updated);

    // Reset Form
    setSlotSubj('');
    setSlotTopic('');
    setSlotPriority('Medium');
    setSlotModalVisible(false);
  };

  const handleDeleteSlot = id => {
    Alert.alert(
      'Delete Study Block',
      'Are you sure you want to delete this study block?',
      [
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
      ],
    );
  };

  const handleClearSlots = () => {
    Alert.alert(
      'Clear Scheduler',
      'Delete all scheduled study blocks for this day?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            const todayKey = formatDateKey(new Date());
            const updated = slots.filter(
              s => (s.date || todayKey) !== selectedDateKey,
            );
            setSlots(updated);
            saveSlots(updated);
          },
        },
      ],
    );
  };

  // DateTime Picker open calls
  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: selectedDate,
      mode: 'date',
      onChange: (event, date) => {
        if (date) {
          setSelectedDate(date);
        }
      },
    });
  };

  const showStartTimePicker = () => {
    DateTimePickerAndroid.open({
      value: slotStart,
      mode: 'time',
      is24Hour: false,
      onChange: (event, date) => {
        if (date) {
          setSlotStart(date);
        }
      },
    });
  };

  const showEndTimePicker = () => {
    DateTimePickerAndroid.open({
      value: slotEnd,
      mode: 'time',
      is24Hour: false,
      onChange: (event, date) => {
        if (date) {
          setSlotEnd(date);
        }
      },
    });
  };

  // Filter & Sort Slots for active date
  const filteredSlots = slots.filter(s => {
    const slotDate = s.date || formatDateKey(new Date());
    return slotDate === selectedDateKey;
  });

  const sortedSlots = [...filteredSlots].sort((a, b) => {
    return timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime);
  });

  // Extract unique subjects currently added for the active date
  const subjectsList = Array.from(
    new Set(sortedSlots.map(s => s.subject).filter(Boolean)),
  );

  // Filter tasks based on subject selection
  const tasksForSubject = sortedSlots.filter(
    s => selectedSubjFilter === 'All' || s.subject === selectedSubjFilter,
  );

  const priorityWeight = {High: 3, Medium: 2, Low: 1};

  // Pending tasks sorted by priority
  const pendingTasks = tasksForSubject
    .filter(s => !s.completed)
    .sort((a, b) => {
      const weightA = priorityWeight[a.priority || 'Medium'] || 2;
      const weightB = priorityWeight[b.priority || 'Medium'] || 2;
      return weightB - weightA;
    });

  // Completed tasks sorted by priority
  const completedTasks = tasksForSubject
    .filter(s => s.completed)
    .sort((a, b) => {
      const weightA = priorityWeight[a.priority || 'Medium'] || 2;
      const weightB = priorityWeight[b.priority || 'Medium'] || 2;
      return weightB - weightA;
    });

  const getPriorityColor = p => {
    if (p === 'High') {
      return '#ff3b30';
    }
    if (p === 'Medium') {
      return '#ff9500';
    }
    return '#007171';
  };

  return (
    <Screen NoHeader style={styles.screenContainer}>
      {/* Date Selector Header */}
      <View
        style={[
          styles.dateSelectorContainer,
          {backgroundColor: theme.colors.primary},
        ]}>
        <TouchableOpacity
          onPress={showDatePicker}
          style={styles.dateSelectorRow}>
          <Icon name="calendar-month" size={22} color="#ffffff" />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <Icon name="chevron-down" size={18} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date())}
          style={styles.todayBtn}>
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Premium Tab Bar */}
      <View
        style={[
          styles.tabContainer,
          theme.dark && {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            shadowColor: '#000',
          },
        ]}>
        <TouchableOpacity
          onPress={() => setActiveTab('planner')}
          style={[
            styles.tabButton,
            theme.dark && {borderColor: theme.colors.outlineVariant},
            activeTab === 'planner' && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}>
          <Icon
            name="calendar-clock"
            size={20}
            color={
              activeTab === 'planner'
                ? '#ffffff'
                : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'planner' && {
                color: '#ffffff',
                fontWeight: 'bold',
              },
            ]}>
            Daily Planner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('tasks')}
          style={[
            styles.tabButton,
            theme.dark && {borderColor: theme.colors.outlineVariant},
            activeTab === 'tasks' && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}>
          <Icon
            name="clipboard-text-play"
            size={20}
            color={
              activeTab === 'tasks' ? '#ffffff' : theme.colors.onSurfaceVariant
            }
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
        <ScrollView style={styles.contentContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                size="large"
                style={[
                  styles.sectionTitle,
                  {color: theme.colors.onBackground},
                ]}>
                Study Timeline
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                Structure your day into blocks of focused learning.
              </Text>
            </View>
            {sortedSlots.length > 0 && (
              <TouchableOpacity
                onPress={handleClearSlots}
                style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {sortedSlots.length === 0 ? (
            <Card
              style={[
                styles.emptyCard,
                theme.dark && {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}>
              <Icon
                name="calendar-blank"
                size={60}
                color={theme.colors.primary}
                style={styles.emptyCardIcon}
              />
              <Text style={[styles.emptyText, {color: theme.colors.primary}]}>
                No study blocks scheduled today.
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                Schedule blocks to map your revision, practice mock tests, or
                reading schedules!
              </Text>
              <TouchableOpacity
                onPress={() => setSlotModalVisible(true)}
                style={[
                  styles.addBtn,
                  {backgroundColor: theme.colors.primary},
                ]}>
                <Icon name="plus" size={18} color="white" />
                <Text style={styles.addBtnText}>Schedule First Block</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View>
              {sortedSlots.map(item => (
                <View key={item.id} style={styles.timelineRow}>
                  {/* Visual Left Line */}
                  <View style={styles.timelineLeft}>
                    <Text
                      style={[styles.timeText, {color: theme.colors.primary}]}>
                      {item.startTime}
                    </Text>
                    <Text style={styles.durationText}>to {item.endTime}</Text>
                    <View style={styles.timelineLine} />
                    <View
                      style={[
                        styles.timelineDot,
                        {backgroundColor: theme.colors.primary},
                      ]}
                    />
                  </View>

                  {/* Right Content Card */}
                  <Card
                    style={[
                      styles.timelineCard,
                      theme.dark && {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}>
                    <View style={styles.timelineCardContent}>
                      <View style={styles.flex1}>
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
                          {/* Priority Badge */}
                          <View
                            style={[
                              styles.priorityBadge,
                              {
                                borderColor: getPriorityColor(
                                  item.priority || 'Medium',
                                ),
                              },
                            ]}>
                            <Text
                              style={[
                                styles.priorityBadgeText,
                                {
                                  color: getPriorityColor(
                                    item.priority || 'Medium',
                                  ),
                                },
                              ]}>
                              {item.priority || 'Medium'}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.slotTopicText,
                            {color: theme.colors.onSurface},
                          ]}>
                          {item.topic}
                        </Text>
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
          <View style={styles.spacerStyle} />
        </ScrollView>
      )}

      {/* Tab 2: Task Manager Checklist */}
      {activeTab === 'tasks' && (
        <ScrollView style={styles.contentContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text size="large" style={styles.sectionTitle}>
                Study Targets Checklist
              </Text>
              <Text style={styles.sectionSubtitle}>
                Targets are automatically generated from your active daily
                planner slots.
              </Text>
            </View>
          </View>

          {/* Clean Subject Dropdown Filter */}
          <View
            style={[
              styles.dropdownContainer,
              theme.dark && {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}>
            <Text
              style={[styles.dropdownLabel, {color: theme.colors.onSurface}]}>
              Filter by Subject:
            </Text>
            <TouchableOpacity
              onPress={() => setDropdownVisible(true)}
              style={[
                styles.dropdownBtn,
                theme.dark && {
                  backgroundColor: 'rgba(0, 113, 113, 0.15)',
                  borderColor: '#007171',
                },
              ]}>
              <Text
                style={[
                  styles.dropdownBtnText,
                  theme.dark && {color: '#80cbc4'},
                ]}>
                {selectedSubjFilter}
              </Text>
              <Icon
                name="chevron-down"
                size={20}
                color={theme.dark ? '#80cbc4' : '#007171'}
              />
            </TouchableOpacity>
          </View>

          {sortedSlots.length === 0 ? (
            <Card
              style={[
                styles.emptyCard,
                theme.dark && {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}>
              <Icon
                name="calendar-clock"
                size={60}
                color={theme.colors.primary}
                style={styles.emptyCardIcon}
              />
              <Text style={[styles.emptyText, {color: theme.colors.primary}]}>
                No planner slots scheduled.
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                Add study blocks in the "Daily Planner" tab to automatically
                create checkable targets!
              </Text>
            </Card>
          ) : (
            <View>
              {/* Pending Targets */}
              <Text
                style={[
                  styles.checklistSectionHeader,
                  {color: theme.colors.onBackground},
                ]}>
                Pending Targets ({pendingTasks.length})
              </Text>
              {pendingTasks.length === 0 ? (
                <Card
                  style={[
                    styles.emptyChecklistPlaceholder,
                    theme.dark && {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}>
                  <Icon name="check-circle-outline" size={32} color="#80cbc4" />
                  <Text
                    style={[
                      styles.emptyPlaceholderText,
                      {color: theme.colors.onSurfaceVariant},
                    ]}>
                    All targets completed for this filter!
                  </Text>
                </Card>
              ) : (
                pendingTasks.map(item => (
                  <Card
                    key={item.id}
                    style={[
                      styles.taskCard,
                      theme.dark && {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}>
                    <View style={styles.taskCardContent}>
                      <TouchableOpacity
                        onPress={() => handleToggleTask(item.id)}
                        style={styles.checkboxContainer}>
                        <Icon
                          name="checkbox-blank-circle-outline"
                          size={26}
                          color={theme.colors.onSurfaceVariant}
                        />
                        <MiniBurst
                          active={activeMiniBurstId === item.id}
                          onComplete={() => setActiveMiniBurstId(null)}
                        />
                      </TouchableOpacity>
                      <View style={styles.flex1}>
                        <Text
                          style={[
                            styles.taskDescription,
                            {color: theme.colors.onSurface},
                          ]}>
                          {item.topic}
                        </Text>
                        <View style={styles.taskMetaRow}>
                          <View
                            style={[
                              styles.miniSubjectTag,
                              theme.dark && {
                                backgroundColor: theme.colors.primaryContainer,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.miniSubjectTagText,
                                theme.dark && {
                                  color: theme.colors.onPrimaryContainer,
                                },
                              ]}>
                              {item.subject}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.priorityTag,
                              {
                                borderColor: getPriorityColor(
                                  item.priority || 'Medium',
                                ),
                              },
                            ]}>
                            <Text
                              style={[
                                styles.priorityTagText,
                                {
                                  color: getPriorityColor(
                                    item.priority || 'Medium',
                                  ),
                                },
                              ]}>
                              {item.priority || 'Medium'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))
              )}

              {/* Completed Targets */}
              <Text
                style={[
                  styles.checklistSectionHeader,
                  {marginTop: 20, color: theme.colors.onBackground},
                ]}>
                Completed Targets ({completedTasks.length})
              </Text>
              {completedTasks.length === 0 ? (
                <Card
                  style={[
                    styles.emptyChecklistPlaceholder,
                    theme.dark && {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}>
                  <Icon
                    name="checkbox-blank-circle-outline"
                    size={32}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.emptyPlaceholderText,
                      {color: theme.colors.onSurfaceVariant},
                    ]}>
                    No completed targets yet.
                  </Text>
                </Card>
              ) : (
                completedTasks.map(item => (
                  <Card
                    key={item.id}
                    style={[
                      styles.taskCard,
                      theme.dark && {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}>
                    <View style={styles.taskCardContent}>
                      <TouchableOpacity
                        onPress={() => handleToggleTask(item.id)}
                        style={styles.checkboxContainer}>
                        <Icon
                          name="checkbox-marked-circle"
                          size={26}
                          color={theme.colors.primary}
                        />
                        <MiniBurst
                          active={activeMiniBurstId === item.id}
                          onComplete={() => setActiveMiniBurstId(null)}
                        />
                      </TouchableOpacity>
                      <View style={styles.flex1}>
                        <Text
                          style={[
                            styles.taskDescription,
                            styles.completedTaskDesc,
                            {color: theme.colors.onSurfaceVariant},
                          ]}>
                          {item.topic}
                        </Text>
                        <View style={styles.taskMetaRow}>
                          <View
                            style={[
                              styles.miniSubjectTag,
                              theme.dark && {
                                backgroundColor: theme.colors.primaryContainer,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.miniSubjectTagText,
                                theme.dark && {
                                  color: theme.colors.onPrimaryContainer,
                                },
                              ]}>
                              {item.subject}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.priorityTag,
                              {
                                borderColor: getPriorityColor(
                                  item.priority || 'Medium',
                                ),
                              },
                            ]}>
                            <Text
                              style={[
                                styles.priorityTagText,
                                {
                                  color: getPriorityColor(
                                    item.priority || 'Medium',
                                  ),
                                },
                              ]}>
                              {item.priority || 'Medium'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}
          <View style={styles.spacerStyle} />
        </ScrollView>
      )}

      {/* Subject Filter Dropdown Modal Menu */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}>
          <View
            style={[
              styles.dropdownMenuCard,
              theme.dark && {backgroundColor: theme.colors.surface},
            ]}>
            <Text
              style={[
                styles.dropdownMenuTitle,
                {
                  color: theme.colors.onSurface,
                  borderBottomColor: theme.colors.outlineVariant,
                },
              ]}>
              Select Subject
            </Text>
            <ScrollView style={styles.dropdownScrollView}>
              {['All', ...subjectsList].map(subj => (
                <TouchableOpacity
                  key={subj}
                  onPress={() => {
                    setSelectedSubjFilter(subj);
                    setDropdownVisible(false);
                  }}
                  style={[
                    styles.dropdownMenuItem,
                    selectedSubjFilter === subj && {
                      backgroundColor: theme.colors.primaryContainer,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.dropdownMenuItemText,
                      {color: theme.colors.onSurface},
                      selectedSubjFilter === subj && {
                        color: theme.colors.primary,
                        fontWeight: 'bold',
                      },
                    ]}>
                    {subj}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Planner Slot Creation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={slotModalVisible}
        onRequestClose={() => setSlotModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              theme.dark && {backgroundColor: theme.colors.surface},
            ]}>
            <View style={styles.modalHeader}>
              <Text
                size="medium"
                style={[styles.modalTitle, {color: theme.colors.onSurface}]}>
                Schedule Study Block
              </Text>
              <IconButton
                icon="close"
                size={22}
                onPress={() => setSlotModalVisible(false)}
              />
            </View>

            {/* Time Pickers instead of manual text inputs */}
            <Text
              style={[
                styles.modalLabel,
                {color: theme.colors.onSurfaceVariant},
              ]}>
              Study Time Block
            </Text>
            <View style={styles.timePickerRow}>
              <TouchableOpacity
                onPress={showStartTimePicker}
                style={[
                  styles.timePickerButton,
                  theme.dark && {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}>
                <Text style={styles.timePickerLabel}>Start Time</Text>
                <Text
                  style={[
                    styles.timePickerVal,
                    {color: theme.colors.onSurface},
                  ]}>
                  {formatTime(slotStart)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={showEndTimePicker}
                style={[
                  styles.timePickerButton,
                  theme.dark && {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}>
                <Text style={styles.timePickerLabel}>End Time</Text>
                <Text
                  style={[
                    styles.timePickerVal,
                    {color: theme.colors.onSurface},
                  ]}>
                  {formatTime(slotEnd)}
                </Text>
              </TouchableOpacity>
            </View>

            <PaperTextInput
              label="Subject"
              placeholder="e.g. Physics"
              value={slotSubj}
              onChangeText={setSlotSubj}
              mode="outlined"
              style={[
                styles.modalInput,
                theme.dark && {backgroundColor: theme.colors.surface},
              ]}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />

            <PaperTextInput
              label="Specific Study Topic"
              placeholder="e.g. Newton's Laws of Motion"
              value={slotTopic}
              onChangeText={setSlotTopic}
              mode="outlined"
              style={[
                styles.modalInput,
                theme.dark && {backgroundColor: theme.colors.surface},
              ]}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />

            {/* Slot Priority selector */}
            <Text
              style={[
                styles.modalLabel,
                {color: theme.colors.onSurfaceVariant},
              ]}>
              Priority Level
            </Text>
            <View style={styles.prioritySelector}>
              {['Low', 'Medium', 'High'].map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSlotPriority(p)}
                  style={[
                    styles.priorityBtn,
                    theme.dark && {
                      backgroundColor: theme.colors.elevation.level2,
                      borderColor: theme.colors.outlineVariant,
                    },
                    slotPriority === p && {
                      backgroundColor: theme.colors.primaryContainer,
                      borderColor: theme.colors.primary,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.priorityBtnText,
                      {color: getPriorityColor(p)},
                      slotPriority === p && styles.boldText,
                    ]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
      <Confetti
        active={showGrandConfetti}
        onComplete={() => setShowGrandConfetti(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  dateSelectorContainer: {
    backgroundColor: '#007171',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  todayBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  todayBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
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
  clearBtnText: {
    color: '#ff3b30',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    elevation: 3,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyCardIcon: {
    alignSelf: 'center',
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007171',
  },
  durationText: {
    fontSize: 9,
    color: '#90a4ae',
    marginTop: 2,
    textAlign: 'center',
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
  taskCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    elevation: 2,
    overflow: 'visible',
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    overflow: 'visible',
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    overflow: 'visible',
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
  modalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#546e7a',
    marginTop: 5,
    marginBottom: 8,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  timePickerButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b0bec5',
    backgroundColor: '#fafafa',
  },
  timePickerLabel: {
    fontSize: 10,
    color: '#78909c',
    marginBottom: 2,
  },
  timePickerVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#263238',
  },
  modalInput: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  modalSubmitBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalSubmitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
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
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  completedTaskDesc: {
    textDecorationLine: 'line-through',
    color: '#90a4ae',
  },
  boldText: {
    fontWeight: 'bold',
  },
  spacerStyle: {
    height: 100,
  },
  flex1: {
    flex: 1,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eceff1',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#37474f',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eef6f5',
    borderWidth: 1,
    borderColor: '#b2dbdb',
  },
  dropdownBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007171',
    textTransform: 'capitalize',
  },
  dropdownMenuCard: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    maxHeight: '60%',
  },
  dropdownMenuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eceff1',
    paddingBottom: 6,
  },
  dropdownMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#37474f',
    textTransform: 'capitalize',
  },
  checklistSectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 10,
  },
  emptyChecklistPlaceholder: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eceff1',
    marginBottom: 15,
    elevation: 1,
  },
  emptyPlaceholderText: {
    color: '#90a4ae',
    fontSize: 12,
    marginTop: 6,
  },
  dropdownScrollView: {
    maxHeight: 250,
  },
});

export default StudyPlanner;
