import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GlassTextInput = ({ label, value, onChangeText, placeholder, icon, rightIcon, onRightIconPress, disabled, autoFocus }) => {
  const { colors, dark } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: dark ? '#cfd8dc' : '#263238' }]}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: dark ? '#004d40' : '#dcfce7',
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
        
        {icon && (
          <Icon 
            name={icon} 
            size={18} 
            color={disabled ? (dark ? '#78909c' : '#90a4ae') : (dark ? '#a7f3d0' : '#047857')} 
            style={styles.leftIcon} 
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            { color: dark ? '#ffffff' : '#263238' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dark ? '#6ee7b7' : '#059669'}
          editable={!disabled}
          autoFocus={autoFocus}
        />

        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} disabled={disabled || !onRightIconPress}>
            <View style={[styles.rightIconContainer, { backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <Icon name={rightIcon} size={18} color={disabled ? (dark ? '#78909c' : '#90a4ae') : (dark ? '#a7f3d0' : '#047857')} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  rightIconContainer: {
    height: 32,
    width: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  }
});

export default GlassTextInput;
