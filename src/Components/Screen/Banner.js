import {Image, StyleSheet, Linking} from 'react-native';
import {TouchableRipple, ActivityIndicator} from 'react-native-paper';
import {useQuery} from '@tanstack/react-query';
import useApi from '../Api/Api';
import {useNavigation} from '@react-navigation/native';
const Banner = () => {
  const navigation = useNavigation();
  const {data, isLoading} = useQuery({
    queryKey: [`course-image`],
    queryFn: () => useApi().get(`/course/banner`),
  });
  return (
    <>
      <TouchableRipple
        style={styles.banner}
        onPress={() => {
          data ? Linking.openURL(data?.data[0]?.url) : null;
        }}>
        {isLoading ? (
          <ActivityIndicator size={40} style={{marginTop: 30}} />
        ) : (
          <Image
            source={{
              uri: data?.data[0]?.image,
            }}
            style={styles.img}
          />
        )}
      </TouchableRipple>
      {data?.data[1] && (
        <TouchableRipple
          style={{height: 400, width: '100%', marginTop: 5}}
          onPress={() => {
            navigation.navigate('Internship');
          }}>
          <Image
            source={{
              uri: data?.data[1]?.image,
            }}
            style={{
              height: '100%',
              width: '100%',
              resizeMode: 'cover',
              borderRadius: 15,
            }}
          />
        </TouchableRipple>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    height: 200,
    width: '100%',
    marginVertical: 15,
  },
  img: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
    borderRadius: 15,
  },
});
export default Banner;
