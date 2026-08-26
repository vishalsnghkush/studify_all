import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {Text} from '../../../Components/Input';
import {Screen} from '../../../Components/Screen';
import {useTheme, Card, Button, SegmentedButtons, IconButton, Dialog, Portal} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useApi from '../../../Components/Api/Api';

// Graceful import for PDF library
let RNHTMLtoPDF = null;
try {
  RNHTMLtoPDF = require('react-native-html-to-pdf').default;
} catch (e) {
  console.log('RNHTMLtoPDF not loaded in this environment');
}

const InternReports = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.initial);
  const { get, post } = useApi();

  const [reportType, setReportType] = useState('daily');
  const [loading, setLoading] = useState(false);

  // Form states
  const [dailyForm, setDailyForm] = useState({tasks: '', progress: '', blocks: '', hours: ''});
  const [weeklyForm, setWeeklyForm] = useState({milestones: '', bugs: '', planning: ''});
  const [monthlyForm, setMonthlyForm] = useState({summary: '', learnings: '', evaluation: ''});

  // DB reports list state
  const [reportsList, setReportsList] = useState([]);

  // Selected report detail modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [internStatus, setInternStatus] = useState('Pending');

  const loadData = async () => {
    try {
      const res = await get('/interns/reports');
      if (res && res.data) setReportsList(res.data);

      const profileRes = await get('/interns/profile');
      if (profileRes && profileRes.data) {
        setInternStatus(profileRes.data.status || 'Pending');
      }
    } catch (e) {
      console.log('Error loading reports', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const handleTextChange = (formName, field, val) => {
    if (formName === 'daily') {
      setDailyForm({...dailyForm, [field]: val});
    } else if (formName === 'weekly') {
      setWeeklyForm({...weeklyForm, [field]: val});
    } else {
      setMonthlyForm({...monthlyForm, [field]: val});
    }
  };

  const submitReport = async () => {
    let summaryText = '';
    let detailsData = {};

    if (reportType === 'daily') {
      if (!dailyForm.tasks.trim()) return Alert.alert('Error', 'Please enter tasks worked on.');
      if (!dailyForm.hours.trim()) return Alert.alert('Error', 'Please enter hours spent.');
      summaryText = dailyForm.tasks.substring(0, 60) + '...';
      detailsData = {...dailyForm};
      setDailyForm({tasks: '', progress: '', blocks: '', hours: ''});
      setDailyForm({tasks: '', progress: '', blocks: '', hours: ''});

      // Cancel remaining EOD notifications for today
      try {
        const Notifee = require('@notifee/react-native').default;
        if (Notifee) {
          await Notifee.cancelNotification('daily_eod_5pm');
          await Notifee.cancelNotification('daily_eod_7pm');
          await Notifee.cancelNotification('daily_eod_10pm');
        }
      } catch (e) {}
    } else if (reportType === 'weekly') {
      if (!weeklyForm.milestones.trim()) return Alert.alert('Error', 'Please enter weekly milestones.');
      summaryText = weeklyForm.milestones.substring(0, 60) + '...';
      detailsData = {...weeklyForm};
      setWeeklyForm({milestones: '', bugs: '', planning: ''});
    } else {
      if (!monthlyForm.summary.trim()) return Alert.alert('Error', 'Please enter monthly summary.');
      summaryText = monthlyForm.summary.substring(0, 60) + '...';
      detailsData = {...monthlyForm};
      setMonthlyForm({summary: '', learnings: '', evaluation: ''});
    }

    try {
      await post('/interns/reports', {
        type: reportType === 'daily' ? 'Daily EOD' : reportType === 'weekly' ? 'Weekly Report' : 'Monthly Report',
        summary: summaryText,
        details: detailsData,
      });
      Alert.alert('Success', 'Report submitted successfully! Today has been marked present.');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  const generatePDFAndShare = async (report) => {
    setLoading(true);
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #333; }
            h1 { color: #007171; border-bottom: 2px solid #007171; padding-bottom: 6px; }
            .meta { background: #F5F5F5; padding: 10px; border-radius: 6px; margin-bottom: 20px; }
            .field-box { margin-bottom: 12px; border: 1px solid #DDD; padding: 10px; border-radius: 6px; }
            .field-title { font-weight: bold; color: #111; margin-bottom: 4px; }
            .field-body { font-size: 13px; color: #444; }
          </style>
        </head>
        <body>
          <h1>Intern Performance Log</h1>
          <div class="meta">
            <p><b>Intern Name:</b> ${user?.fname || 'Intern'} ${user?.lname || ''}</p>
            <p><b>Report Type:</b> ${report.type}</p>
            <p><b>Submission Date:</b> ${report.date}</p>
          </div>
          ${Object.keys(report.details).map(key => `
            <div class="field-box">
              <div class="field-title">${key.toUpperCase()}</div>
              <div class="field-body">${report.details[key] || 'None'}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    if (RNHTMLtoPDF) {
      try {
        const options = {
          html: htmlContent,
          fileName: `Report_${report.date}_${Date.now()}`,
          directory: 'Documents',
        };
        const file = await RNHTMLtoPDF.convert(options);
        
        // Use Share utility to let user view/open it immediately!
        await Share.open({
          url: 'file://' + file.filePath,
          type: 'application/pdf',
          title: 'Review PDF Report',
        });
      } catch (err) {
        Alert.alert('Report Saved', `Document generated successfully at local Documents path.`);
      }
    } else {
      // Mock sharing fallback
      setTimeout(async () => {
        try {
          await Share.open({
            message: `Compiled ${report.type} for ${report.date}:\n\n` + 
              Object.keys(report.details).map(k => `${k.toUpperCase()}: ${report.details[k]}`).join('\n'),
            title: 'Share EOD Report',
          });
        } catch (e) {
          Alert.alert('Report Details', 'Unable to launch system share sheet.');
        }
      }, 500);
    }
    setLoading(false);
  };

  const handleReviewReport = (report) => {
    setSelectedReport(report);
    setDetailVisible(true);
  };

  if (internStatus !== 'Approved') {
    return (
      <Screen NoHeader style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
        <Icon name="lock-outline" size={64} color="#999" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Verification Required</Text>
        <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
          Performance Reports submission is locked. Please upload your Internship Offer Letter in your Profile and await TL approval to unlock it.
        </Text>
        <Button mode="contained" onPress={() => navigation.navigate('InternProfile')}>
          Go to Profile
        </Button>
      </Screen>
    );
  }

  return (
    <Screen NoHeader style={styles.container}>
        <Text style={styles.title}>Submit Performance Reports</Text>
        <Text style={styles.subtitle}>Submit EODs to automatically log calendar attendance and track reviews.</Text>

        <SegmentedButtons
          value={reportType}
          onValueChange={setReportType}
          buttons={[
            {value: 'daily', label: 'Daily EOD'},
            {value: 'weekly', label: 'Weekly'},
            {value: 'monthly', label: 'Monthly'},
          ]}
          style={styles.segmented}
        />

        {/* 1. Daily EOD Form */}
        {reportType === 'daily' && (
          <Card style={styles.formCard}>
            <Card.Content>
              <Text style={styles.label}>Tasks Completed Today</Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={dailyForm.tasks}
                onChangeText={v => handleTextChange('daily', 'tasks', v)}
                style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="List layouts built, bugs resolved, API calls integrated..."
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>Progress Rate (%)</Text>
              <TextInput
                value={dailyForm.progress}
                onChangeText={v => handleTextChange('daily', 'progress', v)}
                style={[styles.input, {borderColor: colors.outline, height: 40, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="E.g., 90%"
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>Roadblocks & Doubts</Text>
              <TextInput
                value={dailyForm.blocks}
                onChangeText={v => handleTextChange('daily', 'blocks', v)}
                style={[styles.input, {borderColor: colors.outline, height: 40, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="E.g., Gradle compilation issue..."
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>Hours Logged</Text>
              <TextInput
                keyboardType="numeric"
                value={dailyForm.hours}
                onChangeText={v => handleTextChange('daily', 'hours', v)}
                style={[styles.input, {borderColor: colors.outline, height: 40, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="E.g., 8"
                placeholderTextColor="#999"
              />
              <Button mode="contained" onPress={submitReport} style={styles.submitBtn}>
                Submit Daily EOD
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* 2. Weekly Form */}
        {reportType === 'weekly' && (
          <Card style={styles.formCard}>
            <Card.Content>
              <Text style={styles.label}>Weekly Milestones Achieved</Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={weeklyForm.milestones}
                onChangeText={v => handleTextChange('weekly', 'milestones', v)}
                style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="Summary of modules integrated this week..."
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>Challenges Faced & Resolved</Text>
              <TextInput
                multiline
                numberOfLines={2}
                value={weeklyForm.bugs}
                onChangeText={v => handleTextChange('weekly', 'bugs', v)}
                style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="Bugs resolved or design alignment issues..."
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>Plan for Next Week</Text>
              <TextInput
                value={weeklyForm.planning}
                onChangeText={v => handleTextChange('weekly', 'planning', v)}
                style={[styles.input, {borderColor: colors.outline, height: 40, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="E.g., Setup notifications and verify profiles"
                placeholderTextColor="#999"
              />
              <Button mode="contained" onPress={submitReport} style={styles.submitBtn}>
                Submit Weekly Report
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* 3. Monthly Form */}
        {reportType === 'monthly' && (
          <Card style={styles.formCard}>
            <Card.Content>
              <Text style={styles.label}>Monthly summary & Deliverables</Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={monthlyForm.summary}
                onChangeText={v => handleTextChange('monthly', 'summary', v)}
                style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="Major project tracks finalized this month..."
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>Key Technical Learnings</Text>
              <TextInput
                multiline
                numberOfLines={2}
                value={monthlyForm.learnings}
                onChangeText={v => handleTextChange('monthly', 'learnings', v)}
                style={[styles.input, {borderColor: colors.outline, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="E.g., Deep dive into custom layout render cycles"
                placeholderTextColor="#999"
              />
              <Text style={styles.label}>Self Evaluation Rating (1-5)</Text>
              <TextInput
                keyboardType="numeric"
                value={monthlyForm.evaluation}
                onChangeText={v => handleTextChange('monthly', 'evaluation', v)}
                style={[styles.input, {borderColor: colors.outline, height: 40, backgroundColor: colors.elevation.level2, color: colors.onSurface}]}
                placeholder="E.g., 4.5"
                placeholderTextColor="#999"
              />
              <Button mode="contained" onPress={submitReport} style={styles.submitBtn}>
                Submit Monthly Report
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Submissions List */}
        <Text style={styles.sectionTitle}>Submitted Reports Log</Text>
        <Card style={styles.logCard}>
          <Card.Content style={{padding: 0}}>
            {reportsList.length === 0 ? (
              <Text style={styles.emptyText}>No reports submitted yet.</Text>
            ) : (
              reportsList.map((item) => (
                <View key={item.id}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleReviewReport(item)}
                    style={styles.logItem}>
                    <View style={{flex: 1, paddingRight: 8}}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.logType}>{item.type}</Text>
                        <Text style={styles.logDate}>{item.date}</Text>
                      </View>
                      <Text style={styles.logSummary} numberOfLines={2}>
                        {item.summary}
                      </Text>
                    </View>
                    <IconButton
                      icon="share-variant"
                      iconColor={colors.primary}
                      size={24}
                      onPress={() => generatePDFAndShare(item)}
                      style={styles.pdfBtn}
                    />
                  </TouchableOpacity>
                  <View style={[styles.divider, {backgroundColor: colors.outlineVariant}]} />
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Detailed Review Modal */}
        <Portal>
          <Dialog visible={detailVisible} onDismiss={() => setDetailVisible(false)} style={styles.dialog}>
            <Dialog.Title>Report Review Details</Dialog.Title>
            <Dialog.Content>
              {selectedReport && (
                <View>
                  <Text style={styles.repLabel}>Report Type</Text>
                  <Text style={styles.repVal}>{selectedReport.type} ({selectedReport.date})</Text>

                  {Object.keys(selectedReport.details).map(key => (
                    <View key={key} style={{marginTop: 10}}>
                      <Text style={styles.repLabel}>{key.toUpperCase()}</Text>
                      <Text style={styles.repVal}>{selectedReport.details[key] || 'None'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDetailVisible(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    lineHeight: 20,
  },
  segmented: {
    marginBottom: 20,
  },
  formCard: {
    marginBottom: 24,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitBtn: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  logCard: {
    elevation: 1,
    marginBottom: 20,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logType: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  logDate: {
    fontSize: 11,
    color: '#888',
    marginLeft: 10,
  },
  logSummary: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  pdfBtn: {
    margin: 0,
  },
  divider: {
    height: 1,
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
  },
  dialog: {
    borderRadius: 12,
  },
  repLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dialogValue: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
});

export default InternReports;
