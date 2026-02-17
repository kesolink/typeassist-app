const axios = require('axios');
const { API_ENDPOINTS, ERROR_MESSAGES, DEFAULTS } = require('./constants');

// ─── Configure Axios ────────────────────────────────────────────
const apiClient = axios.create({
  timeout: DEFAULTS.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Handle API Errors ──────────────────────────────────────────
const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    if (status === 404) {
      return { success: false, error: ERROR_MESSAGES.INVALID_TOKEN };
    } else if (status === 400) {
      return { success: false, error: data.error || ERROR_MESSAGES.INVALID_TOKEN };
    } else if (status === 403) {
      return { success: false, error: data.error || ERROR_MESSAGES.DEVICE_MISMATCH };
    } else if (status >= 500) {
      return { success: false, error: ERROR_MESSAGES.SERVER_ERROR };
    } else {
      return { success: false, error: data.error || 'An error occurred' };
    }
  } else if (error.request) {
    // Request made but no response received
    return { success: false, error: ERROR_MESSAGES.NETWORK_ERROR };
  } else {
    // Something else happened
    return { success: false, error: error.message || ERROR_MESSAGES.NETWORK_ERROR };
  }
};

// ─── Verify Token ───────────────────────────────────────────────
const verifyToken = async (token, deviceId) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.VERIFY_TOKEN, {
      token,
      deviceId,
    });

    if (response.data.valid || response.data.success) {
      return {
        success: true,
        email: response.data.email,
        remainingCredits: response.data.remainingCredits,
        totalCredits: response.data.totalCredits,
      };
    } else {
      return { success: false, error: response.data.error || ERROR_MESSAGES.INVALID_TOKEN };
    }
  } catch (error) {
    console.error('[API] Token verification failed:', error.message);
    return handleAPIError(error);
  }
};

// ─── Use Credit (Deduct 1 Credit) ──────────────────────────────
const useCredit = async (token, deviceId) => {
  try {
    console.log('[API] useCredit called with:', {
      hasToken: !!token,
      tokenValue: token,
      hasDeviceId: !!deviceId,
      deviceIdValue: deviceId,
      endpoint: API_ENDPOINTS.USE_CREDIT
    });

    const response = await apiClient.post(API_ENDPOINTS.USE_CREDIT, {
      token,
      deviceId,
    });

    if (response.data.success) {
      return {
        success: true,
        remainingCredits: response.data.remainingCredits,
        message: response.data.message,
      };
    } else {
      return { success: false, error: response.data.error || 'Failed to use credit' };
    }
  } catch (error) {
    console.error('[API] Credit usage failed:', error.message);
    return handleAPIError(error);
  }
};

// ─── Get Balance ────────────────────────────────────────────────
const getBalance = async (token) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.GET_BALANCE(token));

    if (response.data.success) {
      return {
        success: true,
        remainingCredits: response.data.remainingCredits,
        totalCredits: response.data.totalCredits,
      };
    } else {
      return { success: false, error: response.data.error || 'Failed to get balance' };
    }
  } catch (error) {
    console.error('[API] Balance check failed:', error.message);
    return handleAPIError(error);
  }
};

module.exports = {
  verifyToken,
  useCredit,
  getBalance,
  handleAPIError,
};
