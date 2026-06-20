import {useState, memo, useEffect} from 'react';
import {TextInput} from 'react-native-paper';

function InputText({
  name,
  label,
  onPress,
  style,
  defaultValue,
  value: propValue,
  maxLength,
  updateFormValue,
  rightIcon = false,
  keyboard = 'default',
  error = false,
  disabled = false,
  multiline = 1,
  ...props
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [showPassword, setShowPassword] = useState(rightIcon);

  useEffect(() => {
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue]);

  const displayValue = propValue !== undefined ? propValue : internalValue;

  const updateInputValue = val => {
    setInternalValue(val);
    if (updateFormValue) {
        updateFormValue({name, value: val});
    }
};

  return (
    <TextInput
      mode="outlined"
      onPressIn={onPress}
      showSoftInputOnFocus={onPress ? false : true}
      maxLength={maxLength}
      keyboardType={keyboard}
      label={label}
      value={displayValue}
      error={error}
      secureTextEntry={showPassword}
      onChangeText={e => updateInputValue(e)}
      editable={!disabled}
      autoCapitalize="none"
      numberOfLines={multiline}
      multiline={multiline > 1 ? true : false}
      right={
        rightIcon &&
        (showPassword ? (
          <TextInput.Icon
            icon="eye"
            onPress={() => setShowPassword(!showPassword)}
          />
        ) : (
          <TextInput.Icon
            icon="eye-off"
            onPress={() => setShowPassword(!showPassword)}
          />
        ))
      }
      style={{marginBottom: 15, ...style}}
      {...props}
    />
  );
}

export default memo(InputText);
