import { Platform } from 'react-native';
import { savePushToken } from '../api/users';
import { fetchProfiles } from '../api/users';

// Push notifications are native-only — no-op silently on web.
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function registerPushToken(uid: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Device = require('expo-device');
    if (!Device.isDevice) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await savePushToken(uid, token);
  } catch {}
}

// Sent directly from the client via the Expo Push HTTP API — no server needed,
// which keeps everything on the Firebase free tier.
export async function notifyUsers(uids: string[], title: string, body: string): Promise<void> {
  try {
    const profiles = await fetchProfiles(uids);
    const messages = profiles
      .filter((p) => p.expoPushToken)
      .map((p) => ({ to: p.expoPushToken, sound: 'default', title, body }));
    if (messages.length === 0) return;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch {}
}
