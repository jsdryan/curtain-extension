// Default lists are empty — users add their own sites and keywords.
const DEFAULT_SITES = [];

// Keywords: match any URL or title containing these (case-insensitive).
// Catches related content on ANY site.
const DEFAULT_KEYWORDS = [];

// Initialize defaults on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['sites', 'keywords']);
  if (!data.sites) {
    await chrome.storage.local.set({ sites: DEFAULT_SITES });
  }
  if (!data.keywords) {
    await chrome.storage.local.set({ keywords: DEFAULT_KEYWORDS });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'curtainDown') {
    curtainDown().then(sendResponse);
    return true;
  }
  if (message.action === 'curtainUp') {
    curtainUp().then(sendResponse);
    return true;
  }
  if (message.action === 'getStatus') {
    getStatus().then(sendResponse);
    return true;
  }
});

async function getStatus() {
  const data = await chrome.storage.local.get(['curtainActive', 'backupHistory', 'backupBookmarks']);
  return {
    active: !!data.curtainActive,
    historyCount: data.backupHistory ? data.backupHistory.length : 0,
    bookmarkCount: data.backupBookmarks ? data.backupBookmarks.length : 0,
  };
}

// Build a matcher function from sites + keywords lists
function buildMatcher(sites, keywords) {
  const sitesLower = (sites || []).map((s) => s.toLowerCase());
  const kwLower = (keywords || []).map((k) => k.toLowerCase());

  return function matches(url, title) {
    const urlLower = (url || '').toLowerCase();
    const titleLower = (title || '').toLowerCase();

    // Check site domain match
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      for (const site of sitesLower) {
        if (hostname === site || hostname.endsWith('.' + site)) return true;
      }
    } catch { /* ignore */ }

    // Check keyword match in URL or title
    for (const kw of kwLower) {
      if (urlLower.includes(kw) || titleLower.includes(kw)) return true;
    }

    return false;
  };
}

