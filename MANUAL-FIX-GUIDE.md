# 🛠️ **MANUAL FIX GUIDE - Azure Function Permissions**

## 🎯 **Root Cause of 500 Error**

Your Azure Function is failing because the **Managed Identity doesn't have permissions** to access Microsoft Graph API for SharePoint.

## 📋 **Step-by-Step Fix (Azure Portal)**

### **Step 1: Open Azure Portal**

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for **"func-sharepoint-prod-001"**
3. Click on your Function App

### **Step 2: Enable Managed Identity (Already Done)**

✅ **VERIFIED:** Your Function App already has System Assigned Managed Identity enabled:

- Principal ID: `6e5844bc-5996-48a7-a3b4-c4d3c4c0c5f8`
- Tenant ID: `14f493f8-7990-4a8d-9885-37e35f0fe7d3`

### **Step 3: Assign Microsoft Graph Permissions**

#### **Option A: Via Azure Portal (Recommended)**

1. **Navigate to Azure Active Directory:**

   - In Azure Portal, search for **"Azure Active Directory"**
   - Go to **Enterprise Applications**
   - Search for **"func-sharepoint-prod-001"**
   - Click on your Function App's managed identity

2. **Assign Permissions:**
   - Go to **Permissions** (or **API Permissions**)
   - Click **"Add a permission"**
   - Select **Microsoft Graph**
   - Choose **Application permissions**
   - Search for and select:
     - `Sites.Read.All`
     - `Sites.ReadWrite.All` (if you need write access)
   - Click **"Add permissions"**
   - Click **"Grant admin consent"** ⚠️ **IMPORTANT**

#### **Option B: Via PowerShell (Advanced)**

```powershell
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Application.ReadWrite.All", "AppRoleAssignment.ReadWrite.All"

# Get the Function App's managed identity
$functionAppSP = Get-MgServicePrincipal -Filter "displayName eq 'func-sharepoint-prod-001'"

# Get Microsoft Graph service principal
$graphSP = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"

# Find the Sites.Read.All role
$sitesReadAllRole = $graphSP.AppRoles | Where-Object {$_.Value -eq "Sites.Read.All"}

# Assign the permission
New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $functionAppSP.Id -PrincipalId $functionAppSP.Id -ResourceId $graphSP.Id -AppRoleId $sitesReadAllRole.Id
```

---

## 🧪 **Test After Permission Assignment**

### **Test 1: Function Endpoint**

```bash
# Test the Function directly
curl -X GET "https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net/api/GetSharePointData?code=xo6_67J3Bs7xR40dznwcV_yQhNn4bi38Ikw_Xfc1r1kvAzFu3Hb1nw=="
```

**Expected Success Response:**

```json
{
  "AuthenticationType": "ManagedIdentity",
  "ItemCount": 5,
  "Items": [
    {
      "id": "164",
      "createdBy": {...},
      "fields": {...}
    }
  ]
}
```

### **Test 2: Frontend Integration**

After GitHub Actions completes (~5 minutes):

1. Visit: https://white-field-0b0ad7303.3.azurestaticapps.net
2. Try to login
3. Should see SharePoint data

---

## ⚡ **Quick Alternative: PowerShell Command**

If you prefer command line, run this in PowerShell:

```powershell
# Install Microsoft Graph PowerShell if needed
Install-Module Microsoft.Graph -Scope CurrentUser

# Connect and assign permission
Connect-MgGraph -Scopes "Application.ReadWrite.All"
$sp = Get-MgServicePrincipal -Filter "displayName eq 'func-sharepoint-prod-001'"
$graph = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"
$role = $graph.AppRoles | Where-Object {$_.Value -eq "Sites.Read.All"}
New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -PrincipalId $sp.Id -ResourceId $graph.Id -AppRoleId $role.Id
```

---

## 📊 **Current Status**

| Issue                    | Status      | Solution                        |
| ------------------------ | ----------- | ------------------------------- |
| ✅ Azure Function Config | FIXED       | Azure AD settings added         |
| ✅ Frontend Auth Config  | DEPLOYED    | GitHub Actions running          |
| ⚠️ Graph Permissions     | **PENDING** | **← YOU ARE HERE**              |
| ❌ 500 Error             | ACTIVE      | Will fix after permissions      |
| ❌ 400 Error             | ACTIVE      | Should fix with frontend update |

---

## 🎯 **Expected Timeline**

- **NOW:** Assign Microsoft Graph permissions (5 minutes)
- **+5 min:** Test Azure Function - should return data instead of 500 error
- **+10 min:** Frontend authentication update deployed
- **+15 min:** Full end-to-end flow working

**The permission assignment is the final missing piece to resolve the 500 error! 🚀**
