import React, {useEffect} from 'react';
import Pdf from 'react-native-pdf';
import {useDispatch} from 'react-redux';
import {triggerActivity} from '../../../Redux/Slices/GamificationSlice';

const PDF = ({route}) => {
  const {url} = route.params;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(triggerActivity('pdf_read'));
  }, [dispatch]);

  return (
    <Pdf
      source={{
        uri: url,
        cache: true,
      }}
      trustAllCerts={false}
      style={{flex: 1}}
    />
  );
};

export default PDF;
