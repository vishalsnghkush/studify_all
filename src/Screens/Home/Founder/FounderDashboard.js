import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Button, Avatar, useTheme, Chip, Divider } from 'react-native-paper';
import { Text } from '../../../Components/Input';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Screen } from '../../../Components/Screen';
import useApi from '../../../Components/Api/Api';

export default function FounderDashboard({ navigation }) {
  const colors = useTheme().colors;
  const api = useApi();
  const get = api?.get || (async () => null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalInterns: 0,
    activeToday: 0,
    absentToday: 0,
    pendingTasks: 0,
    completionRate: '0%',
    mostActiveDept: 'Tech',
    leastActiveDept: 'HR',
    revenue: '₹0',
    traffic: '0 visits/mo',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await get('/interns/team?department=All', { skipSuccessFlash: true, skipErrorFlash: true });
      if (res && res.data) {
        const teamList = res.data.team || [];
        const reportsList = res.data.reports || [];
        const attendanceMap = res.data.attendance || {};
        
        const total = teamList.length;
        const todayISO = new Date().toISOString().split('T')[0];
        
        let activeCount = 0;
        teamList.forEach(member => {
          const mId = String(member.id || member.user_id);
          const att = attendanceMap[mId]?.[todayISO];
          if (att && (att.status === 'Full' || att.status === 'Half' || att.status === 'Present' || att.morning_marked_at || att.evening_marked_at)) {
            activeCount++;
          }
        });

        // Department activity calculation
        const deptCounts = {};
        teamList.forEach(m => {
          const d = m.department || 'Tech';
          deptCounts[d] = (deptCounts[d] || 0) + 1;
        });

        const depts = Object.keys(deptCounts);
        depts.sort((a, b) => deptCounts[b] - deptCounts[a]);

        setMetrics({
          totalInterns: total,
          activeToday: activeCount,
          absentToday: Math.max(0, total - activeCount),
          pendingTasks: Math.max(0, total * 2 - reportsList.length),
          completionRate: total > 0 ? `${Math.min(100, Math.round((reportsList.length / (total * 3)) * 100))}%` : '0%',
          mostActiveDept: depts[0] || 'Tech',
          leastActiveDept: depts[depts.length - 1] || 'HR',
          revenue: '₹0',
          traffic: '0 visits/mo',
        });
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Screen NoHeader style={{ padding: 0 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#1A237E' }]}>
        <View>
          <Text style={{ fontSize: 13, color: '#9FA8DA', textTransform: 'uppercase', letterSpacing: 1 }}>Executive Hub 👑</Text>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>Founder Dashboard</Text>
        </View>
        <Avatar.Icon size={44} icon="crown" style={{ backgroundColor: '#3949AB' }} color="#FFD700" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} colors={['#1A237E']} />}>
        
        {/* Single Screen Overview Cards */}
        <Text style={styles.sectionHeading}>Company Overview</Text>
        <View style={styles.gridRow}>
          <Card style={[styles.miniCard, { backgroundColor: '#E8EAF6' }]}>
            <Card.Content style={styles.miniCardContent}>
              <Icon name="account-group" size={24} color="#1A237E" />
              <Text style={[styles.cardVal, { color: '#1A237E' }]}>{metrics.totalInterns}</Text>
              <Text style={styles.cardLbl}>Total Interns</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.miniCard, { backgroundColor: '#E8F5E9' }]}>
            <Card.Content style={styles.miniCardContent}>
              <Icon name="check-circle" size={24} color="#2E7D32" />
              <Text style={[styles.cardVal, { color: '#2E7D32' }]}>{metrics.activeToday}</Text>
              <Text style={styles.cardLbl}>Active Today</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.gridRow}>
          <Card style={[styles.miniCard, { backgroundColor: '#FFEBEE' }]}>
            <Card.Content style={styles.miniCardContent}>
              <Icon name="close-circle" size={24} color="#C62828" />
              <Text style={[styles.cardVal, { color: '#C62828' }]}>{metrics.absentToday}</Text>
              <Text style={styles.cardLbl}>Absent Today</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.miniCard, { backgroundColor: '#FFF3E0' }]}>
            <Card.Content style={styles.miniCardContent}>
              <Icon name="clipboard-alert" size={24} color="#E65100" />
              <Text style={[styles.cardVal, { color: '#E65100' }]}>{metrics.pendingTasks}</Text>
              <Text style={styles.cardLbl}>Pending Tasks</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Business Metrics */}
        <Text style={styles.sectionHeading}>Performance & Business Analytics</Text>
        <Card style={{ marginBottom: 14, backgroundColor: '#fff', borderRadius: 12, elevation: 2 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, color: '#555', fontWeight: '600' }}>Overall Completion Rate</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2E7D32' }}>{metrics.completionRate}</Text>
            </View>
            <Divider style={{ marginVertical: 8 }} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
              <View>
                <Text style={{ fontSize: 11, color: '#777' }}>Most Active Department</Text>
                <Chip icon="fire" style={{ backgroundColor: '#E8F5E9', marginTop: 4 }}>{metrics.mostActiveDept}</Chip>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#777' }}>Least Active Department</Text>
                <Chip icon="alert-outline" style={{ backgroundColor: '#FFEBEE', marginTop: 4 }}>{metrics.leastActiveDept}</Chip>
              </View>
            </View>
            <Divider style={{ marginVertical: 8 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <View>
                <Text style={{ fontSize: 11, color: '#777' }}>Monthly Revenue</Text>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1B5E20' }}>{metrics.revenue}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#777' }}>Website Traffic</Text>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0D47A1' }}>{metrics.traffic}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Founder Controls */}
        <Text style={styles.sectionHeading}>Founder Management Controls</Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          <Button mode="contained" buttonColor="#1A237E" icon="domain" onPress={() => navigation.navigate('TLDashboard')}>
            Manage Departments & Teams
          </Button>
          <Button mode="contained-tonal" icon="book-open-page-variant" onPress={() => navigation.navigate('InternLearningHub')}>
            Manage Modules & Training
          </Button>
          <Button mode="outlined" icon="account-supervisor" onPress={() => navigation.navigate('TLMyTeam')}>
            Manage Team Leaders & Interns
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A237E',
    marginTop: 12,
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justify: 'space-between',
    marginBottom: 10,
  },
  miniCard: {
    width: '48%',
    borderRadius: 12,
    elevation: 2,
  },
  miniCardContent: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cardVal: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardLbl: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
});
