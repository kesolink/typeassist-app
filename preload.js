const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('typeassist', {
  // Typing controls
  startTyping: (text, speed) => ipcRenderer.invoke('start-typing', { text, speed }),
  stopTyping: () => ipcRenderer.invoke('stop-typing'),

  // Hotkey
  setHotkey: (key) => ipcRenderer.invoke('set-hotkey', key),
  getHotkey: () => ipcRenderer.invoke('get-hotkey'),

  // Authentication
  verifyToken: (token) => ipcRenderer.invoke('verify-token', token),
  getAuthState: () => ipcRenderer.invoke('get-auth-state'),
  logout: () => ipcRenderer.invoke('logout'),
  useCredit: (token, deviceId) => ipcRenderer.invoke('use-credit', token, deviceId),

  // Window controls (frameless)
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window'),

  // Events from main process
  onHotkeyTriggered: (callback) => ipcRenderer.on('hotkey-triggered', callback),
  onTypingProgress: (callback) => ipcRenderer.on('typing-progress', (_, data) => callback(data)),
  onTypingComplete: (callback) => ipcRenderer.on('typing-complete', callback),
  onTypingCancelled: (callback) => ipcRenderer.on('typing-cancelled', callback),
  onTypingStopped: (callback) => ipcRenderer.on('typing-stopped', (_, charIndex) => callback(charIndex)),
  onTypingError: (callback) => ipcRenderer.on('typing-error', (_, msg) => callback(msg)),
  onHotkeyError: (callback) => ipcRenderer.on('hotkey-error', (_, key) => callback(key)),

  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
