import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './config/authConfig'
import { TicketDashboard } from './components/TicketDashboard'
import './App.css'

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <div className="app">
        <TicketDashboard />
      </div>
    </MsalProvider>
  )
}

export default App
