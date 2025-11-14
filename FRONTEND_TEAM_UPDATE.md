# 🚀 Frontend Integration - SharePoint API Säkerhetsuppdateringar

## 📢 VIKTIGT MEDDELANDE TILL FRONTEND TEAM

🎉 **Azure Function är nu LIVE med användarspecifik säkerhet!** 

✅ **BEKRÄFTAT FUNGERAR**: API:et implementerar nu On-Behalf-Of flow och användar-isolation  
🚨 **FRONTEND UPPDATERING BEHÖVS**: Response format har ändrats - se nedan

## 🔄 KRITISKA ÄNDRINGAR SOM KRÄVER FRONTEND-UPPDATERING

### **🚨 BREAKING CHANGE #1: Response Format**

#### ❌ **Före (direkt array):**
```javascript
const response = await fetch('/api/GetSharePointData');
const items = await response.json(); // Direkt array av SharePoint items
```

#### ✅ **Nu (objekt med Items property):**
```javascript
const response = await fetch('/api/GetSharePointData');
const data = await response.json(); 
const items = data.Items; // Array är nu inne i Items property
```

### **🚨 BREAKING CHANGE #2: Nya Error Codes**

**403 Forbidden**: Användaren har inte SharePoint-behörighet  
**Kräver**: Graceful error handling för access denied scenarios

### **🚨 BREAKING CHANGE #3: Token Scopes**

**MSAL måste begära `Sites.Read.All` scope** för SharePoint-åtkomst

---

## ✅ GODA NYHETER - DETTA FUNGERAR REDAN:

🎉 **Authorization Headers**: Frontend skickar redan `Authorization: Bearer <token>` - perfekt!  
🎉 **User Isolation**: API implementerar automatiskt användarspecifik data  
🎉 **Backward Compatibility**: Managed Identity fallback om tokens saknas

## 📋 EXAKT VAD FRONTEND BEHÖVER ÄNDRA

### **1. Uppdatera Response Parsing (OBLIGATORISKT)**

#### Nuvarande kod som INTE fungerar längre:
```javascript
const response = await fetch('/api/GetSharePointData', {
    headers: { 'Authorization': `Bearer ${userToken}` }
});
const items = await response.json(); // ❌ DETTA FUNGERAR INTE LÄNGRE
```

#### Uppdaterad kod som fungerar:
```javascript
const response = await fetch('/api/GetSharePointData', {
    headers: { 'Authorization': `Bearer ${userToken}` }
});
const data = await response.json();
const items = data.Items; // ✅ Items är nu inne i data-objektet

// Bonus - ny användarkontext tillgänglig:
console.log('Inloggad användare:', data.UserContext?.UserName);
console.log('Säkerhetstyp:', data.AuthenticationType);
console.log('Antal items:', data.ItemCount);
```

### **2. Lägg till 403 Forbidden Error Handling (OBLIGATORISKT)**

```javascript
const response = await fetch('/api/GetSharePointData', {
    headers: { 'Authorization': `Bearer ${userToken}` }
});

// Nya error codes som måste hanteras:
if (response.status === 403) {
    // ❌ Användaren har inte SharePoint-behörighet
    alert('Du har inte behörighet att komma åt denna SharePoint-data. Kontakta din IT-administrator.');
    return;
}

if (response.status === 401) {
    // ❌ Token expired eller ogiltig  
    await refreshUserToken();
    return;
}

if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
}

const data = await response.json();
const items = data.Items;
```

### **3. Verifiera MSAL Token Scopes (OBLIGATORISKT)**

Se till att din MSAL konfiguration begär rätt scope:

```javascript
// authConfig.js - kontrollera att detta scope finns:
const loginRequest = {
    scopes: [
        'Sites.Read.All'  // ✅ OBLIGATORISKT för SharePoint-åtkomst
    ]
};
```

### 3. **Komplett Implementation Example**

