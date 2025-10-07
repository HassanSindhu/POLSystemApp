import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


export default function Traveling() {
return (
<View style={[styles.container, { justifyContent: 'center' }] }>
<Text style={styles.header}>Traveling</Text>
<Text style={{ color: '#444', fontSize: 16, marginTop: 8 }}>
(Add your driver trip fields here later — e.g., Start Location, End Location, Odometer, Notes, etc.)
</Text>
</View>
);
}


const styles = StyleSheet.create({
container: {
padding: 16,
backgroundColor: '#fff',
flex: 1,
},
header: {
fontSize: 24,
fontWeight: '800',
color: '#111',
},
});