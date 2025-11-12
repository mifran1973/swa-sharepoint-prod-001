import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './config/authConfig'
import { TicketDashboard } from './components/TicketDashboard'
import './App.css'

// Initialize MSAL instance with error handling
let msalInstance: PublicClientApplication;
try {
  msalInstance = new PublicClientApplication(msalConfig);
} catch (error) {
  console.error('Failed to initialize MSAL:', error);
  // Fallback configuration if MSAL fails
  throw new Error('Authentication configuration error. Please check environment variables.');
}

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
