import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
} from 'react-native';
import {color} from 'react-native-reanimated';

const ComponentRenderer = ({component}) => {
  const {type, props, children} = component;

  // Map JSON types to React Native components
  const componentsMap = {
    View: View,
    Text: Text,
    Pressable: Pressable,
    Image: Image,
  };

  const Component = componentsMap[type];

  if (!Component) {
    return null; // Handle unknown component types
  }

  // Render children recursively
  const renderedChildren = children
    ? children.map((child, index) => (
        <ComponentRenderer key={index} component={child} />
      ))
    : null;

  // Handle events (e.g., onPress)
  const enhancedProps = {...props};
  if (props?.onPress) {
    enhancedProps.onPress = () => {
      console.log('props.onPress()');
    };
  }

  // Special handling for Text component
  if (type === 'Text') {
    return <Component style={props?.style}>{props?.text}</Component>;
  }

  // Apply style prop to View and other components
  return (
    <Component style={props?.style} {...enhancedProps}>
      {renderedChildren}
    </Component>
  );
};

const jsonUI = {
  type: 'View',
  props: {
    style: {flex: 1, justifyContent: 'center', margin: 10}, // Add style here
  },
  children: [
    {
      type: 'Image',
      props: {
        source: {uri: 'https://reactjs.org/logo-og.png'},
        style: {width: 200, height: 200, alignSelf: 'center'},
      },
    },
    {
      type: 'View',
      props: {
        style: {
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
          padding: 15,
          color: 'black',
          borderRadius: 10,
        },
      },
      children: [
        {
          type: 'Text',
          props: {
            text: 'Hello 1',
          },
        },
        {
          type: 'Text',
          props: {
            text: 'Hello 2',
          },
        },
      ],
    },
    {
      type: 'Pressable',
      props: {
        style: ({pressed}) => [
          {
            backgroundColor: pressed ? '#ccc' : '#007bff',
            padding: 15,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
          },
        ],
        onPress: 'con',
      },
      children: [
        {
          type: 'Text',
          props: {
            style: {color: 'white', fontSize: 16},
            text: 'Click US',
          },
        },
      ],
    },
  ],
};

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ComponentRenderer component={jsonUI} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
