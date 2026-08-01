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
import {fetchChatGroups} from '../../../Redux/Slices/ChatSlice';

const Groups = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {groups, loadingGroups} = useSelector(state => state.chat);
  const {user} = useSelector(state => state.initial);
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    if (user?.is_intern) {
      dispatch(
        fetchChatGroups({
          department: user?.department || 'Tech',
          is_tl: user?.is_tl ? 'true' : 'false',
        }),
      );
    }
  }, [dispatch, user]);

  const handleRefresh = () => {
    if (user?.is_intern) {
      dispatch(
        fetchChatGroups({
          department: user?.department || 'Tech',
          is_tl: user?.is_tl ? 'true' : 'false',
        }),
      );
    }
  };

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
  };

  const renderItem = ({item}) => {
    // For groups: show custom badge subtitles & labels
    const isAllDepts = item?.display_name?.includes('All Depts');
    const isAllInterns = item?.display_name?.includes('All Interns');

    let subtitle = item?.lastMessage || undefined;
    if (isAllDepts) {
      subtitle = item?.member_names ? `🌍 Global (${item.member_count} members)` : 'Global Community (All Depts + TLs)';
    } else if (isAllInterns) {
      subtitle = item?.member_names ? `🎓 Interns Only (${item.member_count} members)` : 'Interns Lounge (No TLs)';
    } else if (item?.is_group && item?.member_names) {
      subtitle = item.member_names;
    }

    const avatarBg = isAllDepts
      ? '#3F51B5'
      : isAllInterns
      ? '#FF9800'
      : item?.is_group
      ? '#4CAF50'
      : colors.primary;

    const avatarLabel = isAllDepts
      ? 'ALL'
      : isAllInterns
      ? 'INT'
      : item?.display_name?.substring(0, 1).toUpperCase();

    return (
      <>
        <List.Item
          title={item?.display_name}
          key={item?.chat_group_id}
          description={subtitle}
          titleStyle={{fontSize: 18, fontWeight: 'bold'}}
          descriptionNumberOfLines={1}
          descriptionStyle={item?.is_group ? {fontSize: 12, color: colors.onSurfaceVariant} : undefined}
          onPress={() => handlePress(item)}
          left={props => (
            <Avatar.Text
              {...props}
              label={avatarLabel}
              size={50}
              style={{backgroundColor: avatarBg}}
              color="#ffffff"
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
  };

  return (
    <Screen list NoHeader>
      <View style={{paddingVertical: 10}}>
        <Searchbar
          placeholder="Search conversations"
          value={query}
          onChangeText={setQuery}
          style={{borderRadius: 30}}
          loading={loadingGroups}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.chat_group_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 40}}
        refreshing={loadingGroups}
        onRefresh={handleRefresh}
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
