import {useState, useEffect, useCallback} from 'react';
import {View, KeyboardAvoidingView} from 'react-native';
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
// import {addMessage} from '../../../Redux/Slices/ChatSlice';

export default function CustomerService() {
  const {colors} = useTheme();
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.initial);
  const [chatMessages, setChatMessages] = useState([]);

  const onSend = useCallback((messages = []) => {
    setChatMessages([...chatMessages, ...messages]);
    GiftedChat.append(chatMessages, messages);
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
            backgroundColor: '#284B63',
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
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={100}
      style={{flex: 1}}>
      <Screen padding list>
        <GiftedChat
          messages={chatMessages}
          onSend={messages => setChatMessages([...messages, ...chatMessages])}
          renderBubble={renderBubble}
          user={{_id: 1, name: user?.fname || user?.email}}
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
    </KeyboardAvoidingView>
  );
}
