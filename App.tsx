import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider, useColors } from './src/context/SettingsContext';
import { isFirebaseConfigured } from './src/lib/firebase';
import { RootNavigator } from './src/navigation/RootNavigator';

function SetupNotice() {
  const colors = useColors();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.setupContent}>
      <Text style={styles.setupEmoji}>🔧</Text>
      <Text style={[styles.setupTitle, { color: colors.text }]}>One-time Firebase setup needed</Text>
      <Text style={[styles.setupText, { color: colors.textSecondary }]}>
        1. Go to console.firebase.google.com and create a free project{'\n'}
        2. Enable Authentication → Email/Password{'\n'}
        3. Create a Cloud Firestore database{'\n'}
        4. Add a Web app and copy its config{'\n'}
        5. Paste the config into src/lib/firebase.ts{'\n\n'}
        Full steps are in README.md.
      </Text>
    </ScrollView>
  );
}

function AppInner() {
  const colors = useColors();
  return (
    <SafeAreaProvider>
      <StatusBar style={colors.background === '#0F172A' ? 'light' : 'dark'} />
      {isFirebaseConfigured ? (
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      ) : (
        <SetupNotice />
      )}
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  setupContent: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  setupEmoji: { fontSize: 48, textAlign: 'center' },
  setupTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginVertical: 14 },
  setupText: { fontSize: 15, lineHeight: 24 },
});
