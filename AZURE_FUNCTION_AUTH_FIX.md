# 🔧 AZURE FUNCTION AUTHENTICATION FIX

## 🚨 **PROBLEM IDENTIFIED**

**Error:** `AADSTS50013: Assertion failed signature validation`
**Root Cause:** Azure Function configuration mismatch between frontend and backend app registrations.

**Current State:**
- Frontend Client ID: `110bbc9c-7b2c-4364-afad-b954953e3b7b` ✅
- Backend shows: `00000000-0000-0000-0000-000000000000` ❌ (Missing/Wrong config)
- Certificate thumbprint: `AEDB054FE6FEECBB98EC355879234A70827B5677`

---

## ✅ **IMMEDIATE FIX REQUIRED**

### **Step 1: Configure Azure Function App Settings**

The Azure Function is missing proper Azure AD configuration. Run these commands:

```bash
# Configure Azure Function authentication settings
az functionapp config appsettings set \
  --name "func-sharepoint-prod-001" \
  --resource-group "func-sharepoint-prod-001_group" \
  --settings \
    "AzureAd__ClientId=110bbc9c-7b2c-4364-afad-b954953e3b7b" \
    "AzureAd__TenantId=14f493f8-7990-4a8d-9885-37e35f0fe7d3" \
    "AzureAd__Instance=https://login.microsoftonline.com/" \
    "AzureAd__Domain=xzk57.onmicrosoft.com" \
    "AzureAd__CallbackPath=/signin-oidc"
```

**✅ STATUS: COMPLETED** - Azure Function authentication settings have been configured successfully.

### **Step 2: Set Client Secret (REQUIRED)**

You need to create/get a client secret for the Azure Function:

```bash
# Create a new client secret (if needed)
az ad app credential reset \
  --id 110bbc9c-7b2c-4364-afad-b954953e3b7b \
  --display-name "AzureFunction-Secret"

# Set the client secret in Function App (COMPLETED)
# Client secret has been securely configured in Azure Function App
# ✅ AzureAd__ClientSecret: [CONFIGURED_SECURELY]
```

### **Step 3: Restart Function App**

After setting configuration, restart the Function App:

```bash
az functionapp restart \
  --name "func-sharepoint-prod-001" \
  --resource-group "func-sharepoint-prod-001_group"
```

**✅ STATUS: COMPLETED** - Azure Function has been restarted successfully.

---

## 🔍 **VERIFICATION STEPS**

### **1. Check Function App Configuration**

```bash
az functionapp config appsettings list \
  --name "func-sharepoint-prod-001-hmeqadf6h0g9cng8" \
  --resource-group "func-sharepoint-prod-001_group" \
  --query "[?contains(name, 'AzureAd')]"
```

Expected output should include:
```json
[
  {
    "name": "AzureAd__ClientId",
    "value": "110bbc9c-7b2c-4364-afad-b954953e3b7b"
  },
  {
    "name": "AzureAd__TenantId", 
    "value": "14f493f8-7990-4a8d-9885-37e35f0fe7d3"
  },
  {
    "name": "AzureAd__ClientSecret",
    "value": "[HIDDEN]"
  }
]
```

### **2. Test Function Authentication**

```bash
# Test the function after configuration
curl -X GET "https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net/api/GetSharePointData" \
  -H "Authorization: Bearer YOUR_USER_TOKEN_FROM_FRONTEND" \
  -H "Content-Type: application/json"
```

Expected: **NO MORE `AADSTS50013` errors**

---

## 🛠️ **ALTERNATIVE: Azure Portal Configuration**

If CLI doesn't work, use Azure Portal:

### **1. Navigate to Function App**
1. Go to Azure Portal → Function Apps
2. Select `func-sharepoint-prod-001-hmeqadf6h0g9cng8`
3. Go to **Configuration** → **Application Settings**

### **2. Add Missing Settings**
Click **+ New application setting** and add:

| Name | Value |
|------|-------|
| `AzureAd__ClientId` | `110bbc9c-7b2c-4364-afad-b954953e3b7b` |
| `AzureAd__TenantId` | `14f493f8-7990-4a8d-9885-37e35f0fe7d3` |
| `AzureAd__ClientSecret` | `[YOUR_SECRET_FROM_AZURE_AD_APP]` |
| `AzureAd__Instance` | `https://login.microsoftonline.com/` |

### **3. Save and Restart**
1. Click **Save**
2. Click **Restart** in Function App overview

---

## 📋 **AZURE AD APP REGISTRATION REQUIREMENTS**

Ensure your app registration `110bbc9c-7b2c-4364-afad-b954953e3b7b` has:

### **API Permissions:**
- Microsoft Graph:
  - `Sites.Read.All` (Application)
  - `Sites.Read.All` (Delegated)
  - `User.Read` (Delegated)

### **Certificates & secrets:**
- At least one active client secret

### **Authentication:**
- Platform configurations for Single-page application:
  - `https://white-field-0b0ad7303.3.azurestaticapps.net`
  - `http://localhost:5173` (development)

---

## 🎯 **EXPECTED RESULT**

After these fixes:

1. ✅ No more `AADSTS50013` certificate validation errors
2. ✅ Azure Function recognizes proper app ID (`110bbc9c-7b2c-4364-afad-b954953e3b7b`)
3. ✅ On-Behalf-Of flow works correctly
4. ✅ Users see SharePoint data with their own permissions

---

## ⚠️ **IMPORTANT NOTES**

### **Security:**
- Never store client secrets in code or frontend
- Client secret should only be in Azure Function App Settings
- Use managed identity when possible

### **Troubleshooting:**
- If errors persist, check Azure Function logs
- Verify certificate dates in Azure AD app registration
- Ensure Function App has latest configuration

### **Next Steps:**
Once configuration is fixed, the Azure Function should properly:
1. Accept user tokens from frontend
2. Use On-Behalf-Of flow to get SharePoint access
3. Return user-specific SharePoint data
4. No more authentication errors
