import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  async initialize(): Promise<void> {
    await this.requestPermission();
    const token = await this.getFCMToken();
    if (token) {
      await this.saveFCMToken(token);
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async saveFCMToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('fcm_token', token);
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  onTokenRefresh(callback: (token: string) => void): () => void {
    return messaging().onTokenRefresh(callback);
  }

  onMessage(callback: (message: any) => void): () => void {
    return messaging().onMessage(callback);
  }

  setBackgroundMessageHandler(handler: (message: any) => Promise<void>): void {
    messaging().setBackgroundMessageHandler(handler);
  }
}

export default new NotificationService();
