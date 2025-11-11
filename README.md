# 🚀 SharePoint Ticket Dashboard

En modern, säker och skalbar SharePoint-integration byggd med Azure Functions och React. Denna lösning visar SharePoint-tickets i en responsiv dashboard med real-time data från Microsoft Graph API.

## 📋 Översikt

Denna applikation består av två huvudkomponenter:
1. **Azure Function** - Backend API som hämtar data från SharePoint via Microsoft Graph
2. **React Dashboard** - Frontend som visar tickets i en modern, responsiv UI

## 🏗️ Arkitektur

```
┌─────────────────┐    HTTPS     ┌──────────────────┐    Graph API    ┌─────────────────┐
│                 │──────────────▶│                  │─────────────────▶│                 │
│  Static Web App │               │  Azure Function  │                  │   SharePoint    │
│   (React + TS)  │◀──────────────│   (.NET 8)       │◀─────────────────│   Online        │
│                 │    JSON       │                  │   Managed ID     │                 │
└─────────────────┘               └──────────────────┘                  └─────────────────┘
```

## ⚡ Funktioner

### 🎨 Frontend (React + TypeScript)
- **Modern UI Design** - Glassmorphism med gradient-bakgrunder
- **Responsiv Layout** - Fungerar på desktop, tablet och mobil
- **Real-time Data** - Visar aktuella SharePoint-tickets
- **Status Badges** - Visuell indikation av ticket-status
- **Error Handling** - Graceful fallback till mock data vid API-fel
- **TypeScript** - Typsäkerhet och bättre utvecklarupplevelse

### 🔧 Backend (Azure Functions)
- **Modern Graph SDK** - Använder Microsoft Graph SDK 5.x
- **Managed Identity** - Säker autentisering utan lösenord
- **Robust Error Handling** - Hantering av API-begränsningar och fel
- **.NET 8** - Senaste versionen för bästa prestanda
- **Function Key Security** - Skyddad API-access

### 🛡️ Säkerhet
- **Azure AD Integration** - Managed Identity för SharePoint-åtkomst
- **Function Key Authentication** - Säker API-access
- **CORS Configuration** - Begränsat till godkända domäner
- **Secret Management** - Säker hantering av API-nycklar via GitHub Secrets

### 🚀 DevOps & Deployment
- **GitHub Actions** - Automatisk CI/CD pipeline
- **Azure Static Web Apps** - Skalbar hosting med CDN
- **Environment Variables** - Säker konfigurationshantering
- **Branch Protection** - Konfigurerat för main branch

## 📂 Projektstruktur

```
swa-sharepoint-prod-001/
├── src/                          # React applikation
│   ├── components/               # React komponenter
│   │   ├── TicketDashboard.tsx   # Huvudkomponent för dashboard
│   │   └── TicketCard.tsx        # Komponent för individuella tickets
│   ├── services/                 # API services
│   │   └── sharePointApi.ts      # SharePoint API integration
│   ├── types/                    # TypeScript type definitions
│   │   └── sharepoint.ts         # SharePoint data types
│   ├── App.tsx                   # Huvudkomponent
│   ├── App.css                   # Styling med glassmorphism
│   └── main.tsx                  # Entry point
├── .github/workflows/            # GitHub Actions
│   └── azure-static-web-apps-*.yml
├── public/                       # Statiska filer
├── dist/                         # Build output (genereras)
├── package.json                  # NPM dependencies
├── tsconfig.json                 # TypeScript konfiguration
├── vite.config.ts               # Vite build konfiguration
└── MANUAL-SETUP.md              # Manuell setup guide
```

## 🔧 Installation & Setup

### Förutsättningar
- Node.js 18+
- Azure CLI
- Git
- Azure subscription med:
  - SharePoint Online
  - Azure Functions
  - Azure Static Web Apps

### 1. Klona Repository
```bash
git clone https://github.com/mifran1973/swa-sharepoint-prod-001.git
cd swa-sharepoint-prod-001
```

### 2. Installera Dependencies
```bash
npm install
```

### 3. Miljövariabler
Skapa `.env.local` för lokal utveckling:
```env
VITE_AZURE_FUNCTION_URL=https://your-function-app.azurewebsites.net
VITE_FUNCTION_KEY=your-function-key
```

### 4. Lokal Utveckling
```bash
npm run dev
```

Applikationen körs på `http://localhost:5174`

## 🔧 Azure Function Setup

Azure Function:en hanterar SharePoint-integration och är redan deployad till:
`https://func-sharepoint-prod-001-hmeqadf6h0g9cng8.westeurope-01.azurewebsites.net`

