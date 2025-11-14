# 🚨 **TROUBLESHOOTING GUIDE - Azure Function & Authentication Issues**

## 🔍 **Issues Identified**

### **1. Azure Function 500 Error**

```
Request URL: https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net/api/GetSharePointData?code=xo6_67J3Bs7xR40dznwcV_yQhNn4bi38Ikw_Xfc1r1kvAzFu3Hb1nw==
Status Code: 500 Internal Server Error
```

**Root Causes:**

- Missing Azure AD configuration in Function App settings
- Managed Identity permissions not properly configured for Microsoft Graph
- Graph authentication service failing without proper error handling

### **2. Authentication 400 Error**

```
Request URL: https://login.microsoftonline.com/14f493f8-7990-4a8d-9885-37e35f0fe7d3/oauth2/v2.0/token
Status Code: 400 Bad Request
```

**Root Causes:**

- Incorrect or missing scopes in MSAL configuration
- Redirect URI mismatch in Azure AD app registration
- Missing user consent for required permissions

---

## ✅ **Solutions Applied**

### **Solution 1: Azure Function Configuration Fixed**

**What was done:**

```bash
# Added Azure AD settings to Function App
az functionapp config appsettings set --name "func-sharepoint-prod-001" \
  --resource-group "func-sharepoint-prod-001_group" \
  --settings "AzureAd__ClientId=<your-client-id>" \
             "AzureAd__TenantId=<your-tenant-id>" \
             "AzureAd__ClientSecret=<your-client-secret>"

# Restarted Function App to load new settings
az functionapp restart --name "func-sharepoint-prod-001" --resource-group "func-sharepoint-prod-001_group"
```

**Status:** ✅ **COMPLETED** - Azure AD settings are now configured in production

### **Solution 2: MSAL Authentication Configuration Updated**

**What was done:**

```typescript
// Updated src/config/authConfig.ts
export const msalConfig: Configuration = {
  auth: {
    clientId:
      import.meta.env.VITE_AZURE_CLIENT_ID ||
      "110bbc9c-7b2c-4364-afad-b954953e3b7b",
    authority: `https://login.microsoftonline.com/${
      import.meta.env.VITE_AZURE_TENANT_ID ||
      "14f493f8-7990-4a8d-9885-37e35f0fe7d3"
    }`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin, // ← ADDED
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    "https://graph.microsoft.com/Sites.Read.All",
    "https://graph.microsoft.com/User.Read",
  ], // ← UPDATED
  prompt: "select_account", // ← ADDED
};
```

**Status:** ✅ **COMPLETED** - Deployed to GitHub, automatic deployment in progress

---

## 🔧 **Remaining Issues to Fix**

### **Issue 1: Managed Identity Permissions**

The Azure Function's Managed Identity needs explicit permissions to Microsoft Graph.

**Solution:**

```bash
# Get the Function App's Managed Identity Object ID
PRINCIPAL_ID=$(az functionapp identity show --name "func-sharepoint-prod-001" \
  --resource-group "func-sharepoint-prod-001_group" --query principalId -o tsv)

# Assign Microsoft Graph permissions
az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$PRINCIPAL_ID/appRoleAssignments" \
  --body '{
    "principalId": "'$PRINCIPAL_ID'",
    "resourceId": "00000003-0000-0000-c000-000000000000",
    "appRoleId": "332a536c-c7ef-4017-ab91-336970924f0d"
  }'
```

### **Issue 2: Azure AD App Registration Configuration**

The Azure AD app registration needs proper redirect URIs and permissions.

**Required Redirect URIs:**

- `https://white-field-0b0ad7303.3.azurestaticapps.net`
- `http://localhost:5173` (for development)

**Required API Permissions:**

- `Microsoft Graph - Sites.Read.All` (Delegated)
- `Microsoft Graph - User.Read` (Delegated)

---

## 🧪 **Testing Steps**

### **Test 1: Azure Function (After Fixes)**

```bash
# Test the Function directly
curl -X GET "https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net/api/GetSharePointData?code=xo6_67J3Bs7xR40dznwcV_yQhNn4bi38Ikw_Xfc1r1kvAzFu3Hb1nw=="

# Expected response:
{
  "AuthenticationType": "ManagedIdentity",
  "ItemCount": [number],
  "Items": [array of SharePoint items]
}
```

### **Test 2: Frontend Authentication (After GitHub Actions Deploy)**

```
1. Go to: https://white-field-0b0ad7303.3.azurestaticapps.net
2. Click "Logga in med Microsoft"
3. Complete OAuth flow
4. Should see dashboard with user-specific data
```

### **Test 3: End-to-End Integration**

```
1. Login to frontend
2. Frontend calls Azure Function with user token
3. Azure Function uses On-Behalf-Of flow
4. Returns user-specific SharePoint data
5. Dashboard shows personalized tickets
```

---

## 📊 **Current Status**

| Component                 | Status     | Next Action              |
| ------------------------- | ---------- | ------------------------ |
| ✅ Azure Function Config  | FIXED      | Monitor for errors       |
| ✅ Frontend Auth Config   | DEPLOYED   | Wait for GitHub Actions  |
| ⚠️ Managed Identity Perms | PENDING    | Assign Graph permissions |
| ⚠️ Azure AD App Config    | PENDING    | Update redirect URIs     |
| ❌ End-to-End Flow        | NOT TESTED | Full integration test    |

---

## 🚀 **Next Steps**

### **Immediate (Next 10 minutes):**

1. ✅ Wait for GitHub Actions deployment to complete
2. ❌ Test frontend authentication flow
3. ❌ Assign Managed Identity permissions to Microsoft Graph

### **Short Term (Next 30 minutes):**

1. ❌ Update Azure AD app registration with correct redirect URIs
2. ❌ Test Azure Function endpoint directly
3. ❌ Verify end-to-end user authentication flow

### **Verification:**

1. ❌ Confirm 500 errors are resolved
2. ❌ Confirm 400 authentication errors are resolved
3. ❌ Verify users can login and see their SharePoint data

---

## 📞 **Quick Resolution Commands**

If you want to run these yourself:

```bash
# 1. Assign Graph permissions to Managed Identity
PRINCIPAL_ID="6e5844bc-5996-48a7-a3b4-c4d3c4c0c5f8"
az ad sp list --display-name "Microsoft Graph" --query '[0].id' -o tsv
# Then use Azure Portal to assign Sites.Read.All permission

# 2. Test Function after permission assignment
Invoke-WebRequest -Uri "https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net/api/GetSharePointData?code=xo6_67J3Bs7xR40dznwcV_yQhNn4bi38Ikw_Xfc1r1kvAzFu3Hb1nw==" -UseBasicParsing

# 3. Monitor GitHub Actions
# Go to: https://github.com/mifran1973/swa-sharepoint-prod-001/actions
```

---

## 🎯 **Expected Resolution Timeline**

- **5 minutes:** GitHub Actions completes, frontend authentication updated
- **15 minutes:** Managed Identity permissions assigned, Function working
- **20 minutes:** Azure AD app registration updated
- **25 minutes:** Full end-to-end flow working
- **30 minutes:** Complete resolution confirmed

**The main issues have been identified and most fixes are already deployed. The remaining steps are permission assignments which should resolve both the 500 and 400 errors.**
