import React, {useEffect} from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useTheme} from 'react-native-paper';
import {WebView} from 'react-native-webview';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text} from '../../../Components/Input';

const LecturePlayer = ({route, navigation}) => {
  const lecture = route?.params?.lecture || {};
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;

  useEffect(() => {
    StatusBar.setHidden(isLandscape, 'fade');
    return () => {
      StatusBar.setHidden(false, 'fade');
    };
  }, [isLandscape]);

  // Custom HTML that embeds only the video in a clean full-screen iframe
  // The outer page clips the iframe to hide Google Drive's top toolbar
  const videoHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
        }
        .video-wrapper {
          position: absolute;
          top: -80px;
          left: 0;
          width: 100%;
          height: calc(100% + 80px);
          overflow: hidden;
        }
        iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      </style>
    </head>
    <body>
      <div class="video-wrapper">
        <iframe
          src="https://drive.google.com/file/d/${lecture.id}/preview"
          allow="autoplay; encrypted-media; fullscreen"
          allowfullscreen="true"
          frameborder="0">
        </iframe>
      </div>
    </body>
    </html>
  `;

  if (isLandscape) {
    return (
      <View style={styles.fullscreenContainer}>
        <WebView
          source={{html: videoHTML}}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          style={styles.webView}
        />

        {/* Floating Back Button in Landscape mode to go back directly */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.floatingBackButton}>
          <Micon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullscreenContainer}>
      {/* Video Player — 2/3 of screen */}
      <View style={styles.videoPortrait}>
        <WebView
          source={{html: videoHTML}}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          style={styles.webView}
        />

        {/* Floating Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.floatingBackButton}>
          <Micon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Details — 1/3 of screen */}
      <View
        style={[styles.detailsContainer, {backgroundColor: colors.surface}]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Badge & Chapter */}
          <View style={styles.metaRow}>
            <View style={[styles.badge, styles.badgeBg]}>
              <Text
                style={[
                  styles.badgeText,
                  {color: colors.primary || '#007171'},
                ]}>
                {lecture.subject || 'Subject'}
              </Text>
            </View>
            <Text style={[styles.metaText, {color: colors.outline}]}>
              Ch: {lecture.chapter_no || ''}
            </Text>
          </View>

          {/* Lecture Title */}
          <Text style={[styles.lectureTitle, {color: colors.onSurface}]}>
            {lecture.name || 'Lecture'}
          </Text>

          {/* Rotate hint */}
          <View
            style={[
              styles.infoCard,
              {backgroundColor: colors.surfaceVariant || 'rgba(0,0,0,0.03)'},
            ]}>
            <Micon
              name="phone-rotate-landscape"
              size={22}
              color={colors.primary || '#007171'}
            />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, {color: colors.onSurface}]}>
                Fullscreen Option
              </Text>
              <Text style={[styles.infoDescription, {color: colors.outline}]}>
                Tap the fullscreen button on the player, or rotate your device
                to watch in fullscreen.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoPortrait: {
    flex: 2,
    position: 'relative',
    backgroundColor: '#000',
  },
  detailsContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  scrollContent: {
    flexGrow: 1,
  },
  floatingBackButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  badgeBg: {
    backgroundColor: 'rgba(0,113,113,0.1)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  lectureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 'auto',
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoDescription: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default LecturePlayer;
