'use strict';

let overlay = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SHOW_WARNING') showWarning();
  if (msg.type === 'HIDE_WARNING') hideWarning();
});

function showWarning() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.id = '__faceguard_overlay__';

  const css = `
    #__faceguard_overlay__ {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Courier New', Courier, monospace;
      animation: __fg_fadein__ 0.2s ease;
    }
    @keyframes __fg_fadein__ { from { opacity:0 } to { opacity:1 } }
    @keyframes __fg_blink__ { 0%,100%{opacity:1} 50%{opacity:0.3} }
    #__faceguard_overlay__ .fg-icon {
      font-size: 72px;
      animation: __fg_blink__ 0.8s ease-in-out infinite;
      margin-bottom: 24px;
      filter: drop-shadow(0 0 24px #ef4444);
    }
    #__faceguard_overlay__ .fg-title {
      font-size: 22px;
      letter-spacing: 6px;
      color: #ef4444;
      font-weight: 700;
      margin-bottom: 10px;
    }
    #__faceguard_overlay__ .fg-sub {
      font-size: 12px;
      color: #475569;
      letter-spacing: 2px;
      margin-bottom: 32px;
    }
    #__faceguard_overlay__ .fg-btn {
      padding: 10px 28px;
      background: transparent;
      color: #475569;
      border: 1px solid #1e293b;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      letter-spacing: 2px;
      cursor: pointer;
      transition: all 0.2s;
    }
    #__faceguard_overlay__ .fg-btn:hover {
      color: #94a3b8;
      border-color: #334155;
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  overlay.appendChild(style);

  overlay.innerHTML += `
    <div class="fg-icon">⊘</div>
    <div class="fg-title">UNAUTHORIZED FACE</div>
    <div class="fg-sub">UNKNOWN OBSERVER DETECTED BY FACEGUARD</div>
    <button class="fg-btn" id="__fg_dismiss__">[ DISMISS ]</button>
  `;

  document.documentElement.appendChild(overlay);

  document.getElementById('__fg_dismiss__').addEventListener('click', hideWarning);

  // Auto-dismiss after 15s
  setTimeout(hideWarning, 15000);
}

function hideWarning() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}
