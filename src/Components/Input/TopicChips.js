import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTopEngagedSubjects } from '../../Utils/EngagementTracker';

export const TopicChips = ({ subject, studentClass, onSelectTopic }) => {
  const { colors, dark } = useTheme();
  const [chips, setChips] = useState([]);

  useEffect(() => {
    loadChips();
  }, [subject, studentClass]);

  const loadChips = async () => {
    // 1. Get user's weak/strong subjects from EngagementTracker to personalize.
    const topEngaged = await getTopEngagedSubjects();
    const weakSubject = topEngaged.length > 0 ? topEngaged[topEngaged.length - 1] : null;

    let defaultChips = [];
    
    // Fake dynamic popular topics based on subject (in a real app, fetch from server)
    if (subject === 'Physics') {
      defaultChips = [
        { label: 'Laws of Motion', icon: 'axis-arrow', recommended: false },
        { label: 'Thermodynamics', icon: 'fire', recommended: false },
      ];
    } else if (subject === 'Biology') {
      defaultChips = [
        { label: 'Photosynthesis', icon: 'leaf', recommended: false },
        { label: 'Cell Structure', icon: 'bacteria', recommended: false },
      ];
    } else if (subject === 'Mathematics') {
      defaultChips = [
        { label: 'Quadratic Equations', icon: 'function-variant', recommended: false },
        { label: 'Trigonometry', icon: 'triangle-outline', recommended: false },
      ];
    } else {
      defaultChips = [
        { label: 'Important Formulas', icon: 'text-box-search-outline', recommended: false },
        { label: 'Previous Year Questions', icon: 'history', recommended: false },
      ];
    }

    // If the currently selected subject is their weak subject, add a specific "Recommended" chip
    if (weakSubject && subject && weakSubject.toLowerCase() === subject.toLowerCase()) {
      defaultChips.unshift({
        label: 'Revise Weak Areas',
        icon: 'brain',
        recommended: true,
      });
    }

    setChips(defaultChips);
  };

  if (!subject) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: dark ? '#a1a1aa' : '#71717a' }]}>
        Popular or recent. Tap to auto-fill.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {chips.map((chip, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => onSelectTopic(chip.label)}
            style={[
              styles.chip,
              {
                backgroundColor: chip.recommended
                  ? (dark ? 'rgba(13, 148, 136, 0.15)' : '#e0f2f1')
                  : (dark ? 'rgba(255, 255, 255, 0.05)' : '#f4f4f5'),
                borderColor: chip.recommended
                  ? colors.primary
                  : (dark ? 'rgba(255, 255, 255, 0.1)' : '#e4e4e7'),
              },
            ]}>
            {chip.icon && (
              <Icon 
                name={chip.icon} 
                size={16} 
                color={chip.recommended ? colors.primary : (dark ? '#a1a1aa' : '#52525b')} 
                style={styles.icon} 
              />
            )}
            <Text
              style={[
                styles.label,
                { color: chip.recommended ? colors.primary : (dark ? '#e4e4e7' : '#3f3f46') },
              ]}>
              {chip.label}
            </Text>
            {chip.recommended && (
              <Icon name="sparkles" size={12} color={colors.primary} style={{ marginLeft: 6 }} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  scroll: {
    paddingRight: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  }
});
