import {useCallback, useEffect, useState, useMemo, useRef} from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Pressable,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {GiftedChat, Bubble, Send, InputToolbar} from 'react-native-gifted-chat';
import {useTheme, IconButton} from 'react-native-paper';
import {Screen} from '../../../Components/Screen';
import useApi from '../../../Components/Api/Api';
import WebView from 'react-native-webview';
import AttachmentModal from '../../../Components/Screen/Chat/Modal';
import {setMessage, addMessage} from '../../../Redux/Slices/ChatSlice';
import Notifee from '@notifee/react-native';

const Chat = ({route}) => {
  const {data} = route?.params || {};
  const {user} = useSelector(state => state.initial);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const messageIdsRef = useRef(new Set());
  const {colors} = useTheme();
  const {client, messages} = useSelector(state => state.chat);
  const [viewer, setViewer] = useState({visible: false, type: null, url: null});
  const pageSize = 30;
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const giftedRef = useRef(null);

  const currentUserId = user?.user_id;

  useEffect(() => {
    fetchChats();
    Notifee.cancelDisplayedNotification(data?.chat_group_id?.toString());
    var newTopic;
    if (data?.is_group) {
      newTopic = `chat/${data?.chat_group_id}`;
    } else {
      newTopic = `chat/${[currentUserId, data.receiver_id].sort().join('-')}`;
    }
    client.subscribe(newTopic);
    return () => {
      client.unsubscribe(newTopic);
    };
  }, []);

  const fetchChats = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        if (!hasMoreRef.current || loadingMoreRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      const res = await useApi().get(
        `/chat/chats/${data?.chat_group_id}?offset=${offsetRef.current}`,
      );
      const newChats = Array.isArray(res?.data) ? res.data : [];

      if (newChats.length === 0) {
        hasMoreRef.current = false;
      } else {
        offsetRef.current += pageSize;
      }

      const next = isLoadMore ? [...messages] : [...newChats];
      if (isLoadMore) {
        newChats.forEach(m => {
          if (!messageIdsRef.current.has(m.id)) {
            messageIdsRef.current.add(m.id);
            next.unshift(m);
          }
        });
      } else {
        messageIdsRef.current = new Set();
        newChats.forEach(m => messageIdsRef.current.add(m.id));
      }
      dispatch(setMessage(next));
    } catch (err) {
      console.log('error fetching chats', err);
    } finally {
      if (isLoadMore) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMoreMessages = () => {
    if (hasMoreRef.current && !loadingMore) fetchChats(true);
  };

  const mapToGifted = useMemo(() => {
    const sortedChats = [...messages].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    const mappedMessages = sortedChats.map(c => {
      const senderId = c.sender_id || c.user_id || c.receiver_id || 'other';
      const isCurrentUser = senderId === currentUserId;
      return {
        _id: c.id || `${c.created_at}-${Math.random()}`,
        text: c.message_type === 'text' ? c.message : '',
        createdAt: new Date(c.created_at),
        user: {
          _id: isCurrentUser ? currentUserId : senderId,
          name: isCurrentUser
            ? user?.fname || user?.email || 'You'
            : c.sender_name || c.display_name || 'User',
        },
        image: c.message_type === 'image' ? c.media_url : undefined,
        video: c.message_type === 'video' ? c.media_url : undefined,
        docUrl: c.message_type === 'document' ? c.media_url : undefined,
        mediaType: c.message_type,
        status: c.status,
        pending: c.pending,
      };
    });

    const unreadCount = data?.unread_count || 0;
    if (unreadCount > 0 && unreadCount < mappedMessages.length) {
      const insertIndex = unreadCount;
      mappedMessages.splice(insertIndex, 0, {
        _id: 'unread-separator',
        text: '',
        createdAt: new Date(),
        user: {_id: 'system'},
        system: true,
        isUnreadLine: true,
      });
    }

    return mappedMessages;
  }, [messages, data?.unread_count, currentUserId]);

  const onSend = useCallback(
    async (msgs = []) => {
      if (!msgs.length) return;
      const {text} = msgs[0];
      const trimmed = text?.trim();
      if (!trimmed) return;

      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        created_at: new Date().toISOString(),
        message_type: 'text',
        message: trimmed,
        sender_id: currentUserId,
      };

      dispatch(addMessage(optimistic));
      messageIdsRef.current.add(tempId);
      try {
        if (client?.isConnected()) {
          const payload = JSON.stringify({
            chat_group_id: data?.chat_group_id,
            sender_id: currentUserId,
            receiver_id: data?.receiver_id,
            message: trimmed,
            message_type: 'text',
            media_url: null,
          });
          const message = new Paho.MQTT.Message(payload);
          const notifi = new Paho.MQTT.Message(
            JSON.stringify({
              chat_group_id: data?.chat_group_id,
              receiver_id: data?.receiver_id,
              message: '1 sent you a message.',
            }),
          );
          notifi.destinationName = `notification/${data?.receiver_id}`;
          client.send(notifi);
          if (data?.is_group) {
            message.destinationName = `chat/${data?.chat_group_id}`;
          } else {
            message.destinationName = `chat/${[currentUserId, data?.receiver_id]
              .sort()
              .join('-')}`;
          }
          client.send(message);
        }
      } catch (e) {
        console.log('MQTT send error', e);
      }

      setTimeout(() => {
        try {
          giftedRef.current?.scrollToBottom?.();
        } catch (e) {}
      }, 60);
    },
    [client, currentUserId, data?.chat_group_id, dispatch, user],
  );

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
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={100}
      style={{flex: 1}}>
      <Screen list padding>
        <GiftedChat
          ref={giftedRef}
          messages={mapToGifted}
          onSend={msgs => onSend(msgs)}
          user={{_id: currentUserId, name: user?.fname || user?.email}}
          showUserAvatar
          isLoadingEarlier={loadingMore}
          textInputProps={{
            style: {color: '#fff', flex: 1, fontSize: 18},
            placeholderTextColor: '#aaa',
          }}
          loadEarlier={hasMoreRef.current}
          infiniteScroll={true}
          onLoadEarlier={loadMoreMessages}
          listViewProps={{
            keyboardDismissMode: 'on-drag',
          }}
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
                  opacity: props.currentMessage.pending ? 0.6 : 1,
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
            <Send {...props} disabled={!props.text?.trim()}>
              <View>
                <IconButton icon="send" size={25} iconColor={colors.primary} />
              </View>
            </Send>
          )}
          alwaysShowSend
          renderActions={() => (
            <IconButton
              icon="paperclip"
              size={24}
              onPress={() => setShowAttachmentPicker(true)}
            />
          )}
          renderInputToolbar={props => (
            <InputToolbar
              {...props}
              containerStyle={{
                backgroundColor: colors.elevation?.level2 || '#222',
                borderTopWidth: 0,
                borderRadius: 24,
                paddingHorizontal: 4,
                marginHorizontal: 4,
              }}
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
        {showAttachmentPicker && (
          <AttachmentModal
            showAttachmentPicker={showAttachmentPicker}
            setShowAttachmentPicker={setShowAttachmentPicker}
          />
        )}
        <Modal
          visible={viewer.visible}
          transparent={false}
          animationType="fade">
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
    </KeyboardAvoidingView>
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
  attachmentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachmentSheet: {
    backgroundColor: '#222',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  attachTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  attachBtn: {
    paddingVertical: 12,
  },
  attachBtnText: {color: '#fff', fontSize: 15},
});

export default Chat;
