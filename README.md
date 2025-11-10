# SharePoint Tickets Dashboard - Static Web App

En modern React TypeScript-applikation som visar SharePoint tickets data från en Azure Function API. Byggt för deployment som Azure Static Web App.

## 🚀 Funktioner

- **Real-time dashboard** - Visar SharePoint tickets i en responsiv dashboard
- **Modern UI** - Glassmorphism design med gradients och animationer
- **TypeScript** - Fullständig type safety med SharePoint data models
- **Responsiv** - Fungerar perfekt på desktop, tablet och mobil
- **Error handling** - Robust felhantering med retry-funktionalitet
- **Live updates** - Refresh-knapp för att uppdatera data

## 🛠️ Teknisk Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Modern CSS med CSS Grid och Flexbox
- **API Integration:** Fetch API mot Azure Functions
- **Deployment:** Azure Static Web Apps

## 📋 Förutsättningar

Innan du börjar, se till att du har:
- Node.js (version 18 eller senare)
- npm eller yarn
- En fungerande Azure Function som servar SharePoint data
- VS Code (rekommenderat för utveckling)

## 🚀 Komma igång

### 1. Klona och installera
```bash
git clone <your-repo-url>
cd swa-sharepoint-prod-001
npm install
```

### 2. Konfigurera API
Uppdatera `.env` filen med din Azure Function URL:
```bash
# För lokal utveckling mot lokal Azure Function
VITE_AZURE_FUNCTION_URL=http://localhost:7071

# För produktion mot Azure Function App
VITE_AZURE_FUNCTION_URL=https://your-function-app.azurewebsites.net
```

### 3. Starta utvecklingsserver
```bash
npm run dev
```
Öppna [http://localhost:5173](http://localhost:5173) i din webbläsare.

### 4. Bygga för produktion
```bash
npm run build
```
Detta skapar en optimerad build i `dist/` mappen.

## 📁 Projektstruktur

```
src/
├── components/           # React komponenter
│   ├── TicketCard.tsx   # Komponent för individuella tickets
│   └── TicketDashboard.tsx # Huvuddashboard
├── services/            # API services
│   └── sharePointApi.ts # SharePoint API integration
├── types/              # TypeScript type definitions
│   └── sharepoint.ts   # SharePoint data models
├── App.tsx             # Huvudapplikation
├── App.css             # Styling
└── main.tsx            # Entry point
```

## 🔧 API Integration

Appen kommunicerar med en Azure Function som hämtar data från SharePoint via Microsoft Graph API:

### API Endpoint
```
GET /api/GetSharePointData
```

### Response Format
```typescript
SharePointTicket[] // Array av tickets från SharePoint
```

### Data Structure
Varje ticket innehåller:
- ID och metadata
- Skapad av/datum information  
- Senast ändrad av/datum
- Content Type
- SharePoint URL för direkt access

## 🎨 Design System

### Färgschema
- **Primär gradient:** `#667eea` → `#764ba2`
- **Accent färger:** `#4f46e5` (blå), `#10b981` (grön), `#dc2626` (röd)
- **Neutrale:** Vit bakgrund med glassmorphism effekter

### Komponenter
- **Ticket Cards:** Glassmorphism kort med hover-effekter
- **Dashboard Header:** Statistik och kontrolls area
- **Loading States:** Spinner och skelett UI
- **Error States:** Tydliga felmeddelanden med retry

## 🚀 Deployment till Azure Static Web Apps

### Via Azure Portal
1. Skapa en ny Static Web App i Azure Portal
2. Koppla till ditt GitHub repository
3. Konfigurera build settings:
   - **App location:** `/`
   - **Api location:** `` (tom, vi använder extern Azure Function)
   - **Output location:** `dist`

### Via Azure CLI
```bash
# Installera Azure CLI och logga in
az login

# Skapa Static Web App
az staticwebapp create \
  --name swa-sharepoint-dashboard \
  --resource-group your-rg \
  --source https://github.com/your-username/swa-sharepoint-prod-001 \
  --location "West Europe" \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

### Environment Variables i Azure
Konfigurera följande i Azure Static Web App settings:
```
VITE_AZURE_FUNCTION_URL=https://your-function-app.azurewebsites.net
```

## 🔐 CORS Konfiguration

Se till att din Azure Function har rätt CORS-inställningar för att tillåta requests från din Static Web App:

```json
{
  "cors": {
    "allowedOrigins": [
      "http://localhost:5173",
      "https://your-swa-app.azurestaticapps.net"
    ]
  }
}
```

## 🐛 Felsökning

### API Connection Issues
1. Kontrollera att `VITE_AZURE_FUNCTION_URL` är korrekt
2. Verifiera CORS-inställningar på Azure Function
3. Kolla att Azure Function körs och är tillgänglig

### Build Issues
1. Kör `npm run build` lokalt för att identifiera fel
2. Kontrollera TypeScript-fel i VS Code
3. Se till att alla dependencies är installerade

### Styling Issues
1. Kolla CSS vendor prefixes för äldre webbläsare
2. Testa i olika webbläsare och enheter
3. Verifiera responsiv design

## 📱 Browser Support

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+  
- ✅ Safari 14+
- ⚠️ IE inte stödd (använder moderna CSS-funktioner)

## 🤝 Bidrag

1. Fork projektet
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Commit dina ändringar (`git commit -m 'Add amazing feature'`)
4. Push till branch (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📄 Licens

Detta projekt är licensierat under MIT License - se [LICENSE](LICENSE) filen för detaljer.

## 🆘 Support

Om du stöter på problem:
1. Kolla [Issues](../../issues) för kända problem
2. Skapa ett nytt issue med detaljerad beskrivning
3. Inkludera browser/OS information och felmeddelanden