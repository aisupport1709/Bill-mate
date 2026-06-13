import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useColors } from '../context/SettingsContext';

interface Props extends TextInputProps {
  label?: string;
  suffix?: string;
}

export function Input({ label, suffix, style, ...rest }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.row, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }, style]}
          placeholderTextColor={colors.textSecondary}
          {...rest}
        />
        {suffix ? <Text style={[styles.suffix, { color: colors.textSecondary }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: { flex: 1, height: 50, fontSize: 16 },
  suffix: { fontSize: 16, fontWeight: '700', marginLeft: 6 },
});
