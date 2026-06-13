import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '../context/SettingsContext';

export function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emoji: { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 6 },
});