### Funktioner:
- **GetSharePointData** - Hämtar tickets från SharePoint Lists
- **Managed Identity** - Säker åtkomst till SharePoint
- **Error Handling** - Robust felhantering med retry-logik

## 🚀 Deployment

### Automatisk Deployment
Applikationen deployas automatiskt till Azure Static Web Apps när kod pushes till `main` branch.

**Live URL:** https://white-field-0b0ad7303.3.azurestaticapps.net

### GitHub Actions Workflow
1. **Build** - Kompilerar TypeScript och bygger React app
2. **Environment Variables** - Injicerar miljövariabler vid build
3. **Deploy** - Deployas till Azure Static Web Apps
4. **Validation** - Verifierar att deployment lyckades

## 🔐 Säkerhetskonfiguration

### Function App
- **Authorization Level:** Function Key Required
- **CORS:** Begränsat till Static Web App URL
- **Managed Identity:** Aktiverat för SharePoint åtkomst

### SharePoint Permissions
Azure Function har följande Microsoft Graph permissions:
- `Sites.Read.All` - Läsa SharePoint sites
- `User.Read.All` - Läsa användarinformation

## 📊 API Endpoints

### GET /api/GetSharePointData
Hämtar alla tickets från SharePoint Lists.

**Response:**
```json
[
  {
    "Id": "164",
    "CreatedBy": {
      "User": {
        "DisplayName": "Mikael Fransson",
        "Id": "55cef879-3c26-4d37-b476-abc4c93aa721",
        "email": "mifran@xzk57.onmicrosoft.com"
      }
    },
    "CreatedDateTime": "2025-01-12T12:10:33+00:00",
    "LastModifiedDateTime": "2025-01-12T12:10:33+00:00",
    "WebUrl": "https://xzk57.sharepoint.com/sites/itsupport/Lists/Tickets/164_.000",
    "Fields": {
      "Title": "Ticket Title",
      "Description": "Ticket Description", 
      "Status": "Open",
      "Priority": "High"
    }
  }
]
```

## 🎨 UI/UX Features

### Design System
- **Glassmorphism** - Modern transparent design med blur-effekter
- **Gradient Backgrounds** - Dynamiska färgövergångar
- **Status Colors** - Färgkodade status-badges
- **Responsive Design** - Anpassar sig till alla skärmstorlekar

### Accessibility
- **Semantic HTML** - Korrekt användning av HTML-element
- **ARIA Labels** - Tillgänglighet för skärmläsare
- **Keyboard Navigation** - Full keyboard support
- **Color Contrast** - WCAG AA-kompatibla färgkontraster

## 🔍 Felsökning

### Vanliga Problem

**Problem:** API returnerar 401/403 fel  
**Lösning:** Kontrollera Function Key och CORS-inställningar

**Problem:** Tomma data visas  
**Lösning:** Verifiera SharePoint permissions och site URL

**Problem:** Build fel vid deployment  
**Lösning:** Kontrollera environment variables i GitHub Secrets

### Debug Information
Applikationen loggar API-anrop i browser console för felsökning.

## 📈 Prestanda

### Build Optimizations
- **Vite** - Snabb byggprocess med ES modules
- **Tree Shaking** - Tar bort oanvänd kod
- **Code Splitting** - Delar upp kod för snabbare laddning
- **CDN** - Azure Static Web Apps levererar via globalt CDN

### Monitoring
- **Azure Application Insights** - Integrerat i Function App
- **Real User Monitoring** - Prestanda från slutanvändare
- **Error Tracking** - Automatisk felrapportering

## 🤝 Bidrag

1. Forka repository
2. Skapa feature branch (`git checkout -b feature/amazing-feature`)
3. Committa changes (`git commit -m 'Add amazing feature'`)
4. Pusha till branch (`git push origin feature/amazing-feature`)
5. Öppna Pull Request

## 📄 Licens

Detta projekt är licensierat under MIT License - se [LICENSE](LICENSE) fil för detaljer.

## 🙏 Acknowledgments

- **Microsoft Graph SDK** - För SharePoint integration
- **React Community** - För UI components och patterns
- **Azure Team** - För Static Web Apps och Functions platform
- **Vite Team** - För snabb build tooling

## 📞 Support

För frågor eller support, kontakta:
- **Email:** mifran@xzk57.onmicrosoft.com
- **GitHub Issues:** [Skapa ett issue](https://github.com/mifran1973/swa-sharepoint-prod-001/issues)

---

**🚀 Live Demo:** https://white-field-0b0ad7303.3.azurestaticapps.net

**📊 GitHub Repository:** https://github.com/mifran1973/swa-sharepoint-prod-001