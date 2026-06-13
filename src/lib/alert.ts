import { Alert, Platform } from 'react-native';

type Button = { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' };

export function showAlert(title: string, message?: string, buttons?: Button[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const msg = [title, message].filter(Boolean).join('\n\n');

  if (!buttons || buttons.length <= 1) {
    window.alert(msg);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Find the non-cancel action (last non-cancel button)
  const action = [...buttons].reverse().find((b) => b.style !== 'cancel');
  const confirmed = window.confirm(msg);
  if (confirmed && action?.onPress) action.onPress();
}
