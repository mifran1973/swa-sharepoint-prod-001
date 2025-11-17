# 🎯 FRONTEND INTEGRATION PROMPT - SharePoint API

## 📋 **COPY THIS PROMPT FOR FRONTEND DEVELOPMENT:**

````
SÄKER SHAREPOINT API INTEGRATION - ANVÄNDARSPECIFIK DATA

🔗 API ENDPOINT:
GET https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net/api/GetSharePointData

🔐 SÄKERHET:
- API garanterar user isolation via On-Behalf-Of flow
- Varje användare ser ENDAST SharePoint-data de har behörighet till
- Automatisk SharePoint permissions enforcement

📤 REQUEST FORMAT:
```javascript
const response = await fetch('/api/GetSharePointData', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${userAccessToken}`,  // Från MSAL
        'Content-Type': 'application/json'
    }
});
````

📥 RESPONSE FORMAT:

```json
{
  "AuthenticationType": "User", // "User" eller "ManagedIdentity"
  "UserContext": {
    "UserId": "guid",
    "UserName": "John Doe",
    "Email": "user@company.com"
  },
  "SecurityNote": "Data filtered by user SharePoint permissions",
  "Items": [
    /* SharePoint list items - ENDAST user-permitted data */
  ],
  "ItemCount": 15,
  "Timestamp": "2025-11-15T10:00:00Z"
}
```

❌ ERROR HANDLING:

- 403 Forbidden → User saknar SharePoint permissions → Visa felmeddelande
- 401 Unauthorized → Token expired/invalid → Förnya token eller omdirigera till login
- 500 Internal Server Error → System fel → Visa generiskt felmeddelande

🔑 MSAL KONFIGURATION - OBLIGATORISK:

```javascript
const loginRequest = {
  scopes: [
    "Sites.Read.All", // MÅSTE finnas för SharePoint-läsning
    "Sites.ReadWrite.All", // Om framtida skrivoperationer planeras
  ],
};
```

✅ IMPLEMENTATION STEG:

1. Konfigurera MSAL med Sites.Read.All scope
2. Hämta user access token från auth service
3. Skicka Authorization: Bearer header till API
4. Parse response.Items för SharePoint-data (EJ direkt array längre!)
5. Hantera 403/401 errors gracefully med user-friendly meddelanden
6. Log response.UserContext för audit trail

🔒 DATAGARANTI:
response.Items innehåller ENDAST SharePoint-data användaren har behörighet till.
Ingen risk för att se andras data - säkerhet garanterad av API.

📋 KOMPLETT KODEXEMPEL:

```javascript
class SharePointService {
  constructor(authService) {
    this.authService = authService;
    this.apiUrl =
      "https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net/api/GetSharePointData";
  }

  async getSharePointData() {
    try {
      // 1. Hämta user token med korrekt scope
      const token = await this.authService.getAccessToken({
        scopes: ["Sites.Read.All"],
      });

      // 2. API call med Authorization header
      const response = await fetch(this.apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // 3. Error handling
      if (response.status === 403) {
        throw new Error(
          "Du har inte behörighet att komma åt denna SharePoint-data. Kontakta IT-support."
        );
      }

      if (response.status === 401) {
        // Token expired - förnya eller omdirigera till login
        throw new Error("Din session har gått ut. Logga in igen.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `SharePoint API fel: ${response.status} - ${errorText}`
        );
      }

      // 4. Parse response - NY STRUKTUR!
      const data = await response.json();

      // 5. Security & audit logging
      console.log("SharePoint Access Info:", {
        user: data.UserContext.UserName,
        authType: data.AuthenticationType,
        itemCount: data.ItemCount,
        timestamp: data.Timestamp,
      });

      // 6. Returnera endast Items (user-specific data)
      return {
        items: data.Items, // SharePoint list items
        userInfo: data.UserContext, // User information
        authType: data.AuthenticationType, // Security context
        itemCount: data.ItemCount, // Number of accessible items
      };
    } catch (error) {
      console.error("SharePoint fetch error:", error);

      // User-friendly error handling
      if (error.message.includes("403")) {
        alert(
          "Du har inte behörighet att komma åt SharePoint-data. Kontakta din IT-administrator."
        );
      } else if (error.message.includes("401")) {
        alert("Din session har gått ut. Du omdirigeras till inloggning.");
        window.location.href = "/login";
      } else {
        alert(
          "Ett fel uppstod vid hämtning av SharePoint-data. Försök igen senare."
        );
      }

      throw error;
    }
  }
}

// ANVÄNDNING:
const authService = new MSALAuthService(); // Din befintliga auth service
const sharePointService = new SharePointService(authService);

try {
  const result = await sharePointService.getSharePointData();

  // result.items innehåller ENDAST data användaren har behörighet till!
  console.log(
    `Loaded ${result.itemCount} items for user: ${result.userInfo.UserName}`
  );

  // Visa data i UI
  displaySharePointItems(result.items);
} catch (error) {
  // Error handling already done in service
}
```

🧪 TESTSCENARIER:

1. User med SharePoint access → 200 OK med user-specific data
2. User utan SharePoint access → 403 Forbidden med felmeddelande
3. Expired token → 401 Unauthorized → token renewal
4. Olika användare → Olika data baserat på permissions

⚠️ BREAKING CHANGE:
Response är inte längre direkt array!
Gammalt: `const items = await response.json();`
Nytt: `const data = await response.json(); const items = data.Items;`

🎯 RESULTAT:
Efter implementation får varje användare endast SharePoint-data de har behörighet till.
User isolation och säkerhet garanterad av API:et.

```

## 🚀 **ANVÄND DENNA PROMPT DIREKT I FRONTEND UTVECKLING**

Kopiera blocket ovan och använd som prompt för frontend-utvecklare. Den innehåller:

✅ **Komplett API specification**
✅ **Säkerhetsgarantier och user isolation**
✅ **Copy-paste klar kod**
✅ **Error handling med user-friendly meddelanden**
✅ **MSAL konfiguration**
✅ **Breaking changes dokumentation**

**Frontend kommer att implementera säker, användarspecifik SharePoint-integration!** 🔐
```
