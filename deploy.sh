#!/bin/bash

# Azure Static Web App Deployment Script
# Detta script deployar Static Web App och konfigurerar koppling till Azure Function

set -e

# Konfigurera variabler
RESOURCE_GROUP="rg-sharepoint-dashboard"
STATIC_WEB_APP_NAME="swa-sharepoint-dashboard"
FUNCTION_APP_NAME="func-sharepoint-prod-001"
LOCATION="West Europe"
GITHUB_REPO_URL="https://github.com/YOUR-USERNAME/swa-sharepoint-prod-001"  # Uppdatera detta!

echo "🚀 Deployar SharePoint Dashboard till Azure Static Web Apps..."

# Kontrollera att Azure CLI är inloggat
if ! az account show > /dev/null 2>&1; then
    echo "❌ Du är inte inloggad på Azure CLI. Kör 'az login' först."
    exit 1
fi

echo "✅ Azure CLI är inloggat"

# Skapa resource group om den inte finns
echo "📁 Skapar/kontrollerar resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION" --output none

# Skapa Static Web App
echo "🌐 Skapar Static Web App..."
az staticwebapp create \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --source $GITHUB_REPO_URL \
    --location "$LOCATION" \
    --branch main \
    --app-location "/" \
    --output-location "dist" \
    --login-with-github

# Få URL för Function App
FUNCTION_URL="https://${FUNCTION_APP_NAME}.azurewebsites.net"

# Sätt environment variables
echo "⚙️ Konfigurerar environment variables..."
az staticwebapp appsettings set \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --setting-names "VITE_AZURE_FUNCTION_URL=$FUNCTION_URL"

# Få Static Web App URL
SWA_URL=$(az staticwebapp show --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" -o tsv)
FULL_SWA_URL="https://$SWA_URL"

# Konfigurera CORS på Function App
echo "🔗 Konfigurerar CORS på Function App..."
az functionapp cors add \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --allowed-origins $FULL_SWA_URL

echo ""
echo "🎉 Deployment klar!"
echo "📱 Static Web App URL: $FULL_SWA_URL"
echo "🔧 Function App URL: $FUNCTION_URL"
echo ""
echo "📋 Nästa steg:"
echo "1. Vänta tills GitHub Actions deployment är klar (ca 2-5 min)"
echo "2. Besök din app på: $FULL_SWA_URL"
echo "3. Kontrollera att tickets laddas från SharePoint"
echo ""
echo "🔍 Om du ser mock data istället för riktiga tickets:"
echo "   - Kontrollera CORS inställningar på Function App"
echo "   - Verifiera att Function App är tillgänglig"
echo "   - Kolla environment variables i Static Web App"