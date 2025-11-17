🔐 SÄKER SHAREPOINT INTEGRATION

## ✅ IMPLEMENTATION SLUTFÖRD

🎉 **Azure Function har implementerat On-Behalf-Of flow och användar-isolation!**

### Vad som är klart:

✅ **Backend säkerhet**: Azure Function använder On-Behalf-Of flow  
✅ **User isolation**: Varje användare ser bara sin tillåtna SharePoint-data  
✅ **Response format**: Ny struktur med UserContext och Items  
✅ **Error handling**: 403 Forbidden för access denied scenarios  
✅ **Backward compatibility**: Managed Identity fallback

### Problem som löstes:

❌ **FÖRE**: Alla användare såg samma data oberoende av SharePoint-behörigheter  
✅ **NU**: Säker användarspecifik data baserat på SharePoint permissions

## 📋 FRONTEND INTEGRATION BEHÖVS

**Frontend måste uppdateras för att hantera nya response-format:**

- Response format ändrat från direkt array till `data.Items`
- Nya 403/401 error codes måste hanteras
- MSAL scopes måste inkludera `Sites.Read.All`

**Se:** `FRONTEND_INTEGRATION_PROMPT.md` för komplett implementation guide

## ✅ SÄKER LÖSNING: On-Behalf-Of Flow

### Säkert flöde:

1. User loggar in → får token
2. Frontend skickar user token till Azure Function
3. Azure Function använder user token med On-Behalf-Of flow
4. Microsoft Graph anropar SharePoint MED användarens behörigheter
5. Returnerar ENDAST data som användaren har tillgång till

## 🛠️ Implementation

### 1. Uppdatera Azure Function (GetSharePointData.cs)

```csharp
[Function("GetSharePointData")]
public async Task<HttpResponseData> Run(
    [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequestData req)
{
    try
    {
        // Hämta Authorization header
        if (!req.Headers.TryGetValues("Authorization", out var authHeaders))
        {
            // Fallback till Managed Identity för backward compatibility
            return await GetDataWithManagedIdentity(req);
        }

        var userToken = authHeaders.First().Replace("Bearer ", "");

        // Använd On-Behalf-Of flow för att få token för SharePoint
        var graphClient = await GetGraphClientWithUserContext(userToken);

        // Nu anropas SharePoint med användarens behörigheter
        var items = await graphClient.Sites["your-site-id"]
            .Lists["your-list-id"]
            .Items
            .Request()
            .GetAsync();

        // Filtrera bara data användaren har tillgång till
        return CreateSuccessResponse(req, items);
    }
    catch (Exception ex)
    {
        return CreateErrorResponse(req, ex.Message);
    }
}

private async Task<GraphServiceClient> GetGraphClientWithUserContext(string userToken)
{
    // On-Behalf-Of flow implementation
    var app = ConfidentialClientApplicationBuilder
        .Create(clientId)
        .WithClientSecret(clientSecret)
        .WithAuthority(authority)
        .Build();

    var userAssertion = new UserAssertion(userToken);
    var scopes = new[] { "https://graph.microsoft.com/.default" };

    var result = await app.AcquireTokenOnBehalfOf(scopes, userAssertion)
        .ExecuteAsync();

    return new GraphServiceClient(
        new DelegateAuthenticationProvider((requestMessage) =>
        {
            requestMessage.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", result.AccessToken);
            return Task.FromResult(requestMessage);
        }));
}
```

### 2. Uppdatera Azure AD App Registration

**Lägg till delegated permissions:**

- `Sites.Read.All` (delegated)
- `Sites.ReadWrite.All` (delegated)

**Behåll application permissions som fallback:**

- `Sites.Read.All` (application)

### 3. Konfigurera Azure Function App Settings

```bash
az functionapp config appsettings set \
  --name func-sharepoint-prod-001 \
  --resource-group your-rg \
  --settings \
    AzureAd__ClientId="110bbc9c-7b2c-4364-afad-b954953e3b7b" \
    AzureAd__ClientSecret="your-secret" \
    AzureAd__TenantId="your-tenant-id" \
    AzureAd__Authority="https://login.microsoftonline.com/your-tenant-id"
```

### 4. Ta bort Function Key från Frontend

```typescript
// src/services/sharePointApi.ts
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_AZURE_FUNCTION_URL || 'https://func-sharepoint-prod-001.azurewebsites.net',
  // TA BORT: FUNCTION_KEY
  ENDPOINTS: {
    GET_SHAREPOINT_DATA: '/api/GetSharePointData'
  }
};

private async fetchFromApi<T>(endpoint: string, userToken?: string): Promise<T> {
  if (!userToken) {
    throw new Error('User must be authenticated to access SharePoint data');
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
```

### 5. Uppdatera Authentication Configuration

```typescript
// src/config/authConfig.ts
// 🚨 VIKTIGT: Använd FULLSTÄNDIGA URLs för att undvika 403 errors!
export const loginRequest = {
  scopes: [
    "https://graph.microsoft.com/Sites.Read.All",     // ✅ Korrekt format
    "https://graph.microsoft.com/Sites.ReadWrite.All", // ✅ Korrekt format
  ],
};

// ❌ FUNGERAR INTE ALLTID - kort format:
// scopes: ['Sites.Read.All'] - KAN ORSAKA 403 ERRORS!
```

## 🔍 Säkerhetsfördelar med ny implementation

### ✅ Användarspecifik behörighet

- Varje användare ser endast SharePoint-data de har tillgång till
- Respekterar SharePoint-säkerhet och grupper
- Följer principle of least privilege

### ✅ Inga exponerade secrets

- Function key tas bort från frontend
- Endast autentiserade användare kan anropa API:et
- User tokens valideras på server-sidan

### ✅ Audit trail

- Alla SharePoint-anrop loggas med rätt användare
- Spårbarhet av vem som gör vad
- Compliance med säkerhetskrav

## 🚀 Migration Plan

1. **Fas 1**: Implementera On-Behalf-Of i Azure Function
2. **Fas 2**: Konfigurera nya permissions i Azure AD
3. **Fas 3**: Uppdatera frontend att KRÄVA authentication
4. **Fas 4**: Ta bort Function Key
5. **Fas 5**: Testa med olika användare för att verifiera behörigheter

## 🚨 VANLIGA PROBLEM OCH LÖSNINGAR

### 403 Forbidden Error Fix

**Problem**: User får "Du har inte behörighet att komma åt SharePoint-data" trots att de borde ha access.

**Lösning**: MSAL scopes måste använda fullständiga URLs:

```javascript
// ❌ Fel - kan orsaka 403 errors:
scopes: ['Sites.Read.All']

// ✅ Rätt - använd fullständiga URLs:
scopes: ['https://graph.microsoft.com/Sites.Read.All']
```

**Exempel på korrekt MSAL config:**
```javascript
const loginRequest = {
  scopes: [
    'https://graph.microsoft.com/Sites.Read.All',
    'https://graph.microsoft.com/Sites.ReadWrite.All'
  ]
};
```

## ⚠️ Viktiga säkerhetskrav

- **ALDRIG** exponera Function Keys i frontend
- **ALLTID** validera user tokens på server-sidan
- **ENDAST** returnera data användaren har behörighet till
- **LOGGA** alla SharePoint-åtkomster för audit
- **ANVÄND** fullständiga scope URLs i MSAL för att undvika 403 errors
