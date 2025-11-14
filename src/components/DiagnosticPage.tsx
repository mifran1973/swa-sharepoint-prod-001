export function DiagnosticPage() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    location: window.location.href,
    environment: {
      NODE_ENV: import.meta.env.MODE,
      VITE_AZURE_CLIENT_ID: import.meta.env.VITE_AZURE_CLIENT_ID
        ? "SET"
        : "NOT SET",
      VITE_AZURE_TENANT_ID: import.meta.env.VITE_AZURE_TENANT_ID
        ? "SET"
        : "NOT SET",
      VITE_FUNCTION_URL: import.meta.env.VITE_FUNCTION_URL ? "SET" : "NOT SET",
      VITE_FUNCTION_KEY: import.meta.env.VITE_FUNCTION_KEY ? "SET" : "NOT SET",
    },
    msalAvailable: typeof window !== "undefined",
    localStorage: typeof Storage !== "undefined",
    sessionStorage: typeof sessionStorage !== "undefined",
    cryptoAvailable: typeof crypto !== "undefined",
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          🔍 Diagnostic Information
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Environment Status
          </h2>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Console Logs
          </h2>
          <div className="bg-gray-50 p-4 rounded text-sm">
            <p>Check browser console (F12) for detailed error messages.</p>
            <p>Look for MSAL, CORS, or network errors.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Quick Tests
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => console.log("Button click test - SUCCESS")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test JavaScript Execution
            </button>

            <button
              onClick={() => alert("Alert test - SUCCESS")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Browser APIs
            </button>

            <button
              onClick={() => {
                fetch("/api/test")
                  .then(() => console.log("Fetch test - SUCCESS"))
                  .catch((err) => console.log("Fetch test - FAILED:", err));
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Test Network Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
