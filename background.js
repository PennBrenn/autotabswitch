'use strict';

const DEFAULT_SETTINGS = {
  mode: 'switch',      // 'switch' | 'warn' | 'both'
  interval: 3,         // seconds between checks
  sensitivity: 60,     // 0–100, higher = stricter matching
  brightness: 100,     // camera brightness 50–150
  decoyUrl: 'about:blank',
  noFaceAction: 'ignore', // 'ignore' | 'trigger'
};

let state = {
  enabled: false,
  status: 'idle',       // idle | loading | watching | alert | no-profile
  monitorWindowId: null,
  monitorTabId: null,
  lastCheck: 0,
  lastAlert: 0,
  alertCount: 0,
  profileExists: false,
  faceCount: 0,
};

// Boot: load profile flag and settings
chrome.storage.local.get(['faceProfile', 'settings'], (data) => {
  state.profileExists = !!(data.faceProfile && data.faceProfile.length > 0);
  if (!data.settings) {
    chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {

    case 'GET_STATUS':
      sendResponse({ ...state });
      break;

    case 'TOGGLE_GUARD':
      if (msg.enabled) {
        startMonitoring(sendResponse);
      } else {
        stopMonitoring();
        sendResponse({ ok: true, state: { ...state } });
      }
      return true;

    case 'FACE_RESULT':
      handleFaceResult(msg);
      sendResponse({ ok: true });
      break;

    case 'MONITOR_READY':
      state.status = state.profileExists ? 'watching' : 'no-profile';
      broadcast();
      sendResponse({ ok: true });
      break;

    case 'MONITOR_ERROR':
      state.enabled = false;
      state.status = 'idle';
      state.monitorWindowId = null;
      state.monitorTabId = null;
      broadcast();
      sendResponse({ ok: true });
      break;

    case 'PROFILE_UPDATED':
      state.profileExists = msg.exists;
      if (state.enabled && msg.exists) state.status = 'watching';
      broadcast();
      sendResponse({ ok: true });
      break;
  }
  return true;
});

function startMonitoring(cb) {
  state.enabled = true;
  state.status = 'loading';
  broadcast();

  if (state.monitorWindowId) {
    try { chrome.windows.remove(state.monitorWindowId, () => {}); } catch(e) {}
  }

  chrome.windows.create({
    url: chrome.runtime.getURL('monitor.html'),
    type: 'popup',
    width: 380,
    height: 280,
    top: 40,
    left: 40,
  }, (win) => {
    if (win) {
      state.monitorWindowId = win.id;
      state.monitorTabId = win.tabs[0].id;
      if (cb) cb({ ok: true, state: { ...state } });
    } else {
      state.enabled = false;
      state.status = 'idle';
      if (cb) cb({ ok: false, error: 'Could not open monitor window.' });
      broadcast();
    }
  });
}

function stopMonitoring() {
  state.enabled = false;
  state.status = 'idle';
  state.faceCount = 0;

  if (state.monitorWindowId) {
    try { chrome.windows.remove(state.monitorWindowId, () => {}); } catch(e) {}
    state.monitorWindowId = null;
    state.monitorTabId = null;
  }
  broadcast();
}

function handleFaceResult(msg) {
  state.lastCheck = Date.now();
  state.faceCount = msg.faceCount || 0;

  if (msg.faceDetected && !msg.authorized) {
    state.alertCount++;
    state.lastAlert = Date.now();
    state.status = 'alert';
    triggerAction();
    setTimeout(() => {
      if (state.enabled) {
        state.status = state.profileExists ? 'watching' : 'no-profile';
        broadcast();
      }
    }, 4000);
  } else if (!msg.faceDetected) {
    // No face — check noFaceAction setting
    chrome.storage.local.get('settings', ({ settings }) => {
      const s = settings || DEFAULT_SETTINGS;
      if (s.noFaceAction === 'trigger') {
        state.alertCount++;
        state.lastAlert = Date.now();
        state.status = 'alert';
        triggerAction();
        setTimeout(() => {
          if (state.enabled) {
            state.status = state.profileExists ? 'watching' : 'no-profile';
            broadcast();
          }
        }, 4000);
      } else {
        state.status = state.profileExists ? 'watching' : 'no-profile';
      }
      broadcast();
    });
    return;
  } else {
    state.status = state.profileExists ? 'watching' : 'no-profile';
  }
  broadcast();
}

function triggerAction() {
  chrome.storage.local.get('settings', ({ settings }) => {
    const s = settings || DEFAULT_SETTINGS;

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      const tabId = tabs[0].id;
      if (tabId === state.monitorTabId) return;

      if (s.mode === 'switch' || s.mode === 'both') {
        chrome.tabs.update(tabId, { url: s.decoyUrl || 'about:blank' });
      }
      if (s.mode === 'warn' || s.mode === 'both') {
        chrome.tabs.sendMessage(tabId, { type: 'SHOW_WARNING' }).catch(() => {});
      }
    });
  });
}

function broadcast() {
  chrome.runtime.sendMessage({ type: 'STATE_UPDATE', state: { ...state } }).catch(() => {});
}

// If user closes monitor window manually, sync state
chrome.windows.onRemoved.addListener((winId) => {
  if (winId === state.monitorWindowId) {
    state.enabled = false;
    state.status = 'idle';
    state.monitorWindowId = null;
    state.monitorTabId = null;
    state.faceCount = 0;
    broadcast();
  }
});
