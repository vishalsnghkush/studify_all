import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GlassButton = ({ label, icon, onPress, disabled, color, style }) => {
  const { colors, dark } = useTheme();
  
  // Use the exact dark teal color from the mockup if no color is provided
  const accent = color || (dark ? '#004d40' : '#006d5b');

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        {
          backgroundColor: disabled ? (dark ? '#263238' : '#cfd8dc') : accent,
          shadowColor: accent,
          shadowOpacity: disabled ? 0 : 0.5,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: disabled ? 0 : 8,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}>
      <View style={styles.contentRow}>
        <Text style={[styles.label, { color: disabled ? (dark ? '#546e7a' : '#90a4ae') : '#ffffff' }]}>
          {label}
        </Text>
        {icon && (
          <Icon 
            name={icon} 
            size={22} 
            color={disabled ? (dark ? '#546e7a' : '#90a4ae') : '#ffffff'} 
            style={styles.icon} 
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
  },
  icon: {
    marginLeft: 10,
  }
});

export default GlassButton;
