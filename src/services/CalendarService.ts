import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNCalendarEvents from 'react-native-calendar-events';

export interface CalendarEvent {
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  notes?: string;
  url?: string;
}

class CalendarService {
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const status = await RNCalendarEvents.requestPermissions();
        return status === 'authorized';
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  async addEvent(event: CalendarEvent): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const eventId = await RNCalendarEvents.saveEvent(event.title, {
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.notes,
        url: event.url,
      });

      return !!eventId;
    } catch (error) {
      console.error('Error adding calendar event:', error);
      Alert.alert('Error', 'Failed to add event to calendar');
      return false;
    }
  }
}

export default new CalendarService();
