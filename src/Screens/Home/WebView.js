import React from 'react';
import WebView from 'react-native-webview';
import {StatusBar, View, ActivityIndicator} from 'react-native';
import {useTheme} from 'react-native-paper';
import {useSelector} from 'react-redux';

const downloadDocument = url => {
  console.log('Downloading document from URL:', url);
};

const WebviewScreen = ({route}) => {
  let url = route?.params?.url || '';
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
        injectedJavaScriptBeforeContentLoaded={
          isDark ? injectedDarkTheme : undefined
        }
        forceDarkOn={isDark}
        algorithmicDarkeningAllowed={isDark}
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
        style={{marginTop: height, flex: 1, backgroundColor: colors.background}}
      />
    </View>
  );
};

export default WebviewScreen;
