import React, {useMemo, useState, useEffect} from 'react';
import {FlatList, View} from 'react-native';
import {
  Avatar,
  Badge,
  Searchbar,
  useTheme,
  List,
  Divider,
} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '../../../Components/Screen';
import Text from '../../../Components/Input/Text';
import {onSelectGroup} from '../../../Redux/Slices/ChatSlice';

const Groups = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {groups} = useSelector(state => state.chat);
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();

  const filtered = useMemo(() => {
    if (!query.trim()) return groups;
    return groups.filter(c =>
      c.display_name.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }, [query, groups]);

  const handlePress = item => {
    navigation.navigate('Chat', {
      data: item,
    });
    dispatch(onSelectGroup(item.chat_group_id));
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
        contentContainerStyle={{paddingBottom: 40}}
        ListEmptyComponent={() => (
          <View style={{marginTop: 60, alignItems: 'center'}}>
            <Text size="medium" style={{color: colors.onSurfaceVariant}}>
              No conversations yet
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

export default Groups;
