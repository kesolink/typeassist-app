const Store = require('electron-store');

// ─── Initialize Electron Store ──────────────────────────────────
const store = new Store({
  name: 'typeassist-auth',
  defaults: {
    token: null,
    email: null,
    credits: 0,
    deviceId: null,
    authenticated: false,
    lastSync: null,
  },
  encryptionKey: 'typeassist-secure-key-2024', // Basic encryption
});

// ─── Store Interface ────────────────────────────────────────────
module.exports = {
  // Get value by key
  get: (key, defaultValue = null) => {
    return store.get(key, defaultValue);
  },

  // Set value by key
  set: (key, value) => {
    store.set(key, value);
  },

  // Get all auth data
  getAuthData: () => {
    return {
      token: store.get('token'),
      email: store.get('email'),
      credits: store.get('credits', 0),
      deviceId: store.get('deviceId'),
      authenticated: store.get('authenticated', false),
    };
  },

  // Clear all stored data
  clear: () => {
    store.clear();
  },

  // Delete specific key
  delete: (key) => {
    store.delete(key);
  },

  // Check if token exists
  hasToken: () => {
    const token = store.get('token');
    return token !== null && token !== undefined && token !== '';
  },

  // Get the raw store (for advanced usage)
  raw: () => store,
};
