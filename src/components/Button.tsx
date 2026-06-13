import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useColors } from '../context/SettingsContext';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const bgColor = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.card;
  const borderColor = variant === 'secondary' ? colors.primary : 'transparent';
  const textColor = variant === 'secondary' ? colors.primary : '#fff';

  return (
    <TouchableOpacity
      style={[styles.base, { backgroundColor: bgColor, borderColor, borderWidth: variant === 'secondary' ? 1 : 0, opacity: isDisabled ? 0.5 : 1 }, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: { fontSize: 16, fontWeight: '600' },
});
