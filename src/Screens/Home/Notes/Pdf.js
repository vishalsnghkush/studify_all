import React, {useEffect} from 'react';
import Pdf from 'react-native-pdf';
import {useDispatch} from 'react-redux';
import {triggerActivity} from '../../../Redux/Slices/GamificationSlice';

import AsyncStorage from '@react-native-async-storage/async-storage';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text, View, TouchableOpacity} from 'react-native';
import {normalizeSubject, normalizeClass} from '../../../Utils/CurriculumConfig';

import { logStudySession } from '../../../Utils/EngagementTracker';

const PDF = ({navigation, route}) => {
  const {url, title, subject} = route.params;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(triggerActivity('pdf_read'));
    const startTime = Date.now();

    return () => {
      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);

      if (durationSeconds >= 2) {
        // Log to universal study session history
        logStudySession(subject || 'General', title || 'Study Note', 'PDF Note', durationSeconds);

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
    <View style={{flex: 1}}>
      <Pdf
        source={{
          uri: url,
          cache: true,
        }}
        trustAllCerts={false}
        style={{flex: 1}}
        onError={(error) => {
          console.warn('PDF load error', error);
        }}
      />

      {/* Always-visible back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: 'absolute',
          top: 40,
          left: 16,
          backgroundColor: 'rgba(0,0,0,0.55)',
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 6,
          zIndex: 999,
        }}>
        <Icon name="arrow-left" size={22} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('AiLecturePlayer', { 
          subject: normalizeSubject(subject, title), 
          studentClass: normalizeClass(route?.params?.studentClass || route?.params?.class, title),
          topic: title 
        })}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            backgroundColor: '#673ab7',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 30,
            flexDirection: 'row',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}>
          <Icon name="video-auto" size={20} color="white" />
          <Text style={{color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 14}}>
            Watch AI Lecture
          </Text>
        </TouchableOpacity>
    </View>
  );
};

export default PDF;
