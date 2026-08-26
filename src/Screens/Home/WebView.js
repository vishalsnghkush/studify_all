import React from 'react';
import WebView from 'react-native-webview';
import {StatusBar, View, ActivityIndicator, Alert} from 'react-native';
import {useTheme} from 'react-native-paper';
import {useSelector} from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
import useApi from '../../Components/Api/Api';

const downloadDocument = url => {
  console.log('Downloading document from URL:', url);
};

const WebviewScreen = ({route}) => {
  let url = route?.params?.url || '';
  const height = StatusBar.currentHeight || 0;
  const {colors} = useTheme();
  const isDark = useSelector(state => state.initial.isDark);
  const user = useSelector(state => state.initial.user);
  const { post } = useApi();

  const isStudifySite = url.includes('studifysuccess.com');
  const isGoogleDrive = url.includes('drive.google.com');

  const handleWebViewMessage = async (event) => {
    try {
      const rawData = event?.nativeEvent?.data;
      console.log('📱 WebView Message Received:', rawData);
      if (!rawData) return;

      const messageData = JSON.parse(rawData);

      if (messageData.type === 'WEBVIEW_DEBUG_ERROR') {
        console.warn('⚠️ WebView Debugger Alert:', messageData.error);
        Alert.alert('Debugger Diagnostic Log 🛠️', `WebView Error: ${messageData.error}`);
        return;
      }

      if (messageData.type === 'RESUME_PAYMENT') {
        const { package: pkgName, amount } = messageData;
        console.log(`💳 Launching Razorpay for ${pkgName} - ₹${amount}`);

        const RAZORPAY_KEY = 'rzp_test_TNciL5Zn3FHf5v';

        const options = {
          description: `${pkgName} Access`,
          image: 'https://www.studifysuccess.com/images/logo.png',
          currency: 'INR',
          key: RAZORPAY_KEY,
          amount: amount * 100, // in paise
          name: 'StudifySuccess',
          prefill: {
            email: user?.email || '',
            contact: user?.phone ? String(user.phone) : '',
            name: `${user?.fname || ''} ${user?.lname || ''}`.trim() || 'User',
          },
          theme: { color: '#3F51B5' },
        };

        try {
          const data = await RazorpayCheckout.open(options);
          console.log('✅ Payment Success:', data);
          
          await post('/payment/unlock-item', {
            item_key: `resume_${pkgName.toLowerCase().replace(/\s+/g, '_')}`,
            title: pkgName,
            amount: amount,
            payment_id: data.razorpay_payment_id,
          });

          Alert.alert(
            'Payment Successful! 🎉',
            `Successfully unlocked ${pkgName} (₹${amount})!`,
          );
        } catch (razorpayErr) {
          console.error('❌ RazorPay Checkout Error:', razorpayErr);
          const errDesc = razorpayErr?.description || razorpayErr?.message || JSON.stringify(razorpayErr);
          Alert.alert(
            'Payment Debugger Alert 🛠️',
            `RazorPay Status/Error: ${errDesc}`
          );
        }
      }
    } catch (err) {
      console.error('❌ WebView Message Parsing Error:', err);
      Alert.alert('Debugger Alert 🛠️', `Failed to parse message: ${err.message}`);
    }
  };

  const injectedBeforeLoadScript = `
    (function() {
      var css = '';
      
      // Hide website navigation headers, bars, social links, and footers immediately
      if (${isStudifySite}) {
        css += ' \\
          .top-bar, .header, header, nav, .navbar, .h_logox, footer, [class*="footer"], #preloader, .preloader, .loader, #loader, [id*="tawk"] { \\
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

      if (${isGoogleDrive}) {
        css += ' \\
          .ndfHFb-c43HA-b30Snd, \\
          .ndfHFb-c43HA-AznF2e, \\
          .ndfHFb-c43HA-tW352c, \\
          .ndfHFb-c43HA-z5C9Gb, \\
          div[class*="drive-viewer-chrome"], \\
          div[class*="ndfHFb-c43HA-ti6hGc"], \\
          div[class*="ndfHFb-c43HA-b30Snd"], \\
          .drive-viewer-toolbar, \\
          .drive-viewer-chrome { \\
            display: none !important; \\
            visibility: hidden !important; \\
            height: 0 !important; \\
            opacity: 0 !important; \\
            z-index: -99999 !important; \\
          } \\
          .ndfHFb-c43HA-O46rAc, \\
          div[class*="drive-viewer-content"] { \\
            top: 0 !important; \\
            height: 100% !important; \\
            width: 100% !important; \\
            padding-top: 0 !important; \\
            margin-top: 0 !important; \\
          } \\
          body, html { \\
            margin: 0 !important; \\
            padding: 0 !important; \\
            overflow: hidden !important; \\
            background: #000000 !important; \\
            margin-top: -56px !important; \\
            height: calc(100% + 56px) !important; \\
          } \\
          /* Crop the top header of the iframe/viewer out of view by shifting up by 56px */ \\
          iframe, .drive-viewer-iframe, [class*="drive-viewer"] { \\
            margin-top: -56px !important; \\
            height: calc(100% + 56px) !important; \\
            border: none !important; \\
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
        var selectors = '.top-bar, .header, header, nav, .navbar, .h_logox, footer, [class*="footer"], #preloader, .preloader, .loader, #loader, [id*="tawk"], .tawk-min-container, .tawk-button, [class*="chat"], [class*="widget"]';
        var elements = document.querySelectorAll(selectors);
        for (var i = 0; i < elements.length; i++) {
          elements[i].style.setProperty('display', 'none', 'important');
          elements[i].style.setProperty('visibility', 'hidden', 'important');
          elements[i].style.setProperty('height', '0', 'important');
          elements[i].style.setProperty('opacity', '0', 'important');
        }
        
        // Ensure form inputs wrapped in .form-floating are ALWAYS VISIBLE
        var formInputs = document.querySelectorAll('.form-floating, .form-group, .form-control, input, select, textarea');
        for (var f = 0; f < formInputs.length; f++) {
          formInputs[f].style.setProperty('display', 'block', 'important');
          formInputs[f].style.setProperty('visibility', 'visible', 'important');
          formInputs[f].style.setProperty('opacity', '1', 'important');
        }

        var wrappers = document.querySelectorAll('body, html, .main-wrapper');
        for (var j = 0; j < wrappers.length; j++) {
          wrappers[j].style.setProperty('padding-top', '0', 'important');
          wrappers[j].style.setProperty('margin-top', '0', 'important');
        }
      }

      function setupResumeButtonClickListeners() {
        try {
          var allElements = document.querySelectorAll('button, a, div, span, p');
          for (var i = 0; i < allElements.length; i++) {
            var el = allElements[i];
            var txt = (el.innerText || el.textContent || '').trim();

            if (txt === 'Basic Resume' && !el.dataset.paymentBound) {
              el.dataset.paymentBound = 'true';
              el.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'RESUME_PAYMENT',
                  package: 'Basic Resume',
                  amount: 299
                }));
              }, true);
            } else if (txt === 'Professional Resume' && !el.dataset.paymentBound) {
              el.dataset.paymentBound = 'true';
              el.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'RESUME_PAYMENT',
                  package: 'Professional Resume',
                  amount: 999
                }));
              }, true);
            }
          }
        } catch (err) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'WEBVIEW_DEBUG_ERROR',
            error: err ? (err.message || err.toString()) : 'Unknown JS Error'
          }));
        }
      }

      hideHeaderFooter();
      setupResumeButtonClickListeners();
      var interval = setInterval(function() {
        hideHeaderFooter();
        setupResumeButtonClickListeners();
      }, 300);
      
      setTimeout(function() {
        clearInterval(interval);
      }, 10000);

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
        onMessage={handleWebViewMessage}
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
