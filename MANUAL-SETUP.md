# 🚀 Azure Static Web App - Manual Setup Guide

## Problem med automatisk script
Scriptet kräver GitHub-autentisering som kan vara komplex. Här är den enklaste manuella metoden:

## 📋 Steg 1: Push kod till GitHub

Först, skapa ett nytt repository på GitHub och push din kod:

```bash
# Om du inte redan har en GitHub remote
git remote add origin https://github.com/mifran1973/swa-sharepoint-prod-001.git
git push -u origin main
```

## 📋 Steg 2: Skapa Static Web App via Azure Portal

### 2.1 Öppna Azure Portal
- Gå till [portal.azure.com](https://portal.azure.com)
- Klicka "Create a resource"
- Sök efter "Static Web App"

### 2.2 Konfigurera Static Web App
**Basics:**
- Subscription: Din Azure subscription
- Resource Group: `func-sharepoint-prod-001_group` (samma som din Function App)
- Name: `swa-sharepoint-dashboard`
- Plan type: `Free`
- Region: `West Europe`

**Deployment:**
- Source: `GitHub`
- Organization: `mifran1973`
- Repository: `swa-sharepoint-prod-001`
- Branch: `main`

**Build Details:**
- Build Presets: `React`
- App location: `/` (root)
- Api location: (lämna tom)
- Output location: `dist`

### 2.3 Klicka "Review + Create"
Azure skapar Static Web App och konfigurerar GitHub Actions automatiskt.

## 📋 Steg 3: Konfigurera Environment Variables

Efter deployment:

### 3.1 I Azure Portal:
- Gå till din Static Web App
- Välj "Configuration" i vänster meny
- Klicka "Add" under Application settings
- Lägg till:
  - **Name:** `VITE_AZURE_FUNCTION_URL`
  - **Value:** `https://func-sharepoint-prod-001.azurewebsites.net`
- Klicka "Save"

## 📋 Steg 4: Konfigurera CORS på Function App

### 4.1 I Azure Portal:
- Gå till din Function App (`func-sharepoint-prod-001`)
- Välj "CORS" i vänster meny under API
- Lägg till din Static Web App URL (kommer från steg 2)
- Exempel: `https://swa-sharepoint-dashboard.azurestaticapps.net`
- Klicka "Save"

## 📋 Steg 5: Testa deployment

1. Vänta på GitHub Actions (ca 2-5 minuter)
2. Besök din Static Web App URL
3. Kontrollera att tickets laddas från SharePoint

## 🔍 Felsökning

### Om du ser mock data:
1. Kontrollera environment variables i Static Web App
2. Verifiera CORS-inställningar på Function App
3. Testa Function App URL direkt i webbläsare

### GitHub Actions fel:
1. Kontrollera att repository är publikt eller att GitHub Actions har rätt permissions
2. Kolla GitHub Actions logs under "Actions" tab i ditt repository

### CORS fel i browser console:
1. Lägg till Static Web App URL i Function App CORS
2. Lägg till både `https://` och `http://localhost:5174` för utveckling

## ✅ Färdig!

När allt fungerar har du:
- ✅ Static Web App som visar SharePoint tickets
- ✅ Automatisk deployment från GitHub
- ✅ Integration med din befintliga Function App
- ✅ Samma managed identity och behörigheter som innan