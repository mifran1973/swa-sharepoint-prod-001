# Azure Static Web App Deployment Script (PowerShell)
# Detta script deployar Static Web App och konfigurerar koppling till Azure Function

# Konfigurera variabler
$ResourceGroup = "func-sharepoint-prod-001_group"
$StaticWebAppName = "swa-sharepoint-dashboard"
$FunctionAppName = "func-sharepoint-prod-001"
$Location = "West Europe"
$GitHubRepoUrl = "https://github.com/mifran1973/swa-sharepoint-prod-001"  # Uppdatera detta!

Write-Host "🚀 Deployar SharePoint Dashboard till Azure Static Web Apps..." -ForegroundColor Green

# Kontrollera att Azure CLI ar inloggat
try {
    az account show | Out-Null
    Write-Host "✅ Azure CLI ar inloggat" -ForegroundColor Green
}
catch {
    Write-Host "❌ Du ar inte inloggad pa Azure CLI. Kor 'az login' forst." -ForegroundColor Red
    exit 1
}

# Skapa resource group om den inte finns
Write-Host "📁 Skapar/kontrollerar resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none

# Skapa Static Web App
Write-Host "🌐 Skapar Static Web App..." -ForegroundColor Yellow
az staticwebapp create `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --source $GitHubRepoUrl `
    --location $Location `
    --branch main `
    --app-location "/" `
    --output-location "dist" `
    --login-with-github

# Fa URL for Function App
$FunctionUrl = "https://$FunctionAppName.azurewebsites.net"

# Satt environment variables
Write-Host "⚙️ Konfigurerar environment variables..." -ForegroundColor Yellow
az staticwebapp appsettings set `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --setting-names "VITE_AZURE_FUNCTION_URL=$FunctionUrl"

# Fa Static Web App URL
$SwaUrl = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroup --query "defaultHostname" -o tsv
$FullSwaUrl = "https://$SwaUrl"

# Konfigurera CORS pa Function App
Write-Host "🔗 Konfigurerar CORS pa Function App..." -ForegroundColor Yellow
az functionapp cors add `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --allowed-origins $FullSwaUrl

Write-Host ""
Write-Host "🎉 Deployment klar!" -ForegroundColor Green
Write-Host "📱 Static Web App URL: $FullSwaUrl" -ForegroundColor Cyan
Write-Host "🔧 Function App URL: $FunctionUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Nästa steg:" -ForegroundColor Yellow
Write-Host "1. Vanta tills GitHub Actions deployment ar klar (cirka 2-5 min)"
Write-Host "2. Besok din app pa: $FullSwaUrl"
Write-Host "3. Kontrollera att tickets laddas fran SharePoint"
Write-Host ""
Write-Host "🔍 Om du ser mock data istallet for riktiga tickets:" -ForegroundColor Yellow
Write-Host "   - Kontrollera CORS installningar pa Function App"
Write-Host "   - Verifiera att Function App ar tillganglig"
Write-Host "   - Kolla environment variables i Static Web App"