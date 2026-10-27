// Small DOM helpers. User text is always set with textContent — never innerHTML.

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'icon') el.innerHTML = v; // only our own static SVG icons, never user data
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}

let toastTimer;
export function toast(msg, ms = 2600) {
  let t = $('#toast');
  if (!t) { t = h('div', { id: 'toast', role: 'status' }); document.body.append(t); }
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}

/** Accept only http(s) links (blocks javascript:, data: …). Adds https:// when missing. Returns '' if invalid. */
export function safeUrl(u) {
  let s = String(u ?? '').trim();
  if (!s) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s;
  try {
    const p = new URL(s);
    return (p.protocol === 'http:' || p.protocol === 'https:') && p.hostname.includes('.') ? p.href : '';
  } catch { return ''; }
}

export const telHref = (v) => { const n = String(v || '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, ''); return n.length >= 3 ? `tel:${n}` : ''; };
export const isEmail = (v) => /^[^\s@<>"'()]+@[^\s@<>"'()]+\.[^\s@<>"'()]+$/.test(String(v || '').trim());

const SOCIAL_BASE = {
  facebook: 'https://facebook.com/', instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/@',
  x: 'https://x.com/', youtube: 'https://youtube.com/@', linkedin: 'https://linkedin.com/in/',
  snapchat: 'https://snapchat.com/add/', telegram: 'https://t.me/', whatsapp: 'https://wa.me/',
};
/** "@brand", "brand" or a full link → a safe profile URL. */
export function socialUrl(key, v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || /\.[a-z]{2,}(\/|$)/i.test(s)) return safeUrl(s);
  const handle = s.replace(/^@/, '');
  return SOCIAL_BASE[key] + (key === 'whatsapp' ? handle.replace(/[^\d]/g, '') : encodeURIComponent(handle));
}

/** localStorage that never throws (private mode, blocked storage…). */
export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};
