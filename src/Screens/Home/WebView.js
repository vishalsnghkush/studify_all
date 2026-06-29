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
  const isStudifySite = url.includes('studifysuccess.com');

  const injectedBeforeLoadScript = `
    (function() {
      var css = '';
      
      // Hide website navigation headers, bars, social links, and footers immediately
      if (${isStudifySite}) {
        css += ' \\
          .top-bar, .header, header, nav, .navbar, .h_logox, footer, [class*="footer"], #preloader, .preloader, .loader, #loader, [id*="tawk"], iframe { \\
            display: none !important; \\
            visibility: hidden !important; \\
            height: 0 !important; \\
            opacity: 0 !important; \\
            z-index: -99999 !important; \\
          } \\
          body, html, .main-wrapper { \\
            padding-top: 0 !important; \\
            margin-top: 0 !important; \\
            background-color: ${isDark ? '#121212' : '#ffffff'} !important; \\
          } \\
        ';
      }
      
      // Apply dark mode overrides immediately if dark mode is active
      if (${isDark}) {
        css += ' \\
          html, body, #root, #__next { background-color: #121212 !important; color: #ffffff !important; } \\
          [class*="loading"] .card, [class*="loading"] [class*="card"], [id*="loading"] .card, [id*="loading"] [class*="card"] { background-color: #1e1e1e !important; color: #ffffff !important; border-color: #333333 !important; } \\
          [class*="loading"] h1, [class*="loading"] h2, [class*="loading"] h3, [class*="loading"] h4, [class*="loading"] p, [class*="loading"] span { color: #e0e0e0 !important; } \\
        ';
      }
      
      var style = document.createElement('style');
      style.id = 'studify-webview-clean-override';
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      document.documentElement.appendChild(style);

      // Force dark mode classes if enabled
      if (${isDark}) {
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
        var observer = new MutationObserver(function() { forceDark(); });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
      }
    })();
    true;
  `;

  const postLoadScript = `
    (function() {
      function hideHeaderFooter() {
        var selectors = '.top-bar, .header, header, nav, .navbar, .h_logox, footer, [class*="footer"], #preloader, .preloader, .loader, #loader, [id*="tawk"], iframe, [class*="widget"], [class*="floating"]';
        var elements = document.querySelectorAll(selectors);
        for (var i = 0; i < elements.length; i++) {
          elements[i].style.setProperty('display', 'none', 'important');
          elements[i].style.setProperty('visibility', 'hidden', 'important');
          elements[i].style.setProperty('height', '0', 'important');
          elements[i].style.setProperty('opacity', '0', 'important');
        }
        
        var wrappers = document.querySelectorAll('body, html, .main-wrapper');
        for (var j = 0; j < wrappers.length; j++) {
          wrappers[j].style.setProperty('padding-top', '0', 'important');
          wrappers[j].style.setProperty('margin-top', '0', 'important');
        }
      }
      
      hideHeaderFooter();
      var interval = setInterval(hideHeaderFooter, 200);
      
      setTimeout(function() {
        clearInterval(interval);
      }, 6000);

      document.addEventListener('click', hideHeaderFooter);
      document.addEventListener('scroll', hideHeaderFooter);
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
        injectedJavaScriptBeforeContentLoaded={injectedBeforeLoadScript}
        injectedJavaScript={isStudifySite ? postLoadScript : undefined}
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
