import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { avatarFor } from '../lib/avatars';

export function Avatar({ avatarId, size = 40 }: { avatarId: number | undefined; size?: number }) {
  const preset = avatarFor(avatarId);
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: preset.color },
      ]}
    >
      <Text style={{ fontSize: size * 0.55 }}>{preset.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
