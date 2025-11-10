# Azure Static Web App Deployment Script (PowerShell)
# This script deploys Static Web App and configures connection to Azure Function

# Configure variables
$ResourceGroup = "func-sharepoint-prod-001_group"
$StaticWebAppName = "swa-sharepoint-dashboard"
$FunctionAppName = "func-sharepoint-prod-001"
$Location = "West Europe"
$GitHubRepoUrl = "https://github.com/mifran1973/swa-sharepoint-prod-001"

Write-Host "🚀 Deploying SharePoint Dashboard to Azure Static Web Apps..." -ForegroundColor Green

# Check if Azure CLI is logged in
try {
    az account show | Out-Null
    Write-Host "✅ Azure CLI is logged in" -ForegroundColor Green
}
catch {
    Write-Host "❌ You are not logged in to Azure CLI. Run 'az login' first." -ForegroundColor Red
    exit 1
}

# Create resource group if it doesn't exist
Write-Host "📁 Creating/checking resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none

# Create Static Web App
Write-Host "🌐 Creating Static Web App..." -ForegroundColor Yellow
az staticwebapp create `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --source $GitHubRepoUrl `
    --location $Location `
    --branch main `
    --app-location "/" `
    --output-location "dist" `
    --login-with-github

# Get Function App URL
$FunctionUrl = "https://$FunctionAppName.azurewebsites.net"

# Set environment variables
Write-Host "⚙️ Configuring environment variables..." -ForegroundColor Yellow
az staticwebapp appsettings set `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --setting-names "VITE_AZURE_FUNCTION_URL=$FunctionUrl"

# Get Static Web App URL
$SwaUrl = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroup --query "defaultHostname" -o tsv
$FullSwaUrl = "https://$SwaUrl"

# Configure CORS on Function App
Write-Host "🔗 Configuring CORS on Function App..." -ForegroundColor Yellow
az functionapp cors add `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --allowed-origins $FullSwaUrl

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "📱 Static Web App URL: $FullSwaUrl" -ForegroundColor Cyan
Write-Host "🔧 Function App URL: $FunctionUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait for GitHub Actions deployment to complete (about 2-5 minutes)"
Write-Host "2. Visit your app at: $FullSwaUrl"
Write-Host "3. Verify that tickets load from SharePoint"
Write-Host ""
Write-Host "🔍 If you see mock data instead of real tickets:" -ForegroundColor Yellow
Write-Host "   - Check CORS settings on Function App"
Write-Host "   - Verify that Function App is accessible"
Write-Host "   - Check environment variables in Static Web App"