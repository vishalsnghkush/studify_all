import {View, StatusBar, SafeAreaView, ScrollView} from 'react-native';
import {windowPaddingHorizontal} from '../../Utils/Dimentions';
import {useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

function Screen({
  children,
  style,
  NoHeader = false,
  list = false,
  padding = false,
  ...props
}) {
  const height = StatusBar.currentHeight || 0;
  const theme = useTheme();
  const {top, bottom} = useSafeAreaInsets();
  const safeTop = top > 0 ? top + 10 : (height > 0 ? height + 10 : 38);

  if (list) {
    return (
      <View
        style={{
          flexGrow: 1,
          backgroundColor: theme.colors.background,
          paddingBottom: bottom || 0,
        }}>
        <View
          style={{
            marginTop: NoHeader ? safeTop : 0,
            paddingHorizontal: padding ? 0 : windowPaddingHorizontal,
            backgroundColor: theme.colors.background,
            flexGrow: 1,
            width: '100%',
            ...style,
          }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: NoHeader ? safeTop : 0,
        paddingBottom: bottom || 0,
      }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: theme.colors.background,
          ...style,
        }}
        {...props}
        nestedScrollEnabled
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        <View
          style={{
            paddingHorizontal: padding ? 0 : windowPaddingHorizontal,
            flexGrow: 1,
            width: '100%',
            ...style,
          }}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Screen;
