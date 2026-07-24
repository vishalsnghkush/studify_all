import React, { useState, useEffect } from 'react';
import { View, StyleSheet, LayoutAnimation, UIManager, Platform, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import GlassDropdown from './Input/GlassDropdown';
import GlassTextInput from './Input/GlassTextInput';
import { TopicChips } from './Input/TopicChips';
import { BOARDS, CLASSES, STREAMS, getClassesForBoard, getSubjectsForClass, getSyllabusData } from '../Utils/CurriculumConfig';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const CurriculumSelector = ({
  board, setBoard,
  studentClass, setStudentClass,
  stream, setStream,
  subject, setSubject,
  topic, setTopic,
  subtopic, setSubtopic
}) => {
  const [subjectOptions, setSubjectOptions] = useState([]);
  const { dark } = useTheme();

  useEffect(() => {
    // When class, stream, or board changes, update subject options
    if (studentClass) {
      const subjects = getSubjectsForClass(studentClass, stream, board);
      setSubjectOptions(subjects);
      
      // If the current subject is no longer in the list, clear it
      if (subject && !subjects.find(s => s.value === subject)) {
        setSubject('');
      }
    }
  }, [studentClass, stream, board]);

  const handleBoardChange = (val) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBoard(val);
    setStudentClass('');
    setStream('');
    setSubject('');
    setTopic('');
    setSubtopic('');
  };

  const handleClassChange = (val) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStudentClass(val);
    setStream('');
    setSubject('');
    setTopic('');
    setSubtopic('');
  };

  const handleStreamChange = (val) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStream(val);
    setSubject('');
    setTopic('');
    setSubtopic('');
  };

  const handleSubjectChange = (val) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSubject(val);
    setTopic('');
    setSubtopic('');
  };

  // ICSE: Stream selection applies to Class 9, 10, 11, 12. CBSE: Class 11, 12
  const showStream = board === 'ICSE' 
    ? ['Class 9', 'Class 10', 'Class 11', 'Class 12'].includes(studentClass)
    : ['Class 11', 'Class 12'].includes(studentClass);
  const streamSelectedIfRequired = showStream ? !!stream : true;

  // Board-specific class list
  const classOptions = getClassesForBoard(board);

  // Dynamically compute syllabus placeholders for topic and subtopic
  const syllabusInfo = getSyllabusData(studentClass, subject);

  return (
    <View style={styles.container}>
      
      {/* Profile Card */}
      <View style={[styles.card, { backgroundColor: dark ? '#1e293b' : '#ffffff' }]}>
        <Text style={[styles.cardTitle, { color: dark ? '#f1f5f9' : '#0f172a' }]}>Profile</Text>
        
        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <GlassDropdown
              label="Board"
              value={board}
              options={BOARDS}
              onSelect={handleBoardChange}
              placeholder="CBSE"
            />
          </View>
          <View style={styles.flexHalf}>
            <GlassDropdown
              label="Class"
              value={studentClass}
              options={classOptions}
              onSelect={handleClassChange}
              disabled={!board}
              placeholder="Select Class"
            />
          </View>
        </View>

        {showStream && (
          <GlassDropdown
            label="Stream"
            value={stream}
            options={STREAMS}
            onSelect={handleStreamChange}
            placeholder="Select Stream"
            disabled={!studentClass}
          />
        )}

        <GlassDropdown
          label="Subject"
          value={subject}
          options={subjectOptions}
          onSelect={handleSubjectChange}
          placeholder={streamSelectedIfRequired ? "Select Subject" : "Pick Stream First"}
          disabled={!studentClass || !streamSelectedIfRequired || subjectOptions.length === 0}
        />
      </View>

      {/* Topic Selection Card */}
      <View style={[styles.card, { backgroundColor: dark ? '#064e3b' : '#eefbf6' }]}>
        <Text style={[styles.cardTitle, { color: dark ? '#ecfdf5' : '#064e3b' }]}>Topic Selection</Text>

        <GlassTextInput
          label="Topic Name"
          value={topic}
          onChangeText={setTopic}
          placeholder={subject ? syllabusInfo.topicPlaceholder : "Select Class & Subject first"}
          disabled={!subject}
        />
        
        {!!subject && (
          <TopicChips 
             subject={subject} 
             studentClass={studentClass} 
             onSelectTopic={setTopic} 
          />
        )}

        <GlassTextInput
          label="Subtopic (optional)"
          value={subtopic}
          onChangeText={setSubtopic}
          placeholder={subject ? syllabusInfo.subtopicPlaceholder : "Select Topic first"}
          disabled={!topic}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexHalf: {
    flex: 0.48,
  }
});
