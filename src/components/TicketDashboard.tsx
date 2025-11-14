import { useState, useEffect, useCallback } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";
import { TicketCard } from "./TicketCard";
import { sharePointApi } from "../services/sharePointApi";
import type { SharePointTicket } from "../types/sharepoint";

interface UserInfo {
  name?: string;
  username?: string;
  localAccountId?: string;
}

export function TicketDashboard() {
  // MSAL hooks must be called unconditionally at the top of the component
  const msal = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [tickets, setTickets] = useState<SharePointTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [authAvailable, setAuthAvailable] = useState(true);

  // Check if MSAL is working properly
  useEffect(() => {
    try {
      // Test if MSAL is functioning
      if (msal && msal.instance) {
        setAuthAvailable(true);
      } else {
        setAuthAvailable(false);
      }
    } catch (error) {
      console.warn("MSAL not working properly:", error);
      setAuthAvailable(false);
    }
  }, [msal]);

  const handleLogin = async () => {
    if (!authAvailable || !msal) {
      setError("Authentication service är inte tillgänglig");
      return;
    }

    try {
      await msal.instance.loginPopup(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
      setError("Inloggning misslyckades. Försök igen senare.");
    }
  };

  const handleLogout = () => {
    if (authAvailable && msal) {
      msal.instance.logoutPopup();
    }
  };

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let userToken = undefined;

      // SÄKERHET: Kräv authentication för att komma åt SharePoint data
      if (
        !isAuthenticated ||
        !authAvailable ||
        !msal ||
        msal.accounts.length === 0
      ) {
        console.warn(
          "⚠️ User not authenticated - cannot load SharePoint tickets"
        );
        setError("Du måste logga in för att se dina SharePoint tickets.");
        setTickets([]);
        return;
      }

      try {
        const account = msal.accounts[0];
        console.log("🔐 Acquiring access token for user:", account.username);

        const response = await msal.instance.acquireTokenSilent({
          ...loginRequest,
          account: account,
        });
        userToken = response.accessToken;
        setUserInfo(account);

        console.log(
          "✅ Successfully acquired access token, length:",
          userToken.length
        );
      } catch (tokenError) {
        console.error("❌ Failed to acquire token:", tokenError);
        setError("Kunde inte hämta säkerhetstoken. Försök logga in igen.");
        return;
      }

      // Ladda tickets med användartoken för säker åtkomst
      console.log("🎫 Loading SharePoint tickets with user permissions...");
      const data = await sharePointApi.getSharePointTickets(userToken);
      setTickets(data);

      if (data.length === 0) {
        setError(
          "Inga tickets hittades. Du kanske inte har behörighet att se några tickets, eller så finns det inga tickets att visa."
        );
      } else {
        console.log(`✅ Successfully loaded ${data.length} tickets`);
      }
    } catch (err) {
      console.error("❌ Error loading tickets:", err);
      const errorMessage = err instanceof Error ? err.message : "Okänt fel";

      if (errorMessage.includes("Authentication required")) {
        setError("🔐 Du måste logga in för att se dina SharePoint tickets.");
      } else if (errorMessage.includes("permissions")) {
        setError(
          "❌ Du har inte behörighet att komma åt dessa SharePoint-data. Kontakta din administratör."
        );
      } else {
        setError(`❌ Kunde inte ladda SharePoint data: ${errorMessage}`);
      }

      // Visa inga tickets vid fel
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authAvailable, msal]);

  useEffect(() => {
    // Always try to load tickets, regardless of authentication state
    loadTickets();
  }, [loadTickets]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar tickets från SharePoint...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and auth is available, show login
  if (!isAuthenticated && authAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              SharePoint Tickets
            </h1>
            <p className="text-gray-600 mb-6">
              Logga in för att se dina tickets
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🔐 Logga in med Microsoft
          </button>
          {!authAvailable && (
            <p className="mt-4 text-sm text-orange-600">
              ⚠️ Authentication-tjänsten är tillfälligt otillgänglig
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  SharePoint Tickets
                </h1>
                <p className="text-sm text-gray-600">
                  {isAuthenticated
                    ? `Välkommen, ${userInfo?.name || userInfo?.username}`
                    : "Demo läge - Begränsad funktionalitet"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={loadTickets}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Uppdatera</span>
              </button>

              {isAuthenticated && authAvailable && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Logga ut</span>
                </button>
              )}

              {!authAvailable && (
                <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm">
                  ⚠️ Offline läge
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-orange-100 border border-orange-300 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-orange-500 mr-3"
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
              <div>
                <p className="text-orange-800 font-medium">Varning</p>
                <p className="text-orange-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Inga tickets hittades
            </h3>
            <p className="text-gray-500">
              {isAuthenticated
                ? "Du har ingen åtkomst till tickets eller så finns det inga."
                : "Logga in för att se dina tickets."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {isAuthenticated ? "Dina Tickets" : "Demo Tickets"} (
                {tickets.length})
              </h2>
              <div className="text-sm text-gray-500">
                Senast uppdaterad: {new Date().toLocaleString("sv-SE")}
              </div>
            </div>

            <div className="tickets-grid">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.Id} ticket={ticket} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
