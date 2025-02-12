import WebView from 'react-native-webview';
import {StatusBar, View} from 'react-native';
import {useTheme} from 'react-native-paper';
const WebviewScreen = ({route}) => {
  const {search} = route?.params;
  console.log('app opne', search);
  const height = StatusBar.currentHeight || 0;
  const {colors} = useTheme();
  return (
    <View style={{backgroundColor: colors.background, flex: 1}}>
      <WebView
        source={{uri: search}}
        startInLoadingState={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowingReadAccessToURL={true}
        style={{marginTop: height}}
      />
    </View>
  );
};

export default WebviewScreen;
