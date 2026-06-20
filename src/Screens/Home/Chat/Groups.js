import React, {useMemo, useState, useEffect} from 'react';
import {FlatList, View, Modal, StyleSheet} from 'react-native';
import {
  Avatar,
  Badge,
  Searchbar,
  useTheme,
  List,
  Divider,
  FAB,
  TextInput,
  Button,
} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Screen} from '../../../Components/Screen';
import Text from '../../../Components/Input/Text';

const Groups = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {groups} = useSelector(state => state.chat);
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [customGroups, setCustomGroups] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const loadCustomGroups = async () => {
        try {
          const saved = await AsyncStorage.getItem('custom_groups');
          if (saved) {
            setCustomGroups(JSON.parse(saved));
          }
        } catch (e) {
          console.log('Error loading custom groups', e);
        }
      };
      loadCustomGroups();
    }, [])
  );

  const displayGroups = useMemo(() => {
    const baseGroups = groups && groups.length > 0 ? groups : [];
    return [...customGroups, ...baseGroups];
  }, [groups, customGroups]);

  const filtered = useMemo(() => {
    if (!query.trim()) return displayGroups;
    return displayGroups.filter(c =>
      c.display_name.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }, [query, displayGroups]);

  const handleStartChat = async () => {
    if (!newChatName.trim()) return;
    const sanitizedName = newChatName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newChat = {
      chat_group_id: `mock_custom_${sanitizedName}`,
      display_name: newChatName.trim(),
      lastMessage: 'Chat started',
      unread_count: 0,
      is_group: 1,
      receiver_id: `group_${sanitizedName}`,
    };
    const updated = [newChat, ...customGroups];
    setCustomGroups(updated);
    try {
      await AsyncStorage.setItem('custom_groups', JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving custom groups', e);
    }
    setNewChatName('');
    setModalVisible(false);
    navigation.navigate('Chat', {
      data: newChat,
    });
  };

  const handlePress = item => {
    navigation.navigate('Chat', {
      data: item,
    });
  };

  const renderItem = ({item}) => (
    <>
      <List.Item
        title={item?.display_name}
        key={item?.chat_group_id}
        description={item?.lastMessage || undefined}
        titleStyle={{fontSize: 20}}
        descriptionNumberOfLines={1}
        onPress={() => handlePress(item)}
        left={props => (
          <Avatar.Text
            {...props}
            label={item?.display_name?.substring(0, 1).toUpperCase()}
            size={50}
            style={{backgroundColor: colors.primary}}
            color={colors.onPrimary}
          />
        )}
        right={() => (
          <View style={{alignItems: 'flex-end', justifyContent: 'center'}}>
            {item?.unread_count > 0 && (
              <Badge style={{backgroundColor: colors.primary}} size={23}>
                <Text style={{color: '#ffffff'}}>{item?.unread_count}</Text>
              </Badge>
            )}
          </View>
        )}
      />
      <Divider inset />
    </>
  );

  return (
    <Screen list NoHeader>
      <View style={{paddingVertical: 10}}>
        <Searchbar
          placeholder="Search conversations"
          value={query}
          onChangeText={setQuery}
          style={{borderRadius: 30}}
          loading={false}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.chat_group_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 80}}
        ListEmptyComponent={() => (
          <View style={{marginTop: 60, alignItems: 'center'}}>
            <Text size="medium" style={{color: colors.onSurfaceVariant}}>
              No conversations yet
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
      <FAB
        icon="plus"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: colors.primary,
        }}
        color={colors.onPrimary}
        onPress={() => setModalVisible(true)}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.elevation.level3}]}>
            <Text size="medium" style={{fontWeight: 'bold', color: colors.onSurface, marginBottom: 15}}>
              Start New Conversation
            </Text>
            <TextInput
              label="Student or Group Name"
              value={newChatName}
              onChangeText={setNewChatName}
              mode="outlined"
              style={{width: '100%', marginBottom: 20}}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button mode="text" onPress={() => { setModalVisible(false); setNewChatName(''); }}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleStartChat} disabled={!newChatName.trim()}>
                Start Chat
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 10,
  },
});

export default Groups;
