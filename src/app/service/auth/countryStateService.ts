import HttpClient from '../httpClient/HttpClient';

interface Country {
  countryId: number;
  name: string;
}

interface State {
  stateId: number;
  name: string;
}

interface CountryApiResponse {
  data: Country[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any;
  meta: any;
  timestamp: string;
}

interface StateApiResponse {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any;
  meta: any;
  timestamp: string;
  data: Array<{
    countryInfo: {
      countryId: number;
      name: string;
    };
    states: State[];
  }>;
}

class CountryStateService {
  /**
   * Fetch all countries
   * @returns Promise with list of countries
   */
  async fetchCountries(): Promise<CountryApiResponse> {
    try {
      const response = await HttpClient.get<CountryApiResponse>(
        '/api/geo/country/list'
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Fetch states by country ID
   * @param countryId - ID of the selected country
   * @returns Promise with list of states for the country
   */
  async fetchStatesByCountry(countryId: number): Promise<StateApiResponse> {
    try {
      const response = await HttpClient.get<StateApiResponse>(
        `/api/geo/country/${countryId}/states`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

const countryStateService = new CountryStateService();
export default countryStateService;
export type { Country, State, CountryApiResponse, StateApiResponse };