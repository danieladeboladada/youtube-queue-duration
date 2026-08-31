// Injected into the active tab's page context via chrome.scripting.executeScript.
// Must be self-contained (no closures over outer variables) since it's serialized
// and run in the page, not in the popup.
function scrapeQueue() {
  const DURATION_RE = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;

  const panel = document.querySelector('ytd-playlist-panel-renderer');
  if (!panel || panel.hasAttribute('hidden')) {
    return { status: 'no-queue' };
  }

  const itemNodes = panel.querySelectorAll('ytd-playlist-panel-video-renderer');
  if (itemNodes.length === 0) {
    return { status: 'no-queue' };
  }

  const videos = [];
  let liveOrUnknownCount = 0;

  itemNodes.forEach((item) => {
    const titleEl = item.querySelector('#video-title');
    const title = titleEl ? titleEl.textContent.trim() : null;
    const link = item.querySelector('a#wc-endpoint, a#thumbnail');
    if (!title || !link) return; // filters non-video header/mix cards

    let durationText = null;
    const badge = item.querySelector('ytd-thumbnail-overlay-time-status-renderer');
    if (badge) {
      const raw = badge.textContent.trim().split(/\s+/)[0];
      if (DURATION_RE.test(raw)) durationText = raw;
    }
    if (!durationText) {
      const candidates = Array.from(item.querySelectorAll('span, div'))
        .map((el) => el.textContent.trim())
        .filter((t) => t.length > 0 && t.length <= 10 && DURATION_RE.test(t));
      durationText = candidates[0] || null;
    }

    if (!durationText) {
      liveOrUnknownCount++;
      videos.push({ title, seconds: null, durationText: null });
      return;
    }

    const parts = durationText.split(':').map(Number);
    const seconds =
      parts.length === 3
        ? parts[0] * 3600 + parts[1] * 60 + parts[2]
        : parts[0] * 60 + parts[1];
    videos.push({ title, seconds, durationText });
  });

  if (videos.length === 0) {
    return { status: 'no-queue' };
  }

  const totalSeconds = videos.reduce((sum, v) => sum + (v.seconds || 0), 0);

  return {
    status: 'ok',
    totalSeconds,
    videoCount: videos.length,
    skippedLiveOrUnknown: liveOrUnknownCount,
    videos,
  };
}

function formatHeadline(totalSeconds) {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function formatDurationText(durationText) {
  return durationText || 'LIVE / TBD';
}

function showState(name) {
  document.querySelectorAll('.state').forEach((el) => {
    el.classList.toggle('hidden', el.id !== `state-${name}`);
  });
}

function renderOk(result) {
  const totalMinutes = Math.round(result.totalSeconds / 60);
  document.getElementById('headline-total').textContent = formatHeadline(result.totalSeconds);
  document.getElementById('subline-minutes').textContent = `(${totalMinutes} minute${totalMinutes === 1 ? '' : 's'})`;
  document.getElementById('video-count').textContent =
    `${result.videoCount} video${result.videoCount === 1 ? '' : 's'} in queue`;

  const skippedNote = document.getElementById('skipped-note');
  if (result.skippedLiveOrUnknown > 0) {
    skippedNote.textContent = `${result.skippedLiveOrUnknown} live/upcoming video${result.skippedLiveOrUnknown === 1 ? '' : 's'} excluded from total`;
    skippedNote.classList.remove('hidden');
  } else {
    skippedNote.classList.add('hidden');
  }

  const list = document.getElementById('breakdown-list');
  list.innerHTML = '';
  result.videos.forEach((v) => {
    const li = document.createElement('li');
    const titleSpan = document.createElement('span');
    titleSpan.className = 'item-title';
    titleSpan.textContent = v.title;
    titleSpan.title = v.title;
    const durationSpan = document.createElement('span');
    durationSpan.className = 'item-duration';
    durationSpan.textContent = formatDurationText(v.durationText);
    li.appendChild(titleSpan);
    li.appendChild(durationSpan);
    list.appendChild(li);
  });

  showState('ok');
}

function renderError(err) {
  document.getElementById('error-detail').textContent = err ? String(err) : 'Unknown error';
  showState('error');
}

async function init() {
  showState('loading');

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (err) {
    renderError(err);
    return;
  }

  if (!tab || !tab.url || !tab.url.startsWith('https://www.youtube.com/watch')) {
    showState('not-youtube');
    return;
  }

  let injectionResults;
  try {
    injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeQueue,
    });
  } catch (err) {
    renderError(err);
    return;
  }

  const result = injectionResults && injectionResults[0] && injectionResults[0].result;

  if (!result || result.status === 'no-queue') {
    showState('no-queue');
    return;
  }

  if (result.status === 'ok') {
    renderOk(result);
    return;
  }

  renderError('Unexpected response from page scan.');
}

document.addEventListener('DOMContentLoaded', init);
