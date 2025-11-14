import type { Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '110bbc9c-7b2c-4364-afad-b954953e3b7b',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || '14f493f8-7990-4a8d-9885-37e35f0fe7d3'}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
};

export const loginRequest = {
  scopes: ['https://graph.microsoft.com/Sites.Read.All', 'https://graph.microsoft.com/User.Read'],
  prompt: 'select_account'
};

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me'
};