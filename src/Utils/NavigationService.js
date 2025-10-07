import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function getCurrentScreen() {
  if (navigationRef.isReady()) {
    const route = navigationRef.getCurrentRoute();
    return {
      name: route.name,
      params: route.params,
    };
  }
  return null;
}

export function getCurrentScreenName() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute().name;
  }
  return null;
}

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
