import HttpClient from '../httpClient/HttpClient';


export interface ProfileSettingsProps {
  organizerUniqueId?: string;
}

export interface ValidationErrors {
  organizerName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  primaryEmail?: string;
  cellPhone?: string;
  streetLine1?: string;
  zipCode?: string;
  city?: string;         
  countryId?: string;    
  stateId?: string; 
}

/**
 * Organizer profile interface matching the API response
 */
export interface OrganizerProfileResponse {
  organizer: {
    status: string;
    isActive: boolean;
    name: string;
    shortName: string;
    timeZoneId: number;
    logoUrl?: string;
    enableTwoFa?: boolean;
  };
  contact: {
    firstName: string;
    middleName: string;
    lastName: string;
    primaryEmail: string;
    cellPhone: string;
  };
  address: {
    streetLine1: string;
    streetLine2: string;
    zipCode: string;
    countryId?: number;
    stateId?: number;
    city?: string;
    countryName?: string;
    stateName?: string;
    countryInfo?: {
      countryId: number;
      name: string;
    };
    stateInfo?: {
      stateId: number;
      name: string;
    };
  };
}

/**
 * Update organizer profile request interface
 */
export interface UpdateOrganizerProfileRequest {
  organizer: {
    name: string;
    shortName: string;
    timeZoneId: number;
    logoUrl?: string;
  };
  contact: {
    firstName: string;
    middleName: string;
    lastName: string;
    primaryEmail: string;
    cellPhone: string;
  };
  address: {
    streetLine1: string;
    streetLine2: string;
    zipCode: string;
    countryId?: number;
    stateId?: number;
    city?: string;
    countryName?: string;
    stateName?: string;
    countryInfo?: {
      countryId: number;
      name: string;
    };
    stateInfo?: {
      stateId: number;
      name: string;
    };
  };
}

/**
 * Fetch organizer profile details
 * @param organizerUniqueId - Optional organizer unique identifier
 * @returns Promise with organizer profile data
 */
export const fetchOrganizerProfile = async (
  organizerUniqueId?: string
): Promise<OrganizerProfileResponse> => {
  try {

    // Use the passed ID or fallback to stored IDs
    const idToUse = organizerUniqueId;

    console.log('Fetching profile for ID:', organizerUniqueId);

    if (!idToUse || idToUse === 'undefined' || idToUse === 'null') {
      console.error('❌ No valid organizer ID available');
      throw new Error('Organizer ID not found. Please log in again.');
    }

    const url = `/api/admin/organizer/profile/${idToUse}/detail`;
    console.log('📡 Calling API:', url);

    const response = await HttpClient.get(url);

    console.log('✅ Profile data received:', response.data);

    // Extract the data from the response structure
    const profileData = response.data?.data || response.data || response;

    return profileData;
  } catch (error: any) {
    console.error('❌ Error fetching organizer profile:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    });
    throw error;
  }
};

/**
 * Update organizer profile using POST method
 * @param organizerUniqueId - Organizer unique identifier
 * @param profileData - Updated profile data
 * @returns Promise with updated profile data
 */
export const updateOrganizerProfile = async (
  organizerUniqueId: string,
  profileData: UpdateOrganizerProfileRequest
): Promise<OrganizerProfileResponse> => {
  try {
    // Get organizerUniqueId from localStorage if not passed
    const storedOrganizerUniqueId = localStorage.getItem('organizerUniqueId');
    const storedOrganizerId = localStorage.getItem('organizerId');
    const idToUse = organizerUniqueId || storedOrganizerUniqueId || storedOrganizerId;

    if (!idToUse || idToUse === 'undefined' || idToUse === 'null') {
      console.error('❌ No valid organizer ID available for update');
      throw new Error('Organizer ID not found. Please log in again.');
    }

    // Helper function to return null for empty values
    const getValueOrNull = (value: any): string | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      }
      return value;
    };

    // Ensure all required fields are present and properly formatted
    // Optional fields should be null if empty, not empty strings
      const sanitizedData = {
      organizer: {
        name: profileData.organizer.name || '',
        shortName: getValueOrNull(profileData.organizer.shortName) || null, 
        timeZoneId: Number(profileData.organizer.timeZoneId) || 10,
      },
      contact: {
        firstName: profileData.contact.firstName || '',
        middleName: getValueOrNull(profileData.contact.middleName) || null,  // null if empty
        lastName: profileData.contact.lastName || '',
        primaryEmail: profileData.contact.primaryEmail || '',
        cellPhone: getValueOrNull(profileData.contact.cellPhone),    // null if empty
      },
      address: {
        ...(profileData.address.countryId && profileData.address.countryId !== 0 ? {
          countryInfo: {
            countryId: profileData.address.countryId,
            name: profileData.address.countryName || ''
          }
        } : {}),
        ...(profileData.address.stateId && profileData.address.stateId !== 0 ? {
          stateInfo: {
            stateId: profileData.address.stateId,
            name: profileData.address.stateName || ''
          }
        } : {}),
        city: getValueOrNull(profileData.address.city),
        streetLine1: getValueOrNull(profileData.address.streetLine1), // null if empty
        streetLine2: getValueOrNull(profileData.address.streetLine2), // null if empty
        zipCode: getValueOrNull(profileData.address.zipCode),
      },
    };

    // Use POST method as per API documentation
    const url = `/api/admin/organizer/profile/${idToUse}/update`;
    console.log('📡 Updating profile at:', url);
    console.log('📤 Sending data:', JSON.stringify(sanitizedData, null, 2));

    const response = await HttpClient.post(url, sanitizedData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Profile updated successfully:', response.data);

    // Extract the data from the response structure
    const updatedData = response.data?.data || response.data || response;

    return updatedData;
  } catch (error: any) {
    console.error('❌ Error updating organizer profile:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      requestData: error?.config?.data
    });

    // Provide more specific error message
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error?.response?.data?.errors) {
      const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
      throw new Error(errorMessages);
    }

    throw error;
  }
};

/**
 * Upload logo for an organizer
 * @param organizerUniqueId - The unique ID of the organizer
 * @param logo - The logo file to upload
 * @returns Promise with upload response
 */
export const uploadLogo = async (
  organizerUniqueId: string,
  logo: File
): Promise<any> => {
  const formData = new FormData();
  formData.append('logo', logo);

  try {
    const response = await HttpClient.post(
      `/api/organizer/profile/${organizerUniqueId}/upload-logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
};

export interface StatusResponse {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: null;
  meta: null;
  timestamp: string;
}

export async function activateOrganizer(organizerUniqueId: string): Promise<StatusResponse> {
  const response = await HttpClient.post(`/api/admin/organizer/${organizerUniqueId}/activate`, {});
  return response.data;
}

export async function deactivateOrganizer(organizerUniqueId: string): Promise<StatusResponse> {
  const response = await HttpClient.post(`/api/admin/organizer/${organizerUniqueId}/deactivate`, {});
  return response.data;
}
