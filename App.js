import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import Fueling from './screens/Fueling';
import Traveling from './screens/Traveling';
import TravelLogs from './screens/TravelLogs';

const Tab = createBottomTabNavigator();

const TabIcon = ({ focused, emoji, color }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</Text>
    {focused && (
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
    )}
  </View>
);

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
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
            tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} emoji="🧭" color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
