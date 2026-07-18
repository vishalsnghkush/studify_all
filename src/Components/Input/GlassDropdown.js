import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GlassDropdown = ({ label, value, options, onSelect, icon, disabled, placeholder }) => {
  const { colors, dark } = useTheme();
  const [visible, setVisible] = useState(false);

  const handleSelect = (val) => {
    onSelect(val);
    setVisible(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: dark ? '#cfd8dc' : '#263238' }]}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.dropdownButton,
          {
            backgroundColor: dark ? '#37474f' : '#eaeff0',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        disabled={disabled}
        onPress={() => setVisible(true)}>
        
        <View style={styles.contentRow}>
          {icon && (
            <Icon 
              name={icon} 
              size={18} 
              color={disabled ? (dark ? '#78909c' : '#90a4ae') : (dark ? '#ffffff' : '#37474f')} 
              style={styles.icon} 
            />
          )}
          <Text
            style={[
              styles.selectedText,
              { color: selectedOption ? (dark ? '#ffffff' : '#263238') : (dark ? '#90a4ae' : '#78909c') },
            ]}>
            {selectedOption ? selectedOption.label : (placeholder || 'Select...')}
          </Text>
        </View>
        <Icon name="chevron-down" size={20} color={dark ? '#90a4ae' : '#546e7a'} />
      </TouchableOpacity>

      <Modal visible={visible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: dark ? '#263238' : '#ffffff' }]}>
             <FlatList
               data={options}
               keyExtractor={(item) => item.value}
               renderItem={({ item }) => (
                 <TouchableOpacity
                   style={[styles.optionItem, item.value === value && { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, item.disabled && { opacity: 0.45 }]}
                   onPress={() => !item.disabled && handleSelect(item.value)}
                   activeOpacity={item.disabled ? 1 : 0.7}>
                   <Text style={[styles.optionText, { color: item.disabled ? (dark ? '#78909c' : '#90a4ae') : (item.value === value ? colors.primary : (dark ? '#eceff1' : '#263238')) }]}>
                     {item.label}
                   </Text>
                   {item.disabled && <Text style={{ fontSize: 11, fontWeight: '700', color: '#f59e0b', marginLeft: 6 }}>🔒</Text>}
                   {!item.disabled && item.value === value && <Icon name="check" size={20} color={colors.primary} />}
                 </TouchableOpacity>
               )}
             />
          </View>
        </TouchableOpacity>
      </Modal>
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '60%',
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 8,
    elevation: 5,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default GlassDropdown;
