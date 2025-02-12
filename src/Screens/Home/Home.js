import {Screen} from '../../Components/Screen';
import HomeHeader from '../../Components/Screen/HomeHeader';
import Banner from '../../Components/Screen/Banner';
const Home = () => {
  console.log('Home renderded');
  return (
    <Screen NoHeader style={{marginBottom: 50}}>
      <HomeHeader />
      <Banner />
    </Screen>
  );
};

export default Home;
