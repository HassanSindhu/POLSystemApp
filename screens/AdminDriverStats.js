import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';

const SAMPLE_DRIVERS = [
  { _id: 'd1', name: 'Ali Khan', mobileNumber: '03001234567', role: 'driver' },
  { _id: 'd2', name: 'Ahmed Raza', mobileNumber: '03001112222', role: 'driver' },
  { _id: 'd3', name: 'Usman Iqbal', mobileNumber: '03005556666', role: 'driver' },
  { _id: 'd4', name: 'Bilal Tariq', mobileNumber: '03007778888', role: 'driver' },
  { _id: 'd5', name: 'Hamza Shah', mobileNumber: '03009990000', role: 'driver' },
  { _id: 'd6', name: 'Saad Ali', mobileNumber: '03003334444', role: 'driver' },
  { _id: 'd7', name: 'Fahad Asif', mobileNumber: '03001239876', role: 'driver' },
];

export default function AdminDriverStats({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
      <View style={styles.header}>
        <Text style={styles.title}>Driver Stats</Text>
        <Text style={styles.subtitle}>Tap a driver to view details</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={SAMPLE_DRIVERS}
        keyExtractor={(item) => item._id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AdminDriverDetails', { driver: item })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>📞 {item.mobileNumber}</Text>
            <Text style={styles.hint}>View driver details →</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#e9d5ff', marginTop: 6, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  name: { fontSize: 18, fontWeight: '800', color: '#111827' },
  meta: { marginTop: 6, color: '#6b7280' },
  hint: { marginTop: 8, color: '#6b7280', fontSize: 13 },
});
