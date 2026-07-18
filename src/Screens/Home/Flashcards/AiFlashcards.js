import React, {useState, useRef, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from 'react-native-paper';
import {Screen} from '../../../Components/Screen';
import {Text} from '../../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import GlassButton from '../../../Components/Input/GlassButton';

const {width} = Dimensions.get('window');
const OPENROUTER_API_KEY = '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';

export default function AiFlashcards({route}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const {subject, topic} = route.params || {};
  const user = useSelector(state => state.initial.user);
  const profileClass = user?.class || 'Class 10';

  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({headerShown: false});
    generateFlashcards();
  }, []);

  const generateFlashcards = async () => {
    setLoading(true);
    try {
      const prompt = `Generate exactly 5 interactive flashcards for the topic "${topic || 'General Revision'}" in the subject "${subject || 'General'}".
      These flashcards MUST be strictly designed for the academic level of: "${profileClass}". Ensure the difficulty and complexity of the questions match a student in "${profileClass}" (not higher or lower grade content).
      Return ONLY a strict JSON array of objects. Each object must have exactly two keys: "question" and "answer". Do not include markdown formatting like \`\`\`json.`;

      const models = [
        'openrouter/free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-2.0-flash-lite-001',
        'qwen/qwen-2.5-coder-32b-instruct:free',
      ];

      let data = null;
      for (const modelName of models) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              messages: [{role: 'user', content: prompt}],
            }),
          });
          if (response.ok) {
            const json = await response.json();
            if (json?.choices?.[0]?.message?.content) {
              data = json;
              break;
            }
          }
        } catch (err) {
          console.log(`Flashcard fetch failed with model ${modelName}`, err);
        }
      }

      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('All flashcard generation models failed.');
      }

      let content = data.choices[0].message.content.trim();
      
      // Robust regex to extract JSON array
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        content = arrayMatch[0];
      } else {
        // Fallback cleanup if somehow it didn't match an array format perfectly
        content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      }

      const parsedCards = JSON.parse(content);
      setFlashcards(parsedCards);
    } catch (e) {
      console.log('Error generating flashcards', e);
    } finally {
      setLoading(false);
    }
  };

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      // Reset flip instantly without animation
      flipAnimation.setValue(0);
      setIsFlipped(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      flipAnimation.setValue(0);
      setIsFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{rotateY: frontInterpolate}],
  };
  const backAnimatedStyle = {
    transform: [{rotateY: backInterpolate}],
  };

  return (
    <Screen NoHeader style={{backgroundColor: theme.colors.background}}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.colors.onBackground}]}>
          AI Flashcards
        </Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{marginTop: 16, color: theme.colors.onSurfaceVariant}}>
              Generating custom flashcards...
            </Text>
          </View>
        ) : flashcards.length > 0 ? (
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{marginBottom: 20, color: theme.colors.primary, fontWeight: 'bold'}}>
              {currentIndex + 1} of {flashcards.length}
            </Text>
            
            <TouchableOpacity activeOpacity={1} onPress={flipCard}>
              <View>
                {/* Front of Card */}
                <Animated.View
                  style={[
                    styles.card,
                    {backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#ffffff'},
                    frontAnimatedStyle,
                  ]}>
                  <Text style={[styles.cardLabel, {color: theme.colors.primary}]}>Q</Text>
                  <Text style={[styles.cardText, {color: theme.colors.onSurface}]}>
                    {flashcards[currentIndex].question}
                  </Text>
                  <Text style={[styles.hint, {color: theme.colors.onSurfaceVariant}]}>Tap to flip</Text>
                </Animated.View>

                {/* Back of Card */}
                <Animated.View
                  style={[
                    styles.card,
                    styles.cardBack,
                    {backgroundColor: theme.dark ? '#3a1f4a' : '#f3e5f5'},
                    backAnimatedStyle,
                  ]}>
                  <Text style={[styles.cardLabel, {color: '#9c27b0'}]}>A</Text>
                  <Text style={[styles.cardText, {color: theme.dark ? '#ffffff' : '#4a148c'}]}>
                    {flashcards[currentIndex].answer}
                  </Text>
                </Animated.View>
              </View>
            </TouchableOpacity>

            <View style={styles.navRow}>
              <GlassButton
                label="Previous"
                icon="chevron-left"
                onPress={prevCard}
                disabled={currentIndex === 0}
                style={{flex: 1, marginRight: 10}}
              />
              <GlassButton
                label="Next"
                icon="chevron-right"
                onPress={nextCard}
                disabled={currentIndex === flashcards.length - 1}
                style={{flex: 1, marginLeft: 10}}
              />
            </View>
          </View>
        ) : (
          <View style={styles.centerBox}>
            <Icon name="cards-playing-outline" size={60} color={theme.colors.onSurfaceVariant} />
            <Text style={{marginTop: 16, marginBottom: 20, color: theme.colors.onSurfaceVariant}}>
              No flashcards available right now.
            </Text>
            <GlassButton
              label="Generate Flashcards"
              onPress={generateFlashcards}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width - 40,
    height: 400,
    borderRadius: 24,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
  },
  cardLabel: {
    position: 'absolute',
    top: 20,
    left: 20,
    fontSize: 24,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  cardText: {
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '500',
  },
  hint: {
    position: 'absolute',
    bottom: 20,
    fontSize: 14,
    opacity: 0.7,
  },
  navRow: {
    flexDirection: 'row',
    marginTop: 40,
    width: '100%',
  },
});
