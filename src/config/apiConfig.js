// ─── Base URLs per environment ────────────────────────────────────────────────
const BASE_URLS = {
  development: 'http://72.255.34.72:31796',
  staging: 'https://staging-api.grabngo.pk',
  production: 'https://prodapi.grabngo.com.pk',
};

// ─── Auto-detect environment from where the app is running ────────────────────
const detectEnv = () => {
  const hostname = window.location.hostname;
  console.log('hostname', hostname);

  if (
    hostname === '172.19.32.1' ||
    hostname === "192.168.1.104" ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    return 'development';
  }

  // if (hostname === 'staging-panel.grabngo.pk') return 'staging';

  return 'production';
};

const API_ENV = detectEnv();

// ─── API versioning ─────────────────────────────────────────────────────────
export const API_VERSION = {
  V1: 'v1',
};

const extractHostAndPort = (url) => {
  const match = url.match(/:\/\/([^/]+)/);
  return match ? match[1] : url;
};

// ─── Active base URL (computed once) ───────────────────────────────────────
export const BASE_URL = BASE_URLS[API_ENV];
export const WS_HOST = extractHostAndPort(BASE_URL);
export const ENV_NAME = API_ENV;

// ─── Build WebSocket URL ────────────────────────────────────────────────────
// endpoint examples: "back-office-chat", "user-chat"
export const getWebSocketUrl = (token, endpoint = 'back-office-chat') => {
  const protocol = BASE_URL.startsWith('https') ? 'wss' : 'ws';
  return `${protocol}://${WS_HOST}/grabngo/api/v1/websocket/ws/${endpoint}?token=${token}`;
};

// ─── Full API root used by axios ───────────────────────────────────────────
export const API_ROOT = `${BASE_URL}/grabngo/api/${API_VERSION.V1}`;