async function curtainDown() {
  const { sites, keywords } = await chrome.storage.local.get(['sites', 'keywords']);
  if ((!sites || sites.length === 0) && (!keywords || keywords.length === 0)) {
    return { success: false, error: '沒有設定任何網站或關鍵字' };
  }

  try {
    const matches = buildMatcher(sites, keywords);

    // --- Collect ALL search terms to query history with ---
    // Use both sites and keywords as search terms, plus empty string to get recent history
    const searchTerms = new Set([
      ...(sites || []),
      ...(keywords || []),
      '', // empty string gets all recent history
    ]);

    // --- Backup & remove history ---
    const seenUrls = new Set();
    const historyItems = [];

    for (const term of searchTerms) {
      const results = await chrome.history.search({
        text: term,
        startTime: 0,
        maxResults: 50000,
      });
      for (const item of results) {
        if (!seenUrls.has(item.url) && matches(item.url, item.title)) {
          seenUrls.add(item.url);
          historyItems.push({
            url: item.url,
            title: item.title,
            lastVisitTime: item.lastVisitTime,
            visitCount: item.visitCount,
          });
        }
      }
    }

    // Remove history entries
    for (const item of historyItems) {
      await chrome.history.deleteUrl({ url: item.url });
    }

    // --- Backup & remove bookmarks ---
    const bookmarkItems = [];
    const seenBookmarkIds = new Set();
    const bmSearchTerms = new Set([...(sites || []), ...(keywords || [])]);

    for (const term of bmSearchTerms) {
      const results = await chrome.bookmarks.search({ query: term });
      for (const bm of results) {
        if (bm.url && !seenBookmarkIds.has(bm.id) && matches(bm.url, bm.title)) {
          seenBookmarkIds.add(bm.id);
          bookmarkItems.push({
            id: bm.id,
            parentId: bm.parentId,
            index: bm.index,
            title: bm.title,
            url: bm.url,
          });
        }
      }
    }

    // Remove bookmarks (reverse order to preserve indices)
    const sortedBookmarks = [...bookmarkItems].sort((a, b) => (b.index || 0) - (a.index || 0));
    for (const bm of sortedBookmarks) {
      try {
        await chrome.bookmarks.remove(bm.id);
      } catch { /* already removed */ }
    }

    // --- Disable Chrome search suggestions ---
    const prevSearchSuggest = await getChromeSetting(chrome.privacy.services.searchSuggestEnabled);
    const prevTopSites = await getChromeSetting(chrome.privacy.services.topSitesProviderEnabled);

    await setChromeSetting(chrome.privacy.services.searchSuggestEnabled, false);
    if (chrome.privacy.services.topSitesProviderEnabled) {
      await setChromeSetting(chrome.privacy.services.topSitesProviderEnabled, false);
    }

    // Save backup
    await chrome.storage.local.set({
      curtainActive: true,
      backupHistory: historyItems,
      backupBookmarks: bookmarkItems,
      backupSearchSuggest: prevSearchSuggest,
      backupTopSites: prevTopSites,
    });

    await updateIcon(true);

    return {
      success: true,
      historyCount: historyItems.length,
      bookmarkCount: bookmarkItems.length,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function curtainUp() {
  const data = await chrome.storage.local.get([
    'backupHistory', 'backupBookmarks',
    'backupSearchSuggest', 'backupTopSites',
  ]);

  try {
    // --- Restore history ---
    const historyItems = data.backupHistory || [];
    for (const item of historyItems) {
      await chrome.history.addUrl({ url: item.url });
    }

    // --- Restore bookmarks ---
    const bookmarkItems = data.backupBookmarks || [];
    const sortedBookmarks = [...bookmarkItems].sort((a, b) => (a.index || 0) - (b.index || 0));
    for (const bm of sortedBookmarks) {
      try {
        await chrome.bookmarks.create({
          parentId: bm.parentId,
          index: bm.index,
          title: bm.title,
          url: bm.url,
        });
      } catch {
        try {
          await chrome.bookmarks.create({ title: bm.title, url: bm.url });
        } catch { /* skip */ }
      }
    }

    // --- Restore Chrome search suggestions ---
    if (data.backupSearchSuggest !== undefined && data.backupSearchSuggest !== null) {
      await setChromeSetting(chrome.privacy.services.searchSuggestEnabled, data.backupSearchSuggest);
    }
    if (data.backupTopSites !== undefined && data.backupTopSites !== null) {
      if (chrome.privacy.services.topSitesProviderEnabled) {
        await setChromeSetting(chrome.privacy.services.topSitesProviderEnabled, data.backupTopSites);
      }
    }

    // Clear backup
    await chrome.storage.local.set({
      curtainActive: false,
      backupHistory: [],
      backupBookmarks: [],
      backupSearchSuggest: null,
      backupTopSites: null,
    });

    await updateIcon(false);

    return {
      success: true,
      historyRestored: historyItems.length,
      bookmarksRestored: bookmarkItems.length,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// --- Chrome privacy setting helpers ---
function getChromeSetting(setting) {
  return new Promise((resolve) => {
    try {
      setting.get({}, (details) => resolve(details.value));
    } catch { resolve(undefined); }
  });
}

function setChromeSetting(setting, value) {
  return new Promise((resolve) => {
    try {
      setting.set({ value }, () => resolve());
    } catch { resolve(); }
  });
}

async function updateIcon(active) {
  const suffix = active ? '-active' : '';
  await chrome.action.setIcon({
    path: {
      16: `icons/icon16${suffix}.png`,
      48: `icons/icon48${suffix}.png`,
      128: `icons/icon128${suffix}.png`,
    },
  });
}

// Restore icon state on startup
chrome.storage.local.get('curtainActive').then(({ curtainActive }) => {
  if (curtainActive) {
    updateIcon(true);
  }
});
