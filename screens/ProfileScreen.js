import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

export default function ProfileScreen({ navigation }) {
  // Sample data - will be replaced with API data later
  const userData = {
    name: 'Driver Name',
    email: 'Example.e@example.com',
    role: 'Driver',
    joinDate: '2024-01-15',
  };

  const statsData = {
    totalTravels: 24,
    pendingTravels: 3,
    totalFuelCost: 12560,
    totalDistance: 2450,
    fuelRecords: 18,
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.header}>Profile</Text>
            <Text style={styles.subHeader}>Your account overview</Text>
          </View>
          <View style={styles.headerDecoration} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
              <Text style={styles.userRole}>{userData.role}</Text>
              <Text style={styles.joinDate}>Joined {userData.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{statsData.totalTravels}</Text>
              <Text style={styles.statLabel}>Total Travels</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{statsData.pendingTravels}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{statsData.fuelRecords}</Text>
              <Text style={styles.statLabel}>Fuel Records</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{statsData.totalDistance}km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
          </View>
        </View>

        {/* Financial Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>

          <View style={styles.financeCard}>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Total Fuel Cost</Text>
              <Text style={styles.financeValue}>Rs {statsData.totalFuelCost.toLocaleString()}</Text>
            </View>

            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Average per Travel</Text>
              <Text style={styles.financeValue}>Rs {Math.round(statsData.totalFuelCost / statsData.totalTravels).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
            <Text style={styles.actionButtonSecondaryText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]}>
            <Text style={styles.actionButtonDangerText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 40,
  },
  headerContainer: {
    backgroundColor: '#7c3aed',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  headerBackground: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    position: 'relative',
  },
  headerContent: {
    zIndex: 2,
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subHeader: {
    fontSize: 16,
    color: '#e9d5ff',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  container: {
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#7c3aed',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  financeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  financeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  financeLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  financeValue: {
    fontSize: 16,
    color: '#7c3aed',
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7c3aed',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonDanger: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowOpacity: 0,
    elevation: 0,
    marginTop: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  actionButtonSecondaryText: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 16,
  },
  actionButtonDangerText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 16,
  },
});