import RazorpayCheckout from 'react-native-razorpay';
import FlashMessage from '../Components/Screen/FlashMessage';
import useApi from '../Components/Api/Api';

export default function RazorPay(amount, course_id, navigation) {
  var options = {
    name: 'studifysuccess',
    description: 'Edtech platform!',
    image: 'https://www.studifysuccess.com/images//apple-touch-icon.webp',
    currency: 'INR',
    //test
    key: 'rzp_test_TNciL5Zn3FHf5v',
    //live
    // key:"rzp_live_bnmEvhWAmtCTkZ",
    amount: amount * 100,
    prefill: {
      email: '',
      contact: '',
    },
    theme: {color: '#008b8b'},
  };
  RazorpayCheckout.open(options)
    .then(e => {
      useApi().post(
        '/payment',
        (data = {
          course_id,
          amount,
          payment_id: e.razorpay_payment_id,
        }),
      );
    })
    .then(() => navigation.navigate('MyCourse'))
    .catch(error => {
      FlashMessage({
        message: error?.error?.reason
          ? 'Payment Cancelled'
          : 'Something went wrong',
        type: 'danger',
      });
    });
}
