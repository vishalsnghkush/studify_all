import {memo} from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Text from './Text';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
const InputButton = ({
  name,
  mode = false,
  onPress,
  loading = false,
  style,
  icon,
}) => {
  return (
    <TouchableOpacity
      style={[!mode ? styles.container : styles.outline, style]}
      contentStyle={{padding: 7}}
      labelStyle={{
        fontSize: 20,
      }}
      onPress={onPress}
      disabled={loading}>
      {icon && (
        <>
          <Icon name={icon} size={20} color="#007171" />
          <View style={{width: 5}} />
        </>
      )}
      {loading ? (
        <ActivityIndicator size={25} color="white" />
      ) : (
        <Text size="medium" style={{color: !mode ? 'white' : '#007171'}}>
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
    backgroundColor: '#007171',
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
    borderColor: '#007171',
    flexDirection: 'row',
    gap: 5,
    marginBottom: 10,
  },
});
export default memo(InputButton);