```javascript
class SharePointService {
  constructor(authService) {
    this.authService = authService;
    this.apiUrl = "/api/GetSharePointData";
  }

  async getSharePointData() {
    try {
      // Hämta user token (du gör redan detta!)
      const userToken = await this.authService.getAccessToken({
        scopes: ["Sites.Read.All"], // Se till att du begär rätt scopes
      });

      const response = await fetch(this.apiUrl, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      });

      // Hantera nya error codes
      if (response.status === 403) {
        throw new Error("Ingen behörighet till SharePoint-data");
      }

      if (response.status === 401) {
        throw new Error("Token expired - vänligen logga in igen");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Log säkerhetsinfo (användbart för debugging)
      console.log("SharePoint Access Info:", {
        user: data.UserContext.UserName,
        authType: data.AuthenticationType,
        itemCount: data.ItemCount,
        security: data.SecurityNote,
      });

      // Returnera items som tidigare
      return data.Items;
    } catch (error) {
      console.error("SharePoint fetch error:", error);
      this.handleSharePointError(error);
      throw error;
    }
  }

  handleSharePointError(error) {
    if (error.message.includes("403")) {
      alert(
        "Du har inte behörighet att komma åt denna SharePoint-data. Kontakta din IT-administrator."
      );
    } else if (error.message.includes("401")) {
      alert("Din session har gått ut. Vänligen logga in igen.");
      // Redirect to login
      window.location.href = "/login";
    } else {
      alert(
        "Ett fel uppstod vid hämtning av SharePoint-data. Försök igen senare."
      );
    }
  }
}

// Usage
const sharePointService = new SharePointService(yourAuthService);
const items = await sharePointService.getSharePointData();
// items innehåller nu endast data användaren har behörighet till! 🔒
```

## 🔍 VAD FRONTEND BEHÖVER TESTA

### **Test Scenarios:**

#### 1. **Normal User Access**

```javascript
// Test med giltig user token
const items = await sharePointService.getSharePointData();
console.log("Items för användare:", items.length);
```

#### 2. **Access Denied Scenario**

```javascript
// Test med user som inte har SharePoint access
// Förväntat: 403 error med user-friendly message
```

#### 3. **Token Expiry**

```javascript
// Test med expired token
// Förväntat: 401 error → token refresh → retry
```

#### 4. **User Isolation Testing**

```javascript
// Test med olika användarkonton
// Förväntat: Olika användare ser olika data
```

## 🎯 TOKEN SCOPES SOM KRÄVS

Se till att din MSAL/Auth konfiguration begär rätt scopes:

```javascript
const loginRequest = {
  scopes: [
    "Sites.Read.All", // OBLIGATORISK för SharePoint läsning
    "Sites.ReadWrite.All", // Om framtida skrivoperationer planeras
  ],
};
```

## 🚨 BREAKING CHANGES SAMMANFATTNING

| Aspekt              | Före                 | Efter                                              |
| ------------------- | -------------------- | -------------------------------------------------- |
| **Response Format** | `Array<ListItem>`    | `{ Items: Array<ListItem>, UserContext: {}, ... }` |
| **Data Access**     | Alla ser samma data  | User-specific data baserat på permissions          |
| **Error Codes**     | Endast 500/200       | Ny 403 Forbidden för access denied                 |
| **Security**        | Global system access | User isolation med On-Behalf-Of flow               |

## ✅ FRONTEND ÄNDRINGS-CHECKLIST

### **🚨 KRITISKT (Måste göras för att applikationen ska fungera):**
- [ ] **Response parsing**: Ändra `response.json()` till `response.json().Items`  
- [ ] **403 Error handling**: Lägg till graceful handling för access denied  
- [ ] **Token scopes**: Verifiera att `Sites.Read.All` begärs i MSAL config

### **📈 REKOMMENDERAT (För bättre användarupplevelse):**
- [ ] Logga användarkontext för debugging (`data.UserContext.UserName`)
- [ ] Visa antal items i UI (`data.ItemCount`)
- [ ] Implementera retry-logik för 401 errors
- [ ] Testa med olika användarkonton för att verifiera isolation

## 🎉 FÖRDELAR FÖR ANVÄNDARNA

✅ **Säkerhet**: Användare ser bara data de har behörighet till  
✅ **Prestanda**: Direkta SharePoint ID:n = snabbare respons  
✅ **Audit Trail**: Detaljerad logging av vem som kommer åt vad  
✅ **Reliability**: Managed Identity fallback om tokens saknas

## 🤝 SUPPORT

**Frågor?** Kontakta backend-teamet:

- Tekniska frågor om API-implementering
- Hjälp med Azure AD scope-konfiguration
- Testning av user isolation scenarios

**API fungerar redan nu** med dina befintliga Authorization headers! 🚀

---

_Uppdaterat: 2025-11-14_  
_Status: 🚨 BREAKING CHANGES IMPLEMENTERADE - Frontend uppdatering krävs omedelbart_  
_Azure Function: ✅ LIVE med On-Behalf-Of flow och användar-isolation_
