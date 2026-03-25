const toggleBtn = document.getElementById('toggle-btn');
const statusEl = document.getElementById('status');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const countsEl = document.getElementById('counts');
const historyCountEl = document.getElementById('history-count');
const bookmarkCountEl = document.getElementById('bookmark-count');

// Site elements
const siteListEl = document.getElementById('site-list');
const newSiteInput = document.getElementById('new-site');
const addSiteBtn = document.getElementById('add-site-btn');

// Keyword elements
const keywordListEl = document.getElementById('keyword-list');
const newKeywordInput = document.getElementById('new-keyword');
const addKeywordBtn = document.getElementById('add-keyword-btn');

let isActive = false;

// --- Tabs ---
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// --- Initialize ---
document.addEventListener('DOMContentLoaded', async () => {
  await refreshStatus();
  await renderSiteList();
  await renderKeywordList();
});

// --- Toggle curtain ---
toggleBtn.addEventListener('click', async () => {
  toggleBtn.disabled = true;
  toggleBtn.textContent = isActive ? '恢復中...' : '隱藏中...';

  const action = isActive ? 'curtainUp' : 'curtainDown';
  const result = await chrome.runtime.sendMessage({ action });

  if (result && result.success) {
    await refreshStatus();
  } else {
    const errorMsg = result?.error || '操作失敗';
    toggleBtn.textContent = errorMsg;
    setTimeout(() => refreshStatus(), 2000);
  }

  toggleBtn.disabled = false;
});

// --- Sites ---
addSiteBtn.addEventListener('click', addSite);
newSiteInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addSite();
});

async function addSite() {
  let site = newSiteInput.value.trim().toLowerCase();
  if (!site) return;

  // Clean up: remove protocol, path, www
  try {
    if (site.includes('://')) {
      site = new URL(site).hostname;
    }
  } catch { /* keep as-is */ }
  site = site.replace(/^www\./, '');
  site = site.replace(/\/.*$/, '');

  if (!site || !site.includes('.')) return;

  const { sites = [] } = await chrome.storage.local.get('sites');
  if (sites.includes(site)) {
    newSiteInput.value = '';
    return;
  }

  sites.push(site);
  await chrome.storage.local.set({ sites });
  newSiteInput.value = '';
  await renderSiteList();
}

async function removeSite(site) {
  const { sites = [] } = await chrome.storage.local.get('sites');
  const updated = sites.filter((s) => s !== site);
  await chrome.storage.local.set({ sites: updated });
  await renderSiteList();
}

async function renderSiteList() {
  const { sites = [] } = await chrome.storage.local.get('sites');
  siteListEl.innerHTML = '';

  for (const site of sites) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = site;
    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.textContent = '\u00d7';
    btn.title = '移除';
    btn.addEventListener('click', () => removeSite(site));
    li.appendChild(span);
    li.appendChild(btn);
    siteListEl.appendChild(li);
  }
}

// --- Keywords ---
addKeywordBtn.addEventListener('click', addKeyword);
newKeywordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addKeyword();
});

async function addKeyword() {
  const kw = newKeywordInput.value.trim().toLowerCase();
  if (!kw || kw.length < 2) return;

  const { keywords = [] } = await chrome.storage.local.get('keywords');
  if (keywords.includes(kw)) {
    newKeywordInput.value = '';
    return;
  }

  keywords.push(kw);
  await chrome.storage.local.set({ keywords });
  newKeywordInput.value = '';
  await renderKeywordList();
}

async function removeKeyword(kw) {
  const { keywords = [] } = await chrome.storage.local.get('keywords');
  const updated = keywords.filter((k) => k !== kw);
  await chrome.storage.local.set({ keywords: updated });
  await renderKeywordList();
}

async function renderKeywordList() {
  const { keywords = [] } = await chrome.storage.local.get('keywords');
  keywordListEl.innerHTML = '';

  for (const kw of keywords) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = kw;
    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.textContent = '\u00d7';
    btn.title = '移除';
    btn.addEventListener('click', () => removeKeyword(kw));
    li.appendChild(span);
    li.appendChild(btn);
    keywordListEl.appendChild(li);
  }
}

// --- Status ---
const tipEl = document.getElementById('tip');

async function refreshStatus() {
  const result = await chrome.runtime.sendMessage({ action: 'getStatus' });
  isActive = result?.active || false;

  if (isActive) {
    statusEl.className = 'status status-active';
    statusIcon.textContent = '\uD83D\uDFE0';
    statusText.textContent = '簾幕模式（已隱藏）';
    toggleBtn.textContent = '恢復全部';
    toggleBtn.className = 'btn btn-restore';
    countsEl.classList.remove('hidden');
    tipEl.classList.remove('hidden');
    historyCountEl.textContent = result.historyCount || 0;
    bookmarkCountEl.textContent = result.bookmarkCount || 0;
  } else {
    statusEl.className = 'status status-safe';
    statusIcon.textContent = '\uD83D\uDFE2';
    statusText.textContent = '一般模式';
    toggleBtn.textContent = '拉下簾幕';
    toggleBtn.className = 'btn btn-activate';
    countsEl.classList.add('hidden');
    tipEl.classList.add('hidden');
  }
}
