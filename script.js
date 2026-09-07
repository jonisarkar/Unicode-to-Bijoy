let currentMode = 'U2B'; // U2B: Unicode to Bijoy, B2U: Bijoy to Unicode

const inputArea = document.getElementById('input-text');
const outputArea = document.getElementById('output-text');
const modeDisplay = document.getElementById('mode-display');
const inputLabel = document.getElementById('input-label');
const outputLabel = document.getElementById('output-label');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
const inCount = document.getElementById('in-count');
const outCount = document.getElementById('out-count');
const btnU2B = document.getElementById('btn-u2b');
const btnB2U = document.getElementById('btn-b2u');
const inputBadge = document.getElementById('input-badge');
const outputBadge = document.getElementById('output-badge');
const fontHint = document.getElementById('font-hint');

function setMode(mode, swapTextToo = false) {
  currentMode = mode;
  const isU2B = mode === 'U2B';

  if (btnU2B && btnB2U) {
    btnU2B.classList.toggle('active', isU2B);
    btnB2U.classList.toggle('active', !isU2B);
  }
  if (modeDisplay) modeDisplay.innerHTML = `MODE: <strong>${isU2B ? 'UNICODE → BIJOY' : 'BIJOY → UNICODE'}</strong>`;
  if (inputLabel) inputLabel.innerText = isU2B ? 'Unicode Input' : 'Bijoy Input';
  if (outputLabel) outputLabel.innerText = isU2B ? 'Bijoy Output' : 'Unicode Output';
  if (inputBadge) { inputBadge.innerText = isU2B ? 'UNICODE' : 'BIJOY'; inputBadge.className = 'badge ' + (isU2B ? 'u' : 'b'); }
  if (outputBadge) { outputBadge.innerText = isU2B ? 'BIJOY' : 'UNICODE'; outputBadge.className = 'badge ' + (isU2B ? 'b' : 'u'); }

  if (inputArea) {
    inputArea.placeholder = isU2B
      ? 'এখানে ইউনিকোড বাংলা লিখুন বা পেস্ট করুন…'
      : 'এখানে বিজয় (SutonnyMJ) টেক্সট পেস্ট করুন…';
    inputArea.classList.toggle('bijoy-text', !isU2B);
  }
  if (outputArea) outputArea.classList.toggle('bijoy-text', isU2B);
  if (fontHint) fontHint.innerText = isU2B ? 'Bijoy in SutonnyMJ • Unicode in Bangla' : 'Clean Unicode output, press-ready';

  if (swapTextToo) swapText(false);
  else convert();
}

function toggleMode() {
  setMode(currentMode === 'U2B' ? 'B2U' : 'U2B', true);
}

function swapText(reconvert = true) {
  const t = inputArea.value;
  inputArea.value = outputArea.value;
  outputArea.value = t;
  updateCounts();
  if (reconvert) convert();
}

function countStats(text) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { chars, words };
}

function updateCounts() {
  if (inCount) {
    const s = countStats(inputArea.value);
    inCount.innerHTML = `<b>${s.chars.toLocaleString()}</b> chars • <b>${s.words.toLocaleString()}</b> words`;
  }
  if (outCount) {
    const s = countStats(outputArea.value);
    outCount.innerHTML = `<b>${s.chars.toLocaleString()}</b> chars • <b>${s.words.toLocaleString()}</b> words`;
  }
}

function convert() {
  const text = inputArea.value;
  if (!text.trim()) {
    outputArea.value = '';
    updateCounts();
    return;
  }
  try {
    if (currentMode === 'U2B') {
      outputArea.value = BanglaConverter.unicodeToBijoy(text);
    } else {
      outputArea.value = BanglaConverter.bijoyToUnicode(text);
    }
  } catch (e) {
    console.error(e);
    showToast('Conversion failed — please try again');
    return;
  }
  updateCounts();
}

// Live convert (debounced slightly for big pastes)
let tId = null;
inputArea.addEventListener('input', () => {
  updateCounts();
  clearTimeout(tId);
  tId = setTimeout(convert, 120);
});

// Ctrl+Enter to convert
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    convert();
    showToast('Converted ✓');
  }
});

function clearInput() {
  inputArea.value = '';
  outputArea.value = '';
  inputArea.focus();
  updateCounts();
}

function clearAll() {
  inputArea.value = '';
  outputArea.value = '';
  updateCounts();
  inputArea.focus();
}

async function pasteInput() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) { showToast('Clipboard is empty'); return; }
    inputArea.value = text;
    convert();
    showToast('Pasted ✓');
  } catch (err) {
    inputArea.focus();
    showToast('Press Ctrl+V to paste');
  }
}

async function copyOutput() {
  if (!outputArea.value) { showToast('Nothing to copy'); return; }
  try {
    await navigator.clipboard.writeText(outputArea.value);
    showToast('Copied to clipboard ✓');
  } catch (e) {
    // fallback
    outputArea.select();
    document.execCommand('copy');
    showToast('Copied ✓');
  }
}

function downloadOutput() {
  if (!outputArea.value) { showToast('Nothing to download'); return; }
  const ext = currentMode === 'U2B' ? 'bijoy' : 'unicode';
  const blob = new Blob([outputArea.value], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bangla-${ext}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  showToast('Downloaded .txt ✓');
}

let toastTimer = null;
function showToast(msg) {
  if (toastMsg) toastMsg.innerText = msg;
  else if (toast) toast.innerText = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// Theme: persist in localStorage
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const moon = document.getElementById('theme-icon-moon');
  const sun = document.getElementById('theme-icon-sun');
  if (moon && sun) {
    const isDark = theme === 'dark';
    moon.style.display = isDark ? 'block' : 'none';
    sun.style.display = isDark ? 'none' : 'block';
  }
  try { localStorage.setItem('bijoy-theme', theme); } catch (e) {}
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

// Full display / focus mode — expands editors to fill the whole screen
function toggleFullDisplay() {
  const on = document.body.classList.toggle('full-display');
  const btn2 = document.getElementById('full-btn2');
  if (btn2) btn2.innerHTML = on ? '✕ Exit full' : '⛶ Full display';
  try {
    if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      // try true browser fullscreen; silently ignore if blocked
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!on && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  } catch (e) {}
  showToast(on ? 'Full display ON — press F to exit' : 'Full display OFF');
}

// Keyboard: F = full display, Esc exits (in addition to Ctrl+Enter convert)
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input')) return;
  if ((e.key === 'f' || e.key === 'F' || e.key === 'ফ') && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (document.activeElement !== inputArea && document.activeElement !== outputArea) {
      e.preventDefault();
      toggleFullDisplay();
    }
  }
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && document.body.classList.contains('full-display')) {
    // keep focus-mode layout even if user exits browser fullscreen with Esc;
    // press the button / F again to restore hero. Do nothing here on purpose.
  }
});

(function init() {
  let saved = 'dark';
  try { saved = localStorage.getItem('bijoy-theme') || 'dark'; } catch (e) {}
  applyTheme(saved);
  setMode('U2B');
  updateCounts();
})();
