import { useState, useEffect } from "react";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./config/authConfig";
import { TicketDashboard } from "./components/TicketDashboard";
import { DiagnosticPage } from "./components/DiagnosticPage";
import "./App.css";

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Global error caught:", error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      setHasError(true);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Tjänsten är tillfälligt otillgänglig
            </h1>
            <p className="text-gray-600 mb-4">
              Vi upplever för närvarande tekniska problem.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
          >
            🔄 Försök igen
          </button>
          <div className="mt-4 text-sm text-gray-500">
            <p>SharePoint Tickets Dashboard</p>
            <p>Status: Felsökning pågår</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Initialize MSAL instance with comprehensive error handling
function initializeMSAL(): PublicClientApplication | null {
  try {
    console.log("Initializing MSAL with config:", {
      clientId: msalConfig.auth.clientId,
      authority: msalConfig.auth.authority,
      redirectUri: msalConfig.auth.redirectUri,
    });

    if (!msalConfig.auth.clientId || msalConfig.auth.clientId.length < 10) {
      console.warn(
        "Invalid clientId detected, authentication will be disabled"
      );
      return null;
    }

    return new PublicClientApplication(msalConfig);
  } catch (error) {
    console.error("Failed to initialize MSAL:", error);
    return null;
  }
}

function App() {
  console.log("🚀 App component starting...");
  console.log("Environment mode:", import.meta.env.MODE);
  console.log("Current URL:", window.location.href);

  const [msalInstance, setMsalInstance] =
    useState<PublicClientApplication | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if we should show diagnostic page
  const showDiagnostic =
    window.location.search.includes("debug") ||
    window.location.pathname.includes("debug");
  console.log("Show diagnostic page:", showDiagnostic);

  useEffect(() => {
    console.log("🔧 App useEffect - initializing MSAL...");
    try {
      const instance = initializeMSAL();
      console.log("✅ MSAL instance created:", !!instance);
      setMsalInstance(instance);
    } catch (error) {
      console.error("❌ MSAL initialization failed:", error);
      setAuthError("Authentication service unavailable");
    }
  }, []);

  // Show diagnostic page if requested
  if (showDiagnostic) {
    console.log("🔍 Rendering diagnostic page");
    return (
      <ErrorBoundary>
        <div className="app">
          <DiagnosticPage />
        </div>
      </ErrorBoundary>
    );
  }

  // If MSAL failed to initialize, show app without authentication
  if (authError || msalInstance === null) {
    console.log(
      "⚠️ Rendering without MSAL authentication, authError:",
      authError,
      "msalInstance:",
      !!msalInstance
    );
    return (
      <ErrorBoundary>
        <div className="app">
          <TicketDashboard />
        </div>
      </ErrorBoundary>
    );
  }

  // Normal flow with MSAL authentication
  console.log("✅ Rendering with MSAL authentication");
  return (
    <ErrorBoundary>
      <MsalProvider instance={msalInstance}>
        <div className="app">
          <TicketDashboard />
        </div>
      </MsalProvider>
    </ErrorBoundary>
  );
}

export default App;
