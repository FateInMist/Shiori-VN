/* ============================================================
   VN 图鉴 — 可交互原型
   数据源：VNDB Kana API（真实数据，只读）
   写操作（收藏/评分）为演示，不会提交到 VNDB
   ============================================================ */
(() => {
  'use strict';

  /* 原生壳在 onApplyWindowInsets 时把状态栏/导航栏高度（dp）传进来 */
  window.__setInsets = function (top, bottom) {
    const s = document.documentElement.style;
    s.setProperty('--inset-top', (Number(top) || 0) + 'px');
    s.setProperty('--inset-bottom', (Number(bottom) || 0) + 'px');
  };

  const API = 'https://api.vndb.org/kana';
  const screen = document.getElementById('screen');
  const tabbar = document.getElementById('tabbar');
  const overlayRoot = document.getElementById('overlayRoot');
  const toastEl = document.getElementById('toast');
  const appEl = document.getElementById('app');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- icons ---------------- */
  const ICONS = {
    home: '<path d="M4 10.6 12 4l8 6.6V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19z"/><path d="M9.6 20.6v-5.9h4.8v5.9"/>',
    calendar: '<rect x="3.5" y="5.2" width="17" height="15.3" rx="3.2"/><path d="M8 3.4v3.4M16 3.4v3.4M3.5 9.9h17"/><path d="M7.5 13.4h2M11 13.4h2M14.5 13.4h2M7.5 16.6h2M11 16.6h2"/>',
    heart: '<path d="M12 20.2s-7.4-4.4-7.4-9.4A4.25 4.25 0 0 1 12 7.9a4.25 4.25 0 0 1 7.4 2.9c0 5-7.4 9.4-7.4 9.4z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3.2v2.1M12 18.7v2.1M3.2 12h2.1M18.7 12h2.1M5.9 5.9l1.5 1.5M16.6 16.6l1.5 1.5M18.1 5.9l-1.5 1.5M7.4 16.6l-1.5 1.5"/>',
    search: '<circle cx="11" cy="11" r="6.4"/><path d="m15.8 15.8 4.4 4.4"/>',
    chevL: '<path d="M14.6 4.8 7.4 12l7.2 7.2"/>',
    chevR: '<path d="M9.4 4.8 16.6 12l-7.2 7.2"/>',
    arrowL: '<path d="M19.5 12h-15"/><path d="m11 5.5-6.5 6.5L11 18.5"/>',
    share: '<path d="M12 15.2V3.6"/><path d="m8.2 7.4 3.8-3.8 3.8 3.8"/><path d="M5 13.6v5.2A1.7 1.7 0 0 0 6.7 20.5h10.6a1.7 1.7 0 0 0 1.7-1.7v-5.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.6 4.6 4.6L19 6.8"/>',
    x: '<path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6"/>',
    sliders: '<path d="M4 7.5h8.5M18 7.5h2M4 16.5h4.5M13.5 16.5H20"/><circle cx="15.2" cy="7.5" r="2.1"/><circle cx="11" cy="16.5" r="2.1"/>',
    star: '<path d="m12 3.8 2.55 5.3 5.75.8-4.2 4.05 1.0 5.75L12 16.98l-5.1 2.72 1-5.75L3.7 9.9l5.75-.8z"/>',
    user: '<circle cx="12" cy="8.6" r="3.7"/><path d="M4.8 20.4a7.2 7.2 0 0 1 14.4 0"/>',
    moon: '<path d="M20 14.6A8.4 8.4 0 0 1 9.4 4 8.4 8.4 0 1 0 20 14.6z"/>',
    sun: '<circle cx="12" cy="12" r="3.9"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
    link: '<path d="M10.2 13.8a3.9 3.9 0 0 0 5.5 0l3-3a3.9 3.9 0 0 0-5.5-5.5l-1.6 1.6"/><path d="M13.8 10.2a3.9 3.9 0 0 0-5.5 0l-3 3a3.9 3.9 0 0 0 5.5 5.5l1.6-1.6"/>',
    trash: '<path d="M4.6 7h14.8M9.6 7V5.5A1.5 1.5 0 0 1 11.1 4h1.8a1.5 1.5 0 0 1 1.5 1.5V7M6.6 7l.95 12.4A1.6 1.6 0 0 0 9.15 21h5.7a1.6 1.6 0 0 0 1.6-1.6L17.4 7"/>',
    image: '<rect x="3.5" y="4.6" width="17" height="14.8" rx="3.1"/><circle cx="9" cy="10.1" r="1.55"/><path d="m4.6 17.6 4.6-4.6 3.1 3.1 3.2-3.2 3.4 3.4"/>',
    shield: '<path d="M12 3.4 18.9 6v5.6c0 4.3-2.9 7.4-6.9 8.9-4-1.5-6.9-4.6-6.9-8.9V6z"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.35-5.65"/><path d="M20 4.6V10h-5.4"/>',
    grid: '<rect x="3.6" y="3.6" width="6.8" height="6.8" rx="2.1"/><rect x="13.6" y="3.6" width="6.8" height="6.8" rx="2.1"/><rect x="3.6" y="13.6" width="6.8" height="6.8" rx="2.1"/><rect x="13.6" y="13.6" width="6.8" height="6.8" rx="2.1"/>',
    lock: '<rect x="4.6" y="10.2" width="14.8" height="10.2" rx="3"/><path d="M8.2 10.2V7.6a3.8 3.8 0 0 1 7.6 0v2.6"/>',
    clock: '<circle cx="12" cy="12" r="8.3"/><path d="M12 7.4V12l3.1 1.9"/>',
    tag: '<path d="M11.2 3.8H20v8.8l-8.4 8.4a1.8 1.8 0 0 1-2.5 0l-6.3-6.3a1.8 1.8 0 0 1 0-2.5z"/><circle cx="16.2" cy="7.8" r="1.4"/>',
    play: '<path d="M8.5 5.6 19 12 8.5 18.4z"/>',
    dot: '<circle cx="12" cy="12" r="3.4"/>',
  };

  function icon(name, cls = '') {
    const filled = name === 'star' || name === 'play' || name === 'dot';
    return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') +
      '" stroke="currentColor" stroke-width="' + (filled ? '0' : '1.85') + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || '') + '</svg>';
  }

  /* ---------------- constants ---------------- */
  const CARD_FIELDS = 'id,title,alttitle,titles{lang,title},released,rating,votecount,image{url,sexual,violence,thumbnail,dims},platforms,developers{id,name}';
  const VN_FIELDS = [
    'id,title,alttitle,titles{lang,title,latin,official,main},aliases,olang,devstatus,released,languages,platforms',
    'length,length_minutes,length_votes,description,rating,average,votecount,popularity',
    'image{url,sexual,violence,dims},screenshots{url,sexual,violence,dims}',
    'tags{id,name,category,rating,spoiler},developers{id,name,original},staff{id,name,role,note}',
    'va{note,staff{id,name},character{id,name,image{url}}},relations{id,relation,title,released,image{url}}',
    'extlinks{url,label,name}',
  ].join(',');

  const PLATFORMS = {
    win: 'Windows', lin: 'Linux', mac: 'Mac', web: '网页', and: 'Android', ios: 'iOS',
    swi: 'Switch', sw2: 'Switch 2', ps1: 'PS1', ps2: 'PS2', ps3: 'PS3', ps4: 'PS4', ps5: 'PS5',
    psv: 'PS Vita', psp: 'PSP', xbo: 'Xbox One', xb3: 'Xbox 360', xb1: 'Xbox', xxs: 'Xbox X/S',
    nds: 'NDS', n3d: '3DS', wii: 'Wii', wiu: 'Wii U', gba: 'GBA', gbc: 'GBC',
    drc: 'Dreamcast', sat: 'Saturn', smd: 'Mega Drive', scd: 'Mega-CD', pce: 'PC Engine',
    dos: 'DOS', x68: 'X68000', p98: 'PC-98', p88: 'PC-88', fmt: 'FM Towns', fm7: 'FM-7', fm8: 'FM-8',
    msx: 'MSX', pcf: 'PC-FX', tdo: '3DO', bdp: 'BD Player', dvd: 'DVD Player', mob: '手机',
    oth: '其他', vnd: 'VNDS', x1s: 'Sharp X1', nes: 'Famicom', sfc: 'SFC', gdr: 'GD-ROM',
  };
  const LANGS = {
    ja: '日语', en: '英语', zh: '中文', 'zh-Hans': '简体中文', 'zh-Hant': '繁体中文', ko: '韩语',
    ru: '俄语', fr: '法语', de: '德语', es: '西班牙语', it: '意大利语', pt: '葡萄牙语',
    'pt-br': '葡萄牙语（巴西）', pl: '波兰语', tr: '土耳其语', vi: '越南语', th: '泰语',
    id: '印尼语', nl: '荷兰语', sv: '瑞典语', no: '挪威语', da: '丹麦语', fi: '芬兰语',
    hu: '匈牙利语', cs: '捷克语', uk: '乌克兰语', ar: '阿拉伯语', he: '希伯来语', hi: '印地语',
  };
  const ROLES = {
    scenario: '剧本', director: '导演', chardesign: '角色设计', art: '美术', music: '音乐',
    songs: '演唱', translator: '翻译', editor: '编辑', qa: '测试', staff: '其他',
  };
  const ROLE_ORDER = ['director', 'scenario', 'chardesign', 'art', 'music', 'songs', 'translator', 'editor', 'qa', 'staff'];
  const RELATIONS = {
    seq: '续作', preq: '前作', pre: '前作', alt: '另版', fan: 'FD', ser: '同系列', side: '番外',
    par: '母作', char: '同角色', set: '同设定', tech: '同引擎', im: '印象', mem: '同世界观',
  };
  const LIST_STATUS = {
    1: { label: '在玩', cls: 'st-1' },
    2: { label: '已完成', cls: 'st-2' },
    3: { label: '搁置', cls: 'st-3' },
    4: { label: '弃坑', cls: 'st-4' },
    5: { label: '想玩', cls: 'st-5' },
    6: { label: '黑名单', cls: 'st-4' },
  };
  const LENGTH_LABEL = { 1: '很短', 2: '短', 3: '中等', 4: '长', 5: '很长' };
  const DEVSTATUS = { 0: '已发售', 1: '开发中', 2: '已取消' };

  const TITLE_LANG = {
    auto: 'VNDB 默认（罗马字）',
    ja: '日语原名',
    en: '英语',
    'zh-Hans': '简体中文',
    'zh-Hant': '繁体中文',
  };
  const TITLE_ROWS = [['ja', '日'], ['en', 'EN'], ['zh-Hans', '简中'], ['zh-Hant', '繁中']];

  function titleOf(vn) {
    if (!vn) return '';
    const want = state.settings.titleLang || 'auto';
    if (want === 'auto') return vn.title || '';
    const list = vn.titles || [];
    const pick = (code) => list.find(t => t.lang === code && (t.title || t.latin));
    let t = pick(want);
    if (!t && want === 'zh-Hans') t = pick('zh-Hant');
    if (!t && want === 'zh-Hant') t = pick('zh-Hans');
    if (!t && want === 'ja') t = list.find(x => x.main);
    return (t && (t.title || t.latin)) || vn.title || '';
  }

  function titleRows(vn, mainText) {
    const rows = [];
    const seen = new Set([mainText]);
    TITLE_ROWS.forEach(([code, label]) => {
      const t = (vn.titles || []).find(x => x.lang === code);
      const text = t && (t.title || t.latin);
      if (!text || seen.has(text)) return;
      seen.add(text);
      rows.push([label, text]);
    });
    if (!rows.length && vn.alttitle && !seen.has(vn.alttitle)) rows.push(['日', vn.alttitle]);
    return rows;
  }

  const HOME_CHIPS = [
    { id: 'top', label: '高分', filters: [['rating', '>=', 76], ['votecount', '>=', 300]], sort: 'rating' },
    { id: 'new', label: '新作', filters: [['released', '>=', monthsAgo(20)]], sort: 'released' },
    { id: 'pop', label: '人气', filters: [], sort: 'votecount' },
    { id: 'romance', label: '恋爱', filters: [['tag', '=', 'g96']], sort: 'rating' },
    { id: 'fantasy', label: '奇幻', filters: [['tag', '=', 'g2']], sort: 'rating' },
    { id: 'mystery', label: '悬疑', filters: [['tag', '=', 'g19']], sort: 'rating' },
    { id: 'scifi', label: '科幻', filters: [['tag', '=', 'g105']], sort: 'rating' },
    { id: 'slice', label: '日常', filters: [['tag', '=', 'g454']], sort: 'rating' },
    { id: 'school', label: '校园', filters: [['tag', '=', 'g47']], sort: 'rating' },
    { id: 'nakige', label: '泣系', filters: [['tag', '=', 'g596']], sort: 'rating' },
  ];

  const HOT_TAGS = [
    ['恋爱', 'g96'], ['奇幻', 'g2'], ['悬疑', 'g19'], ['科幻', 'g105'], ['喜剧', 'g104'],
    ['剧情', 'g147'], ['恐怖', 'g7'], ['日常', 'g454'], ['校园', 'g47'], ['泣系', 'g596'],
    ['乙女', 'g542'], ['动作', 'g12'],
  ];

  /* ---------------- state ---------------- */
  const DEFAULT_SETTINGS = { theme: 'dark', accent: 'vndb', blurAdult: true, quality: 'high', titleLang: 'auto' };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  }

  const state = {
    token: (() => { try { return localStorage.getItem('vn.token') || ''; } catch (e) { return ''; } })(),
    user: null,
    settings: Object.assign({}, DEFAULT_SETTINGS, loadJSON('vn.settings', {})),
    recent: loadJSON('vn.recent', []),
    lastSearches: loadJSON('vn.searches', []),
  };

  const cache = new Map();

  /* ---------------- 本地缓存（离线 / 秒开） ---------------- */
  const CACHE_PREFIX = 'vnc:';
  const CACHE_INDEX = 'vnc:__index';
  const TTL = { list: 2 * 3600e3, detail: 24 * 3600e3, long: 7 * 24 * 3600e3, ulist: 60e3 };

  function hashCode(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function cacheId(path, body, token) {
    return hashCode(path + '|' + JSON.stringify(body || null) + '|' + (token ? token.slice(-10) : ''));
  }
  function cacheRead(id) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function cacheWrite(id, path, data, ttl) {
    try {
      localStorage.setItem(CACHE_PREFIX + id, JSON.stringify({ t: Date.now(), ttl, p: path, d: data }));
      const idx = loadJSON(CACHE_INDEX, []);
      const next = idx.filter(x => x.id !== id);
      next.push({ id, t: Date.now() });
      localStorage.setItem(CACHE_INDEX, JSON.stringify(next));
      trimCache(next);
    } catch (e) {
      /* 配额满：清掉一半再试一次 */
      try {
        const idx = loadJSON(CACHE_INDEX, []);
        idx.slice(0, Math.ceil(idx.length / 2)).forEach(x => localStorage.removeItem(CACHE_PREFIX + x.id));
        localStorage.setItem(CACHE_INDEX, JSON.stringify(idx.slice(Math.ceil(idx.length / 2))));
        localStorage.setItem(CACHE_PREFIX + id, JSON.stringify({ t: Date.now(), ttl, p: path, d: data }));
      } catch (e2) { /* 放弃缓存 */ }
    }
  }
  function trimCache(idx) {
    if (idx.length <= 90) return;
    idx.sort((a, b) => a.t - b.t);
    const drop = idx.slice(0, idx.length - 70);
    drop.forEach(x => { try { localStorage.removeItem(CACHE_PREFIX + x.id); } catch (e) {} });
    try { localStorage.setItem(CACHE_INDEX, JSON.stringify(idx.slice(idx.length - 70))); } catch (e) {}
  }
  function cacheStats() {
    let bytes = 0, count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX) && k !== CACHE_INDEX) {
          count++;
          bytes += (localStorage.getItem(k) || '').length;
        }
      }
    } catch (e) {}
    return { count, bytes };
  }
  function clearApiCache() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }
  function invalidatePath(prefixPath) {
    try {
      const idx = loadJSON(CACHE_INDEX, []);
      const keep = [];
      idx.forEach(x => {
        const entry = cacheRead(x.id);
        if (entry && entry.p && entry.p.indexOf(prefixPath) === 0) {
          localStorage.removeItem(CACHE_PREFIX + x.id);
        } else {
          keep.push(x);
        }
      });
      localStorage.setItem(CACHE_INDEX, JSON.stringify(keep));
    } catch (e) {}
  }

  const inflight = new Map();
  function backgroundRefresh(id, path, body, opts, ttl) {
    if (inflight.has(id)) return;
    inflight.set(id, true);
    api(path, body, opts)
      .then((data) => cacheWrite(id, path, data, ttl))
      .catch(() => {})
      .finally(() => inflight.delete(id));
  }

  /* 带缓存请求：
     - 有缓存且未过期 → 直接用
     - 有缓存但已过期 → 先返回旧数据，后台静默更新（下次打开就是新的）
     - 无缓存 → 正常请求
  */
  async function apiCached(path, body, opts) {
    opts = opts || {};
    const ttl = opts.ttl || TTL.list;
    const id = cacheId(path, body, opts.token);
    const hit = cacheRead(id);
    const fresh = hit && hit.ttl && (Date.now() - hit.t < hit.ttl);
    if (hit && !opts.force) {
      if (!fresh) backgroundRefresh(id, path, body, opts, ttl);
      return hit.d;
    }
    try {
      const data = await api(path, body, opts);
      cacheWrite(id, path, data, ttl);
      return data;
    } catch (err) {
      if (hit) return hit.d;
      throw err;
    }
  }

  /* ---------------- utils ---------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function monthsAgo(n) {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
  }
  function ratingOf(v) {
    const r = v && (v.rating != null ? v.rating : v.average);
    return r == null ? null : (r / 10).toFixed(1);
  }
  function votesFmt(n) {
    if (n == null) return '';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }
  function yearOf(s) {
    if (!s) return '';
    const m = String(s).match(/^(\d{4})/);
    return m ? m[1] : '待定';
  }
  function dateCn(s) {
    if (!s) return '未知';
    if (s === 'TBA') return '待定';
    const m = String(s).match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
    if (!m) return s;
    let out = m[1] + ' 年';
    if (m[2]) out += ' ' + Number(m[2]) + ' 月';
    if (m[3]) out += ' ' + Number(m[3]) + ' 日';
    return out;
  }
  /* 我的时长：VNDB 没有写入接口，只存本机 */
  function myLengthKey(id) { return 'vnlen:' + id; }
  function getMyLength(id) {
    try {
      const v = localStorage.getItem(myLengthKey(id));
      return v ? Math.max(0, Number(v) || 0) : 0;
    } catch (e) { return 0; }
  }
  function setMyLength(id, minutes) {
    try {
      if (minutes > 0) localStorage.setItem(myLengthKey(id), String(Math.round(minutes)));
      else localStorage.removeItem(myLengthKey(id));
    } catch (e) { /* 忽略 */ }
  }
  function myLengthText(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h && m) return h + ' 小时 ' + m + ' 分';
    if (h) return h + ' 小时';
    return m + ' 分';
  }

  function lengthShort(v) {
    if (v.length_minutes) {
      const h = Math.round(v.length_minutes / 60);
      return h >= 1 ? h + ' 小时' : v.length_minutes + ' 分';
    }
    return LENGTH_LABEL[v.length] || '';
  }
  function lengthText(v) {
    if (v.length_minutes) {
      const h = Math.floor(v.length_minutes / 60);
      const m = v.length_minutes % 60;
      return (h ? h + ' 小时 ' : '') + (m ? m + ' 分' : '');
    }
    if (v.length) return LENGTH_LABEL[v.length] || '未知';
    return '未知';
  }
  function platformText(list) {
    if (!list || !list.length) return '未知';
    return list.map(p => PLATFORMS[p] || p).join(' / ');
  }
  function langText(list) {
    if (!list || !list.length) return '未知';
    return list.map(l => LANGS[l] || l).join(' · ');
  }

  /* 把 VNDB 描述里的 BBCode 简化成安全 HTML */
  function formatDesc(text) {
    if (!text) return '';
    let out = esc(text);
    out = out.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (m, url, label) => {
      const safe = url.replace(/"/g, '%22');
      return '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    });
    out = out.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<span class="spoiler" data-spoiler>$1</span>');
    out = out.replace(/\[\/?(b|i|u|s|code|quote|center|raw|spoiler|url[^\]]*)\]/gi, '');
    return out;
  }

  /* ---------------- API ---------------- */
  class ApiError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  /* VNDB 的 CORS 只允许 POST/GET，PATCH/DELETE 需要本地服务器代理转发。
     同源下若存在 /kana 代理就用它，否则直连 API（写操作会被浏览器拦下）。 */
  let apiRoot = API;
  let apiRootReady = false;
  async function resolveApiRoot() {
    apiRootReady = true;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    try {
      const ping = await fetch(location.origin + '/kana/schema', { method: 'GET', cache: 'no-store' });
      if (ping.ok) apiRoot = location.origin + '/kana';
    } catch (e) { /* 没有代理就直连 */ }
  }

  /* 原生 HTTP 桥（只有 APK 壳里有）：不经过浏览器，天然没有 CORS 限制，PATCH/DELETE 可用 */
  const nativePending = new Map();
  let nativeSeq = 0;
  window.__nativeHttp = function (id, res) {
    const cb = nativePending.get(id);
    if (!cb) return;
    nativePending.delete(id);
    cb(res || {});
  };

  function nativeRequest(url, opts) {
    return new Promise((resolve, reject) => {
      const id = 'r' + (++nativeSeq);
      nativePending.set(id, (res) => {
        if (res.error) reject(new ApiError(0, '网络请求失败：' + res.error));
        else resolve({ status: res.status, text: res.body || '' });
      });
      try {
        window.AndroidApp.request(id, opts.method || 'GET', url,
          JSON.stringify(opts.headers || {}), opts.body || null);
      } catch (e) {
        nativePending.delete(id);
        reject(new ApiError(0, '原生请求失败：' + e.message));
      }
    });
  }

  async function httpRaw(url, opts) {
    if (window.AndroidApp && window.AndroidApp.request) {
      return nativeRequest(url, opts);
    }
    let res;
    try {
      res = await fetch(url, {
        method: opts.method || 'GET',
        headers: opts.headers,
        body: opts.body,
        signal: opts.signal,
      });
    } catch (e) {
      throw new ApiError(0, '网络请求失败，请检查网络或代理');
    }
    const text = res.status === 204 ? '' : await res.text();
    return { status: res.status, text };
  }

  async function api(path, body, opts) {
    opts = opts || {};
    if (!apiRootReady) await resolveApiRoot();
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (opts.token) headers['Authorization'] = 'Token ' + opts.token;

    const raw = await httpRaw(apiRoot + path, {
      method: opts.method || (body ? 'POST' : 'GET'),
      headers,
      body: body ? JSON.stringify(body) : null,
      signal: opts.signal,
    });

    if (raw.status === 204) return null;
    if (raw.status < 200 || raw.status >= 300) {
      let msg = raw.text;
      try { const j = JSON.parse(raw.text); msg = j.message || j.error || raw.text; } catch (e) { /* plain */ }
      throw new ApiError(raw.status, String(msg).slice(0, 200));
    }
    return raw.text ? JSON.parse(raw.text) : null;
  }
  function vnList(body, ttl) { return apiCached('/vn', body, { ttl: ttl || TTL.list }); }

  /* ---------------- 打开外部链接（WebView 里走原生） ---------------- */
  function openExternal(url) {
    try {
      if (window.AndroidApp && window.AndroidApp.openExternal) {
        window.AndroidApp.openExternal(url);
        return;
      }
    } catch (e) { /* 忽略 */ }
    window.open(url, '_blank', 'noopener');
  }

  /* ---------------- preference helpers ---------------- */
  function isNsfw(img) {
    return state.settings.blurAdult && img && img.sexual != null && img.sexual >= 1.5;
  }
  /* 横版封面判断：优先用 API 给的 dims，没有则等图片加载后按真实尺寸补判 */
  function isLand(img) {
    const d = img && img.dims;
    return !!(d && d[0] && d[1] && d[0] > d[1] * 1.06);
  }
  function coverHtml(v, opts) {
    opts = opts || {};
    const img = v.image || {};
    const src = img.url || '';
    const land = isLand(img);
    const nsfw = isNsfw(img) ? ' nsfw' : '';
    const classes = 'cover' + (land ? ' land' : '') + nsfw + (opts.cls ? ' ' + opts.cls : '');
    const badge = opts.noBadge ? '' : ratingBadge(v);
    return '<div class="' + classes + '" data-cover>' +
      '<div class="ph sk"></div>' +
      (src ? (land ? '<img class="bgfill" loading="lazy" decoding="async" src="' + esc(src) + '" alt="" aria-hidden="true">' : '') +
        '<img class="fade" loading="lazy" decoding="async" src="' + esc(src) + '" alt="">' : '') +
      badge +
      '</div>';
  }
  function ratingBadge(v) {
    const r = ratingOf(v);
    if (!r) return '';
    const top = Number(r) >= 8.5 ? ' top' : '';
    return '<span class="badge' + top + '">' + icon('star') + r + '</span>';
  }

  /* ---------------- skeleton / error ---------------- */
  function skeletonGrid(n) {
    let out = '<div class="grid">';
    for (let i = 0; i < n; i++) {
      out += '<div class="card"><div class="sk" style="aspect-ratio:3/4;border-radius:20px"></div>' +
        '<div class="sk" style="height:11px;margin:9px 2px 0;width:86%"></div>' +
        '<div class="sk" style="height:11px;margin:5px 2px 0;width:54%"></div></div>';
    }
    return out + '</div>';
  }
  function errorCard(err, retryLabel) {
    return '<div class="err-card"><h3>加载失败</h3><p>' + esc(err && err.message ? err.message : err) +
      '</p><button class="btn" data-act="retry">' + icon('refresh') + (retryLabel || '重试') + '</button></div>';
  }

  /* ---------------- toast / sheet / lightbox ---------------- */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2400);
  }

  let activeSheet = null;
  function closeSheet() {
    if (!activeSheet) return;
    const s = activeSheet;
    activeSheet = null;
    screen.style.overflow = '';
    s.scrim.classList.remove('on');
    s.sheet.classList.remove('on');
    setTimeout(() => { s.wrap.remove(); }, 320);
  }
  function openSheet(html, onMount) {
    closeSheet();
    const wrap = document.createElement('div');
    wrap.innerHTML = '<div class="scrim"></div><div class="sheet"><div class="grabber"></div>' + html + '</div>';
    overlayRoot.appendChild(wrap);
    const scrim = wrap.firstElementChild;
    const sheet = wrap.lastElementChild;
    scrim.addEventListener('click', closeSheet);
    screen.style.overflow = 'hidden';
    requestAnimationFrame(() => { scrim.classList.add('on'); sheet.classList.add('on'); });
    activeSheet = { wrap, scrim, sheet };
    if (onMount) onMount(sheet);
    return sheet;
  }

  function openLightbox(urls, start) {
    let idx = start || 0;
    const wrap = document.createElement('div');
    wrap.innerHTML = '<div class="lightbox">' +
      '<div class="lb-bar"><button class="icon-btn" data-lb="close">' + icon('x') + '</button></div>' +
      '<img alt=""><div class="lb-count"></div></div>';
    overlayRoot.appendChild(wrap);
    const lb = wrap.firstElementChild;
    const img = $('img', lb);
    const counter = $('.lb-count', lb);
    function paint() {
      img.src = urls[idx];
      counter.textContent = (idx + 1) + ' / ' + urls.length;
    }
    paint();
    requestAnimationFrame(() => lb.classList.add('on'));
    lb.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-lb]');
      if (btn || ev.target === lb) {
        lb.classList.remove('on');
        setTimeout(() => wrap.remove(), 240);
        return;
      }
      const rect = lb.getBoundingClientRect();
      if (ev.clientX < rect.width * 0.32 && idx > 0) { idx--; paint(); }
      else if (ev.clientX > rect.width * 0.68 && idx < urls.length - 1) { idx++; paint(); }
    });
  }

  /* ---------------- images ---------------- */
  document.addEventListener('load', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.classList.contains('fade')) {
      t.classList.add('in');
      const ph = t.parentElement && t.parentElement.querySelector('.ph');
      if (ph) ph.style.display = 'none';

      /* API 没给 dims 时，用真实尺寸兜底判断横版 */
      const cover = t.closest('[data-cover]');
      if (cover && t.naturalWidth && t.naturalHeight && t.naturalWidth > t.naturalHeight * 1.06) {
        if (!cover.classList.contains('land')) {
          cover.classList.add('land');
          if (!cover.querySelector('.bgfill')) {
            const bg = document.createElement('img');
            bg.className = 'bgfill';
            bg.src = t.currentSrc || t.src;
            bg.alt = '';
            bg.setAttribute('aria-hidden', 'true');
            cover.insertBefore(bg, cover.firstChild);
          }
        }
        if (cover.classList.contains('poster')) {
          cover.style.width = '100%';
          cover.style.aspectRatio = t.naturalWidth + ' / ' + t.naturalHeight;
        }
      }
    }
  }, true);
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.parentElement) {
      const ph = t.parentElement.querySelector('.ph');
      if (ph) ph.style.display = 'none';
      t.style.display = 'none';
    }
  }, true);

  /* ---------------- cards ---------------- */
  function cardHtml(v, extra) {
    extra = extra || {};
    const sub = extra.sub != null ? extra.sub : (yearOf(v.released) || '');
    return '<article class="card" data-vn="' + esc(v.id) + '">' +
      coverHtml(v, extra) +
      '<h3 class="card-title">' + esc(titleOf(v)) + '</h3>' +
      (sub ? '<div class="card-sub">' + esc(sub) + '</div>' : '') +
      (extra.overlay || '') +
      '</article>';
  }

  /* ---------------- home ---------------- */
  const homeState = { chip: HomeChipDefault(), items: [], page: 1, more: true, loading: false, runId: 0 };
  function HomeChipDefault() { return HOME_CHIPS[0]; }

  function chipHtml(chips, activeId) {
    return chips.map(c =>
      '<button class="chip' + (c.id === activeId ? ' is-on' : '') + '" data-chip="' + c.id + '">' + esc(c.label) + '</button>'
    ).join('');
  }

  async function renderHome() {
    const runId = ++navSeq;
    if (homeState.items.length) { paintHome(); return; }
    screen.innerHTML = '<div class="home-top"><button class="home-search" data-act="go-search">' +
      icon('search') + '<span>搜索作品、标签、角色…</span></button></div>' +
      '<div class="chips">' + chipHtml(HOME_CHIPS, homeState.chip.id) + '</div>' +
      skeletonGrid(9);
    try {
      const chip = homeState.chip;
      const filters = chip.filters.length === 0 ? [] :
        chip.filters.length === 1 ? chip.filters[0] : ['and'].concat(chip.filters);
      const data = await vnList({ filters, sort: chip.sort, reverse: true, results: 24, page: 1, fields: CARD_FIELDS });
      if (runId !== navSeq) return;
      homeState.items = data.results || [];
      homeState.page = 1;
      homeState.more = !!data.more;
      paintHome();
    } catch (err) {
      if (runId !== navSeq) return;
      screen.innerHTML = errorCard(err);
    }
  }

  function paintHome() {
    screen.innerHTML =
      '<div class="home-top"><button class="home-search" data-act="go-search">' +
        icon('search') + '<span>搜索作品、标签、角色…</span></button></div>' +
      '<div class="chips" id="homeChips">' + chipHtml(HOME_CHIPS, homeState.chip.id) + '</div>' +
      '<div id="quoteSlot"></div>' +
      '<div class="section-head"><div class="section-title"><span class="dot"></span>' +
        esc(homeState.chip.label) + '推荐</div><div class="section-more">' + (homeState.items.length ? homeState.items.length + '+ 部' : '') + '</div></div>' +
      '<div class="grid" id="homeGrid">' + homeState.items.map(v => cardHtml(v, { sub: yearOf(v.released) })).join('') + '</div>' +
      '<div class="loader" id="homeLoader" hidden><span class="spin"></span>加载中</div>' +
      '<div id="sentinel" style="height:1px"></div>';

    $('#homeChips').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-chip]');
      if (!btn) return;
      const chip = HOME_CHIPS.find(c => c.id === btn.dataset.chip);
      if (!chip || chip.id === homeState.chip.id) return;
      homeState.chip = chip;
      homeState.items = [];
      homeState.more = true;
      screen.scrollTop = 0;
      renderHome();
    });

    if (homeState.more) {
      observeSentinel(() => loadHomeMore());
    }
    loadDailyQuote();
  }

  /* ---------------- 每日台词 ---------------- */
  function quoteHtml(q) {
    const vn = q.vn || {};
    const ch = q.character;
    const face = ch && ch.image && ch.image.url
      ? '<img src="' + esc(ch.image.url) + '" alt="">'
      : '<span style="width:21px;height:21px;border-radius:50%;background:var(--chip);display:inline-block"></span>';
    const who = (ch ? esc(ch.name) + ' · ' : '') + esc(vn.title || 'VNDB');
    return '<div class="quote-card"' + (vn.id ? ' data-vn="' + esc(vn.id) + '"' : '') + '>' +
      '<p class="q-text">' + esc(q.quote || '') + '</p>' +
      '<div class="q-foot">' + face + '<span class="q-vn">' + who + '</span>' +
      '<span class="q-tag">每日台词</span></div></div>';
  }

  async function loadDailyQuote() {
    const slot = $('#quoteSlot');
    if (!slot) return;
    const day = new Date().toISOString().slice(0, 10);
    const key = 'vn.quote.' + day;
    let q = null;
    try { q = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    if (q) { slot.innerHTML = quoteHtml(q); return; }
    try {
      const data = await api('/quote', {
        filters: ['random', '=', 1],
        results: 1,
        fields: 'id,quote,score,vn{id,title},character{id,name,image{url}}',
      });
      q = (data.results || [])[0];
      if (!q) return;
      try { localStorage.setItem(key, JSON.stringify(q)); } catch (e) {}
      if ($('#quoteSlot')) slot.innerHTML = quoteHtml(q);
    } catch (e) { /* 静默 */ }
  }

  async function loadHomeMore() {
    if (homeState.loading || !homeState.more) return;
    homeState.loading = true;
    const loader = $('#homeLoader');
    if (loader) loader.hidden = false;
    try {
      const chip = homeState.chip;
      const filters = chip.filters.length === 0 ? [] :
        chip.filters.length === 1 ? chip.filters[0] : ['and'].concat(chip.filters);
      const page = homeState.page + 1;
      const data = await vnList({ filters, sort: chip.sort, reverse: true, results: 24, page, fields: CARD_FIELDS });
      homeState.page = page;
      homeState.more = !!data.more;
      const grid = $('#homeGrid');
      if (grid && data.results.length) {
        grid.insertAdjacentHTML('beforeend', data.results.map(v => cardHtml(v)).join(''));
      }
      if (!homeState.more && loader) loader.remove();
    } catch (e) {
      toast('加载更多失败');
    } finally {
      homeState.loading = false;
      const l = $('#homeLoader');
      if (l && homeState.more) l.hidden = true;
    }
  }

  /* ---------------- calendar ---------------- */
  const calState = {
    y: new Date().getFullYear(),
    m: new Date().getMonth(),
    cache: new Map(),
  };

  async function renderCalendar() {
    const runId = ++navSeq;
    const y = calState.y, m = calState.m;
    screen.innerHTML =
      '<div class="page-head" style="padding-bottom:6px"><div><h1 class="page-title">发售日历</h1>' +
      '<div class="page-sub">按发售月份浏览视觉小说</div></div></div>' +
      '<div class="month-bar"><button class="icon-btn" data-act="cal-prev">' + icon('chevL') + '</button>' +
      '<div class="month-label">' + y + ' 年 ' + (m + 1) + ' 月</div>' +
      '<button class="icon-btn" data-act="cal-next">' + icon('chevR') + '</button></div>' +
      '<div id="calBody">' + skeletonGrid(9) + '</div>';

    $('.month-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      if (btn.dataset.act === 'cal-prev') {
        calState.m--; if (calState.m < 0) { calState.m = 11; calState.y--; }
      } else {
        calState.m++; if (calState.m > 11) { calState.m = 0; calState.y++; }
      }
      screen.scrollTop = 0;
      renderCalendar();
    });

    const key = y + '-' + m;
    if (calState.cache.has(key)) { paintCalendar(calState.cache.get(key), y, m); return; }

    try {
      const start = y + '-' + String(m + 1).padStart(2, '0') + '-01';
      const ny = m === 11 ? y + 1 : y;
      const nm = m === 11 ? 1 : m + 2;
      const end = ny + '-' + String(nm).padStart(2, '0') + '-01';
      const data = await vnList({
        filters: ['and', ['released', '>=', start], ['released', '<', end]],
        sort: 'released', reverse: true, results: 100,
        fields: CARD_FIELDS,
      });
      if (runId !== navSeq) return;
      calState.cache.set(key, data.results || []);
      paintCalendar(data.results || [], y, m);
    } catch (err) {
      if (runId !== navSeq) return;
      $('#calBody').innerHTML = errorCard(err);
    }
  }

  function paintCalendar(allItems, y, m) {
    const body = $('#calBody');
    if (!body) return;
    /* 只保留本月完整日期，避免 "2026" 这类只到年份的条目混进当月 */
    const prefix = y + '-' + String(m + 1).padStart(2, '0');
    const items = (allItems || []).filter(v => String(v.released || '').startsWith(prefix));
    if (!items.length) {
      body.innerHTML = '<div class="empty"><div class="big">' + icon('calendar') + '</div>' +
        '<h3>这个月没有记录</h3><p>' + y + ' 年 ' + (m + 1) + ' 月暂时没有已公布发售日的作品。</p></div>';
      return;
    }
    const groups = new Map();
    items.forEach(v => {
      const d = String(v.released || '');
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d).push(v);
    });
    /* 完整日期在前，只有月份/年份的放最后 */
    const keys = Array.from(groups.keys()).sort((a, b) => {
      const af = /^\d{4}-\d{2}-\d{2}$/.test(a) ? 0 : 1;
      const bf = /^\d{4}-\d{2}-\d{2}$/.test(b) ? 0 : 1;
      if (af !== bf) return af - bf;
      return String(b).localeCompare(String(a));
    });
    let html = '';
    keys.forEach((date) => {
      const list = groups.get(date);
      const full = date.match(/^\d{4}-(\d{2})-(\d{2})$/);
      const monthOnly = date.match(/^\d{4}-(\d{2})$/);
      let head = date;
      if (full) {
        head = full[1].replace(/^0/, '') + ' 月 ' + full[2].replace(/^0/, '') + ' 日';
      } else if (monthOnly) {
        head = '日期未定';
      }
      html += '<section><div class="date-head"><span>' + esc(head) + '</span>' +
        '<i>' + list.length + '</i></div>' +
        '<div class="grid">' + list.map(v => cardHtml(v, { sub: '' })).join('') + '</div></section>';
    });
    body.innerHTML = html;
  }

  /* ---------------- search ---------------- */
  const searchState = {
    q: '',
    sort: 'relevance',
    platforms: [],
    years: [],
    lengths: [],
    rating: 0,
    tags: [],
    items: [],
    page: 1,
    more: true,
    loading: false,
    total: 0,
  };

  function buildSearchFilters() {
    const f = [];
    if (searchState.q) f.push(['search', '=', searchState.q]);
    searchState.tags.forEach(tid => f.push(['tag', '=', tid]));
    searchState.platforms.forEach(p => f.push(['platform', '=', p]));
    if (searchState.years.length) {
      const ors = searchState.years.map(y => ['and',
        ['released', '>=', y + '-01-01'],
        ['released', '<', String(Number(y) + 1) + '-01-01']]);
      f.push(ors.length === 1 ? ors[0] : ['or'].concat(ors));
    }
    searchState.lengths.forEach(l => f.push(['length', '=', Number(l)]));
    if (searchState.rating) f.push(['rating', '>=', searchState.rating]);
    if (!f.length) return [];
    return f.length === 1 ? f[0] : ['and'].concat(f);
  }

  function sortArgs() {
    switch (searchState.sort) {
      case 'rating': return { sort: 'rating', reverse: true };
      case 'released': return { sort: 'released', reverse: true };
      case 'votecount': return { sort: 'votecount', reverse: true };
      case 'title': return { sort: 'title', reverse: false };
      default: return {};
    }
  }

  function renderSearch() {
    screen.innerHTML =
      '<div class="search-wrap"><div class="search-box">' + icon('search') +
        '<input id="q" type="search" enterkeyhint="search" placeholder="搜索作品、别名…" value="' + esc(searchState.q) + '">' +
        '<button class="icon-sq" data-act="open-filters" aria-label="筛选">' + icon('sliders') + '</button>' +
      '</div></div>' +
      '<div id="searchBody"></div>';

    const input = $('#q');
    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const val = input.value.trim();
        if (val === searchState.q) return;
        searchState.q = val;
        runSearch(true);
      }, 320);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { input.blur(); searchState.q = input.value.trim(); runSearch(true); }
    });
    $$('[data-act="open-filters"]').forEach(b => b.addEventListener('click', openFilterSheet));

    if (!searchState.q && !searchState.tags.length && !searchState.platforms.length && !searchState.years.length) {
      paintSearchIdle();
    } else {
      runSearch(true);
    }
  }

  function paintSearchIdle() {
    const body = $('#searchBody');
    const recent = state.recent.slice(0, 6);
    body.innerHTML =
      '<div class="section-head" style="padding-top:8px"><div class="section-title"><span class="dot"></span>热门标签</div></div>' +
      '<div class="tags" style="padding:0 16px;gap:8px">' +
        HOT_TAGS.map(t => '<button class="tag" data-hot-tag="' + t[1] + '">' + esc(t[0]) + '</button>').join('') +
      '</div>' +
      (recent.length ?
        '<div class="section-head"><div class="section-title"><span class="dot"></span>最近浏览</div>' +
        '<div class="section-more" data-act="clear-recent">清空</div></div>' +
        '<div class="hscroll" style="display:flex;gap:11px;overflow-x:auto;padding:0 16px 6px">' +
          recent.map(v => '<div class="mini" data-vn="' + esc(v.id) + '" style="width:88px;flex:none">' +
            '<div class="cover" style="aspect-ratio:3/4;border-radius:16px;overflow:hidden;background:var(--bg-2)">' +
              '<img src="' + esc(v.image || '') + '" alt="" style="width:100%;height:100%;object-fit:cover">' +
            '</div>' +
            '<div class="card-title" style="font-size:11px">' + esc(v.title) + '</div>' +
          '</div>').join('') +
        '</div>' : '') +
      '<div class="empty" style="padding-top:34px"><div class="big">' + icon('search') + '</div>' +
        '<h3>找一部想玩的</h3><p>输入标题、别名或英文名；也可以用标签、平台、年份筛选。</p></div>';

    body.addEventListener('click', (e) => {
      const tagBtn = e.target.closest('[data-hot-tag]');
      if (tagBtn) {
        searchState.tags = [tagBtn.dataset.hotTag];
        renderSearch();
        return;
      }
      if (e.target.closest('[data-act="clear-recent"]')) {
        state.recent = [];
        saveJSON('vn.recent', []);
        paintSearchIdle();
      }
    });
  }

  async function runSearch(reset) {
    if (reset) {
      searchState.items = [];
      searchState.page = 1;
      searchState.more = true;
      const body = $('#searchBody');
      if (body) body.innerHTML = skeletonGrid(9);
    }
    if (searchState.loading) return;
    searchState.loading = true;
    try {
      const body = { filters: buildSearchFilters(), results: 30, page: searchState.page, fields: CARD_FIELDS };
      Object.assign(body, sortArgs());
      const data = await vnList(body);
      searchState.items = searchState.items.concat(data.results || []);
      searchState.more = !!data.more;
      paintSearchResults(data.more);
      if (searchState.q && !state.lastSearches.includes(searchState.q)) {
        state.lastSearches.unshift(searchState.q);
        state.lastSearches = state.lastSearches.slice(0, 8);
        saveJSON('vn.searches', state.lastSearches);
      }
    } catch (err) {
      const body = $('#searchBody');
      if (body) body.innerHTML = errorCard(err);
    } finally {
      searchState.loading = false;
    }
  }

  function paintSearchResults(more) {
    const body = $('#searchBody');
    if (!body) return;
    if (!searchState.items.length) {
      body.innerHTML = '<div class="empty"><div class="big">' + icon('search') + '</div>' +
        '<h3>没有找到结果</h3><p>换个关键词，或者放宽筛选条件试试。</p></div>';
      return;
    }
    body.innerHTML =
      '<div class="result-meta"><span>已加载 <b>' + searchState.items.length + '</b> 部作品' +
        (more ? '，可继续下拉' : '') + '</span><span>' + sortLabel() + '</span></div>' +
      '<div class="grid" id="searchGrid">' + searchState.items.map(v => cardHtml(v, { sub: yearOf(v.released) })).join('') + '</div>' +
      '<div class="loader" id="searchLoader" hidden><span class="spin"></span>加载中</div>' +
      '<div id="sentinel" style="height:1px"></div>';
    if (more) observeSentinel(loadSearchMore);
  }

  function sortLabel() {
    return ({ relevance: '相关度', rating: '评分最高', released: '最新发售', votecount: '评价最多', title: '标题' })[searchState.sort] || '';
  }

  async function loadSearchMore() {
    if (searchState.loading || !searchState.more) return;
    searchState.loading = true;
    const loader = $('#searchLoader');
    if (loader) loader.hidden = false;
    try {
      searchState.page++;
      const body = { filters: buildSearchFilters(), results: 30, page: searchState.page, fields: CARD_FIELDS };
      Object.assign(body, sortArgs());
      const data = await vnList(body);
      searchState.more = !!data.more;
      searchState.items = searchState.items.concat(data.results || []);
      const grid = $('#searchGrid');
      if (grid && data.results.length) {
        grid.insertAdjacentHTML('beforeend', data.results.map(v => cardHtml(v)).join(''));
      }
    } catch (e) {
      searchState.page--;
      toast('加载更多失败');
    } finally {
      searchState.loading = false;
      const l = $('#searchLoader');
      if (l) l.hidden = true;
    }
  }

  const FILTER_PLATFORMS = [['win', 'Windows'], ['swi', 'Switch'], ['ps5', 'PS5'], ['ps4', 'PS4'], ['ps2', 'PS2'], ['and', 'Android'], ['ios', 'iOS'], ['lin', 'Linux'], ['mac', 'Mac'], ['web', '网页']];
  const FILTER_YEARS = ['2025', '2024', '2023', '2022', '2021', '2020', '2018', '2015', '2010', '2005'];

  function openFilterSheet() {
    const tagsHtml = searchState.tags.length
      ? searchState.tags.map(t => '<button class="opt on" data-del-tag="' + esc(t) + '">' + esc(tagName(t)) + ' ×</button>').join('')
      : '<span class="muted" style="font-size:12px">还没有选择标签</span>';

    const sheet = openSheet(
      '<h2>筛选</h2><div class="s-sub">组合条件会同时生效</div>' +
      '<div class="sheet-section"><h4>排序</h4><div class="opt-row" id="sortRow">' +
        [['relevance', '相关度'], ['rating', '评分最高'], ['released', '最新发售'], ['votecount', '评价最多'], ['title', '标题']]
          .map(o => '<button class="opt' + (searchState.sort === o[0] ? ' on' : '') + '" data-sort="' + o[0] + '">' + o[1] + '</button>').join('') +
      '</div></div>' +
      '<div class="sheet-section"><h4>平台</h4><div class="opt-row" id="platRow">' +
        FILTER_PLATFORMS.map(p => '<button class="opt' + (searchState.platforms.includes(p[0]) ? ' on' : '') + '" data-plat="' + p[0] + '">' + p[1] + '</button>').join('') +
      '</div></div>' +
      '<div class="sheet-section"><h4>年份</h4><div class="opt-row" id="yearRow">' +
        FILTER_YEARS.map(y => '<button class="opt' + (searchState.years.includes(y) ? ' on' : '') + '" data-year="' + y + '">' + y + '</button>').join('') +
      '</div></div>' +
      '<div class="sheet-section"><h4>时长</h4><div class="opt-row" id="lenRow">' +
        [['1', '很短'], ['2', '短'], ['3', '中等'], ['4', '长'], ['5', '很长']]
          .map(l => '<button class="opt' + (searchState.lengths.includes(l[0]) ? ' on' : '') + '" data-len="' + l[0] + '">' + l[1] + '</button>').join('') +
      '</div></div>' +
      '<div class="sheet-section"><h4>评分下限</h4><div class="opt-row" id="rateRow">' +
        [[0, '不限'], [70, '7.0+'], [75, '7.5+'], [80, '8.0+'], [85, '8.5+']]
          .map(r => '<button class="opt' + (searchState.rating === r[0] ? ' on' : '') + '" data-rate="' + r[0] + '">' + r[1] + '</button>').join('') +
      '</div></div>' +
      '<div class="sheet-section"><h4>标签</h4><div class="opt-row" id="tagRow">' + tagsHtml + '</div>' +
        '<div class="field" style="margin-top:10px"><input id="tagInput" placeholder="搜索标签，例如 Romance"></div>' +
        '<div class="opt-row" id="tagResults"></div>' +
      '</div>' +
      '<div class="sheet-foot"><button class="btn" data-act="reset-filters">重置</button>' +
      '<button class="btn primary" data-act="apply-filters">查看结果</button></div>',
      (root) => {
        root.addEventListener('click', (e) => {
          const t = e.target.closest('button');
          if (!t) return;
          if (t.dataset.sort) { searchState.sort = t.dataset.sort; t.parentElement.querySelectorAll('.opt').forEach(b => b.classList.toggle('on', b === t)); }
          if (t.dataset.plat) { toggleIn(searchState.platforms, t.dataset.plat); t.classList.toggle('on'); }
          if (t.dataset.year) { toggleIn(searchState.years, t.dataset.year); t.classList.toggle('on'); }
          if (t.dataset.len) { toggleIn(searchState.lengths, t.dataset.len); t.classList.toggle('on'); }
          if (t.dataset.rate) {
            searchState.rating = Number(t.dataset.rate);
            t.parentElement.querySelectorAll('.opt').forEach(b => b.classList.toggle('on', b === t));
          }
          if (t.dataset.delTag) {
            searchState.tags = searchState.tags.filter(x => x !== t.dataset.delTag);
            t.remove();
          }
          if (t.dataset.addTag) {
            if (!searchState.tags.includes(t.dataset.addTag)) searchState.tags.push(t.dataset.addTag);
            t.classList.add('on');
            t.disabled = true;
          }
          if (t.dataset.act === 'apply-filters') { closeSheet(); runSearch(true); }
          if (t.dataset.act === 'reset-filters') {
            searchState.sort = 'relevance';
            searchState.platforms = [];
            searchState.years = [];
            searchState.lengths = [];
            searchState.rating = 0;
            searchState.tags = [];
            closeSheet();
            renderSearch();
          }
        });

        const tagInput = root.querySelector('#tagInput');
        let tid = null;
        tagInput.addEventListener('input', () => {
          clearTimeout(tid);
          tid = setTimeout(async () => {
            const q = tagInput.value.trim();
            const res = root.querySelector('#tagResults');
            if (!q) { res.innerHTML = ''; return; }
            try {
              const data = await api('/tag', { filters: ['search', '=', q], results: 8, fields: 'id,name,vn_count' });
              res.innerHTML = (data.results || []).map(t =>
                '<button class="opt' + (searchState.tags.includes(t.id) ? ' on' : '') + '" data-add-tag="' + esc(t.id) + '">' +
                esc(t.name) + ' <span style="opacity:.5">' + t.vn_count + '</span></button>').join('');
            } catch (e) { res.innerHTML = '<span class="muted">搜索失败</span>'; }
          }, 300);
        });
      }
    );
    return sheet;
  }

  function tagName(id) {
    const hit = HOT_TAGS.find(t => t[1] === id);
    return hit ? hit[0] : id;
  }
  function toggleIn(arr, val) {
    const i = arr.indexOf(val);
    if (i >= 0) arr.splice(i, 1); else arr.push(val);
  }

  /* ---------------- detail ---------------- */
  async function renderDetail(vnId) {
    const runId = ++navSeq;
    appEl.classList.add('is-detail');
    screen.innerHTML = '<div style="padding:16px">' + skeletonGrid(3) + '</div>' +
      '<div style="padding:0 16px"><div class="sk" style="height:14px;width:70%"></div>' +
      '<div class="sk" style="height:12px;width:45%;margin-top:8px"></div></div>';
    try {
      const data = await apiCached('/vn', { filters: ['id', '=', vnId], results: 1, fields: VN_FIELDS }, { ttl: TTL.detail });
      if (runId !== navSeq) return;
      const vn = (data.results || [])[0];
      if (!vn) { screen.innerHTML = errorCard(new Error('没有找到这个条目')); return; }
      paintDetail(vn);
    } catch (err) {
      if (runId !== navSeq) return;
      screen.innerHTML = errorCard(err);
    }
  }

  function paintDetail(vn) {
    addRecent(vn);
    const rating = ratingOf(vn);
    const bg = vn.image && vn.image.url ? vn.image.url : '';
    const nsfwPoster = isNsfw(vn.image) ? ' nsfw' : '';
    const dims = vn.image && vn.image.dims;
    const landPoster = isLand(vn.image);
    const posterStyle = landPoster && dims ? ' style="width:100%;aspect-ratio:' + dims[0] + ' / ' + dims[1] + '"' : '';
    const mainTitle = titleOf(vn);
    const rows = titleRows(vn, mainTitle);
    const titleAlt = vn.alttitle && vn.alttitle !== mainTitle && !rows.some(r => r[1] === vn.alttitle) ? vn.alttitle : '';
    const lengthPill = (vn.length_minutes || vn.length) ? '<span class="pill ghost">' + esc(lengthShort(vn)) + '</span>' : '';
    const myLen = getMyLength(vn.id);
    const myLenPill = '<button class="pill ghost" id="myLenPill" data-act="my-length">' + icon('clock') +
      (myLen ? '我的时长 ' + esc(myLengthText(myLen)) : '记录时长') + '</button>';

    screen.innerHTML =
      '<div class="detail">' +
        '<div class="d-hero">' +
          (bg ? '<div class="bg" style="background-image:url(&quot;' + esc(bg) + '&quot;)"></div>' : '') +
          '<div class="wash"></div>' +
          '<div class="d-top">' +
            '<button class="icon-btn" data-act="back">' + icon('arrowL') + '</button>' +
            '<button class="icon-btn" data-act="share-vn">' + icon('share') + '</button>' +
          '</div>' +
          '<div class="d-cover">' +
            '<div class="poster' + (landPoster ? ' land' : '') + nsfwPoster + '"' + posterStyle + ' data-cover>' +
              (bg ? '<img src="' + esc(bg) + '" alt="">' : '') +
            '</div>' +
          '</div>' +
          '<div class="d-info">' +
            '<h1 class="d-title">' + esc(mainTitle) + '</h1>' +
            (titleAlt ? '<div class="d-alt">' + esc(titleAlt) + '</div>' : '') +
            (rows.length ? '<div class="d-titles">' + rows.map(r =>
              '<div class="d-title-row"><span class="lang">' + r[0] + '</span><span>' + esc(r[1]) + '</span></div>').join('') + '</div>' : '') +
            '<div class="d-pills">' +
              (rating ? '<span class="pill hi">' + icon('star') + ' ' + rating + '</span>' : '') +
              (vn.votecount ? '<span class="pill ghost">' + votesFmt(vn.votecount) + ' 评价</span>' : '') +
              '<span class="pill ghost">' + esc(yearOf(vn.released)) + '</span>' +
              lengthPill +
              myLenPill +
            '</div>' +
            '<div class="d-actions">' +
              '<button class="btn primary" data-act="list">' + icon('plus') + '加入收藏</button>' +
              '<button class="btn" data-act="vote">' + icon('star') + '评分</button>' +
              '<button class="btn ghost" data-act="open-vndb" aria-label="在 VNDB 打开">' + icon('link') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<nav class="d-tabs" id="dTabs">' +
          ['简介|about', '角色|chars', '制作|staff', '发行|release', '截图|shots', '相关|rels'].map((t, i) => {
            const [label, key] = t.split('|');
            return '<button class="d-tab' + (i === 0 ? ' is-on' : '') + '" data-dtab="' + key + '">' + label + '</button>';
          }).join('') +
        '</nav>' +
        '<div class="d-body" id="dBody"></div>' +
      '</div>';

    const tabs = $('#dTabs');
    const body = $('#dBody');
    let current = 'about';

    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-dtab]');
      if (!btn || btn.dataset.dtab === current) return;
      current = btn.dataset.dtab;
      $$('.d-tab', tabs).forEach(b => b.classList.toggle('is-on', b === btn));
      paintTab(current);
    });

    function paintTab(key) {
      if (key === 'about') { body.innerHTML = aboutHtml(vn); bindAbout(vn); return; }
      if (key === 'chars') { paintChars(vn, body); return; }
      if (key === 'staff') { paintStaff(vn, body); return; }
      if (key === 'release') { paintReleases(vn, body); return; }
      if (key === 'shots') { paintShots(vn, body); return; }
      if (key === 'rels') { paintRels(vn, body); return; }
    }
    paintTab('about');
    refreshFavUi(vn);

    $('.detail').addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'back') back();
      if (act.dataset.act === 'share-vn') {
        const url = 'https://vndb.org/' + vn.id;
        if (navigator.share) navigator.share({ title: vn.title, url }).catch(() => {});
        else { try { navigator.clipboard.writeText(url); toast('链接已复制'); } catch (err) { openExternal(url); } }
      }
      if (act.dataset.act === 'fav' || act.dataset.act === 'list') openListSheet(vn);
      if (act.dataset.act === 'vote') openVoteSheet(vn);
      if (act.dataset.act === 'my-length') openMyLengthSheet(vn);
      if (act.dataset.act === 'open-vndb') openExternal('https://vndb.org/' + vn.id);
    });
  }

  function aboutHtml(vn) {
    const rating = ratingOf(vn);
    const devs = (vn.developers || []).map(d => d.name).join(' / ');
    const tags = (vn.tags || []).filter(t => t.spoiler === 0).sort((a, b) => b.rating - a.rating);
    const contTags = tags.filter(t => t.category === 'cont').slice(0, 14);
    const eroTags = tags.filter(t => t.category === 'ero').slice(0, 8);
    const techTags = tags.filter(t => t.category === 'tech').slice(0, 6);

    const tagBlock = (title, list, cls) => !list.length ? '' :
      '<div class="tag-block"><h4>' + title + '</h4><div class="tags">' +
      list.map(t => '<button class="tag ' + (cls || '') + '" data-tag="' + esc(t.id) + '">' + esc(t.name) +
        '<b>' + Number(t.rating || 0).toFixed(1) + '</b></button>').join('') +
      '</div></div>';

    const links = (vn.extlinks || []).slice(0, 5).map(l =>
      '<a class="pill" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + icon('link') + esc(l.label) + '</a>').join('');

    const staffTop = (vn.staff || []).filter(s => s.role === 'scenario' || s.role === 'chardesign' || s.role === 'art');
    const staffLine = staffTop.slice(0, 3).map(s => s.name).join(' / ');

    return (vn.description ?
      '<div class="desc clamped" id="desc">' + formatDesc(vn.description) + '</div>' +
      '<button class="more-btn" data-act="more-desc">展开全部</button>' : '<div class="desc muted">暂无简介。</div>') +
      '<div class="info-card">' +
        row('原名', vn.alttitle || (vn.titles || []).filter(t => t.main).map(t => t.title)[0] || '—') +
        row('发售日', dateCn(vn.released) + (vn.devstatus != null ? ' · ' + (DEVSTATUS[vn.devstatus] || '') : '')) +
        row('开发商', devs || '—') +
        row('平台', platformText(vn.platforms)) +
        row('语言', langText(vn.languages)) +
        row('时长', lengthText(vn)) +
        row('评分', (rating || '—') + (vn.votecount ? '（' + votesFmt(vn.votecount) + ' 人）' : '')) +
        (staffLine ? row('主要制作', staffLine) : '') +
        ((vn.aliases || []).length ? row('别名', vn.aliases.slice(0, 4).join(' / ')) : '') +
      '</div>' +
      tagBlock('内容标签', contTags) +
      tagBlock('性内容标签', eroTags, 'ero') +
      tagBlock('技术标签', techTags) +
      (links ? '<div class="tag-block"><h4>外部链接</h4><div class="tags">' + links + '</div></div>' : '') +
      '<div style="height:10px"></div>';
  }

  function row(k, v) {
    return '<div class="info-row"><div class="k">' + k + '</div><div class="v">' + esc(v) + '</div></div>';
  }

  function bindAbout(vn) {
    const desc = $('#desc');
    const btn = $('[data-act="more-desc"]');
    if (btn && desc) {
      btn.addEventListener('click', () => {
        const clamped = desc.classList.toggle('clamped');
        btn.textContent = clamped ? '展开全部' : '收起';
      });
    }
    screen.querySelectorAll('[data-spoiler]').forEach(sp => {
      sp.addEventListener('click', () => sp.classList.toggle('open'));
    });
  }

  async function paintChars(vn, body) {
    body.innerHTML = '<div class="loader"><span class="spin"></span>加载角色</div>';
    try {
      const vaMap = new Map();
      (vn.va || []).forEach(va => { if (va.character) vaMap.set(va.character.id, va.staff && va.staff.name); });
      const data = await apiCached('/character', {
        filters: ['vn', '=', ['id', '=', vn.id]],
        results: 60,
        fields: 'id,name,original,image{url,sexual},sex',
      }, { ttl: TTL.detail });
      const list = data.results || [];
      if (!list.length) {
        body.innerHTML = '<div class="empty"><div class="big">' + icon('user') + '</div><h3>暂无角色资料</h3></div>';
        return;
      }
      const sexIcon = (sex) => {
        const s = (sex || [])[0];
        if (s === 'f') return '♀';
        if (s === 'm') return '♂';
        if (s === 'b') return '⚥';
        return '';
      };
      body.innerHTML = '<div class="people">' + list.map(c => {
        const va = vaMap.get(c.id);
        const img = c.image && c.image.url;
        const nsfw = isNsfw(c.image);
        return '<div class="person" data-char="' + esc(c.id) + '">' +
          '<div class="ava' + (nsfw ? ' nsfw' : '') + '" data-cover>' +
            (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : esc((c.name || '?').slice(0, 2))) +
          '</div>' +
          '<div class="p-main"><div class="p-name">' + esc(c.name) + ' <span style="color:var(--ink-3);font-weight:500">' + sexIcon(c.sex) + '</span></div>' +
          '<div class="p-sub">' + esc(c.original || '') + (va ? (c.original ? ' · ' : '') + 'CV ' + esc(va) : '') + '</div></div>' +
          '<span class="chev">' + icon('chevR') + '</span>' +
          '</div>';
      }).join('') + '</div>' +
      (list.length >= 60 ? '<div class="center muted" style="padding:14px;font-size:11px">仅展示前 60 位角色</div>' : '');
    } catch (err) {
      body.innerHTML = errorCard(err);
    }
  }

  function paintStaff(vn, body) {
    const staff = vn.staff || [];
    if (!staff.length) {
      body.innerHTML = '<div class="empty"><div class="big">' + icon('user') + '</div><h3>暂无制作人员</h3></div>';
      return;
    }
    const byRole = new Map();
    staff.forEach(s => {
      if (!byRole.has(s.role)) byRole.set(s.role, []);
      if (!byRole.get(s.role).some(x => x.id === s.id)) byRole.get(s.role).push(s);
    });
    const roles = Array.from(byRole.keys()).sort((a, b) => {
      const ia = ROLE_ORDER.indexOf(a), ib = ROLE_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    body.innerHTML = roles.map(role => {
      const list = byRole.get(role);
      const shown = list.slice(0, 8);
      const rest = list.length - shown.length;
      return '<div class="section-head" style="padding:14px 0 8px"><div class="section-title" style="font-size:13px">' +
        esc(ROLES[role] || role) + '<span class="muted" style="font-weight:600;font-size:11px">' + list.length + '</span></div></div>' +
        '<div class="people">' + shown.map(s =>
          '<div class="person"><div class="ava" style="font-size:13px">' + esc((s.name || '?').slice(0, 1)) + '</div>' +
          '<div class="p-main"><div class="p-name">' + esc(s.name) + '</div>' +
          (s.note ? '<div class="p-sub">' + esc(s.note) + '</div>' : '') + '</div></div>').join('') +
        (rest > 0 ? '<div class="more-note">另有 ' + rest + ' 位</div>' : '') +
        '</div>';
    }).join('');
  }

  function paintShots(vn, body) {
    const shots = vn.screenshots || [];
    if (!shots.length) {
      body.innerHTML = '<div class="empty"><div class="big">' + icon('image') + '</div><h3>暂无截图</h3></div>';
      return;
    }
    body.innerHTML = '<div class="shots">' + shots.map((s, i) => {
      const nsfw = isNsfw(s) ? ' nsfw' : '';
      return '<div class="shot' + nsfw + '" data-shot="' + i + '" data-cover><img src="' + esc(s.url) + '" loading="lazy" alt=""></div>';
    }).join('') + '</div>';
    body.addEventListener('click', (e) => {
      const shot = e.target.closest('[data-shot]');
      if (!shot) return;
      if (shot.classList.contains('nsfw') && !shot.classList.contains('revealed')) { shot.classList.add('revealed'); return; }
      openLightbox(shots.map(s => s.url), Number(shot.dataset.shot));
    });
  }

  function paintRels(vn, body) {
    const rels = vn.relations || [];
    if (!rels.length) {
      body.innerHTML = '<div class="empty"><div class="big">' + icon('grid') + '</div><h3>没有关联作品</h3></div>';
      return;
    }
    body.innerHTML = '<div class="rel-grid">' + rels.map(r =>
      '<div class="rel" data-vn="' + esc(r.id) + '">' +
        '<img src="' + esc((r.image && r.image.url) || '') + '" loading="lazy" alt="">' +
        '<div class="r-main"><div class="r-title">' + esc(r.title) + '</div>' +
        '<div class="r-sub">' + esc(yearOf(r.released)) + '</div></div>' +
        '<span class="rel-tag">' + esc(RELATIONS[r.relation] || r.relation) + '</span>' +
      '</div>').join('') + '</div>';
  }

  const MEDIA = { blr: '蓝光', mrt: '卡带', cas: '磁带', cd: 'CD', dc: '下载卡', dvd: 'DVD', flp: '软盘', gdr: 'GD-ROM', in: '下载', mem: '记忆卡', nod: '任天堂光盘', umd: 'UMD', otc: '其他' };
  const REL_FIELDS = 'id,title,alttitle,released,platforms,languages{lang,latin,main,mtl,title},media{medium,qty},minage,resolution,voiced,uncensored,official,patch,freeware,gtin,catalog,engine,notes,producers{id,name,developer,publisher},images{url,sexual,violence},extlinks{url,label,name}';

  async function paintReleases(vn, body) {
    body.innerHTML = '<div class="loader"><span class="spin"></span>加载发行版</div>';
    try {
      const data = await apiCached('/release', {
        filters: ['vn', '=', ['id', '=', vn.id]],
        results: 50,
        fields: REL_FIELDS,
      }, { ttl: TTL.detail });
      const list = data.results || [];
      if (!list.length) {
        body.innerHTML = '<div class="empty"><div class="big">' + icon('calendar') + '</div><h3>暂无发行信息</h3></div>';
        return;
      }
      body.innerHTML = list.map(rel => {
        const img = (rel.images && rel.images[0] && rel.images[0].url) || '';
        const langs = (rel.languages || []).map(l => (LANGS[l.lang] || l.lang || '') + (l.mtl ? '（机翻）' : '')).filter(Boolean);
        const media = (rel.media || []).map(m => MEDIA[m.medium] || m.medium).filter(Boolean);
        const devs = (rel.producers || []).filter(p => p.developer && p.publisher).map(p => p.name);
        const pubs = (rel.producers || []).filter(p => p.publisher && !p.developer).map(p => p.name);
        const flags = [];
        if (rel.official) flags.push('<span class="flag">官方</span>');
        else flags.push('<span class="flag dim">非官方</span>');
        if (rel.patch) flags.push('<span class="flag dim">补丁</span>');
        if (rel.freeware) flags.push('<span class="flag dim">免费</span>');
        if (rel.uncensored) flags.push('<span class="flag">无修正</span>');
        if (rel.voiced) flags.push('<span class="flag">语音</span>');
        if (rel.minage != null) flags.push('<span class="flag ' + (rel.minage >= 18 ? 'warn' : 'dim') + '">' +
          (rel.minage === 0 ? '全年龄' : rel.minage + '+' ) + '</span>');
        const metaBits = [];
        if (langs.length) metaBits.push('语言：' + langs.join(' / '));
        if (media.length) metaBits.push('介质：' + media.join(' / '));
        if (rel.resolution) metaBits.push(rel.resolution);
        if (rel.engine) metaBits.push('引擎：' + rel.engine);
        return '<div class="rel-item">' +
          (img ? '<img class="rel-thumb" src="' + esc(img) + '" alt="" loading="lazy">' : '') +
          '<div class="rel-body">' +
            '<div class="rel-title">' + esc(rel.title) + '</div>' +
            '<div class="rel-sub">' + esc(dateCn(rel.released)) + ' · ' + esc(platformText(rel.platforms)) + '</div>' +
            '<div class="rel-flags">' + flags.join('') + '</div>' +
            (metaBits.length ? '<div class="rel-meta">' + metaBits.map(m => '<span>' + esc(m) + '</span>').join('') + '</div>' : '') +
            ((devs.length || pubs.length) ? '<div class="rel-meta"><span>开发：' + esc(devs.join(' / ') || '—') + '</span>' +
              (pubs.length ? '<span>发行：' + esc(pubs.join(' / ')) + '</span>' : '') + '</div>' : '') +
            (rel.notes ? '<div class="rel-meta" style="color:var(--ink-3);line-height:1.5">' + esc(rel.notes.slice(0, 160)) + '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    } catch (err) {
      body.innerHTML = errorCard(err);
    }
  }

  /* ---- detail sheets ---- */
  const listState = new Map();

  async function ensureListState(vn) {
    if (!state.token) return null;
    if (listState.has(vn.id)) return listState.get(vn.id);
    try {
      if (!state.user) state.user = await api('/authinfo', null, { token: state.token });
      const data = await apiCached('/ulist', {
        user: state.user.id,
        filters: ['id', '=', vn.id],
        results: 1,
        fields: 'id,vote,labels{id,label}',
      }, { ttl: TTL.ulist, token: state.token });
      const it = (data.results || [])[0];
      const st = it ? ((it.labels || []).map(l => l.id).find(id => LIST_STATUS[id]) || 0) : 0;
      const obj = { inList: !!it, status: st, vote: it ? it.vote : null };
      listState.set(vn.id, obj);
      return obj;
    } catch (e) { return null; }
  }

  async function refreshFavUi(vn) {
    const btn = $('[data-act="list"]');
    if (!btn) return;
    const st = await ensureListState(vn);
    if (!btn.isConnected) return;
    if (st && st.inList) {
      btn.innerHTML = icon('check') + (LIST_STATUS[st.status] ? LIST_STATUS[st.status].label : '已收藏');
      btn.classList.add('primary');
    } else {
      btn.innerHTML = icon('plus') + '加入收藏';
      btn.classList.remove('primary');
    }
  }

  async function saveListStatus(vn, status) {
    await api('/ulist/' + vn.id, {
      labels_set: [status],
      /* 注意：unset 里不能包含目标状态，服务端会先 set 再 unset，导致标签被抹掉 */
      labels_unset: [1, 2, 3, 4, 5].filter(x => x !== status),
    }, { method: 'PATCH', token: state.token });
    const prev = listState.get(vn.id) || {};
    listState.set(vn.id, { inList: true, status, vote: prev.vote || null });
    invalidatePath('/ulist');
    toast('已标记为「' + (LIST_STATUS[status] ? LIST_STATUS[status].label : status) + '」');
    refreshFavUi(vn);
  }

  async function removeFromList(vn) {
    await api('/ulist/' + vn.id, null, { method: 'DELETE', token: state.token });
    listState.set(vn.id, { inList: false, status: 0, vote: null });
    invalidatePath('/ulist');
    toast('已移出收藏');
    refreshFavUi(vn);
  }

  async function submitVote(vn, score) {
    await api('/ulist/' + vn.id, { vote: score * 10 }, { method: 'PATCH', token: state.token });
    const prev = listState.get(vn.id) || {};
    listState.set(vn.id, { inList: true, status: prev.status || 0, vote: score * 10 });
    invalidatePath('/ulist');
    toast('已评分 ' + score + ' 分');
    refreshFavUi(vn);
  }

  function needLoginSheet(title) {
    openSheet('<h2>' + esc(title) + '</h2><div class="s-sub">需要先连接 VNDB 账号</div>' +
      '<p class="hint" style="text-align:left;margin-top:0">连接后可以同步收藏状态与评分，数据保存在你自己的账号里。</p>' +
      '<div class="sheet-foot"><button class="btn" data-act="cancel">取消</button>' +
      '<button class="btn primary" data-act="to-login">去登录</button></div>', (root) => {
      root.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.act === 'cancel') closeSheet();
        if (b.dataset.act === 'to-login') { closeSheet(); go('library'); }
      });
    });
  }

  function openListSheet(vn) {
    if (!state.token) { needLoginSheet('加入收藏'); return; }
    const cur = listState.get(vn.id) || { inList: false, status: 0 };
    const statuses = [['在玩', 1], ['已完成', 2], ['搁置', 3], ['弃坑', 4], ['想玩', 5]];
    let status = cur.status || 1;
    openSheet('<h2>' + (cur.inList ? '收藏状态' : '加入收藏') + '</h2><div class="s-sub">' + esc(vn.title) + '</div>' +
      '<div class="sheet-section"><h4>状态</h4><div class="opt-row" id="statusRow">' +
      statuses.map(s => '<button class="opt' + (status === s[1] ? ' on' : '') + '" data-status="' + s[1] + '">' + s[0] + '</button>').join('') +
      '</div></div>' +
      '<div class="sheet-foot">' +
        (cur.inList ? '<button class="btn" data-act="remove">移出收藏</button>' : '<button class="btn" data-act="cancel">取消</button>') +
        '<button class="btn primary" data-act="save">保存</button></div>', (root) => {
      root.addEventListener('click', async (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.status) {
          status = Number(b.dataset.status);
          root.querySelectorAll('[data-status]').forEach(x => x.classList.toggle('on', x === b));
          return;
        }
        if (b.dataset.act === 'cancel') { closeSheet(); return; }
        if (b.dataset.act === 'remove') {
          b.disabled = true; b.textContent = '处理中…';
          try { await removeFromList(vn); closeSheet(); }
          catch (err) { b.disabled = false; b.textContent = '移出收藏'; toast('失败：' + err.message); }
          return;
        }
        if (b.dataset.act === 'save') {
          b.disabled = true; b.textContent = '保存中…';
          try { await saveListStatus(vn, status); closeSheet(); }
          catch (err) {
            b.disabled = false; b.textContent = '保存';
            toast(err.status === 401 ? '登录已失效，请重新连接' : '保存失败：' + err.message);
          }
        }
      });
    });
  }

  function updateMyLenPill(vn) {
    const el = $('#myLenPill');
    if (!el) return;
    const v = getMyLength(vn.id);
    el.innerHTML = icon('clock') + (v ? '我的时长 ' + esc(myLengthText(v)) : '记录时长');
  }

  function openMyLengthSheet(vn) {
    const cur = getMyLength(vn.id);
    const h0 = Math.floor(cur / 60);
    const m0 = cur % 60;
    const quick = [1, 2, 5, 10, 20, 30, 50, 80];
    openSheet(
      '<h2>记录我的时长</h2><div class="s-sub">' + esc(vn.title) + '</div>' +
      '<div class="len-inputs">' +
        '<label>小时<input id="lenH" type="number" inputmode="numeric" min="0" max="999" value="' + h0 + '"></label>' +
        '<label>分钟<input id="lenM" type="number" inputmode="numeric" min="0" max="59" value="' + m0 + '"></label>' +
      '</div>' +
      '<div class="opt-row" style="margin-top:14px">' +
        quick.map(q => '<button class="opt" data-quick="' + q + '">' + q + ' 小时</button>').join('') +
      '</div>' +
      '<div class="hint" style="text-align:left">只保存在这台设备，不会同步到 VNDB（官方 API 不提供时长写入）。</div>' +
      '<div class="sheet-foot">' +
        (cur ? '<button class="btn" data-act="len-clear">清除</button>' : '<button class="btn" data-act="cancel">取消</button>') +
        '<button class="btn primary" data-act="len-save">保存</button>' +
      '</div>',
      (root) => {
        root.addEventListener('click', (e) => {
          const b = e.target.closest('button');
          if (!b) return;
          if (b.dataset.quick) {
            root.querySelector('#lenH').value = b.dataset.quick;
            root.querySelector('#lenM').value = 0;
            return;
          }
          if (b.dataset.act === 'cancel') { closeSheet(); return; }
          if (b.dataset.act === 'len-clear') {
            setMyLength(vn.id, 0);
            updateMyLenPill(vn);
            closeSheet();
            toast('已清除时长记录');
            return;
          }
          if (b.dataset.act === 'len-save') {
            const hh = Math.max(0, Math.min(999, parseInt(root.querySelector('#lenH').value || '0', 10) || 0));
            const mm = Math.max(0, Math.min(59, parseInt(root.querySelector('#lenM').value || '0', 10) || 0));
            const total = hh * 60 + mm;
            setMyLength(vn.id, total);
            updateMyLenPill(vn);
            closeSheet();
            toast(total ? '已记录 ' + myLengthText(total) : '时长记录已清除');
          }
        });
      }
    );
  }

  function openVoteSheet(vn) {
    if (!state.token) { needLoginSheet('给这部作品打分'); return; }
    const cur = listState.get(vn.id);
    const mine = cur && cur.vote ? cur.vote / 10 : 0;
    openSheet('<h2>给这部作品打分</h2><div class="s-sub">' + esc(vn.title) +
      (mine ? ' · 当前 ' + mine + ' 分' : '') + '</div>' +
      '<div class="opt-row" style="margin-top:8px">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => '<button class="opt' + (mine === n ? ' on' : '') + '" data-score="' + n + '">' + n + '</button>').join('') +
      '</div><div class="sheet-foot"><button class="btn" data-act="cancel">取消</button></div>', (root) => {
      root.addEventListener('click', async (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.act === 'cancel') { closeSheet(); return; }
        if (b.dataset.score) {
          const n = Number(b.dataset.score);
          root.querySelectorAll('[data-score]').forEach(x => x.classList.toggle('on', x === b));
          try { await submitVote(vn, n); closeSheet(); }
          catch (err) { toast(err.status === 401 ? '登录已失效，请重新连接' : '提交失败：' + err.message); }
        }
      });
    });
  }

  function addRecent(vn) {
    if (!vn || !vn.id) return;
    state.recent = state.recent.filter(v => v.id !== vn.id);
    state.recent.unshift({
      id: vn.id, title: vn.title,
      image: (vn.image && vn.image.url) || '',
    });
    state.recent = state.recent.slice(0, 12);
    saveJSON('vn.recent', state.recent);
  }

  /* ---------------- 角色页 ---------------- */
  const CHAR_FIELDS = 'id,name,original,aliases,birthday,age,height,weight,bust,cup,waist,hips,blood_type,sex,gender,description,image{url,sexual,violence},traits{id,name,group_name,sexual,spoiler,lie},vns{id,title,released,role,spoiler,image{url,sexual}}';
  const SEX_LABEL = { f: '女', m: '男', b: '双性', n: '未知' };
  const VN_ROLE = { main: '主角', primary: '主要', side: '配角', appears: '客串' };

  async function renderCharacter(charId) {
    const runId = ++navSeq;
    appEl.classList.add('is-detail');
    screen.innerHTML = '<div style="padding:16px"><div class="sk" style="height:220px;border-radius:26px"></div></div>';
    try {
      const data = await apiCached('/character', {
        filters: ['id', '=', charId],
        results: 1,
        fields: CHAR_FIELDS,
      }, { ttl: TTL.detail });
      if (runId !== navSeq) return;
      const c = (data.results || [])[0];
      if (!c) { screen.innerHTML = errorCard(new Error('没有找到这个角色')); return; }
      paintCharacter(c);
    } catch (err) {
      if (runId !== navSeq) return;
      screen.innerHTML = errorCard(err);
    }
  }

  function paintCharacter(c) {
    const img = c.image && c.image.url ? c.image.url : '';
    const nsfw = isNsfw(c.image);
    const measures = [];
    if (c.age) measures.push(['年龄', c.age]);
    if (c.birthday && (c.birthday[0] || c.birthday[1])) {
      const bd = [c.birthday[0] ? c.birthday[0] + ' 月' : '', c.birthday[1] ? c.birthday[1] + ' 日' : ''].filter(Boolean).join(' ');
      measures.push(['生日', bd]);
    }
    if (c.height) measures.push(['身高', c.height + ' cm']);
    if (c.weight) measures.push(['体重', c.weight + ' kg']);
    if (c.bust || c.waist || c.hips) measures.push(['三围', [c.bust, c.waist, c.hips].map(x => x || '—').join(' / ')]);
    if (c.cup) measures.push(['罩杯', c.cup]);
    if (c.blood_type) measures.push(['血型', String(c.blood_type).toUpperCase()]);
    const sex = (c.sex || [])[0];

    const traits = (c.traits || []).filter(t => !t.lie);
    const groups = new Map();
    traits.forEach(t => {
      const g = t.group_name || '其他';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(t);
    });
    const groupsAll = Array.from(groups.keys()).sort();
    const groupsShown = groupsAll.slice(0, 26);
    const traitHtml = groupsShown.map(g =>
      '<div class="trait-group"><h4>' + esc(g) + '</h4><div class="tags">' +
      groups.get(g).map(t => '<button class="tag' + (t.sexual ? ' ero' : '') + '" data-tag="' + esc(t.id) + '">' +
        esc(t.name) + (t.spoiler ? '<b>剧透</b>' : '') + '</button>').join('') +
      '</div></div>').join('');

    const vns = (c.vns || []).slice().sort((a, b) => String(b.released || '').localeCompare(String(a.released || '')));
    const vnHtml = vns.length ? '<div class="tag-block"><h4>出演作品 · ' + vns.length + '</h4><div class="rel-grid">' +
      vns.map(v => '<div class="rel" data-vn="' + esc(v.id) + '">' +
        '<img src="' + esc((v.image && v.image.url) || '') + '" loading="lazy" alt="">' +
        '<div class="r-main"><div class="r-title">' + esc(v.title) + '</div>' +
        '<div class="r-sub">' + esc(yearOf(v.released)) + '</div></div>' +
        (v.role ? '<span class="rel-tag">' + esc(VN_ROLE[v.role] || v.role) + '</span>' : '') +
        '</div>').join('') + '</div></div>' : '';

    screen.innerHTML = '<div class="char-page">' +
      '<div class="char-hero">' +
        (img ? '<div class="bg" style="background-image:url(&quot;' + esc(img) + '&quot;)"></div>' : '') +
        '<div class="wash"></div>' +
        '<div class="d-top"><button class="icon-btn" data-act="back">' + icon('arrowL') + '</button>' +
          '<button class="icon-btn" data-act="open-char-vndb">' + icon('link') + '</button></div>' +
        '<div class="d-head" style="align-items:center">' +
          '<div class="char-avatar' + (nsfw ? ' nsfw' : '') + '" data-cover>' +
            (img ? '<img src="' + esc(img) + '" alt="">' : esc((c.name || '?').slice(0, 1))) +
          '</div>' +
          '<div class="d-meta">' +
            '<h1 class="d-title" style="font-size:22px">' + esc(c.name) + '</h1>' +
            (c.original ? '<div class="d-alt">' + esc(c.original) + '</div>' : '') +
            '<div class="d-pills" style="margin-top:9px">' +
              (sex ? '<span class="pill hi">' + esc(SEX_LABEL[sex] || sex) + '</span>' : '') +
              (vns.length ? '<span class="pill ghost">' + vns.length + ' 部作品</span>' : '') +
              (traits.length ? '<span class="pill ghost">' + traits.length + ' 个属性</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        (measures.length ? '<div class="measure">' + measures.map(m =>
          '<span>' + m[0] + ' <b>' + esc(m[1]) + '</b></span>').join('') + '</div>' : '') +
      '</div>' +
      '<div class="d-body">' +
        (c.description ? '<div class="desc clamped" id="cdesc" style="margin-top:6px">' + formatDesc(c.description) + '</div>' +
          '<button class="more-btn" data-act="more-cdesc">展开全部</button>' : '<div class="desc muted" style="margin-top:6px">暂无简介。</div>') +
        (traitHtml ? '<div class="tag-block"><h4>属性 · ' + traits.length + '</h4></div>' + traitHtml +
          (groupsAll.length > groupsShown.length ? '<div class="more-note">还有 ' + (groupsAll.length - groupsShown.length) + ' 组属性未展示</div>' : '') : '') +
        vnHtml +
        ((c.aliases || []).length ? '<div class="tag-block"><h4>别名</h4><div class="tags">' +
          c.aliases.slice(0, 8).map(a => '<span class="tag">' + esc(a) + '</span>').join('') + '</div></div>' : '') +
      '</div>' +
    '</div>';

    const root = $('.char-page');
    root.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'back') back();
      if (act.dataset.act === 'open-char-vndb') openExternal('https://vndb.org/' + c.id);
      if (act.dataset.act === 'more-cdesc') {
        const d = $('#cdesc');
        const clamped = d.classList.toggle('clamped');
        act.textContent = clamped ? '展开全部' : '收起';
      }
    });
  }

  /* ---------------- 标签页 ---------------- */
  const tagState = { id: '', tag: null, items: [], page: 1, more: true, loading: false };

  async function renderTag(tagId) {
    const runId = ++navSeq;
    appEl.classList.add('is-detail');
    screen.innerHTML = '<div style="padding:16px"><div class="sk" style="height:90px;border-radius:24px"></div></div>' +
      skeletonGrid(6);
    try {
      const data = await apiCached('/tag', { filters: ['id', '=', tagId], results: 1, fields: 'id,name,aliases,description,category,vn_count' }, { ttl: TTL.long });
      if (runId !== navSeq) return;
      const tag = (data.results || [])[0];
      if (!tag) { screen.innerHTML = errorCard(new Error('没有找到这个标签')); return; }
      tagState.id = tagId;
      tagState.tag = tag;
      tagState.items = [];
      tagState.page = 1;
      tagState.more = true;
      paintTag();
      await loadTagItems(runId, true);
    } catch (err) {
      if (runId !== navSeq) return;
      screen.innerHTML = errorCard(err);
    }
  }

  function paintTag() {
    const t = tagState.tag;
    const cat = { cont: '内容', ero: '性内容', tech: '技术' }[t.category] || '标签';
    screen.innerHTML = '<div class="tag-page">' +
      '<div class="tag-hero"><div class="d-top" style="padding-top:14px">' +
        '<button class="icon-btn" data-act="back">' + icon('arrowL') + '</button>' +
        '<button class="icon-btn" data-act="open-tag-vndb">' + icon('link') + '</button></div>' +
        '<h1 class="tag-title">' + esc(t.name) + '</h1>' +
        '<div class="d-pills" style="margin-top:8px"><span class="pill hi">' + cat + '</span>' +
          '<span class="pill ghost">' + (t.vn_count || 0) + ' 部作品</span></div>' +
        (t.description ? '<div class="tag-desc clamped" id="tdesc" style="margin-top:12px">' + formatDesc(t.description) + '</div>' +
          '<button class="more-btn" data-act="more-tdesc">展开</button>' : '') +
        (t.aliases && t.aliases.length ? '<div style="margin-top:10px;font-size:11.5px;color:var(--ink-3)">别名：' + esc(t.aliases.slice(0, 5).join(' / ')) + '</div>' : '') +
      '</div>' +
      '<div class="section-head" style="padding-top:10px"><div class="section-title"><span class="dot"></span>按评分排序</div></div>' +
      '<div class="grid" id="tagGrid">' + tagState.items.map(v => cardHtml(v)).join('') + '</div>' +
      '<div class="loader" id="tagLoader" hidden><span class="spin"></span>加载中</div>' +
      '<div id="sentinel" style="height:1px"></div>' +
      '</div>';

    $('.tag-page').addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'back') back();
      if (act.dataset.act === 'open-tag-vndb') openExternal('https://vndb.org/' + t.id);
      if (act.dataset.act === 'more-tdesc') {
        const d = $('#tdesc');
        const clamped = d.classList.toggle('clamped');
        act.textContent = clamped ? '展开' : '收起';
      }
    });
  }

  async function loadTagItems(runId, reset) {
    try {
      const data = await vnList({
        filters: ['tag', '=', tagState.id],
        sort: 'rating',
        reverse: true,
        results: 24,
        page: 1,
        fields: CARD_FIELDS,
      });
      if (runId !== navSeq) return;
      tagState.items = data.results || [];
      tagState.more = !!data.more;
      const grid = $('#tagGrid');
      if (grid) grid.innerHTML = tagState.items.map(v => cardHtml(v)).join('');
      if (tagState.more) observeSentinel(() => loadTagMore());
    } catch (e) {
      const grid = $('#tagGrid');
      if (grid) grid.innerHTML = '<div class="empty"><h3>加载失败</h3><p>' + esc(e.message) + '</p></div>';
    }
  }

  async function loadTagMore() {
    if (tagState.loading || !tagState.more) return;
    tagState.loading = true;
    tagState.page++;
    try {
      const data = await vnList({
        filters: ['tag', '=', tagState.id],
        sort: 'rating', reverse: true, results: 24, page: tagState.page, fields: CARD_FIELDS,
      });
      tagState.more = !!data.more;
      tagState.items = tagState.items.concat(data.results || []);
      const grid = $('#tagGrid');
      if (grid) grid.insertAdjacentHTML('beforeend', (data.results || []).map(v => cardHtml(v)).join(''));
    } catch (e) {
      tagState.page--;
    } finally {
      tagState.loading = false;
    }
  }

  /* ---------------- library ---------------- */
  const libState = { label: 0, items: [], page: 1, more: true, loading: false, labels: [] };

  async function renderLibrary() {
    const runId = ++navSeq;
    appEl.classList.remove('is-detail');
    if (!state.token) { paintLogin(); return; }
    if (libState.items.length && state.user) { paintLibrary(); return; }

    screen.innerHTML = '<div style="padding:16px">' + skeletonGrid(3) + '</div>';
    try {
      if (!state.user) {
        state.user = await api('/authinfo', null, { token: state.token });
      }
      const labels = await apiCached('/ulist_labels?user=' + encodeURIComponent(state.user.id) + '&fields=count', null, { token: state.token, ttl: TTL.ulist });
      if (runId !== navSeq) return;
      libState.labels = (labels && labels.labels) || [];
      await loadLibraryItems(runId, true);
    } catch (err) {
      if (runId !== navSeq) return;
      if (err.status === 401) {
        state.token = '';
        state.user = null;
        try { localStorage.removeItem('vn.token'); } catch (e) {}
        paintLogin('Token 无效或已过期，请重新输入。');
      } else {
        screen.innerHTML = errorCard(err);
      }
    }
  }

  function paintLogin(error) {
    screen.innerHTML =
      '<div class="page-head"><div><h1 class="page-title">收藏</h1><div class="page-sub">与你的 VNDB 列表同步</div></div></div>' +
      '<div class="login-card">' +
        '<div class="lock">' + icon('lock') + '</div>' +
        '<h2>连接 VNDB 账号</h2>' +
        '<p>粘贴你的 API Token，即可查看收藏、评分与游玩状态。<br>Token 只保存在本机浏览器。</p>' +
        (error ? '<p style="color:#C2577B">' + esc(error) + '</p>' : '') +
        '<div class="field">' + icon('shield') +
          '<input id="tokenInput" type="password" autocomplete="off" spellcheck="false" placeholder="xxxx-xxxxx-xxxxx-…">' +
        '</div>' +
        '<button class="btn primary" data-act="login">连接</button>' +
        '<div class="hint">在 VNDB「我的资料 → Applications」里创建 Token<br>' +
        '<a href="https://vndb.org/u/tokens" target="_blank" rel="noopener noreferrer">打开 vndb.org/u/tokens</a></div>' +
      '</div>';

    const input = $('#tokenInput');
    $('[data-act="login"]').addEventListener('click', async () => {
      const token = input.value.trim();
      if (!token) { toast('请先填写 Token'); return; }
      const btn = $('[data-act="login"]');
      btn.textContent = '连接中…';
      btn.disabled = true;
      try {
        const user = await api('/authinfo', null, { token });
        state.token = token;
        state.user = user;
        listState.clear();
        try { localStorage.setItem('vn.token', token); } catch (e) {}
        toast('已连接：' + user.username);
        renderLibrary();
      } catch (err) {
        btn.textContent = '连接';
        btn.disabled = false;
        toast(err.status === 401 ? 'Token 无效' : '连接失败：' + err.message);
      }
    });
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('[data-act="login"]').click(); });
  }

  async function loadLibraryItems(runId, reset) {
    if (reset) { libState.items = []; libState.page = 1; libState.more = true; }
    const body = {
      user: state.user.id,
      results: 30,
      page: libState.page,
      sort: 'added',
      reverse: true,
      fields: 'id,vote,labels{id,label},vn{' + CARD_FIELDS + '}',
    };
    if (libState.label) body.filters = ['label', '=', libState.label];
    try {
      const data = await apiCached('/ulist', body, { token: state.token, ttl: TTL.ulist });
      if (runId !== navSeq) return;
      libState.items = reset ? (data.results || []) : libState.items.concat(data.results || []);
      libState.more = !!data.more;
      paintLibrary();
      if (!reset) {
        const grid = $('#libGrid');
        if (grid) grid.innerHTML = libraryCards(libState.items);
      }
    } catch (err) {
      if (runId !== navSeq) return;
      const el = $('#libBody');
      if (el) el.innerHTML = errorCard(err);
      else screen.innerHTML = errorCard(err);
    }
  }

  function libraryCards(items) {
    return items.map(it => {
      const v = it.vn || { id: it.id, title: it.id };
      const st = (it.labels || []).map(l => l.id).find(id => LIST_STATUS[id]);
      const stCls = st ? LIST_STATUS[st].cls : '';
      const stName = st ? LIST_STATUS[st].label : '';
      const vote = it.vote ? (it.vote / 10).toFixed(1) : '';
      const land = isLand(v.image);
      return '<article class="card" data-vn="' + esc(it.id) + '">' +
        '<div class="cover' + (land ? ' land' : '') + '" data-cover>' +
          '<div class="sk ph"></div>' +
          (v.image && v.image.url ? (land ? '<img class="bgfill" loading="lazy" src="' + esc(v.image.url) + '" alt="" aria-hidden="true">' : '') +
            '<img class="fade" loading="lazy" src="' + esc(v.image.url) + '" alt="">' : '') +
          (st ? '<span class="status-dot ' + stCls + '">' + stName + '</span>' : '') +
          (vote ? '<span class="vote-badge">' + vote + '</span>' : '') +
        '</div>' +
        '<h3 class="card-title">' + esc(titleOf(v)) + '</h3></article>';
    }).join('');
  }

  function paintLibrary() {
    const uid = state.user ? state.user.id : '';
    const counts = new Map();
    libState.labels.forEach(l => counts.set(l.id, l.count || 0));
    const statusRow = [[0, '全部'], [1, '在玩'], [2, '已完成'], [3, '搁置'], [4, '弃坑'], [5, '想玩'], [7, '已评分']];

    screen.innerHTML =
      '<div class="user-head">' +
        '<div class="avatar">' + esc(String(state.user.username || 'U').slice(0, 1).toUpperCase()) + '</div>' +
        '<div><div class="u-name">' + esc(state.user.username) + '</div>' +
        '<div class="u-sub">已连接 VNDB · ' + esc(uid) + '</div></div>' +
        '<div class="u-act"><button class="icon-btn" data-act="logout" aria-label="退出登录">' + icon('x') + '</button></div>' +
      '</div>' +
      '<div class="stat-row">' +
        '<div class="stat"><div class="n">' + (counts.get(1) || 0) + '</div><div class="l">在玩</div></div>' +
        '<div class="stat"><div class="n">' + (counts.get(2) || 0) + '</div><div class="l">已完成</div></div>' +
        '<div class="stat"><div class="n">' + (counts.get(5) || 0) + '</div><div class="l">想玩</div></div>' +
        '<div class="stat"><div class="n">' + (counts.get(7) || 0) + '</div><div class="l">已评分</div></div>' +
      '</div>' +
      '<div class="chips" id="libChips" style="padding-top:14px">' +
        statusRow.map(s => '<button class="chip' + (libState.label === s[0] ? ' is-on' : '') + '" data-label="' + s[0] + '">' + s[1] + '</button>').join('') +
      '</div>' +
      '<div id="libGrid" class="grid">' + libraryCards(libState.items) + '</div>' +
      '<div id="libBody"></div>' +
      '<div class="loader" id="libLoader" hidden><span class="spin"></span>加载中</div>' +
      '<div id="sentinel" style="height:1px"></div>';

    $('#libChips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-label]');
      if (!b) return;
      libState.label = Number(b.dataset.label);
      $$('.chip', $('#libChips')).forEach(x => x.classList.toggle('is-on', x === b));
      libState.page = 1;
      loadLibraryItems(navSeq, true);
    });

    $('[data-act="logout"]').addEventListener('click', () => {
      state.token = '';
      state.user = null;
      listState.clear();
      try { localStorage.removeItem('vn.token'); } catch (e) {}
      libState.items = [];
      libState.labels = [];
      paintLogin();
      toast('已退出登录');
    });

    if (libState.more) observeSentinel(loadLibraryMore);
  }

  async function loadLibraryMore() {
    if (libState.loading || !libState.more) return;
    libState.loading = true;
    libState.page++;
    const loader = $('#libLoader');
    if (loader) loader.hidden = false;
    try {
      const body = {
        user: state.user.id, results: 30, page: libState.page,
        sort: 'added', reverse: true,
        fields: 'id,vote,labels{id,label},vn{' + CARD_FIELDS + '}',
      };
      if (libState.label) body.filters = ['label', '=', libState.label];
      const data = await apiCached('/ulist', body, { token: state.token, ttl: TTL.ulist });
      libState.more = !!data.more;
      libState.items = libState.items.concat(data.results || []);
      const grid = $('#libGrid');
      if (grid) grid.insertAdjacentHTML('beforeend', libraryCards(data.results || []));
    } catch (e) {
      libState.page--;
      toast('加载更多失败');
    } finally {
      libState.loading = false;
      const l = $('#libLoader');
      if (l) l.hidden = true;
    }
  }

  /* ---------------- settings ---------------- */
  function renderSettings() {
    appEl.classList.remove('is-detail');
    const s = state.settings;
    screen.innerHTML = '<div id="setRoot">' +
      '<div class="page-head"><div><h1 class="page-title">我的</h1><div class="page-sub">外观、内容与账号</div></div></div>' +

      '<div class="set-group"><h3>外观</h3><div class="set-card">' +
        '<div class="set-row"><div class="set-ico">' + icon('moon') + '</div><div class="set-main"><div class="set-name">主题</div>' +
        '<div class="set-desc">默认是 VNDB 的深蓝配色</div></div>' +
        '<div class="seg" id="themeSeg">' +
          [['dark', '深蓝'], ['light', '浅色'], ['system', '跟随']].map(t =>
            '<button class="' + (s.theme === t[0] ? 'on' : '') + '" data-theme="' + t[0] + '">' + t[1] + '</button>').join('') +
        '</div></div>' +
        '<div class="set-row" data-act="pick-title-lang"><div class="set-ico">' + icon('tag') + '</div>' +
        '<div class="set-main"><div class="set-name">标题语言</div>' +
        '<div class="set-desc">详情与列表优先显示「' + esc(TITLE_LANG[s.titleLang] || TITLE_LANG.auto) + '」</div></div>' +
        '<div class="set-right">' + icon('chevR') + '</div></div>' +
      '</div></div>' +

      '<div class="set-group"><h3>内容</h3><div class="set-card">' +
        '<div class="set-row"><div class="set-ico">' + icon('shield') + '</div><div class="set-main"><div class="set-name">成人内容遮罩</div>' +
        '<div class="set-desc">封面包含露骨内容时默认模糊，点击可显示</div></div>' +
        '<button class="switch' + (s.blurAdult ? ' on' : '') + '" id="blurSwitch" aria-label="成人内容遮罩"></button></div>' +
        '<div class="set-row"><div class="set-ico">' + icon('image') + '</div><div class="set-main"><div class="set-name">图片质量</div>' +
        '<div class="set-desc">省流模式优先加载缩略图</div></div>' +
        '<div class="seg" id="qualitySeg">' +
          [['high', '高清'], ['low', '省流']].map(q =>
            '<button class="' + (s.quality === q[0] ? 'on' : '') + '" data-quality="' + q[0] + '">' + q[1] + '</button>').join('') +
        '</div></div>' +
      '</div></div>' +

      '<div class="set-group"><h3>账号</h3><div class="set-card">' +
        '<div class="set-row"><div class="set-ico">' + icon('user') + '</div><div class="set-main">' +
          '<div class="set-name">' + (state.user ? esc(state.user.username) : '未登录') + '</div>' +
          '<div class="set-desc">' + (state.user ? 'VNDB 账号已连接' : '登录后可同步收藏与评分') + '</div></div>' +
          '<div class="set-right">' + (state.user
            ? '<button class="pill" data-act="logout">退出</button>'
            : '<button class="pill" data-act="go-login">登录</button>') + '</div>' +
        '</div>' +
      '</div></div>' +

      '<div class="set-group"><h3>数据</h3><div class="set-card">' +
        '<div class="set-row"><div class="set-ico">' + icon('grid') + '</div><div class="set-main"><div class="set-name">离线缓存</div>' +
        '<div class="set-desc">' + esc(cacheDesc()) + '</div></div>' +
        '<button class="pill" data-act="clear-cache">清除</button></div>' +
        '<div class="set-row"><div class="set-ico">' + icon('trash') + '</div><div class="set-main"><div class="set-name">清除本地数据</div>' +
        '<div class="set-desc">浏览记录、搜索历史与设置</div></div>' +
        '<button class="pill" data-act="clear-data">清除</button></div>' +
      '</div></div>' +

      '<div class="set-group"><h3>关于</h3><div class="set-card">' +
        '<div class="set-row"><div class="set-ico">' + icon('tag') + '</div><div class="set-main"><div class="set-name">Shiori v0.1 · b108</div>' +
        '<div class="set-desc">数据来自 VNDB Kana API · 原型仅演示界面与交互</div></div></div>' +
        '<div class="set-row" data-act="open-vndb"><div class="set-ico">' + icon('link') + '</div><div class="set-main"><div class="set-name">VNDB 官网</div>' +
        '<div class="set-desc">非官方应用，数据版权归 VNDB 及贡献者</div></div>' +
        '<div class="set-right">' + icon('chevR') + '</div></div>' +
      '</div></div>' +
      '<div style="text-align:center;padding:26px 0 10px;font-size:11px;color:var(--ink-3)">Made for visual novel lovers</div>' +
      '</div>';

    $('#themeSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-theme]');
      if (!b) return;
      state.settings.theme = b.dataset.theme;
      saveJSON('vn.settings', state.settings);
      applyTheme();
      $$('#themeSeg button').forEach(x => x.classList.toggle('on', x === b));
    });
    $('#blurSwitch').addEventListener('click', (e) => {
      state.settings.blurAdult = !state.settings.blurAdult;
      saveJSON('vn.settings', state.settings);
      e.currentTarget.classList.toggle('on', state.settings.blurAdult);
    });
    $('#qualitySeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-quality]');
      if (!b) return;
      state.settings.quality = b.dataset.quality;
      saveJSON('vn.settings', state.settings);
      $$('#qualitySeg button').forEach(x => x.classList.toggle('on', x === b));
    });
    $('#setRoot').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'go-login') go('library');
      if (b.dataset.act === 'pick-title-lang') openTitleLangSheet();
      if (b.dataset.act === 'open-vndb') openExternal('https://vndb.org');
      if (b.dataset.act === 'logout') {
        state.token = ''; state.user = null; listState.clear();
        try { localStorage.removeItem('vn.token'); } catch (err) {}
        toast('已退出登录');
        renderSettings();
      }
      if (b.dataset.act === 'clear-cache') {
        clearApiCache();
        toast('离线缓存已清除');
        renderSettings();
      }
      if (b.dataset.act === 'clear-data') {
        try {
          localStorage.removeItem('vn.recent');
          localStorage.removeItem('vn.searches');
          localStorage.removeItem('vn.settings');
        } catch (err) {}
        clearApiCache();
        state.recent = [];
        state.lastSearches = [];
        toast('本地数据已清除');
      }
    });
  }

  function openTitleLangSheet() {
    const keys = Object.keys(TITLE_LANG);
    openSheet('<h2>标题语言</h2><div class="s-sub">详情页主标题、章节列表用哪种语言</div>' +
      '<div class="opt-row" style="margin-top:6px">' +
      keys.map(k => '<button class="opt' + (state.settings.titleLang === k ? ' on' : '') +
        '" data-set-lang="' + k + '">' + TITLE_LANG[k] + '</button>').join('') +
      '</div>', (root) => {
        root.addEventListener('click', (e) => {
          const b = e.target.closest('[data-set-lang]');
          if (!b) return;
          state.settings.titleLang = b.dataset.setLang;
          saveJSON('vn.settings', state.settings);
          closeSheet();
          toast('标题语言：' + TITLE_LANG[b.dataset.setLang]);
          renderSettings();
        });
      });
  }

  function cacheDesc() {
    const s = cacheStats();
    if (!s.count) return '暂无缓存，浏览后自动保存';
    return s.count + ' 条 · ' + Math.max(1, Math.round(s.bytes / 1024)) + ' KB';
  }

  function applyTheme() {
    const mode = state.settings.theme;
    const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#050D17' : '#EEF3F8');
    try {
      if (window.AndroidApp && window.AndroidApp.setTheme) window.AndroidApp.setTheme(dark);
    } catch (e) { /* 浏览器里没有桥接 */ }
  }

  /* ---------------- routing ---------------- */
  let navSeq = 0;
  let currentRoute = '';
  const scrollPositions = new Map();
  const stack = [];
  let prevHash = null;
  let io = null;

  function observeSentinel(cb) {
    if (io) io.disconnect();
    const target = document.getElementById('sentinel');
    if (!target) return;
    io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) cb();
    }, { root: screen, rootMargin: '600px 0px' });
    io.observe(target);
  }

  function go(route) {
    const target = '#/' + route;
    if (location.hash === target) {
      screen.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    location.hash = target;
  }
  function back() {
    if (stack.length >= 2) {
      const prev = stack[stack.length - 2];
      history.back();
      // 兼容：若 history 无条目（直接打开），回退到首页
      setTimeout(() => {
        if (location.hash === stack[stack.length - 1]) location.hash = prev;
      }, 250);
    } else {
      location.hash = '#/home';
    }
  }

  function syncTabbar(name) {
    const isTab = ['home', 'calendar', 'library', 'settings'].includes(name);
    tabbar.hidden = !isTab;
    appEl.classList.toggle('is-detail', !isTab);
    $$('.tab', tabbar).forEach(t => t.classList.toggle('is-on', t.dataset.tab === name));
  }

  async function route() {
    const raw = (location.hash || '#/home').replace(/^#\/?/, '') || 'home';
    const parts = raw.split('/');
    const name = parts[0] || 'home';
    const param = parts[1] || '';

    if (currentRoute) scrollPositions.set(currentRoute, screen.scrollTop);
    if (io) { io.disconnect(); io = null; }
    currentRoute = raw;
    syncTabbar(name);
    closeSheet();

    const targetName = name === 'vn' ? 'detail' : name;
    screen.innerHTML = '';
    screen.scrollTop = scrollPositions.get(raw) || 0;

    if (name === 'home') await renderHome();
    else if (name === 'calendar') await renderCalendar();
    else if (name === 'library') await renderLibrary();
    else if (name === 'settings') renderSettings();
    else if (name === 'search') renderSearch();
    else if (name === 'vn') await renderDetail(param);
    else if (name === 'character') await renderCharacter(param);
    else if (name === 'tag') await renderTag(param);
    else { location.hash = '#/home'; return; }

    // 恢复滚动位置（在内容渲染后）
    const saved = scrollPositions.get(raw);
    if (saved) requestAnimationFrame(() => { screen.scrollTop = saved; });
    screen.classList.remove('fade-in');
    void screen.offsetWidth;
    screen.classList.add('fade-in');
  }

  window.addEventListener('hashchange', () => {
    const cur = location.hash;
    if (prevHash) {
      if (stack.length >= 2 && stack[stack.length - 2] === cur) stack.pop();
      else stack.push(cur);
    } else {
      stack.push(cur);
    }
    prevHash = cur;
    route();
  });

  /* ---------------- global click ---------------- */
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { go(tab.dataset.tab); return; }

    const chipAct = e.target.closest('[data-act]');
    if (chipAct) {
      const act = chipAct.dataset.act;
      if (act === 'go-search') { go('search'); return; }
      if (act === 'retry') { route(); return; }
    }

    const cover = e.target.closest('[data-cover]');
    if (cover && cover.classList.contains('nsfw') && !cover.classList.contains('revealed')) {
      cover.classList.add('revealed');
      e.stopPropagation();
      return;
    }

    const charEl = e.target.closest('[data-char]');
    if (charEl) { go('character/' + charEl.dataset.char); return; }

    const tagEl = e.target.closest('[data-tag]');
    if (tagEl) { go('tag/' + tagEl.dataset.tag); return; }

    const vnEl = e.target.closest('[data-vn]');
    if (vnEl) { go('vn/' + vnEl.dataset.vn); return; }
  });

  /* ---------------- init ---------------- */
  applyTheme();
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (state.settings.theme === 'system') applyTheme();
    });
  }
  window.addEventListener('scroll', () => {}, { passive: true });

  // 静态资源与图片离线缓存
  if (navigator.serviceWorker && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // 首屏
  if (!location.hash) {
    history.replaceState(null, '', '#/home');
  }
  stack.push(location.hash);
  prevHash = location.hash;
  route();
})();
