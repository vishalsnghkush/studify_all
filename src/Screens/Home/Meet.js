import WebView from 'react-native-webview';
import {StatusBar, View, Linking, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
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
  const isDark = useSelector(state => state.initial.isDark);

  const injectedDarkTheme = `
    (function() {
      // Force page level styles for dark mode loading screen and background
      var css = 'html, body, #root, #__next, .loading-screen, [class*="loading"], [id*="loading"] { background-color: #121212 !important; color: #ffffff !important; }';
      css += ' [class*="loading"] .card, [class*="loading"] [class*="card"], [id*="loading"] .card, [id*="loading"] [class*="card"], .loading-screen .card, .loading-screen [class*="card"] { background-color: #1e1e1e !important; color: #ffffff !important; border-color: #333333 !important; }';
      css += ' [class*="loading"] h1, [class*="loading"] h2, [class*="loading"] h3, [class*="loading"] h4, [class*="loading"] h5, [class*="loading"] h6, [class*="loading"] p, [class*="loading"] span, [id*="loading"] h1, [id*="loading"] h2, [id*="loading"] h3, [id*="loading"] h4, [id*="loading"] h5, [id*="loading"] h6, [id*="loading"] p, [id*="loading"] span, .loading-screen h1, .loading-screen h2, .loading-screen h3, .loading-screen h4, .loading-screen h5, .loading-screen h6, .loading-screen p, .loading-screen span { color: #e0e0e0 !important; }';
      css += ' .loader, .spinner { border-top-color: #007171 !important; }';
      
      var style = document.createElement('style');
      style.id = 'studify-dark-mode-override';
      style.type = 'text/css';
      if (style.styleSheet){
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      document.documentElement.appendChild(style);

      function forceDark() {
        if (document.documentElement && !document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        }
        if (document.body && !document.body.classList.contains('dark')) {
          document.body.classList.add('dark');
          document.body.setAttribute('data-theme', 'dark');
        }
      }

      forceDark();

      // Create an observer to watch for class/theme changes and force them to remain dark
      var observer = new MutationObserver(function(mutations) {
        forceDark();
      });

      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
      
      var checkBody = setInterval(function() {
        if (document.body) {
          clearInterval(checkBody);
          forceDark();
          observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
        }
      }, 100);
    })();
    true;
  `;
  const [permission, setPermission] = useState(false);
  useEffect(() => {
    getPermission();
  }, []);

  const getPermission = async () => {
    const res = await requestCameraAndAudioPermission();
    // console.log('permission', res);
    if (res) {
      setPermission(res);
    }
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
          injectedJavaScriptBeforeContentLoaded={
            isDark ? injectedDarkTheme : undefined
          }
          forceDarkOn={isDark}
          algorithmicDarkeningAllowed={isDark}
          allowsInlineMediaPlayback={true}
          allowsProtectedMedia={true}
          mediaCapturePermissionGrantType="grant-if-same-origin"
          style={{marginTop: height, backgroundColor: colors.background}}
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
