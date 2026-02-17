// ─── Backend API Configuration ──────────────────────────────────
const API_BASE_URL = process.env.API_URL || 'https://typeassist-backend.onrender.com';

// ─── API Endpoints ──────────────────────────────────────────────
const API_ENDPOINTS = {
  VERIFY_TOKEN: `${API_BASE_URL}/api/token/verify`,
  USE_CREDIT: `${API_BASE_URL}/api/token/use-credit`,
  GET_BALANCE: (token) => `${API_BASE_URL}/api/token/balance/${token}`,
};

// ─── Error Messages ─────────────────────────────────────────────
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_TOKEN: 'Invalid token. Please try again.',
  NO_CREDITS: 'No credits remaining. Please purchase more credits.',
  DEVICE_MISMATCH: 'This token is already bound to another device.',
  TOKEN_INACTIVE: 'This token has been deactivated.',
  SERVER_ERROR: 'Server error. Please try again later.',
};

// ─── Default Values ─────────────────────────────────────────────
const DEFAULTS = {
  REQUEST_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

module.exports = {
  API_BASE_URL,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  DEFAULTS,
};
