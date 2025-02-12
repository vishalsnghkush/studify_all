import {Button} from 'react-native-paper';
import {memo} from 'react';
const InputButton = ({
  name,
  mode = 'contained',
  onPress,
  loading = false,
  style,
}) => {
  return (
    <Button
      mode={mode}
      style={{marginBottom: 10, ...style, borderRadius: 50}}
      contentStyle={{padding: 7}}
      labelStyle={{
        fontSize: 20,
      }}
      onPress={onPress}
      disabled={loading}
      loading={loading}>
      {!loading && name}
    </Button>
  );
};

export default memo(InputButton);
