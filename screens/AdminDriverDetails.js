import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Later: we’ll pull driver’s fuel purchases and travel journeys via your APIs.
// For now, we render structure + sample placeholders.

export default function AdminDriverDetails({ route, navigation }) {
  const driver = route.params?.driver;

  useEffect(() => {
    navigation.setOptions?.({
      headerShown: true,
      title: driver?.name ? `${driver.name}` : 'Driver Details',
    });
  }, [navigation, driver?.name]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{driver?.name || 'Driver'}</Text>
        {!!driver?.mobileNumber && <Text style={styles.meta}>📞 {driver.mobileNumber}</Text>}
        {!!driver?.role && <Text style={styles.meta}>Role: {driver.role}</Text>}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Fuel Purchases</Text>
        {/* Sample rows; replace with API data */}
        <View style={styles.row}>
          <Text style={styles.bold}>2025-10-13</Text>
          <Text style={styles.dim}>Vehicle: SAJ-321 • 25 L • Rs 7000</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.bold}>2025-10-07</Text>
          <Text style={styles.dim}>Vehicle: LEG-2106 • 35 L • Rs 9800</Text>
        </View>
        <Text style={styles.todo}>API hook pending — I’ll wire this to your endpoint once you share it.</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Travel Journeys</Text>
        {/* Sample rows; replace with API data */}
        <View style={styles.row}>
          <Text style={styles.bold}>2025-10-13</Text>
          <Text style={styles.dim}>Lahore → Murree • Vehicle: SAJ-321</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.bold}>2025-10-09</Text>
          <Text style={styles.dim}>Lahore → Sheikhupura • Vehicle: GBF-848</Text>
        </View>
        <Text style={styles.todo}>API hook pending — we’ll fetch from your travel logs API by driver.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f8fafc', flex: 1 },
  headerCard: {
    backgroundColor: '#fff', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3, marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  meta: { marginTop: 6, color: '#6b7280' },
  block: { marginTop: 8, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  blockTitle: { fontSize: 16, fontWeight: '800', color: '#374151', marginBottom: 12 },
  row: { marginBottom: 10 },
  bold: { fontWeight: '700', color: '#111827' },
  dim: { color: '#6b7280', marginTop: 2 },
  todo: { color: '#92400e', backgroundColor: '#fffbeb', borderColor: '#fef3c7', borderWidth: 1, padding: 10, borderRadius: 10, marginTop: 8 },
});
