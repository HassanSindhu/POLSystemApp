import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VEHICLES = ['SLJ-1112', 'SAJ-321', 'LEG-2106', 'GBF-848', 'Hiace APL-2025'];

export default function AdminFuelStats({ navigation }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('userData'); // assuming you save full login "user"
        if (raw) {
          const parsed = JSON.parse(raw);
          setUserName(parsed?.name || '');
        }
      } catch {}
    })();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
      <View style={styles.header}>
        <Text style={styles.title}>Fuel Stats</Text>
        {!!userName && <Text style={styles.subtitle}>Welcome, {userName}</Text>}
      </View>

      <FlatList
        data={VEHICLES}
        keyExtractor={(item) => item}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AdminFuelHistory', { vehicle: item })}
          >
            <Text style={styles.cardTitle}>{item}</Text>
            <Text style={styles.cardHint}>View fueling history →</Text>
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
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  cardHint: { marginTop: 6, color: '#6b7280', fontSize: 13 },
});
