import React from 'react';
import { Platform } from 'react-native';
import { useColors } from '../context/SettingsContext';

interface Props {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (iso: string) => void;
  maximumDate?: Date;
}

export function DatePicker({ value, onChange, maximumDate }: Props) {
  const colors = useColors();

  if (Platform.OS === 'web') {
    const max = maximumDate ? maximumDate.toISOString().slice(0, 10) : undefined;
    return (
      <input
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 16,
          padding: '8px 12px',
          borderRadius: 10,
          border: `1.5px solid ${colors.border}`,
          backgroundColor: colors.inputBg,
          color: colors.text,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const DateTimePicker = require('@react-native-community/datetimepicker').default;
  return (
    <DateTimePicker
      value={new Date(value)}
      mode="date"
      display="compact"
      maximumDate={maximumDate}
      onChange={(_: unknown, selected: Date | undefined) => {
        if (selected) onChange(selected.toISOString().slice(0, 10));
      }}
    />
  );
}
