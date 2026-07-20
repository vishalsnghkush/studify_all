import {View, StyleSheet} from 'react-native';
import {Icon, useTheme} from 'react-native-paper';
import {Text} from '../Input';
import BouncyButton from './BouncyButton';

export default function CardHorizontal({title, leftIcon, onPress, rightIcon}) {
  const {colors, dark} = useTheme();

  return (
    <BouncyButton
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: dark ? colors.elevation.level2 : '#FFFFFF',
          borderColor: dark ? colors.outlineVariant : '#ECEFF1',
        },
      ]}>
      <View style={styles.wrapper}>
        <View style={styles.left}>
          <Icon source={leftIcon} size={24} color={colors.primary} />
          <Text style={[styles.text, {color: colors.onSurface}]}>{title}</Text>
        </View>
        {rightIcon ? (
          rightIcon
        ) : (
          <Icon
            source="chevron-right"
            size={24}
            color={colors.onSurfaceVariant}
          />
        )}
      </View>
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  wrapper: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 14,
    fontSize: 16,
    fontWeight: '600',
  },
});
