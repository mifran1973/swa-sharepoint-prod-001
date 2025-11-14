# Azure Deployment Guide

## Förutsättningar

- Azure CLI installerat och inloggat (`az login`)
- GitHub repository (skapa ett och push:a denna kod)
- Azure Function App redan deployad (din `func-sharepoint-prod-001`)

## Steg 1: Skapa Static Web App med Azure CLI

```bash
# Logga in på Azure
az login

# Skapa resource group (om du inte redan har en)
az group create --name rg-sharepoint-dashboard --location "West Europe"

# Skapa Static Web App
az staticwebapp create \
  --name swa-sharepoint-dashboard \
  --resource-group rg-sharepoint-dashboard \
  --source https://github.com/YOUR-USERNAME/swa-sharepoint-prod-001 \
  --location "West Europe" \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

## Steg 2: Konfigurera Environment Variables

Efter deployment, lägg till environment variables:

```bash
# Sätt Azure Function URL
az staticwebapp appsettings set \
  --name swa-sharepoint-dashboard \
  --setting-names VITE_AZURE_FUNCTION_URL="https://func-sharepoint-prod-001.azurewebsites.net"
```

## Steg 3: Konfigurera CORS på Azure Function

Lägg till Static Web App URL till CORS på din Function App:

```bash
# Lägg till Static Web App URL till CORS
az functionapp cors add \
  --name func-sharepoint-prod-001 \
  --resource-group din-rg \
  --allowed-origins "https://swa-sharepoint-dashboard.azurestaticapps.net"
```

## Alternativ: Via Azure Portal

### 1. Skapa Static Web App

- Gå till Azure Portal → Create Resource → Static Web App
- Koppla till ditt GitHub repository
- Sätt build settings:
  - App location: `/`
  - Output location: `dist`
  - Api location: (lämna tom)

### 2. Environment Variables

- Gå till Static Web App → Configuration
- Lägg till: `VITE_AZURE_FUNCTION_URL` = `https://func-sharepoint-prod-001.azurewebsites.net`

### 3. CORS på Function App

- Gå till Function App → CORS
- Lägg till: `https://din-static-web-app.azurestaticapps.net`

## GitHub Actions

GitHub Actions workflow är redan konfigurerad i `.github/workflows/azure-static-web-apps.yml`

Du behöver bara lägga till dessa secrets i GitHub:

- `AZURE_STATIC_WEB_APPS_API_TOKEN` (från Azure Portal)
- `VITE_AZURE_FUNCTION_URL` (din Function App URL)

## Test efter deployment

1. Vänta tills GitHub Actions deployment är klar
2. Besök din Static Web App URL
3. Kontrollera att tickets visas från din Azure Function
4. Om du ser mock data, kolla environment variables och CORS

## Felsökning

### CORS fel

```bash
# Kolla CORS inställningar
az functionapp cors show --name func-sharepoint-prod-001 --resource-group din-rg

# Lägg till specifika origins
az functionapp cors add --name func-sharepoint-prod-001 --resource-group din-rg --allowed-origins "https://din-swa.azurestaticapps.net"
```

### Environment Variables

```bash
# Lista alla app settings
az staticwebapp appsettings list --name swa-sharepoint-dashboard

# Lägg till/uppdatera setting
az staticwebapp appsettings set --name swa-sharepoint-dashboard --setting-names KEY=VALUE
```
