import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { useState } from 'react';

import Fueling from './screens/Fueling';
import Traveling from './screens/Traveling';
import TravelLogs from './screens/TravelLogs';
import LoginScreen from './screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ focused, emoji, color }) => (
  <View style={styles.tabIconContainer}>
    <View style={[
      styles.iconWrapper,
      focused && styles.iconWrapperFocused
    ]}>
      <Text style={[
        styles.iconEmoji,
        focused && styles.iconEmojiFocused
      ]}>{emoji}</Text>
    </View>
    {focused && (
      <View style={[styles.activeIndicator, { backgroundColor: color }]} />
    )}
  </View>
);

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
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              emoji="⛽"
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Traveling"
        component={Traveling}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              emoji="🚗"
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Travel Logs"
        component={TravelLogs}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              emoji="📋"
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainApp" component={MainTabs} />
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
    shadowOffset: {
      width: 0,
      height: -2,
    },
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