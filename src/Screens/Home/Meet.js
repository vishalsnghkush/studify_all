import WebView from 'react-native-webview';
import {StatusBar, View, Linking, Image, SafeAreaView} from 'react-native';
import {useTheme} from 'react-native-paper';
import {useEffect, useState} from 'react';
import {Button, Text} from '../../Components/Input';
import {requestCameraAndAudioPermission} from '../../Utils/CameraAudio';
import {useSelector} from 'react-redux';
const WebviewScreen = ({route, navigation}) => {
  const {room} = route?.params;
  const user = useSelector(state => state.initial.user);
  // console.log('app opne', room);
  const height = StatusBar.currentHeight || 0;
  const {colors} = useTheme();
  const [permission, setPermission] = useState(false);
  useEffect(() => {
    getPermission();
  }, []);

  const getPermission = async () => {
    const res = await requestCameraAndAudioPermission();
    // console.log('permission', res);
    if (res) setPermission(res);
  };

  return (
    <SafeAreaView style={{backgroundColor: colors.background, flex: 1}}>
      {permission ? (
        <WebView
          source={{
            uri: `https://meet.studifysuccess.com/meet?r=${room}&n=${user.fname}&l=true`,
          }}
          startInLoadingState={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowingReadAccessToURL={true}
          originWhitelist={['*']}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          allowsInlineMediaPlayback={true}
          allowsProtectedMedia={true}
          mediaCapturePermissionGrantType="grant-if-same-origin"
          style={{marginTop: height}}
        />
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 12,
          }}>
          <Image
            source={require('../../Assets/Images/error.png')}
            style={{
              width: 300,
              height: 250,
              objectFit: 'contain',
            }}
          />
          <Text style={{marginBottom: 30, fontSize: 20, textAlign: 'center'}}>
            Please approve microphone and camera permissions to proceed.
          </Text>
          <View style={{gap: 10, flexDirection: 'row'}}>
            <Button
              name="Grant"
              onPress={() => Linking.openSettings()}
              style={{flex: 1}}
            />
            <Button
              mode="outlined"
              name="Cancel"
              onPress={() => navigation.goBack()}
              style={{flex: 1}}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default WebviewScreen;
