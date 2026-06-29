import {Screen, CardHorizontal} from '../../../Components/Screen';
import {View} from 'react-native';
import {Linking} from 'react-native';
const ContactUs = ({navigation}) => {
  return (
    <Screen>
      <View style={{marginTop: 15}}>
        <CardHorizontal
          title="Support Portal"
          leftIcon="help-circle"
          onPress={() => {
            navigation.navigate('WebView', {
              url: 'https://support.studifysuccess.com/',
              title: 'Support Portal',
            });
          }}
        />
        <CardHorizontal
          title="Email"
          leftIcon="email"
          onPress={() => {
            Linking.openURL(`mailto:info@studifysuccess.com`);
          }}
        />

        <CardHorizontal
          title="Website"
          leftIcon="web"
          onPress={() => {
            Linking.openURL('https://www.studifysuccess.com');
          }}
        />
        <CardHorizontal
          title="WhatsApp"
          leftIcon="whatsapp"
          onPress={() => {
            Linking.openURL('whatsapp://send?text=Hi!' + '&phone=917428949640');
          }}
        />
        <CardHorizontal
          title="Facebook"
          leftIcon="facebook"
          onPress={() => {
            Linking.openURL('https://www.facebook.com/studifysuccess.ss');
          }}
        />
        <CardHorizontal
          title="Twitter"
          leftIcon="twitter"
          onPress={() => {
            Linking.openURL('https://twitter.com/studifysuccess');
          }}
        />
        <CardHorizontal
          title="Instagram"
          leftIcon="instagram"
          onPress={() => {
            Linking.openURL('https://www.instagram.com/studifysuccess');
          }}
        />
        <CardHorizontal
          title="Youtube"
          leftIcon="youtube"
          onPress={() => {
            Linking.openURL(
              'vnd.youtube://channel/UC4Ko9fNzq9iA1O3qhxHrWIw',
            ).catch(err => console.error('youtube', err));
          }}
        />
      </View>
    </Screen>
  );
};

export default ContactUs;
