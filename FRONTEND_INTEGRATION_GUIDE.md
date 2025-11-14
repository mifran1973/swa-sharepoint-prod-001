# 🔐 Frontend Integration Guide - Säker SharePoint API

## 📊 Aktuell Implementation Status

### ✅ REDAN IMPLEMENTERAT i Frontend:

- **Obligatorisk Authentication**: `userToken` krävs för alla API-anrop
- **Authorization Header**: `Authorization: Bearer <token>` skickas till Azure Function
- **Säker felhantering**: Inga API-anrop utan giltig användartoken
- **User-specific data**: Respekterar SharePoint-behörigheter
- **Förbättrad dataformat-hantering**: Hanterar olika response-format

## 🚨 VIKTIGT: Azure Function Implementation

**Frontend är säkrad men Azure Function behöver uppdateras!**

Nuvarande Azure Function använder fortfarande **Managed Identity** vilket betyder:

- ❌ Alla användare ser samma data
- ❌ SharePoint-behörigheter ignoreras
- ❌ Ingen användarisolering

**Lösning:** Implementera On-Behalf-Of flow i Azure Function (se `AZURE_FUNCTION_OBO_IMPLEMENTATION.md`)

## 📋 Frontend API Implementation

### Current Request Format:

```typescript
// sharePointApi.ts
const headers: HeadersInit = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${userToken}`, // ✅ User token required
  "X-User-Context": "true", // ✅ Signal for user context
};

const response = await fetch(url, {
  method: "GET",
  headers,
});
```

### Expected Response Format (efter Azure Function OBO implementation):

```json
{
  "AuthenticationType": "OnBehalfOf",
  "UserContext": {
    "Name": "Mikael Fransson",
    "UPN": "mikael@example.com",
    "TenantId": "14f493f8-7990-4a8d-9885-37e35f0fe7d3"
  },
  "Items": [
    {
      "Id": "123",
      "Fields": {
        "Title": "Ticket titel",
        "Description": "Beskrivning...",
        "Priority": "Hög"
      },
      "CreatedBy": { ... },
      "LastModifiedDateTime": "2025-11-14T10:00:00Z"
    }
  ],
  "SecurityNote": "Data filtered based on user SharePoint permissions"
}
```

## 🔄 Response Handling

Frontend hanterar redan olika format:

```typescript
// Nuvarande implementation i sharePointApi.ts
if (Array.isArray(data)) {
  return data as T; // ✅ Direct array
} else if (data && data.value && Array.isArray(data.value)) {
  return data.value as T; // ✅ OData format
} else if (data && typeof data === "object") {
  // Försök hitta array-property                     // ✅ Nested arrays
  const arrayKeys = Object.keys(data).filter((key) => Array.isArray(data[key]));
  if (arrayKeys.length > 0) {
    return data[arrayKeys[0]] as T;
  }
}
```

**Efter Azure Function OBO implementation:** Data kommer finnas i `response.Items`

## 🚦 Error Handling

### Nuvarande felhantering:

- **❌ No token**: "Authentication required: Please log in"
- **❌ HTTP 500**: "Failed to fetch data"
- **❌ Network error**: "Could not load SharePoint data"

### Efter OBO implementation:

- **🔐 HTTP 401**: "Invalid or expired token"
- **🚫 HTTP 403**: "Insufficient SharePoint permissions"
- **✅ HTTP 200**: Användarbespecifik data returneras

## 🛠️ Required Azure Function Changes

### 1. Current Azure Function Problem:

```csharp
// NUVARANDE - Använder Managed Identity (DÅLIGT)
var graphClient = GraphServiceClientFactory.Create(credential);
// Alla användare ser samma data!
```

### 2. Krävd Azure Function Fix:

```csharp
// SÄKER - On-Behalf-Of flow
var userAssertion = new UserAssertion(userTokenFromHeader);
var result = await app.AcquireTokenOnBehalfOf(scopes, userAssertion).ExecuteAsync();
var graphClient = new GraphServiceClient(new CustomAuthProvider(result.AccessToken));
// Varje användare ser bara sin egen data!
```

## 📋 Test Scenarios

### ✅ Innan OBO implementation:

1. **Mikael loggar in** → Ser alla tickets (SÄKERHETSPROBLEM)
2. **Anna loggar in** → Ser samma tickets som Mikael (SÄKERHETSPROBLEM)
3. **Ej inloggad** → Fel: "Authentication required" ✅

### ✅ Efter OBO implementation:

1. **Mikael loggar in** → Ser endast tickets han har tillgång till ✅
2. **Anna loggar in** → Ser endast tickets hon har tillgång till ✅
3. **Ej inloggad** → Fel: "Authentication required" ✅

## 🎯 Frontend Team Actions Required

### ✅ KLART - Inga ändringar behövs:

- [x] Authorization header implementation
- [x] User token validation
- [x] Error handling för authentication
- [x] Säker API-kommunikation
- [x] Response format parsing

### ⏳ VÄNTAR PÅ - Azure Function Team:

- [ ] On-Behalf-Of flow implementation
- [ ] User token validation in Azure Function
- [ ] SharePoint permission enforcement
- [ ] Updated response format med user context

## 🔍 Monitoring & Debugging

### Console Logs (Development):

```typescript
console.log("🚀 API Request Details:");
console.log("  URL:", url);
console.log("  User Token Available:", !!userToken);
console.log("  Token Length:", userToken ? userToken.length : 0);
console.log("  ✅ Adding Authorization header with Bearer token");
```

### Production Monitoring:

- Azure Function Logs: Kontrollera OBO token exchange
- Application Insights: Användarspecifik telemetri
- SharePoint Logs: Verifiera behörighetskontroller

## 🚨 Security Checklist

### ✅ Frontend Security (KLART):

- [x] Function Key borttagen från kod
- [x] User authentication krävs
- [x] Token skickas säkert i Authorization header
- [x] Inga fallback till mock-data
- [x] Felhantering för unauthoriserad åtkomst

### ⏳ Backend Security (PENDING):

- [ ] On-Behalf-Of flow implementation
- [ ] User token validation
- [ ] SharePoint permission enforcement
- [ ] Audit logging med användaridentitet
- [ ] Token expiration handling

---

## 📞 Kontakt

**Frontend Team**: Implementationen är klar och säker! ✅  
**Backend Team**: Implementera On-Behalf-Of flow enligt `AZURE_FUNCTION_OBO_IMPLEMENTATION.md`

**Status**: Frontend väntar på säker backend implementation.
