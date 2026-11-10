import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

export const NOTIFICATION_CHANNEL_ID = 'default';

export function isPushSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

if (isPushSupported()) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function isGranted(
  settings: Notifications.NotificationPermissionsStatus,
): boolean {
  return (
    settings.granted ||
    settings.ios?.status === IosAuthorizationStatus.PROVISIONAL
  );
}

export async function ensurePushPermissions(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  const existing = await Notifications.getPermissionsAsync();
  if (isGranted(existing)) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return isGranted(requested);
}

export async function getExpoPushToken(): Promise<string> {
  if (!isPushSupported()) {
    throw new Error('Push-уведомления доступны только в мобильном приложении.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Уведомления',
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#12C2A0',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('Не найден projectId Expo. Проверьте конфигурацию EAS.');
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  return token.data;
}
