import React, {useRef, memo} from 'react';
import {View, Animated, PanResponder, StyleSheet} from 'react-native';
import {Modal, useTheme} from 'react-native-paper';
import {useSelector, useDispatch} from 'react-redux';
import {closeModal} from '../../Redux/Slices/ModalSlice';
import {Text, Button} from '../Input';

const BottomSheet = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const {isOpen, title, content, button} = useSelector(state => state.modal);
  const translateY = useRef(new Animated.Value(600)).current;

  const onClose = () => {
    dispatch(closeModal());
  };

  const btnPress = () => {
    button?.onPress();
    onClose();
  };
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward dragging
        const dy = Math.max(gestureState.dy, 0);
        translateY.setValue(dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          // Close the bottom sheet when dragged down
          onClose();
        } else {
          // Bring back the bottom sheet to the initial position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  Animated.timing(translateY, {
    toValue: isOpen ? 0 : 600,
    duration: 300,
    useNativeDriver: false,
  }).start();

  return (
    <Modal
      visible={isOpen}
      onDismiss={onClose}
      contentContainerStyle={styles.bottomSheet}
      style={styles.modal}>
      <Animated.View
        style={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          padding: 15,

          transform: [{translateY}],
        }}
        {...panResponder.panHandlers}>
        <View
          style={{
            height: 5,
            borderRadius: 10,
            backgroundColor: theme.colors.onSurfaceVariant,
            width: 60,
            alignSelf: 'center',
          }}
        />
        <View style={styles.innerModal}>
          <Text size="medium" style={{marginBottom: 10, fontWeight: 'bold'}}>
            {title}
          </Text>
          <Text> {content}</Text>
        </View>
        <View style={{flexDirection: 'row', gap: 12}}>
          <Button name="Close" style={{flex: 1}} onPress={onClose} />
          <Button
            name={button?.title || 'Ok'}
            mode="outlined"
            style={{flex: 1}}
            onPress={btnPress}
          />
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modal: {
    margin: 0,
  },
  innerModal: {
    marginVertical: 30,
    marginTop: 20,
    alignItems: 'center',
  },
});

export default memo(BottomSheet);
