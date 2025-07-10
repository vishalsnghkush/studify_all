import {useState, useEffect, useCallback} from 'react';
import {View} from 'react-native';
import {
  GiftedChat,
  Bubble,
  Send,
  MessageText,
  InputToolbar,
} from 'react-native-gifted-chat';
import {useDispatch, useSelector} from 'react-redux';
import {Screen} from '../../../Components/Screen';
import {useTheme, IconButton} from 'react-native-paper';
import {addMessage} from '../../../Redux/Slices/ChatSlice';
import Notifee from '@notifee/react-native';

export default function CustomerService() {
  const {colors} = useTheme();
  const dispatch = useDispatch();
  const {client, messages: chatMessages} = useSelector(state => state.chat);
  const {user} = useSelector(state => state.initial);

  useEffect(() => {
    Notifee.cancelAllNotifications();
  }, []);

  const onSend = useCallback((messages = []) => {
    dispatch(addMessage(...messages));
    GiftedChat.append(chatMessages, messages);
    const msg = messages[0].text;
    const payload = JSON.stringify({
      sender: user?.email,
      text: msg,
      timestamp: Date.now(),
    });
    if (msg.trim() && client?.isConnected()) {
      const message = new Paho.MQTT.Message(payload);
      message.destinationName = 'chat/general';
      client.send(message);
    }
  }, []);
  const renderBubble = props => {
    return (
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
            backgroundColor: '#6719e5',
            borderRadius: 18,
            padding: 4,
            marginBottom: 2,
          },
        }}
        textStyle={{
          right: {
            color: '#fff',
            fontSize: 17,
          },
          left: {
            color: '#fff',
            fontSize: 17,
          },
        }}
        timeTextStyle={{
          right: {color: '#fff'},
          left: {color: '#fff'},
        }}
      />
    );
  };
  const renderSend = props => {
    return (
      <Send {...props}>
        <View>
          <IconButton icon="send" size={25} iconColor={colors.primary} />
        </View>
      </Send>
    );
  };

  return (
    <Screen padding list>
      <GiftedChat
        messages={chatMessages}
        onSend={messages => onSend(messages)}
        renderBubble={renderBubble}
        user={{_id: 1, name: 'User Test'}}
        renderSend={renderSend}
        alwaysShowSend
        renderUsernameOnMessage={true}
        textInputStyle={{color: colors.onBackground}}
        renderInputToolbar={props => (
          <InputToolbar
            {...props}
            containerStyle={{
              backgroundColor: colors.background,
              marginTop: 5,
            }}
          />
        )}
      />
    </Screen>
  );
}
