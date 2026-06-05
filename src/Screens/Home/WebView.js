import React from 'react';
import WebView from 'react-native-webview';
import {StatusBar, View, ActivityIndicator} from 'react-native';
import {useTheme} from 'react-native-paper';

const downloadDocument = url => {
  console.log('Downloading document from URL:', url);
};

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
        originWhitelist={['*']}
        javaScriptEnabled={true}
        onFileDownload={({nativeEvent: {downloadUrl}}) =>
          downloadDocument(downloadUrl)
        }
        renderLoading={() => (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.background,
            }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        style={{marginTop: height, flex: 1}}
      />
    </View>
  );
};

export default WebviewScreen;
