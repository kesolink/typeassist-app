const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let currentHotkey = 'F9';
let isTyping = false;
let cancelTyping = false;

// ─── Window Creation ────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 700,
    minHeight: 500,
    frame: false,
    transparent: false,
    backgroundColor: '#0f1219',
    resizable: true,
    icon: require('path').join(__dirname, 'icon.icns'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── System Tray ────────────────────────────────────────────────────
function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAUElEQVQ4T2NkYPj/n4EBCBgZGBj+MzAwMILYYDYjmA0CYDFkNgMjsgIwG8IGCTCC5BnBesB8BpAYI0gOxAbxkeVAbBAfh8sYRmcDKMgAAAftFhE8mzIjAAAAAElFTkSuQmCC'
  );

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show TypeAssist',
      click: () => mainWindow && mainWindow.show(),
    },
    {
      label: 'Status: Ready',
      enabled: false,
      id: 'status',
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        mainWindow.destroy();
        app.quit();
      },
    },
  ]);

  tray.setToolTip('TypeAssist - Ready');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow && mainWindow.show());
}

// ─── Global Hotkey Registration ─────────────────────────────────────
function registerHotkey(key) {
  globalShortcut.unregisterAll();
  try {
    globalShortcut.register(key, () => {
      if (!isTyping) {
        mainWindow.webContents.send('hotkey-triggered');
      }
    });

    if (key !== 'Escape') {
      globalShortcut.register('Escape', () => {
        if (isTyping) {
          cancelTyping = true;
          mainWindow.webContents.send('typing-cancelled');
        }
      });
    }

    currentHotkey = key;
    console.log(`[TypeAssist] Hotkey registered: ${key}`);
  } catch (err) {
    console.error(`[TypeAssist] Failed to register hotkey ${key}:`, err.message);
    mainWindow.webContents.send('hotkey-error', key);
  }
}

// ─── Typing Engine (nut.js) ─────────────────────────────────────────
async function typeText(text, speed) {
  let keyboard;
  try {
    const { keyboard: kb } = require('@nut-tree-fork/nut-js');
    keyboard = kb;
  } catch (err) {
    console.error('[TypeAssist] nut.js not available:', err.message);
    mainWindow.webContents.send('typing-error', 'nut.js is not installed. Run: npm install @nut-tree-fork/nut-js');
    return;
  }

  isTyping = true;
  cancelTyping = false;

  const delays = {
    slow: 300,  // Changed from 120 to 300ms (~20 WPM)
    normal: 60,
    fast: 25,
    instant: 5,
  };

  // Handle custom speed (passed as number) or preset (passed as string)
  let baseDelay;
  if (typeof speed === 'number') {
    baseDelay = speed;
  } else {
    baseDelay = delays[speed] || 60;
  }

  // Set nut.js typing speed
  keyboard.config.autoDelayMs = baseDelay;

  const chars = text.split('');

  // Small delay before starting so user can switch focus
  await sleep(300);

  for (let i = 0; i < chars.length; i++) {
    if (cancelTyping) {
      mainWindow.webContents.send('typing-stopped', i);
      break;
    }

    const char = chars[i];

    try {
      await keyboard.type(char);
    } catch (err) {
      console.error(`[TypeAssist] Error typing char "${char}":`, err.message);
    }

    // Send progress to renderer
    const progress = ((i + 1) / chars.length) * 100;
    mainWindow.webContents.send('typing-progress', {
      progress,
      current: i + 1,
      total: chars.length,
    });

    // Human-like delay with slight randomization
    const jitter = Math.random() * baseDelay * 0.3;
    await sleep(jitter);
  }

  isTyping = false;
  mainWindow.webContents.send('typing-complete');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── IPC Handlers ───────────────────────────────────────────────────
ipcMain.handle('start-typing', async (event, { text, speed }) => {
  if (isTyping) return { error: 'Already typing' };
  typeText(text, speed);
  return { ok: true };
});

ipcMain.handle('stop-typing', () => {
  cancelTyping = true;
  isTyping = false;
  return { ok: true };
});

ipcMain.handle('set-hotkey', (event, key) => {
  registerHotkey(key);
  return { ok: true, key };
});

ipcMain.handle('get-hotkey', () => {
  return currentHotkey;
});

ipcMain.handle('minimize-window', () => {
  mainWindow && mainWindow.minimize();
});

ipcMain.handle('close-window', () => {
  mainWindow && mainWindow.hide();
});

// ─── Authentication IPC Handlers ────────────────────────────────
ipcMain.handle('verify-token', async (event, token) => {
  try {
    const { machineIdSync } = require('node-machine-id');
    const deviceId = machineIdSync();
    const api = require('./src/api.js');

    const result = await api.verifyToken(token, deviceId);

    if (result.success) {
      const store = require('./src/store.js');
      store.set('token', token);
      store.set('email', result.email);
      store.set('credits', result.remainingCredits);
      store.set('deviceId', deviceId);
      store.set('authenticated', true);

      console.log(`[Auth] Token verified for ${result.email} - ${result.remainingCredits} credits`);
      return { success: true, credits: result.remainingCredits, email: result.email };
    } else {
      console.log(`[Auth] Token verification failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('[Auth] Token verification error:', error.message);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
});

ipcMain.handle('get-auth-state', () => {
  const store = require('./src/store.js');
  const authData = {
    authenticated: store.get('authenticated', false),
    credits: store.get('credits', 0),
    email: store.get('email', ''),
    token: store.get('token', ''),
    deviceId: store.get('deviceId', ''),
  };
  console.log('[Auth] get-auth-state called:', {
    hasToken: !!authData.token,
    tokenLength: authData.token?.length,
    hasDeviceId: !!authData.deviceId
  });
  return authData;
});

ipcMain.handle('logout', () => {
  const store = require('./src/store.js');
  console.log('[Auth] User logged out');
  store.clear();
  return { success: true };
});

ipcMain.handle('use-credit', async (event, token, deviceId) => {
  try {
    console.log('[Auth] use-credit called with:', {
      hasToken: !!token,
      tokenValue: token,
      tokenLength: token?.length,
      hasDeviceId: !!deviceId,
      deviceIdValue: deviceId
    });

    const api = require('./src/api.js');
    const result = await api.useCredit(token, deviceId);

    if (result.success) {
      const store = require('./src/store.js');
      store.set('credits', result.remainingCredits);
      console.log(`[Auth] Credit used - ${result.remainingCredits} remaining`);
      return { success: true, remainingCredits: result.remainingCredits };
    } else {
      console.log(`[Auth] Credit usage failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('[Auth] Credit usage error:', error.message);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
});


// ─── App Lifecycle ──────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerHotkey(currentHotkey);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});