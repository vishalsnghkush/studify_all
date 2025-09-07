import {useCallback, useEffect, useState, useMemo, useRef} from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Linking,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {GiftedChat, Bubble, Send, InputToolbar} from 'react-native-gifted-chat';
import {useTheme, IconButton} from 'react-native-paper';
import {Screen} from '../../../Components/Screen';
import {addMessage} from '../../../Redux/Slices/ChatSlice';
import useApi from '../../../Components/Api/Api';
import WebView from 'react-native-webview';
const Chat = ({route}) => {
  const {data} = route?.params || {};
  // console.log('data', data);
  const {user} = useSelector(state => state.initial);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chats, setChats] = useState([]);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const {colors} = useTheme();
  const {client, messages} = useSelector(state => state.chat);
  const [viewer, setViewer] = useState({visible: false, type: null, url: null});

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async (isLoadMore = false) => {
    try {
      if (!hasMoreRef.current && isLoadMore) {
        return; // Don't fetch if no more messages
      }

      if (isLoadMore) {
        setLoadingMore(true);
      }

      const res = await useApi().get(
        `/chat/chats/${data?.chat_group_id}?offset=${offsetRef.current}`,
      );
      const newChats = res?.data || [];

      if (newChats.length === 0) {
        hasMoreRef.current = false;
        if (isLoadMore) {
          setLoadingMore(false);
        }
        return;
      }

      if (isLoadMore) {
        setChats(prevChats => [...prevChats, ...newChats]);
      } else {
        setChats(newChats);
      }

      // Increase offset for next fetch
      offsetRef.current += 30;
    } catch (err) {
      console.log('error fetching chats', err);
    }

    if (isLoadMore) {
      setLoadingMore(false);
    } else {
      setLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (hasMoreRef.current && !loadingMore) {
      fetchChats(true);
    }
  };

  const mapToGifted = useMemo(() => {
    const sortedChats = [...chats].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
    const mappedMessages = sortedChats.map(c => ({
      _id: c.id,
      text: c.message_type === 'text' ? c.message : '',
      createdAt: new Date(c.created_at),
      user: {
        _id: c.receiver_id !== 5 || user?.userId ? 1 : 2,
        name:
          c.receiver_id !== 5 || user?.userId
            ? user?.fname
            : data?.display_name,
      },
      image: c.message_type === 'image' ? c.media_url : undefined,
      video: c.message_type === 'video' ? c.media_url : undefined,
      docUrl: c.message_type === 'document' ? c.media_url : undefined,
      mediaType: c.message_type,
    }));

    const unreadCount = data?.unread_count || 0;
    if (unreadCount > 0 && unreadCount <= mappedMessages.length) {
      const unreadLineIndex = unreadCount;
      mappedMessages.splice(unreadLineIndex, 0, {
        _id: `unread-line-${Date.now()}`,
        text: '',
        createdAt: new Date(),
        user: {_id: 'system'},
        system: true,
        isUnreadLine: true,
      });
    }

    return mappedMessages;
  }, [chats, user, data?.unread_count]);

  const onSend = useCallback((msgs = []) => {
    dispatch(addMessage(...msgs));
    const msg = msgs[0].text;
    const payload = JSON.stringify({
      sender: user?.fname || user?.lname || user?.email,
      email: user?.email,
      text: msg,
      timestamp: Date.now(),
    });
    if (msg.trim() && client?.isConnected()) {
      const message = new Paho.MQTT.Message(payload);
      message.destinationName = 'chat/general';
      client.send(message);
    }
  }, []);

  if (loading)
    return (
      <Screen>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
        />
      </Screen>
    );

  return (
    <Screen list padding>
      <GiftedChat
        messages={mapToGifted}
        onSend={msgs => onSend(msgs)}
        user={{_id: 1, name: user?.fname || user?.email}}
        showUserAvatar
        infiniteScroll
        loadMore
        loadEarlier={hasMoreRef.current}
        isLoadingEarlier={loadingMore}
        onLoadEarlier={loadMoreMessages}
        // inverted={false}
        renderSystemMessage={props => {
          if (props.currentMessage.isUnreadLine) {
            return (
              <View style={styles.unreadLine}>
                <View style={styles.unreadLineBar} />
                <Text style={styles.unreadLineText}>
                  {data?.unread_count} unread message
                  {data?.unread_count !== 1 ? 's' : ''}
                </Text>
                <View style={styles.unreadLineBar} />
              </View>
            );
          }
          return null;
        }}
        renderBubble={props => (
          <Bubble
            {...props}
            wrapperStyle={{
              right: {
                backgroundColor: colors.primary,
                borderRadius: 18,
                padding: 4,
                marginBottom: 2,
              },
              left: {
                backgroundColor: '#18a3fa',
                borderRadius: 18,
                padding: 4,
                marginBottom: 2,
              },
            }}
            textStyle={{
              right: {color: '#fff', fontSize: 18},
              left: {color: '#fff', fontSize: 18},
            }}
            timeTextStyle={{
              right: {color: '#fff', fontSize: 12},
              left: {color: '#fff', fontSize: 12},
            }}
          />
        )}
        renderSend={props => (
          <Send {...props}>
            <View>
              <IconButton icon="send" size={25} iconColor={colors.primary} />
            </View>
          </Send>
        )}
        alwaysShowSend
        renderInputToolbar={props => (
          <InputToolbar
            {...props}
            containerStyle={{backgroundColor: colors.background, marginTop: 5}}
          />
        )}
        renderMessageImage={props => (
          <Pressable
            onPress={() =>
              setViewer({
                visible: true,
                type: 'image',
                url: props.currentMessage.image,
              })
            }>
            <Image
              source={{uri: props.currentMessage.image}}
              style={{
                width: 230,
                height: 280,
                borderRadius: 12,
                marginBottom: 5,
              }}
              resizeMode="cover"
            />
          </Pressable>
        )}
        renderMessageVideo={props => (
          <Pressable
            onPress={() =>
              setViewer({
                visible: true,
                type: 'video',
                url: props.currentMessage.video,
              })
            }
            style={styles.videoThumb}>
            <IconButton
              icon="play"
              size={40}
              iconColor="#fff"
              style={{
                backgroundColor: '#353535ff',
                borderRadius: 50,
                padding: 5,
              }}
            />
            <Text style={styles.videoHint}>Tap to play video</Text>
          </Pressable>
        )}
        renderCustomView={props => {
          const {currentMessage} = props;
          if (currentMessage.docUrl) {
            const fileName = currentMessage.docUrl.split('/').pop();
            return (
              <Pressable
                onPress={() =>
                  setViewer({
                    visible: true,
                    type: 'doc',
                    url: currentMessage.docUrl,
                  })
                }
                style={styles.docBox}>
                <IconButton icon="file" size={40} />
                <Text style={{color: '#fff', fontSize: 14}}>Tap to view</Text>
              </Pressable>
            );
          }
          return null;
        }}
      />
      <Modal visible={viewer.visible} transparent={false} animationType="fade">
        <View
          style={[
            styles.viewerContainer,
            {backgroundColor: colors.background},
          ]}>
          <IconButton
            icon="close"
            size={28}
            style={styles.closeBtn}
            iconColor="#fff"
            onPress={() => setViewer({visible: false, type: null, url: null})}
          />
          {viewer.type === 'image' ? (
            <Image
              source={{uri: viewer.url}}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : (
            <WebView
              source={{
                uri:
                  viewer.type === 'video'
                    ? viewer.url
                    : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                        viewer.url,
                      )}`,
              }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              // style={{width: '100%', height: '100%'}}
              // startInLoadingState
              renderLoading={() => (
                <ActivityIndicator
                  size="large"
                  color="#fff"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                />
              )}
            />
          )}
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  videoThumb: {
    width: 230,
    height: 170,
    marginBottom: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#100f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoHint: {
    position: 'absolute',
    bottom: 8,
    color: '#fff',
    fontSize: 14,
  },
  docBox: {
    width: 230,
    height: 170,
    marginBottom: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#100f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: '#222',
    zIndex: 10,
  },
  fullImage: {width: '100%', height: '80%'},
  fullVideoPlaceholder: {
    width: '100%',
    height: '60%',
    borderRadius: 16,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 20,
  },
  unreadLineBar: {
    flex: 1,
    height: 1,
    backgroundColor: '#ff6b6b',
  },
  unreadLineText: {
    marginHorizontal: 15,
    fontSize: 13,
    color: '#ff6b6b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default Chat;
