import type { SharePointTicket } from '../types/sharepoint';

// Configuration
const API_CONFIG = {
  // För utveckling och produktion - automatisk identifiering av miljö
  BASE_URL: import.meta.env.VITE_AZURE_FUNCTION_URL || 'https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net',
  // SÄKERHET: Ta bort Function Key - använd endast autentiserade anrop
  // FUNCTION_KEY: 'REMOVED_FOR_SECURITY',
  ENDPOINTS: {
    GET_SHAREPOINT_DATA: '/api/GetSharePointData'
  }
};

class SharePointApiService {
  private async fetchFromApi<T>(endpoint: string, userToken?: string): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    try {
      console.log('🚀 API Request Details:');
      console.log('  URL:', url);
      console.log('  User Token Available:', !!userToken);
      console.log('  Token Length:', userToken ? userToken.length : 0);
      
      // SÄKERHET: Kräv användartoken för åtkomst
      if (!userToken) {
        throw new Error('🔐 Authentication required: User must be logged in to access SharePoint data');
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'X-User-Context': 'true', // Signal to Azure Function to use user context
      };

      console.log('  ✅ Adding Authorization header with Bearer token');
      console.log('  ✅ Using secure authenticated request');
      console.log('  Headers being sent:', Object.keys(headers));
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('📥 API Response:');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);
      console.log('  Headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response Error Body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response successful, data type:', typeof data);
      console.log('✅ Is array:', Array.isArray(data));
      console.log('✅ Data keys:', Object.keys(data));
      
      // Hantera olika responsformat från Azure Function
      if (Array.isArray(data)) {
        console.log('✅ Direct array response, length:', data.length);
        return data as T;
      } else if (data && data.value && Array.isArray(data.value)) {
        console.log('✅ OData response with value property, length:', data.value.length);
        return data.value as T;
      } else if (data && typeof data === 'object') {
        console.log('⚠️ Object response, trying to extract array...');
        // Försök hitta array-property
        const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayKeys.length > 0) {
          console.log('✅ Found array in property:', arrayKeys[0]);
          return data[arrayKeys[0]] as T;
        }
      }
      
      console.warn('⚠️ Unexpected data format, returning as-is');
      return data as T;
    } catch (error) {
      console.error('❌ API fetch error:', error);
      throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSharePointTickets(userToken?: string): Promise<SharePointTicket[]> {
    try {
      if (!userToken) {
        throw new Error('🔐 Authentication required: Please log in to access your SharePoint tickets');
      }

      console.log('🎫 Fetching SharePoint tickets for authenticated user...');
      
      // API:et returnerar direkt en array, inte ett objekt med value property
      const data = await this.fetchFromApi<SharePointTicket[]>(API_CONFIG.ENDPOINTS.GET_SHAREPOINT_DATA, userToken);
      
      console.log('✅ Successfully retrieved tickets:', Array.isArray(data) ? data.length : 'invalid format');
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error fetching SharePoint tickets:', error);
      
      // För utveckling - kasta felet vidare för bättre debugging
      if (import.meta.env.DEV) {
        console.warn('🚧 Development mode - throwing error for debugging');
        throw error;
      }
      
      // I produktion - ge användarvänligt meddelande
      throw new Error('Could not load SharePoint data. Please check your permissions and try again.');
    }
  }

  // Helper method för att formatera datum
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper method för att extrahera displayName från complex objects
  getDisplayName(createdBy: SharePointTicket['CreatedBy']): string {
    return createdBy?.User?.DisplayName || 'Okänd användare';
  }

  // Helper method för att få email
  getEmail(createdBy: SharePointTicket['CreatedBy']): string {
    return createdBy?.User?.email || '';
  }
}

export const sharePointApi = new SharePointApiService();
export default sharePointApi;