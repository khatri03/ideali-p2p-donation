import HttpClient from '../httpClient/HttpClient';
import { timeZoneResponseDto } from '../../interface/CommonInter/timeZoneResponseDto';

/**
 * Service for managing timezone operations
 */
class TimeZoneService {
  /**
   * Fetch all available timezones
   * @returns Promise with timezone data
   */
  static async fetchTimeZones(): Promise<timeZoneResponseDto> {
    try {
      const response = await HttpClient.get<timeZoneResponseDto>(
        '/api/admin/list-items/time-zones'
      );

      if (response.status === 200 && response.data.success) {
        return response.data;
      }

      throw new Error(response.statusText || 'Failed to fetch timezones');
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to fetch timezones'
      );
    }
  }

  /**
   * Get timezone display name by ID
   * @param timeZoneId - The timezone ID
   * @param timeZoneData - The timezone data object
   * @returns Display name of the timezone
   */
  static getTimeZoneDisplay(
    timeZoneId: number, 
    timeZoneData: timeZoneResponseDto | null
  ): string {
    if (!timeZoneData?.data) {
      return `Timezone ID: ${timeZoneId}`;
    }

    const timezone = timeZoneData.data.find(tz => tz.id === timeZoneId);
    return timezone ? timezone.displayName : `Timezone ID: ${timeZoneId}`;
  }

  /**
   * Format timezone name for display in select options
   * @param displayName - Full timezone display name
   * @returns Formatted timezone name
   */
  static formatTimeZoneName(displayName: string): string {
    return displayName.split(') ')[1] || displayName;
  }

  /**
   * Format timezone label for select options
   * @param displayName - Full timezone display name
   * @returns Formatted label with timezone name and offset
   */
  static formatTimeZoneLabel(displayName: string): string {
    const timezoneName = this.formatTimeZoneName(displayName);
    const offset = displayName.split(')')[0] + ')';
    return `${timezoneName} ${offset}`;
  }
}

export default TimeZoneService;