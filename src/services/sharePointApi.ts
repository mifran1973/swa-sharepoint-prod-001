import type { SharePointTicket } from '../types/sharepoint';

// Configuration
const API_CONFIG = {
  // För utveckling och produktion - automatisk identifiering av miljö
  BASE_URL: import.meta.env.VITE_AZURE_FUNCTION_URL || 'https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net',
  FUNCTION_KEY: import.meta.env.VITE_FUNCTION_KEY || 'xo6_67J3Bs7xR40dznwcV_yQhNn4bi38Ikw_Xfc1r1kvAzFu3Hb1nw==',
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
      
      // Lägg till function key för säkerhet
      const urlWithKey = API_CONFIG.FUNCTION_KEY 
        ? `${url}?code=${API_CONFIG.FUNCTION_KEY}`
        : url;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // If userToken is provided, add it to Authorization header for user context
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
        headers['X-User-Context'] = 'true'; // Signal to Azure Function to use user context
        headers['X-Ms-Client-Principal-Name'] = 'user'; // Additional Azure Functions header
        console.log('  ✅ Adding Authorization header with Bearer token');
        console.log('  ✅ Adding X-User-Context header');
      } else {
        console.log('  ⚠️ No user token - using function key only');
      }
      
      console.log('  Headers being sent:', Object.keys(headers));
      console.log('  Final URL:', urlWithKey.replace(API_CONFIG.FUNCTION_KEY || '', '***'));
      
      const response = await fetch(urlWithKey, {
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
      console.log('✅ API Response successful, data length:', Array.isArray(data) ? data.length : 'not array');
      return data;
    } catch (error) {
      console.error('❌ API fetch error:', error);
      throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSharePointTickets(userToken?: string): Promise<SharePointTicket[]> {
    try {
      // API:et returnerar direkt en array, inte ett objekt med value property
      const data = await this.fetchFromApi<SharePointTicket[]>(API_CONFIG.ENDPOINTS.GET_SHAREPOINT_DATA, userToken);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching SharePoint tickets:', error);
      
      // För utveckling - returnera mock data om API:et inte är tillgängligt
      if (import.meta.env.DEV) {
        console.warn('Using mock data for development');
        return this.getMockData();
      }
      
      throw error;
    }
  }

  // Mock data för utveckling
  private getMockData(): SharePointTicket[] {
    return [
      {
        Id: "1",
        CreatedBy: {
          User: {
            DisplayName: "Mikael Fransson",
            Id: "55cef879-3c26-4d37-b476-abc4c93aa721",
            email: "mifran@xzk57.onmicrosoft.com"
          }
        },
        CreatedDateTime: "2023-08-30T07:15:34+00:00",
        LastModifiedBy: {
          User: {
            DisplayName: "Mikael Fransson",
            Id: "55cef879-3c26-4d37-b476-abc4c93aa721",
            email: "mifran@xzk57.onmicrosoft.com"
          },
          Application: {
            DisplayName: "Koll 365 Ticketing System",
            Id: "9f7ee4a9-cbdc-4cd2-bfd2-b548fa3fcf25"
          }
        },
        LastModifiedDateTime: "2024-10-18T11:47:38+00:00",
        ContentType: {
          Id: "0x0100D3828DB838A7954F9B6650DD3425CE27",
          Name: "Item"
        },
        ParentReference: {
          Id: "1f68eeb7-b86d-4bbb-85b9-d17a3bfa9ddd",
          SiteId: "xzk57.sharepoint.com,662692cc-5daf-4766-85d8-8051823dfffa,63b107f3-3092-4203-bcdd-05ef41aad476"
        },
        WebUrl: "https://xzk57.sharepoint.com/sites/itsupport/Lists/Tickets/1_.000",
        ETag: "\"e95841cb-57dd-4d24-b7e4-7e8fc2654577,2\"",
        Fields: {
          Title: "Test Ticket 1",
          Description: "Detta är en test ticket",
          Status: "Öppen",
          Priority: "Medium"
        }
      },
      {
        Id: "2",
        CreatedBy: {
          User: {
            DisplayName: "Mikael Fransson",
            Id: "55cef879-3c26-4d37-b476-abc4c93aa721",
            email: "mifran@xzk57.onmicrosoft.com"
          }
        },
        CreatedDateTime: "2023-08-30T07:15:34+00:00",
        LastModifiedBy: {
          User: {
            DisplayName: "Mikael Fransson",
            Id: "55cef879-3c26-4d37-b476-abc4c93aa721",
            email: "mifran@xzk57.onmicrosoft.com"
          }
        },
        LastModifiedDateTime: "2024-10-18T11:47:42+00:00",
        ContentType: {
          Id: "0x0100D3828DB838A7954F9B6650DD3425CE27",
          Name: "Item"
        },
        ParentReference: {
          Id: "1f68eeb7-b86d-4bbb-85b9-d17a3bfa9ddd",
          SiteId: "xzk57.sharepoint.com,662692cc-5daf-4766-85d8-8051823dfffa,63b107f3-3092-4203-bcdd-05ef41aad476"
        },
        WebUrl: "https://xzk57.sharepoint.com/sites/itsupport/Lists/Tickets/2_.000",
        ETag: "\"fb31b738-529a-407f-a4f4-c32d1f3224e2,2\"",
        Fields: {
          Title: "Test Ticket 2",
          Description: "En annan test ticket",
          Status: "Pågående",
          Priority: "Hög"
        }
      }
    ];
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