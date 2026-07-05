(() => {
  'use strict';
  // v5: semua toast/notifikasi visual dimatikan agar tampilan bersih.
 
  const IS_LOCAL_PREVIEW = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

  const CONFIG = {
    // Localhost boleh direct karena di HP/PC kamu memang jalan.
    // Saat sudah di Vercel/domain sendiri, pakai proxy /api/parse agar tidak kena CORS.
    apiUrl: IS_LOCAL_PREVIEW
      ? 'https://api.vidssave.com/api/contentsite_api/media/parse'
      : '/api/parse',
    auth: '20250901majwlqo',
    domain: 'api-ak.vidssave.com',
    storagePrefix: 'yt6767-lite:',
    maxHistory: 60,
    adLinks: [
      'https://www.effectivecpmnetwork.com/ei197f8i?key=7296ce5ce218473810261eabd049ad7d',
      'https://www.effectivecpmnetwork.com/d36pkfnfb?key=98d72eaac9931c3e080dcce9d4d807a0',
      'https://www.effectivecpmnetwork.com/fun79qde?key=f23c4db3393a77a42ef5412b1a75053a',
      'https://www.effectivecpmnetwork.com/uyd5pi1y7g?key=ecda7388108e4bf6b485ab620343f53a',
      'https://www.effectivecpmnetwork.com/z55w4h3qx2?key=b3e81a33d4a9ac5be6d499f5f1bd6274'
    ]
  };

  const STORAGE = {
    history: CONFIG.storagePrefix + 'history',
    stats: CONFIG.storagePrefix + 'stats',
    queue: CONFIG.storagePrefix + 'queue',
    adIndex: CONFIG.storagePrefix + 'ad-index'
  };

  const state = {
    activeTab: 'video',
    videoMode: 'video',
    filter: 'ready',
    currentInfo: null,
    currentOutput: 'video',
    selectedFormat: null,
    history: loadJson(STORAGE.history, []),
    stats: loadJson(STORAGE.stats, { processed: 0, downloads: 0, lastType: '-' }),
    queue: loadJson(STORAGE.queue, []),
    busy: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const els = {
    tabs: $('#mainTabs'),
    tabPill: $('#tabPill'),
    providerBadge: $('#providerBadge'),
    videoUrlInput: $('#videoUrlInput'),
    musicUrlInput: $('#musicUrlInput'),
    processVideoBtn: $('#processVideoBtn'),
    processVideoText: $('#processVideoText'),
    processVideoIcon: $('#processVideoIcon'),
    processMusicBtn: $('#processMusicBtn'),
    processMusicText: $('#processMusicText'),
    processMusicIcon: $('#processMusicIcon'),
    videoResultBox: $('#videoResultBox'),
    musicResultBox: $('#musicResultBox'),
    queueInput: $('#queueInput'),
    queueList: $('#queueList'),
    statProcessed: $('#statProcessed'),
    statDownloads: $('#statDownloads'),
    statLastType: $('#statLastType'),
    statHistory: $('#statHistory'),
    historyList: $('#historyList')
  };

  const icons = {
    loader: '<span class="loader" aria-hidden="true"></span>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"></path></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c1.7-4 4.4-6 8-6s6.3 2 8 6"></path></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"></path></svg>'
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindEvents();
    updatePill();
    renderStats();
    renderHistory();
  }

  function bindEvents() {
    $$('.tab-btn').forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.tab, true)));
    $$('[data-switch-tab]').forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.switchTab, true)));
    $$('.seg-btn').forEach(btn => btn.addEventListener('click', () => {
      state.videoMode = btn.dataset.videoMode;
      $$('.seg-btn').forEach(item => item.classList.toggle('active', item === btn));
      if (state.currentInfo && state.currentOutput !== 'music') renderResult('video');
    }));

    $('#pasteVideoBtn').addEventListener('click', () => pasteTo(els.videoUrlInput));
    $('#pasteMusicBtn').addEventListener('click', () => pasteTo(els.musicUrlInput));
    $('#cleanVideoBtn').addEventListener('click', () => cleanInput(els.videoUrlInput));
    $('#cleanMusicBtn').addEventListener('click', () => cleanInput(els.musicUrlInput));
    $('#clearVideoBtn').addEventListener('click', () => clearInput(els.videoUrlInput));
    $('#clearMusicBtn').addEventListener('click', () => clearInput(els.musicUrlInput));
    $('#musicFromVideoBtn').addEventListener('click', () => {
      els.musicUrlInput.value = els.videoUrlInput.value.trim();
    });

    els.processVideoBtn.addEventListener('click', () => processUrl('video'));
    els.processMusicBtn.addEventListener('click', () => processUrl('music'));
    els.videoUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') processUrl('video'); });
    els.musicUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') processUrl('music'); });

    $('#exportHistoryBtn').addEventListener('click', exportHistory);
    $('#clearHistoryBtn').addEventListener('click', clearHistory);

    window.addEventListener('resize', updatePill);
  }

  function showTab(tab, scroll) {
    const target = ['video', 'music', 'promo', 'history'].includes(tab) ? tab : 'video';
    state.activeTab = target;
    $$('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === target));
    $$('.tab-panel').forEach(panel => panel.classList.toggle('hidden', panel.id !== `tab-${target}`));
    updatePill();
    if (scroll) document.querySelector('.tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updatePill() {
    const active = $('.tab-btn.active');
    if (!active || !els.tabPill) return;
    els.tabPill.style.width = `${active.offsetWidth}px`;
    els.tabPill.style.transform = `translateX(${active.offsetLeft}px)`;
  }


  function openRotatingAd() {
    if (!CONFIG.adLinks.length) return;
    let currentIndex = Number(localStorage.getItem(STORAGE.adIndex) || 0);
    if (!Number.isFinite(currentIndex) || currentIndex < 0 || currentIndex >= CONFIG.adLinks.length) currentIndex = 0;
    const link = CONFIG.adLinks[currentIndex];
    localStorage.setItem(STORAGE.adIndex, String((currentIndex + 1) % CONFIG.adLinks.length));
    try {
      const popup = window.open(link, '_blank', 'noopener,noreferrer');
      if (!popup) toast('Iklan diblokir', 'Browser memblokir tab iklan, proses tetap lanjut.', 'warn');
      else toast('Iklan dibuka', `Iklan ${currentIndex + 1}/${CONFIG.adLinks.length} dibuka, hasil tetap diproses di halaman ini.`, 'success');
    } catch (_) {
      toast('Iklan gagal dibuka', 'Popup ditolak browser, proses tetap lanjut.', 'warn');
    }
  }

  async function processUrl(output) {
    if (state.busy) return toast('Tunggu dulu', 'Masih ada proses berjalan. Browser juga punya batas sabar.', 'warn');
    const input = output === 'music' ? els.musicUrlInput : els.videoUrlInput;
    const url = cleanYoutubeUrl(input.value.trim());
    if (!url) return toast('Link kosong', 'Masukkan link YouTube dulu.', 'warn');
    if (!isYoutubeUrl(url)) return toast('Link tidak valid', 'Yang ini bukan link YouTube.', 'warn');
    input.value = url;
    openRotatingAd();
    state.currentOutput = output;
    state.selectedFormat = null;
    setLoading(output, true);
    hideResult(output);
    try {
      const raw = await fetchVideoInfo(url);
      const info = normalizeInfo(raw, url);
      state.currentInfo = info;
      state.stats.processed += 1;
      state.stats.lastType = output === 'music' ? 'Musik' : 'Video';
      saveJson(STORAGE.stats, state.stats);
      renderStats();
      renderResult(output);
      scrollToResult(output);
      toast('Info berhasil', `${info.title || 'Video'} berhasil dibaca.`, 'success');
    } catch (error) {
      console.error(error);
      toast('Gagal ambil data', error.message || 'API error. Ya, internet kembali mengecewakan.', 'warn');
    } finally {
      setLoading(output, false);
    }
  }

  async function fetchVideoInfo(url) {
    const body = new URLSearchParams({
      auth: CONFIG.auth,
      domain: CONFIG.domain,
      origin: 'source',
      link: url
    }).toString();
    const response = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!response.ok) throw new Error(`Server API error ${response.status}.`);
    const json = await response.json();
    if (json.status !== 1 && json.status !== '1' && json.code !== 0 && json.success !== true) {
      throw new Error(json.message || json.msg || 'Provider menolak link ini.');
    }
    return json.data || json.result || json;
  }

  function normalizeInfo(info, sourceUrl) {
    const data = info || {};
    const title = firstValue(data, ['title', 'name', 'videoTitle', 'caption', 'desc']) || 'Untitled YouTube Video';
    const duration = firstValue(data, ['duration', 'length', 'durationText', 'time']) || 'N/A';
    const thumbnail = normalizeUrl(firstValue(data, ['thumbnail', 'thumb', 'cover', 'image', 'poster', 'thumbnail_url']) || findDeep(data, ['thumbnail', 'thumb', 'cover', 'image', 'poster'])) || '';
    const channel = firstValue(data, ['channel', 'channelName', 'author', 'authorName', 'uploader', 'owner']) || findDeep(data, ['channel', 'channelName', 'author', 'authorName', 'uploader', 'owner']) || 'N/A';
    const channelAvatar = normalizeUrl(firstValue(data, ['avatar', 'authorAvatar', 'channelAvatar', 'profilePicture']) || findDeep(data, ['avatar', 'authorAvatar', 'channelAvatar', 'profilePicture'])) || '';
    const views = firstValue(data, ['views', 'view', 'viewCount', 'view_count', 'play_count']) || findDeep(data, ['views', 'viewCount', 'view_count', 'play_count']);
    const likes = firstValue(data, ['likes', 'like', 'likeCount', 'like_count', 'digg_count']) || findDeep(data, ['likes', 'likeCount', 'like_count', 'digg_count']);
    const subscribers = firstValue(data, ['subscribers', 'subscriber', 'subscriberCount', 'subscriber_count', 'channelSubscribers']) || findDeep(data, ['subscribers', 'subscriberCount', 'subscriber_count', 'channelSubscribers']);
    const resources = normalizeResources(data.resources || data.formats || data.links || data.medias || data.downloads || []);
    const thumbnails = buildThumbnails(data, thumbnail);
    return { ...data, sourceUrl, title, duration, thumbnail, channel, channelAvatar, views, likes, subscribers, resources, thumbnails };
  }

  function normalizeResources(resources) {
    if (!Array.isArray(resources)) return [];
    return resources.map((item, index) => {
      const raw = item || {};
      const type = String(raw.type || raw.mimeType || raw.media_type || raw.kind || '').toLowerCase().includes('audio') ? 'audio' :
        String(raw.type || raw.mimeType || raw.media_type || raw.kind || '').toLowerCase().includes('image') ? 'thumbnail' : 'video';
      const format = String(raw.format || raw.ext || raw.extension || raw.container || (type === 'audio' ? 'MP3' : 'MP4')).replace('.', '').toUpperCase();
      const quality = raw.quality || raw.qualityLabel || raw.resolution || raw.label || raw.name || (type === 'audio' ? 'Audio' : 'Video');
      const size = Number(raw.size || raw.filesize || raw.file_size || raw.contentLength || raw.bytes || 0);
      const downloadUrl = normalizeUrl(raw.download_url || raw.downloadUrl || raw.url || raw.link || raw.href || raw.src || raw.download || '');
      return {
        ...raw,
        id: raw.id || raw.itag || `fmt-${Date.now()}-${index}`,
        type,
        format,
        quality: String(quality).toUpperCase(),
        size,
        download_url: downloadUrl,
        available: !!downloadUrl,
        unavailableReason: downloadUrl ? '' : 'Resolusi ini tidak menyediakan direct link dari API.'
      };
    });
  }

  function buildThumbnails(data, main) {
    const list = [];
    const maybe = data.thumbnails || data.thumbnailList || data.images || [];
    if (main) list.push({ id: 'thumb-main', type: 'thumbnail', format: 'JPG', quality: 'THUMBNAIL', download_url: main, available: true, size: 0 });
    if (Array.isArray(maybe)) {
      maybe.forEach((item, index) => {
        const url = normalizeUrl(typeof item === 'string' ? item : item.url || item.src || item.href || item.image);
        if (url) list.push({ id: `thumb-${index}`, type: 'thumbnail', format: 'JPG', quality: `${item.width || ''}x${item.height || ''}`.replace(/^x$/, '') || 'THUMBNAIL', download_url: url, available: true, size: 0 });
      });
    }
    return uniqueBy(list, 'download_url');
  }

  function renderResult(output) {
    const box = output === 'music' ? els.musicResultBox : els.videoResultBox;
    if (!state.currentInfo) return;
    state.currentOutput = output;
    const mode = output === 'music' ? 'audio' : state.videoMode;
    const title = escapeHtml(state.currentInfo.title || 'Untitled');
    const thumb = escapeAttribute(state.currentInfo.thumbnail || '');
    const channel = escapeHtml(state.currentInfo.channel || 'N/A');
    box.classList.remove('hidden');
    box.innerHTML = `
      <div class="result-card">
        <div class="creator-row">
          <img class="avatar" src="${escapeAttribute(state.currentInfo.channelAvatar || state.currentInfo.thumbnail || '')}" alt="" onerror="this.style.display='none'" />
          <div>
            <h3>${title}</h3>
            <p>${channel}</p>
          </div>
        </div>
        <div class="yt-thumb-wrap">
          <img class="yt-thumb" src="${thumb}" alt="Thumbnail" loading="lazy" onerror="this.style.display='none'" />
          <span class="yt-thumb-label">${mode === 'audio' ? 'Music Mode' : mode === 'thumbnail' ? 'Thumbnail Mode' : 'Video Mode'}</span>
        </div>
        ${renderStatsGrid(state.currentInfo)}
        <div class="notice-box">Pilih format yang bertanda <b>Link siap</b>. Kalau tertulis <b>Link belum ada</b>, tombol download akan menolak dengan sopan, bukan diam kayak tadi.</div>
        <div class="filter-row" id="filterRow">
          <button class="filter-btn ${state.filter === 'ready' ? 'active' : ''}" data-filter="ready" type="button">Link siap</button>
          <button class="filter-btn ${state.filter === 'all' ? 'active' : ''}" data-filter="all" type="button">Semua</button>
          <button class="filter-btn ${state.filter === 'recommended' ? 'active' : ''}" data-filter="recommended" type="button">Rekomendasi</button>
          <button class="filter-btn ${state.filter === 'small' ? 'active' : ''}" data-filter="small" type="button">Ukuran kecil</button>
          <button class="filter-btn ${state.filter === 'hd' ? 'active' : ''}" data-filter="hd" type="button">HD</button>
        </div>
        <div class="format-grid" id="formatGrid"></div>
        <div class="result-actions">
          <button class="btn btn-primary" id="downloadSelectedBtn" type="button">${icons.download}<span>Download File Terpilih</span></button>
          <button class="btn" id="copySelectedBtn" type="button">${icons.copy}<span>Copy URL</span></button>
        </div>
        <div class="mini-inline">
          <button class="btn btn-ghost" id="openThumbBtn" type="button">Buka Thumbnail</button>
          <button class="btn btn-ghost" id="copyThumbBtn" type="button">Copy Thumbnail</button>
          <button class="btn btn-ghost" id="copySourceBtn" type="button">Copy Link Video</button>
        </div>
      </div>`;

    $('#filterRow', box).addEventListener('click', event => {
      const btn = event.target.closest('[data-filter]');
      if (!btn) return;
      state.filter = btn.dataset.filter;
      renderResult(output);
    });
    $('#downloadSelectedBtn', box).addEventListener('click', downloadSelected);
    $('#copySelectedBtn', box).addEventListener('click', copySelectedUrl);
    $('#openThumbBtn', box).addEventListener('click', () => openExternal(state.currentInfo.thumbnail, 'Thumbnail tidak ditemukan.'));
    $('#copyThumbBtn', box).addEventListener('click', () => copyText(state.currentInfo.thumbnail || '', 'URL thumbnail disalin.'));
    $('#copySourceBtn', box).addEventListener('click', () => copyText(state.currentInfo.sourceUrl || '', 'Link video disalin.'));
    renderFormats(box, mode);
  }

  function scrollToResult(output) {
    const box = output === 'music' ? els.musicResultBox : els.videoResultBox;
    if (!box || box.classList.contains('hidden')) return;
    window.setTimeout(() => {
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 160);
  }

  function renderStatsGrid(info) {
    const items = [
      { icon: icons.eye, value: formatCount(info.views), label: 'Views' },
      { icon: icons.heart, value: formatCount(info.likes), label: 'Likes' },
      { icon: icons.user, value: formatCount(info.subscribers), label: 'Subscribers' },
      { icon: icons.clock, value: escapeHtml(info.duration || 'N/A'), label: 'Durasi' },
      { icon: icons.image, value: String(info.thumbnails?.length || (info.thumbnail ? 1 : 0)), label: 'Thumbnail' },
      { icon: icons.info, value: String(info.resources?.length || 0), label: 'Resource' }
    ];
    return `<div class="stats-grid">${items.map(item => `
      <div class="stat-card"><span class="stat-icon">${item.icon}</span><span class="stat-meta"><strong class="stat-value">${item.value}</strong><span class="stat-label">${item.label}</span></span></div>
    `).join('')}</div>`;
  }

  function renderFormats(box, mode) {
    const grid = $('#formatGrid', box);
    const resources = getFilteredResources(mode);
    state.selectedFormat = resources.find(item => item.available) || resources[0] || null;
    if (!resources.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Tidak ada pilihan ${mode === 'audio' ? 'audio' : mode === 'thumbnail' ? 'thumbnail' : 'video'} dari API ini.</div>`;
      return;
    }
    grid.innerHTML = resources.map(item => formatCardHtml(item)).join('');
    $$('.format-card', grid).forEach(card => {
      card.addEventListener('click', () => {
        const item = resources.find(res => String(res.id) === card.dataset.id);
        if (!item) return;
        if (!item.available) {
          toast('Resolusi tidak tersedia', `${item.quality || 'Format ini'} belum punya direct link dari API. Pilih yang statusnya Link siap.`, 'warn');
          return;
        }
        state.selectedFormat = item;
        $$('.format-card', grid).forEach(el => el.classList.toggle('active', el.dataset.id === String(item.id)));
        toast('Format dipilih', `${item.quality} • ${item.format}`, 'success');
      });
    });
  }

  function formatCardHtml(item) {
    const active = state.selectedFormat && String(state.selectedFormat.id) === String(item.id) && item.available;
    return `<button class="format-card ${active ? 'active' : ''} ${item.available ? '' : 'unavailable'}" data-id="${escapeAttribute(item.id)}" type="button" ${item.available ? '' : 'aria-disabled="true"'}>
      <span class="format-kicker">${escapeHtml(item.type)} • ${escapeHtml(item.format)}</span>
      <strong class="format-title">${escapeHtml(item.quality || item.format || 'Format')}</strong>
      <span class="format-meta">${item.size ? formatBytes(item.size) : 'Ukuran N/A'}</span>
      <span class="format-status ${item.available ? 'ready' : 'nope'}">${item.available ? 'Link siap' : 'Link belum ada'}</span>
    </button>`;
  }

  function getFilteredResources(mode) {
    if (!state.currentInfo) return [];
    let list = [];
    if (mode === 'thumbnail') {
      list = state.currentInfo.thumbnails || [];
    } else if (mode === 'audio') {
      list = (state.currentInfo.resources || []).filter(item => item.type === 'audio' || ['MP3', 'M4A', 'AAC', 'WEBM', 'OPUS'].includes(String(item.format).toUpperCase()));
    } else {
      list = (state.currentInfo.resources || []).filter(item => item.type === 'video' || ['MP4', 'WEBM', 'MKV'].includes(String(item.format).toUpperCase()));
    }

    list = sortResources(list, mode);
    if (state.filter === 'ready') list = list.filter(item => item.available);
    if (state.filter === 'recommended') {
      const ready = list.filter(item => item.available);
      const target = mode === 'audio'
        ? ready.find(item => /320|256|192|160|128/.test(String(item.quality))) || ready[0] || list[0]
        : ready.find(item => extractQuality(item.quality) === 1080) || ready.find(item => extractQuality(item.quality) === 720) || ready[0] || list[0];
      list = target ? [target] : [];
    }
    if (state.filter === 'small') list = list.filter(item => item.available && Number(item.size || 0) > 0).sort((a,b) => Number(a.size) - Number(b.size)).slice(0, 8);
    if (state.filter === 'hd') list = list.filter(item => extractQuality(item.quality) >= 720);
    return list;
  }

  function sortResources(list, mode) {
    return [...list].sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      if (mode === 'audio') return extractQuality(b.quality) - extractQuality(a.quality) || Number(b.size || 0) - Number(a.size || 0);
      return extractQuality(b.quality) - extractQuality(a.quality) || Number(b.size || 0) - Number(a.size || 0);
    });
  }

  function downloadSelected() {
    const item = state.selectedFormat;
    if (!item) return toast('Belum pilih format', 'Pilih format dulu.', 'warn');
    if (!item.available || !item.download_url) {
      return toast('Resolusi tidak tersedia', 'Format ini belum punya link download. Pilih yang “Link siap”, jangan maksa tombol jadi cenayang.', 'warn');
    }
    const ext = inferExt(item);
    const filename = `${slugify(state.currentInfo?.title || 'yt-download')}_${slugify(item.quality || item.format || 'file')}.${ext}`;
    openExternal(item.download_url, 'Link download kosong. Ajaib, tapi bukan keajaiban bagus.');
    state.stats.downloads += 1;
    saveJson(STORAGE.stats, state.stats);
    addHistory(item, filename);
    renderStats();
    toast('Download dibuka', filename, 'success');
  }

  function copySelectedUrl() {
    const item = state.selectedFormat;
    if (!item) return toast('Belum pilih format', 'Pilih format dulu.', 'warn');
    if (!item.available || !item.download_url) return toast('URL kosong', 'Format ini belum punya link download.', 'warn');
    copyText(item.download_url, 'URL download disalin.');
  }

  function openExternal(url, emptyMessage) {
    if (!url) return toast('URL kosong', emptyMessage || 'URL tidak ada.', 'warn');
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function addHistory(format, filename) {
    const entry = {
      id: cryptoId(),
      title: state.currentInfo?.title || 'Untitled',
      channel: state.currentInfo?.channel || '',
      sourceUrl: state.currentInfo?.sourceUrl || '',
      thumbnail: state.currentInfo?.thumbnail || '',
      quality: format.quality || '',
      format: format.format || '',
      type: format.type || '',
      size: format.size || 0,
      downloadUrl: format.download_url || '',
      filename,
      createdAt: new Date().toISOString()
    };
    state.history = uniqueBy([entry, ...state.history], 'downloadUrl').slice(0, CONFIG.maxHistory);
    saveJson(STORAGE.history, state.history);
    renderHistory();
  }

  function renderHistory() {
    if (!els.historyList) return;
    if (!state.history.length) {
      els.historyList.innerHTML = '<div class="empty-state">History masih kosong.</div>';
      renderStats();
      return;
    }
    els.historyList.innerHTML = state.history.map(item => `
      <article class="history-card" data-id="${escapeAttribute(item.id)}">
        <div>
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.quality)} • ${escapeHtml(item.format)} • ${item.size ? formatBytes(item.size) : 'N/A'} • ${formatDate(item.createdAt)}</p>
        </div>
        <div class="button-row">
          <button class="btn" data-action="copy" type="button">Copy</button>
          <button class="btn btn-green" data-action="download" type="button">Download</button>
          <button class="btn btn-danger" data-action="remove" type="button">Hapus</button>
        </div>
      </article>
    `).join('');
    $$('.history-card', els.historyList).forEach(card => card.addEventListener('click', event => {
      const btn = event.target.closest('[data-action]');
      if (!btn) return;
      const item = state.history.find(row => row.id === card.dataset.id);
      if (!item) return;
      if (btn.dataset.action === 'copy') copyText(item.downloadUrl, 'URL dari history disalin.');
      if (btn.dataset.action === 'download') openExternal(item.downloadUrl, 'URL history kosong.');
      if (btn.dataset.action === 'remove') removeHistory(item.id);
    }));
    renderStats();
  }

  function removeHistory(id) {
    state.history = state.history.filter(item => item.id !== id);
    saveJson(STORAGE.history, state.history);
    renderHistory();
    toast('Dihapus', 'Item history dibuang dari browser ini.', 'success');
  }

  function clearHistory() {
    state.history = [];
    saveJson(STORAGE.history, state.history);
    renderHistory();
    toast('History kosong', 'Riwayat lokal dibersihkan.', 'success');
  }

  function exportHistory() {
    const blob = new Blob([JSON.stringify(state.history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    openExternal(url, 'Gagal export history.');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function addUrlToQueue(raw) {
    const url = cleanYoutubeUrl(String(raw || '').trim());
    if (!url || !isYoutubeUrl(url)) return toast('Queue gagal', 'Masukkan link YouTube valid dulu.', 'warn');
    state.queue = uniqueBy([{ id: cryptoId(), url, status: 'waiting', createdAt: new Date().toISOString() }, ...state.queue], 'url').slice(0, 80);
    saveJson(STORAGE.queue, state.queue);
    renderQueue();
    toast('Masuk queue', 'Link ditambahkan.', 'success');
  }

  function importQueue() {
    const lines = String(els.queueInput.value || '').split(/\n+/).map(line => cleanYoutubeUrl(line.trim())).filter(isYoutubeUrl);
    if (!lines.length) return toast('Queue kosong', 'Tidak ada link YouTube valid di textarea.', 'warn');
    const rows = lines.map(url => ({ id: cryptoId(), url, status: 'waiting', createdAt: new Date().toISOString() }));
    state.queue = uniqueBy([...rows, ...state.queue], 'url').slice(0, 80);
    saveJson(STORAGE.queue, state.queue);
    els.queueInput.value = '';
    renderQueue();
    toast('Queue masuk', `${lines.length} link ditambahkan.`, 'success');
  }

  function renderQueue() {
    if (!els.queueList) return;
    if (!state.queue.length) {
      els.queueList.innerHTML = '<div class="empty-state">Queue kosong.</div>';
      return;
    }
    els.queueList.innerHTML = state.queue.map(item => `
      <div class="queue-pill" data-id="${escapeAttribute(item.id)}"><span>${escapeHtml(item.url)}</span><button class="btn btn-danger" data-remove type="button">Hapus</button></div>
    `).join('');
    $$('.queue-pill', els.queueList).forEach(row => {
      row.querySelector('[data-remove]').addEventListener('click', () => {
        state.queue = state.queue.filter(item => item.id !== row.dataset.id);
        saveJson(STORAGE.queue, state.queue);
        renderQueue();
      });
    });
  }

  async function runQueue() {
    if (state.busy) return toast('Tunggu', 'Masih proses link lain.', 'warn');
    const next = state.queue[0];
    if (!next) return toast('Queue kosong', 'Masukkan link dulu.', 'warn');
    els.videoUrlInput.value = next.url;
    showTab('video', true);
    await processUrl('video');
    state.queue = state.queue.filter(item => item.id !== next.id);
    saveJson(STORAGE.queue, state.queue);
    renderQueue();
  }

  function clearQueue() {
    state.queue = [];
    saveJson(STORAGE.queue, state.queue);
    renderQueue();
    toast('Queue kosong', 'Daftar queue dihapus.', 'success');
  }

  function setLoading(output, loading) {
    state.busy = loading;
    const btn = output === 'music' ? els.processMusicBtn : els.processVideoBtn;
    const text = output === 'music' ? els.processMusicText : els.processVideoText;
    btn.disabled = loading;
    text.textContent = loading ? 'Sedang Memproses...' : (output === 'music' ? 'Proses Musik' : 'Proses Video');
    const holder = btn.querySelector('svg, .loader');
    if (holder) holder.outerHTML = loading ? icons.loader : (output === 'music'
      ? '<svg id="processMusicIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3-3"></path></svg>'
      : '<svg id="processVideoIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"></path></svg>');
  }

  function hideResult(output) {
    const box = output === 'music' ? els.musicResultBox : els.videoResultBox;
    box.classList.add('hidden');
    box.innerHTML = '';
  }

  async function pasteTo(input) {
    try {
      const text = await navigator.clipboard.readText();
      input.value = cleanYoutubeUrl(text.trim());
      input.focus();
      toast('Clipboard ditempel', 'Link masuk ke input.', 'success');
    } catch (_) {
      toast('Clipboard ditolak', 'Browser menolak akses clipboard. Paste manual aja.', 'warn');
    }
  }

  function cleanInput(input) {
    const clean = cleanYoutubeUrl(input.value.trim());
    if (!clean) return toast('Kosong', 'Tidak ada link untuk dibersihkan.', 'warn');
    input.value = clean;
    toast('Link dibersihkan', 'Parameter tracking dibuang.', 'success');
  }

  function clearInput(input) {
    input.value = '';
    input.focus();
    toast('Dikosongkan', 'Input bersih.', 'success');
  }

  function cleanYoutubeUrl(url) {
    try {
      if (!url) return '';
      const found = String(url).match(/https?:\/\/[^\s]+/i);
      const raw = found ? found[0] : url;
      const parsed = new URL(raw);
      if (!isYoutubeUrl(parsed.href)) return raw;
      if (parsed.hostname.includes('youtu.be')) {
        const id = parsed.pathname.split('/').filter(Boolean)[0];
        return id ? `https://youtu.be/${id}` : parsed.href;
      }
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/watch?v=${id}`;
      return parsed.origin + parsed.pathname;
    } catch (_) {
      return url;
    }
  }

  function isYoutubeUrl(url) {
    return /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(String(url || ''));
  }

  function normalizeUrl(value) {
    if (Array.isArray(value)) value = value[0];
    if (value && typeof value === 'object') value = value.url || value.href || value.src || value.link || '';
    const url = String(value || '').trim();
    if (!url || url === 'undefined' || url === 'null' || /^javascript:/i.test(url)) return '';
    return url;
  }

  function firstValue(obj, keys) {
    for (const key of keys) {
      if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }
    return '';
  }

  function findDeep(obj, keys, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 4) return '';
    const lower = keys.map(k => k.toLowerCase());
    for (const [key, value] of Object.entries(obj)) {
      if (lower.includes(key.toLowerCase()) && value !== null && value !== undefined && value !== '') return value;
    }
    for (const value of Object.values(obj)) {
      const found = findDeep(value, keys, depth + 1);
      if (found) return found;
    }
    return '';
  }

  function extractQuality(value) {
    const match = String(value || '').match(/(\d{2,4})/);
    return match ? Number(match[1]) : 0;
  }

  function inferExt(item) {
    if (item.type === 'thumbnail') return 'jpg';
    const ext = String(item.format || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ext) return ext;
    return item.type === 'audio' ? 'mp3' : 'mp4';
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (!value) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = value;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function formatCount(value) {
    if (value === undefined || value === null || value === '') return 'N/A';
    const num = Number(String(value).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(num) || !String(value).match(/\d/)) return escapeHtml(value);
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
  }

  function formatDate(value) {
    try { return new Date(value).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }); }
    catch (_) { return '-'; }
  }

  function slugify(value) {
    return String(value || 'file').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 70) || 'file';
  }

  function uniqueBy(items, key) {
    const seen = new Set();
    return items.filter(item => {
      const value = item?.[key];
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  function cryptoId() {
    return crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function copyText(text, success) {
    if (!text) return toast('Tidak ada yang disalin', 'Nilainya kosong.', 'warn');
    try {
      await navigator.clipboard.writeText(text);
      toast('Disalin', success || 'Berhasil disalin.', 'success');
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      toast('Disalin', success || 'Berhasil disalin.', 'success');
    }
  }

  function toast() {
    // Notifikasi visual dimatikan total sesuai request.
  }

  function renderStats() {
    els.statProcessed.textContent = formatCount(state.stats.processed || 0);
    els.statDownloads.textContent = formatCount(state.stats.downloads || 0);
    els.statLastType.textContent = state.stats.lastType || '-';
    els.statHistory.textContent = formatCount(state.history.length || 0);
  }

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }
})();
