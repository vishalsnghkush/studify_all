import {Screen} from '../../Components/Screen';
import HomeHeader from '../../Components/Screen/HomeHeader';
import Banner from '../../Components/Screen/Banner';
const Home = () => {
  return (
    <Screen NoHeader style={{marginBottom: 50}}>
      <HomeHeader />
      <Banner />
    </Screen>
  );
};

export default Home;
