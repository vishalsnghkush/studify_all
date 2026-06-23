import axios from 'axios';

const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/studifysuccess-c7ad5/databases/(default)/documents/gamification';

// Sanitize email to make it a safe Firestore Document ID (removing characters if needed, though standard Firestore IDs support dots and @)
const getDocIdFromEmail = email => {
  if (!email) {
    return '';
  }
  return encodeURIComponent(email.trim().toLowerCase());
};

/**
 * Sync local gamification data to Firebase Firestore REST API
 */
export const syncGamificationToFirebase = async (user, gamificationState) => {
  if (!user || !user.email || !gamificationState) {
    return;
  }

  const docId = getDocIdFromEmail(user.email);
  if (!docId) {
    return;
  }

  const url = `${FIRESTORE_BASE}/${docId}`;

  const payload = {
    fields: {
      email: {stringValue: user.email.trim().toLowerCase()},
      name: {
        stringValue: `${user.fname || ''} ${user.lname || ''}`.trim() || 'User',
      },
      avatar: {
        stringValue: `${user.fname?.[0] || 'U'}${
          user.lname?.[0] || ''
        }`.toUpperCase(),
      },
      xp: {integerValue: String(gamificationState.xp || 0)},
      level: {integerValue: String(gamificationState.level || 1)},
      streak: {integerValue: String(gamificationState.streak || 0)},
      updatedAt: {timestampValue: new Date().toISOString()},
    },
  };

  try {
    // PATCH request will upsert (create or update) the document in Firestore
    await axios.patch(url, payload);
    console.log('Gamification synced to Firebase Firestore successfully');
  } catch (error) {
    console.log(
      'Error syncing gamification to Firebase:',
      error?.response?.data || error.message,
    );
  }
};

/**
 * Fetch global leaderboard top 10 from Firestore REST API
 */
export const fetchGlobalLeaderboard = async () => {
  const url =
    'https://firestore.googleapis.com/v1/projects/studifysuccess-c7ad5/databases/(default)/documents:runQuery';

  const queryPayload = {
    structuredQuery: {
      from: [{collectionId: 'gamification'}],
      orderBy: [
        {
          field: {fieldPath: 'xp'},
          direction: 'DESCENDING',
        },
      ],
      limit: 10,
    },
  };

  try {
    const response = await axios.post(url, queryPayload);
    const results = response.data || [];

    // Parse the structured query response from Firestore REST API
    const formatted = results
      .filter(item => item.document)
      .map(item => {
        const fields = item.document.fields;
        return {
          email: fields.email?.stringValue || '',
          name: fields.name?.stringValue || 'Anonymous',
          avatar: fields.avatar?.stringValue || 'U',
          xp: parseInt(fields.xp?.integerValue || '0', 10),
          level: parseInt(fields.level?.integerValue || '1', 10),
          streak: parseInt(fields.streak?.integerValue || '0', 10),
          isUser: false,
        };
      });

    return formatted;
  } catch (error) {
    console.log(
      'Error fetching global leaderboard:',
      error?.response?.data || error.message,
    );
    return [];
  }
};
