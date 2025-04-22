import WebView from 'react-native-webview';
import {StatusBar, View, ActivityIndicator} from 'react-native';
import {useTheme} from 'react-native-paper';
import {Text} from '../../Components/Input';
const WebviewScreen = ({route}) => {
  let url = route?.params?.url || '';
  const height = StatusBar.currentHeight || 0;
  const {colors} = useTheme();
  return (
    <View style={{backgroundColor: colors.background, flex: 1}}>
      <WebView
        source={{uri: url}}
        startInLoadingState={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowingReadAccessToURL={true}
        mixedContentMode={'always'}
        onFileDownload={({nativeEvent: {downloadUrl}}) =>
          downloadDocument(downloadUrl)
        }
        renderLoading={() => (
          <ActivityIndicator
            size={35}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
            }}
          />
        )}
        style={{marginTop: height}}
      />
    </View>
  );
};

export default WebviewScreen;
