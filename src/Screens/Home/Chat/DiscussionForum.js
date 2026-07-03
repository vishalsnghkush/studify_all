import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import {useTheme, Avatar, ActivityIndicator, IconButton, TextInput as PaperTextInput} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {launchImageLibrary} from 'react-native-image-picker';
import {useIsFocused} from '@react-navigation/native';
import * as DocumentPicker from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {setUser, setLastSeenMsgId, setUnreadDiscussion} from '../../../Redux/Slices/InitialSlice';
import useApi from '../../../Components/Api/Api';
import {Screen} from '../../../Components/Screen';
import {Text} from '../../../Components/Input';

const isValidAvatarUri = (uri) => {
  return uri && (uri.startsWith('data:image') || uri.startsWith('http://') || uri.startsWith('https://'));
};

const {width} = Dimensions.get('window');

const DiscussionForum = ({navigation}) => {
  const {colors} = useTheme();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const {user, lastSeenMsgId} = useSelector(state => state.initial);
  const {get, post, put} = useApi();

  const [selectedClass, setSelectedClass] = useState(user?.class || null);
  const [selectedSubject, setSelectedSubject] = useState('General');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const flatListRef = useRef(null);

  // Clear unread badge and update lastSeenMsgId when screen is focused with new messages
  useEffect(() => {
    if (isFocused && messages.length > 0) {
      const maxId = Math.max(...messages.map(m => m.id || 0), 0);
      if (maxId > lastSeenMsgId) {
        dispatch(setLastSeenMsgId(maxId));
      }
      dispatch(setUnreadDiscussion(false));
    }
  }, [isFocused, messages, lastSeenMsgId]);

  const classesList = [
    'Class 1st', 'Class 2nd', 'Class 3rd', 'Class 4th', 'Class 5th',
    'Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th',
    'Class 11th', 'Class 12th'
  ];

  // Dynamically determine subjects based on class
  const getSubjects = () => {
    if (!selectedClass) return ['General'];
    const classNum = parseInt(selectedClass.replace(/\D/g, ''), 10);
    if (isNaN(classNum) || classNum <= 5) {
      return ['General', 'Mathematics', 'EVS/Science', 'English', 'Social Studies'];
    } else if (classNum >= 6 && classNum <= 8) {
      return ['General', 'Mathematics', 'Science', 'English', 'Social Science', 'Hindi'];
    } else {
      return ['General', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science'];
    }
  };

  const subjects = getSubjects();

  // Save the selected class to database & Redux
  const saveClass = async (classVal) => {
    try {
      setLoading(true);
      await put('/user/update', {class: classVal});
      dispatch(setUser({...user, class: classVal}));
      setSelectedClass(classVal);
    } catch (err) {
      console.log('Error saving class:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages from API
  const fetchMessages = async () => {
    if (!selectedClass || !selectedSubject) return;
    try {
      const res = await get(`/user/discussion/messages?class=${selectedClass}&subject=${selectedSubject}`);
      if (res && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.log('Error fetching messages:', err);
    }
  };

  // Poll for new messages every 5 seconds to keep it real-time
  useEffect(() => {
    if (selectedClass) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedClass, selectedSubject]);

  // Send message to API
  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    let messageContent = textToSend;
    if (replyToMessage) {
      const payload = {
        replyId: replyToMessage.id,
        replyName: replyToMessage.user_id === user?.user_id ? 'You' : `${replyToMessage.fname || ''} ${replyToMessage.lname || ''}`.trim(),
        replyText: replyToMessage.message || (replyToMessage.image?.startsWith('data:application/pdf') ? '📄 PDF Document' : '📷 Image'),
        text: textToSend
      };
      messageContent = JSON.stringify(payload);
      setReplyToMessage(null);
    }

    try {
      const res = await post('/user/discussion/messages', {
        class: selectedClass,
        subject: selectedSubject,
        message: messageContent
      }, { skipSuccessFlash: true });
      if (res && res.data) {
        setMessages(prev => [...prev, {
          ...res.data,
          fname: user.fname,
          lname: user.lname,
          avatar: user.avatar
        }]);
        setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
      }
    } catch (err) {
      console.log('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Pick Image and Send
  const pickImage = () => {
    launchImageLibrary(
      {mediaType: 'photo', includeBase64: true, quality: 0.5, maxWidth: 600, maxHeight: 600},
      async response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset?.base64) return;
        
        const base64Data = `data:${asset.type};base64,${asset.base64}`;
        setSending(true);

        let messageContent = '';
        if (replyToMessage) {
          const payload = {
            replyId: replyToMessage.id,
            replyName: replyToMessage.user_id === user?.user_id ? 'You' : `${replyToMessage.fname || ''} ${replyToMessage.lname || ''}`.trim(),
            replyText: replyToMessage.message || (replyToMessage.image?.startsWith('data:application/pdf') ? '📄 PDF Document' : '📷 Image'),
            text: ''
          };
          messageContent = JSON.stringify(payload);
          setReplyToMessage(null);
        }

        try {
          const res = await post('/user/discussion/messages', {
            class: selectedClass,
            subject: selectedSubject,
            message: messageContent,
            image: base64Data
          }, { skipSuccessFlash: true });
          if (res && res.data) {
            setMessages(prev => [...prev, {
              ...res.data,
              fname: user.fname,
              lname: user.lname,
              avatar: user.avatar
            }]);
            setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
          }
        } catch (err) {
          console.log('Error sending image:', err);
        } finally {
          setSending(false);
        }
      }
    );
  };

  // Pick Document (PDF) and Send
  const pickDocument = async () => {
    try {
      const [pickResult] = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
        allowMultiSelection: false,
      });
      if (!pickResult?.uri) return;

      setSending(true);

      let messageContent = `[PDF] ${pickResult.name || 'document.pdf'}`;
      if (replyToMessage) {
        const payload = {
          replyId: replyToMessage.id,
          replyName: replyToMessage.user_id === user?.user_id ? 'You' : `${replyToMessage.fname || ''} ${replyToMessage.lname || ''}`.trim(),
          replyText: replyToMessage.message || (replyToMessage.image?.startsWith('data:application/pdf') ? '📄 PDF Document' : '📷 Image'),
          text: `[PDF] ${pickResult.name || 'document.pdf'}`
        };
        messageContent = JSON.stringify(payload);
        setReplyToMessage(null);
      }

      try {
        const base64Str = await ReactNativeBlobUtil.fs.readFile(pickResult.uri, 'base64');
        const base64Data = `data:application/pdf;base64,${base64Str}`;
        
        const res = await post('/user/discussion/messages', {
          class: selectedClass,
          subject: selectedSubject,
          message: messageContent,
          image: base64Data
        }, { skipSuccessFlash: true });

        if (res && res.data) {
          setMessages(prev => [...prev, {
            ...res.data,
            fname: user.fname,
            lname: user.lname,
            avatar: user.avatar
          }]);
          setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
        }
      } catch (err) {
        console.log('Error sending document:', err);
        Alert.alert('Error', 'Failed to upload document.');
      } finally {
        setSending(false);
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.log('DocumentPicker error:', err);
      }
    }
  };

  const getClassCardDetails = (className) => {
    const numStr = className.replace(/[^0-9]/g, '');
    const num = parseInt(numStr, 10) || 1;
    if (num <= 5) {
      return {
        icon: 'school-outline',
        accentColor: '#007171',
      };
    } else if (num <= 8) {
      return {
        icon: 'compass-outline',
        accentColor: '#1e88e5',
      };
    } else if (num <= 10) {
      return {
        icon: 'sigma',
        accentColor: '#8e24aa',
      };
    } else {
      return {
        icon: 'rocket-launch-outline',
        accentColor: '#e65100',
      };
    }
  };

  const renderClassSelector = () => (
    <View style={{flex: 1}}>
      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={classesList}
          keyExtractor={(item) => item}
          numColumns={2}
          contentContainerStyle={styles.classGrid}
          ListHeaderComponent={
            <View style={styles.classSelectorHeader}>
              <IconText icon="account-group" color={colors.primary} size={64} />
              <Text size="large" style={[styles.title, {color: colors.onSurface}]}>Choose your Class</Text>
              <Text style={[styles.subtitle, {color: colors.onSurfaceVariant}]}>
                Select your class/standard to access the student discussion boards.
              </Text>
            </View>
          }
          renderItem={({item}) => {
            const details = getClassCardDetails(item);
            return (
              <TouchableOpacity
                style={[
                  styles.classCard,
                  {
                    backgroundColor: colors.elevation.level2,
                    borderColor: colors.outlineVariant,
                    borderLeftColor: details.accentColor,
                    borderLeftWidth: 4,
                  }
                ]}
                onPress={() => saveClass(item)}>
                <Micon name={details.icon} size={26} color={details.accentColor} style={{marginBottom: 8}} />
                <Text size="medium" style={{color: colors.onSurface, fontWeight: 'bold'}}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  const renderMessageItem = ({item}) => {
    const isMe = item.user_id === user?.user_id;
    const initials = `${item.fname?.[0] || 'U'}${item.lname?.[0] || ''}`.toUpperCase();

    // Parse reply content if message starts with reply JSON
    let parsedMsg = null;
    let displayText = item.message;
    if (item.message && item.message.startsWith('{"replyId"')) {
      try {
        parsedMsg = JSON.parse(item.message);
        displayText = parsedMsg.text;
      } catch (e) {}
    }

    const isPDF = item.image && item.image.startsWith('data:application/pdf');

    // Parse viewed_by array count
    let viewsCount = 0;
    try {
      if (item.viewedBy) {
        const list = typeof item.viewedBy === 'string' ? JSON.parse(item.viewedBy) : item.viewedBy;
        if (Array.isArray(list)) {
          viewsCount = list.length;
        }
      }
    } catch (e) {}

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onLongPress={() => setReplyToMessage(item)}
        style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMe && (
          isValidAvatarUri(item.avatar) ? (
            <Image source={{uri: item.avatar}} style={styles.chatAvatar} />
          ) : (
            <Avatar.Text size={32} label={initials} style={styles.chatAvatarText} labelStyle={{fontSize: 12}} />
          )
        )}
        <View style={styles.messageBubbleContainer}>
          <Text size="small" style={[styles.senderName, isMe ? styles.mySenderName : styles.otherSenderName, {color: colors.primary}]}>
            {isMe ? 'You' : `${item.fname || ''} ${item.lname || ''}`.trim() || 'User'}
          </Text>
          <View style={[
            styles.messageBubble,
            isMe ? [styles.myBubble, {backgroundColor: colors.primary}] : [styles.otherBubble, {backgroundColor: colors.elevation.level2}]
          ]}>
            {/* Render Reply Quoted preview box inside bubble */}
            {parsedMsg && (
              <View style={[
                styles.quotedBubble, 
                {
                  borderLeftColor: isMe ? '#ffffff' : colors.primary, 
                  backgroundColor: isMe ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)'
                }
              ]}>
                <Text style={{fontWeight: 'bold', fontSize: 11, color: isMe ? '#ffffff' : colors.primary}} numberOfLines={1}>
                  {parsedMsg.replyName}
                </Text>
                <Text style={{fontSize: 12, color: isMe ? '#e0e0e0' : colors.onSurfaceVariant}} numberOfLines={1}>
                  {parsedMsg.replyText}
                </Text>
              </View>
            )}

            {/* Attached content (PDF or Image) */}
            {item.image && (
              isPDF ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.pdfCard,
                    {backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : colors.elevation.level3}
                  ]}
                  onPress={() => navigation.navigate('Pdf', { url: item.image })}>
                  <IconButton icon="file-pdf-box" iconColor="#d32f2f" size={32} style={{margin: 0}} />
                  <View style={{flex: 1, paddingRight: 8}}>
                    <Text style={{color: isMe ? '#ffffff' : colors.onSurface, fontWeight: 'bold', fontSize: 13}} numberOfLines={1}>
                      {displayText.replace('[PDF] ', '') || 'PDF Document'}
                    </Text>
                    <Text style={{color: isMe ? '#e0e0e0' : colors.onSurfaceVariant, fontSize: 11}}>
                      Tap to view document
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerImage(item.image)}>
                  <Image source={{uri: item.image}} style={styles.attachedImage} />
                </TouchableOpacity>
              )
            )}

            {/* Text message */}
            {displayText && (!isPDF) ? (
              <Text style={[styles.messageText, {color: isMe ? '#ffffff' : colors.onSurface}]}>
                {displayText}
              </Text>
            ) : null}

            {/* Read receipt eyes footer */}
            <View style={styles.bubbleFooter}>
              {viewsCount > 0 && (
                <View style={styles.viewsContainer}>
                  <Micon name="eye-outline" size={11} color={isMe ? '#e0e0e0' : colors.onSurfaceVariant} style={{marginRight: 3}} />
                  <Text style={[styles.viewsText, {color: isMe ? '#e0e0e0' : colors.onSurfaceVariant}]}>
                    {viewsCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {isMe && (
          isValidAvatarUri(item.avatar) ? (
            <Image source={{uri: item.avatar}} style={styles.chatAvatarRight} />
          ) : (
            <Avatar.Text size={32} label={initials} style={styles.chatAvatarRightText} labelStyle={{fontSize: 12}} />
          )
        )}
      </TouchableOpacity>
    );
  };

  if (!selectedClass) {
    return <Screen>{renderClassSelector()}</Screen>;
  }

  return (
    <Screen NoHeader>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Class Header & Subject selector */}
        <View style={[styles.headerContainer, {backgroundColor: colors.elevation.level1, borderBottomColor: colors.outlineVariant}]}>
          <View style={styles.headerInfo}>
            <Text size="medium" style={{fontWeight: 'bold', color: colors.onSurface}}>{selectedClass} Discussion Board</Text>
            <TouchableOpacity onPress={() => setSelectedClass(null)}>
              <Text size="small" style={{color: colors.primary, fontWeight: 'bold'}}>Change Class</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={subjects}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.subjectRibbon}
            renderItem={({item}) => {
              const active = selectedSubject === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.subjectPill,
                    active ? {backgroundColor: colors.primary} : {backgroundColor: colors.elevation.level3}
                  ]}
                  onPress={() => {
                    setSelectedSubject(item);
                    setMessages([]);
                  }}>
                  <Text size="small" style={{color: active ? '#ffffff' : colors.onSurface, fontWeight: 'bold'}}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Strict Warning Banner */}
        <View style={[styles.warningBanner, {backgroundColor: '#ffebee', borderColor: '#ffcdd2'}]}>
          <Text style={{color: '#c62828', fontSize: 10, fontWeight: 'bold', textAlign: 'center', paddingVertical: 5, paddingHorizontal: 12}}>
            ⚠️ Strict Warning: Posting inappropriate, offensive, or spam content is strictly prohibited. Violators will be banned immediately.
          </Text>
        </View>

        {/* Message board */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
          onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
        />

        {/* Reply Quoted Preview Bar above input bar */}
        {replyToMessage && (
          <View style={[styles.replyPreviewBar, {backgroundColor: colors.elevation.level2, borderLeftColor: colors.primary}]}>
            <View style={{flex: 1}}>
              <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 12}}>
                Replying to {replyToMessage.user_id === user?.user_id ? 'You' : `${replyToMessage.fname || ''} ${replyToMessage.lname || ''}`.trim()}
              </Text>
              <Text style={{color: colors.onSurfaceVariant, fontSize: 13}} numberOfLines={1}>
                {replyToMessage.message || (replyToMessage.image?.startsWith('data:application/pdf') ? '📄 PDF Document' : '📷 Image')}
              </Text>
            </View>
            <IconButton 
              icon="close-circle" 
              size={20} 
              iconColor={colors.outline} 
              onPress={() => setReplyToMessage(null)} 
              style={{margin: 0}} 
            />
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, {backgroundColor: colors.elevation.level1, borderTopColor: colors.outlineVariant}]}>
          <IconButton
            icon="image"
            mode="contained"
            containerColor={colors.elevation.level3}
            iconColor={colors.primary}
            size={24}
            onPress={pickImage}
            disabled={sending}
            style={{margin: 0}}
          />
          <IconButton
            icon="paperclip"
            mode="contained"
            containerColor={colors.elevation.level3}
            iconColor={colors.primary}
            size={24}
            onPress={pickDocument}
            disabled={sending}
            style={{margin: 0}}
          />
          <PaperTextInput
            mode="outlined"
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            style={styles.textInput}
            dense
            outlineStyle={{borderRadius: 24, borderColor: colors.outlineVariant}}
            theme={{colors: {primary: colors.primary}}}
            onSubmitEditing={handleSend}
          />
          <IconButton
            icon="send"
            mode="contained"
            containerColor={colors.primary}
            iconColor="#ffffff"
            size={24}
            onPress={handleSend}
            disabled={sending || (!inputText.trim())}
            style={{margin: 0}}
          />
        </View>

        {/* Image Fullscreen Lightbox Modal */}
        <Modal 
          visible={!!viewerImage} 
          transparent={true} 
          animationType="fade"
          onRequestClose={() => setViewerImage(null)}>
          <View style={styles.modalBackground}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setViewerImage(null)}>
              <IconButton icon="close" iconColor="#ffffff" size={30} style={{margin: 0}} />
            </TouchableOpacity>
            <Image source={{uri: viewerImage}} style={styles.fullscreenImage} resizeMode="contain" />
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Screen>
  );
};

