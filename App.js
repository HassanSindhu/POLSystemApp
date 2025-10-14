// App.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, Platform } from 'react-native';

// Regular user screens
import Fueling from './screens/Fueling';
import Traveling from './screens/Traveling';
import TravelLogs from './screens/TravelLogs';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';

// Admin screens
import AdminFuelStats from './screens/AdminFuelStats';
import AdminFuelHistory from './screens/AdminFuelHistory';
import AdminDriverStats from './screens/AdminDriverStats';
import AdminDriverDetails from './screens/AdminDriverDetails';
import AdminAddDriver from './screens/AdminAddDriver';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ focused, emoji, color }) => (
  <View style={styles.tabIconContainer}>
    <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
      <Text style={[styles.iconEmoji, focused && styles.iconEmojiFocused]}>{emoji}</Text>
    </View>
    {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
  </View>
);

// ===== Regular user tabs =====
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Fuel"
        component={Fueling}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} emoji="⛽" color={color} />,
        }}
      />
      <Tab.Screen
        name="Traveling"
        component={Traveling}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} emoji="🚗" color={color} />,
        }}
      />
      <Tab.Screen
        name="Travel Logs"
        component={TravelLogs}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} emoji="📋" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} emoji="👤" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ===== Admin stacks (for pushable detail screens with headers) =====
const FuelStatsStack = createNativeStackNavigator();
function AdminFuelStatsStack() {
  return (
    <FuelStatsStack.Navigator>
      <FuelStatsStack.Screen
        name="AdminFuelStats"
        component={AdminFuelStats}
        options={{ headerShown: false }}
      />
      <FuelStatsStack.Screen
        name="AdminFuelHistory"
        component={AdminFuelHistory}
        options={{ title: 'Fuel History' }}
      />
    </FuelStatsStack.Navigator>
  );
}

const DriverStatsStack = createNativeStackNavigator();
function AdminDriverStatsStack() {
  return (
    <DriverStatsStack.Navigator>
      <DriverStatsStack.Screen
        name="AdminDriverStats"
        component={AdminDriverStats}
        options={{ headerShown: false }}
      />
      <DriverStatsStack.Screen
        name="AdminDriverDetails"
        component={AdminDriverDetails}
        options={{ title: 'Driver Details' }}
      />
    </DriverStatsStack.Navigator>
  );
}

// ===== Admin tabs =====
function AdminTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Fuel Stats"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Fuel Stats"
        component={AdminFuelStatsStack}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} emoji="📊" color={color} />,
        }}
      />
      <Tab.Screen
        name="Driver Stats"
        component={AdminDriverStatsStack}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} emoji="🧑‍✈️" color={color} />,
        }}
      />
      <Tab.Screen
        name="Add Driver"
        component={AdminAddDriver}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} emoji="➕" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} emoji="👤" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ===== Root navigator =====
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Login decides where to go based on user.role (admin -> AdminApp, else MainApp) */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainApp" component={MainTabs} />
        <Stack.Screen name="AdminApp" component={AdminTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    height: Platform.OS === 'ios' ? 85 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: 'absolute',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  iconWrapperFocused: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    transform: [{ scale: 1.1 }],
  },
  iconEmoji: {
    fontSize: 22,
    opacity: 0.7,
  },
  iconEmojiFocused: {
    fontSize: 22,
    opacity: 1,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7c3aed',
  },
});
