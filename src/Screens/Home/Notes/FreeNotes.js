import {View, FlatList, Image} from 'react-native';
import {useState} from 'react';
import {Screen} from '../../../Components/Screen';
import Dropdown from '../../../Components/Input/Dropdown';
import useApi from '../../../Components/Api/Api';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator, TouchableRipple, useTheme} from 'react-native-paper';
import {Text} from '../../../Components/Input';
import {set} from 'react-native-reanimated';

const classList = [
  {label: 'Class 6th', value: 6},
  {label: 'Class 7th', value: 7},
  {label: 'Class 8th', value: 8},
  {label: 'Class 9th', value: 9},
  {label: 'Class 10th', value: 10},
  {label: 'Class 11th', value: 11},
  {label: 'Class 12th', value: 12},
];

const Notes = ({navigation}) => {
  const {colors} = useTheme();
  const [form, setForm] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({});
  const refetch = async vale => {
    setIsLoading(true);
    try {
      const res = await useApi().get(`/notes?cls=${vale}`);
      console.log(vale);
      setData(res);
    } catch (err) {
      console.log(err);
    }
    setIsLoading(false);
  };

  const updateFormValue = ({name, value}) => {
    setForm(value);
    refetch(value);
  };

  return (
    <Screen list>
      <View style={{flexDirection: 'row', gap: 10, marginBottom: 10}}>
        <View style={{flex: 1}}>
          <Dropdown
            label="Class"
            name="class"
            value={form}
            updateFormValue={updateFormValue}
            list={classList}
            style={{flex: 1}}
          />
        </View>
      </View>
      <View>
        {isLoading ? (
          <ActivityIndicator size={40} style={{marginTop: 30}} />
        ) : data?.data?.length == 0 ? (
          <Image
            source={require('../../../Assets/Images/nodata.png')}
            style={{
              width: 320,
              height: 320,
              alignSelf: 'center',
              marginTop: 100,
            }}
          />
        ) : (
          <FlatList
            data={data?.data}
            keyExtractor={item => item.id}
            renderItem={({item}) => {
              return (
                <TouchableRipple
                  onPress={() => {
                    navigation.navigate('Pdf', {url: item.pdf_url});
                  }}
                  style={{
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 10,
                    backgroundColor: colors.elevation.level2,
                  }}>
                  <View>
                    <Text
                      size="large"
                      numberOfLines={1}
                      style={{
                        alignSelf: 'center',
                        textTransform: 'capitalize',
                        marginVertical: 10,
                      }}>
                      {item.name}
                    </Text>
                    {/* <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginVertical: 10,
                      }}> */}
                    <Text size="medium" style={{textTransform: 'capitalize'}}>
                      Subject: {item.subject}
                    </Text>
                    <Text size="medium">Ch Name: {item.chapter_name}</Text>
                    <Text size="medium">Ch No: {item.chapter_no}</Text>
                    {/* </View> */}
                  </View>
                </TouchableRipple>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
};

export default Notes;
