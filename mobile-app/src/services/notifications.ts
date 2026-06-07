import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function initializePushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permissions not granted');
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  return token.data;
}

export function setupNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener(
    onNotification
  );

  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      onNotification(response.notification);
    }
  );

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      badge: 1,
    },
    trigger: {
      seconds: 1,
    },
  });
}