// Helper SVG/Vector Icon placeholder for react-native-vector-icons
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
const IconText = ({icon, color, size}) => (
  <Micon name={icon} color={color} size={size} />
);

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  classSelectorHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 14,
    lineHeight: 20,
  },
  classGrid: {
    paddingHorizontal: 12,
    paddingBottom: 110,
  },
  classCard: {
    flex: 1,
    margin: 8,
    paddingVertical: 22,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  headerContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    elevation: 3,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectRibbon: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subjectPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 4,
  },
  warningBanner: {
    borderBottomWidth: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
  },
  otherMessageRow: {
    alignSelf: 'flex-start',
  },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  chatAvatarText: {
    marginRight: 8,
  },
  chatAvatarRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
  },
  chatAvatarRightText: {
    marginLeft: 8,
  },
  messageBubbleContainer: {
    flexDirection: 'column',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  mySenderName: {
    alignSelf: 'flex-end',
    marginRight: 6,
    marginBottom: 2,
  },
  otherSenderName: {
    alignSelf: 'flex-start',
    marginLeft: 6,
    marginBottom: 2,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  attachedImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginVertical: 4,
  },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 50,
  },
  replyPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  quotedBubble: {
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginVertical: 4,
    width: 210,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    fontSize: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
});

export default DiscussionForum;
