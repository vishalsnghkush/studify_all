import {memo} from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Text from './Text';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';

const InputButton = ({
  name,
  mode = false,
  onPress,
  loading = false,
  style,
  icon,
}) => {
  const {colors} = useTheme();
  return (
    <TouchableOpacity
      style={[
        !mode 
          ? [styles.container, {backgroundColor: colors.primary}] 
          : [styles.outline, {borderColor: colors.primary}], 
        style
      ]}
      contentStyle={{padding: 7}}
      labelStyle={{
        fontSize: 20,
      }}
      onPress={onPress}
      disabled={loading}>
      {icon && !loading && (
        <>
          <Icon name={icon} size={20} color={colors.primary} />
          <View style={{width: 5}} />
        </>
      )}
      {loading ? (
        <ActivityIndicator size={25} color={!mode ? 'white' : colors.primary} />
      ) : (
        <Text size="medium" style={{color: !mode ? 'white' : colors.primary}}>
          {name}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    width: '100%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    marginBottom: 10,
  },
  outline: {
    borderRadius: 10,
    width: '100%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    flexDirection: 'row',
    gap: 5,
    marginBottom: 10,
  },
});
export default memo(InputButton);
