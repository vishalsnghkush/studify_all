import React, {useEffect} from 'react';
import Pdf from 'react-native-pdf';
import {useDispatch} from 'react-redux';
import {triggerActivity} from '../../../Redux/Slices/GamificationSlice';

import AsyncStorage from '@react-native-async-storage/async-storage';

const PDF = ({route}) => {
  const {url, title, subject} = route.params;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(triggerActivity('pdf_read'));
    const startTime = Date.now();

    return () => {
      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);

      if (durationSeconds >= 2) {
        const logPdfRead = async () => {
          try {
            const data = await AsyncStorage.getItem('@studify_notes_read_history');
            let history = [];
            if (data) {
              try {
                history = JSON.parse(data);
              } catch (_) {}
            }
            history.push({
              title: title || 'Study Note',
              subject: subject || 'General',
              timestamp: Date.now(),
              duration: durationSeconds,
            });
            await AsyncStorage.setItem('@studify_notes_read_history', JSON.stringify(history));
          } catch (e) {
            console.warn('Failed to log PDF read duration', e);
          }
        };
        logPdfRead();
      }
    };
  }, [dispatch, url, title, subject]);

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
