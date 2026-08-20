// Dynamic API Base URL resolver
// Resolves to http://localhost:5000 on host PC browser
// Resolves to window.location.origin (proxied via Vite) on local network or public tunnels
export const API_BASE_URL = 
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin;
