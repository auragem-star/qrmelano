// Renders the mobile landing page for a scanned QR code.
// Everything comes from the part of the link after "#" — it is never sent to any server.
// All text is inserted with textContent and every link is checked, so nothing in a link can run code.
import { h, safeUrl, telHref, isEmail, socialUrl } from './util.js';
import { decode } from './codec.js';

const ICONS = {
  facebook: '<path d="M14 8h3V4h-3c-2.8 0-4 1.7-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6Z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2"/>',
  tiktok: '<path d="M16 3c.4 2.4 1.9 3.9 4 4.1v3.4a7.6 7.6 0 0 1-4-1.3v6.3a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.5a2.2 2.2 0 1 0 1.3 2V3H16Z"/>',
  x: '<path d="M4 3h4.6l4.1 5.7L17.6 3H20l-6.2 7.3L21 21h-4.6l-4.5-6.2L6.6 21H4.2l6.6-7.7L4 3Z"/>',
  youtube: '<path d="M22 8.2c-.2-1.6-1-2.6-2.6-2.8C17.3 5 12 5 12 5s-5.3 0-7.4.4C3 5.6 2.2 6.6 2 8.2 1.8 9.6 1.8 12 1.8 12s0 2.4.2 3.8c.2 1.6 1 2.6 2.6 2.8C6.7 19 12 19 12 19s5.3 0 7.4-.4c1.6-.2 2.4-1.2 2.6-2.8.2-1.4.2-3.8.2-3.8s0-2.4-.2-3.8ZM10 15V9l5.2 3L10 15Z"/>',
  linkedin: '<path d="M4 9h4v12H4V9Zm2-6a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 6 3Zm4 6h3.8v1.7c.6-1 1.9-2 3.9-2 4 0 4.3 2.6 4.3 6V21h-4v-5.5c0-1.4 0-3.1-1.9-3.1s-2.1 1.5-2.1 3V21h-4V9Z"/>',
  snapchat: '<path d="M12 3c3 0 5 2.2 5 5.2v2.3l1.6-.5c.6 0 .9.6.4 1-.7.5-2 .8-2 1.3.4 1.6 2 3.2 3.6 3.6.4.1.4.6 0 .8-.8.4-2 .5-2.3.7-.3.3-.2 1-.6 1.2-.6.2-1.6-.3-2.8 0-1 .3-1.8 1.4-2.9 1.4s-1.9-1.1-2.9-1.4c-1.2-.3-2.2.2-2.8 0-.4-.2-.3-.9-.6-1.2-.3-.2-1.5-.3-2.3-.7-.4-.2-.4-.7 0-.8C5 16 6.6 14.4 7 12.8c0-.5-1.3-.8-2-1.3-.5-.4-.2-1 .4-1l1.6.5V8.2C7 5.2 9 3 12 3Z"/>',
  telegram: '<path d="m21 4-3 16c-.2 1-.9 1.3-1.8.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.1 14 1.6 12.6c-1-.3-1-1 .2-1.5L19.6 4.2c.8-.3 1.6.2 1.4 1.8Z"/>',
  whatsapp: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
ICONS.phone = '<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1Z"/>';
ICONS.mail = '<path d="M3 5h18v14H3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" stroke-width="2"/>';
ICONS.pin = '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/>';
ICONS.clock = '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
ICONS.globe = '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="currentColor" stroke-width="2"/>';

const icon = (name) => h('span', { class: 'ic', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">${ICONS[name] || ICONS.link}</svg>` });
const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const card = (...c) => h('div', { class: 'card' }, ...c);
const para = (t) => (str(t) ? h('p', { text: str(t), dir: 'auto' }) : null);
const title = (t) => h('h1', { text: str(t, 200), dir: 'auto' });
const avatar = (u) => (safeUrl(u) ? h('img', { class: 'avatar', src: safeUrl(u), alt: '', referrerpolicy: 'no-referrer' }) : null);
const cover = (u) => (safeUrl(u) ? h('img', { class: 'cover', src: safeUrl(u), alt: '', referrerpolicy: 'no-referrer' }) : null);
const btn = (href, text, ghost) => (href ? h('a', { class: ghost ? 'btn ghost' : 'btn', href, rel: 'noopener noreferrer' }, text) : null);
function row(href, label, sub, ic = 'link') {
  if (!href || !str(label)) return null;
  const external = /^https?:/.test(href);
  return h('a', { class: 'row', href, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) },
    icon(ic), h('span', { dir: 'auto' }, str(label, 300), sub ? h('small', { text: sub }) : null));
}
const mapsUrl = (address, map) => safeUrl(map) || (str(address) ? `https://maps.google.com/?q=${encodeURIComponent(str(address))}` : '');
const waUrl = (n) => { const d = String(n || '').replace(/[^\d]/g, ''); return d ? `https://wa.me/${d}` : ''; };
const mailUrl = (e) => (isEmail(e) ? `mailto:${str(e)}` : '');
const list = (v, max) => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object').slice(0, max) : []);
const filled = (...nodes) => nodes.some(Boolean);

function copyBtn(text, label) {
  const b = h('button', { class: 'btn', type: 'button' }, label);
  b.addEventListener('click', () => navigator.clipboard.writeText(text).then(() => { b.textContent = 'Copied ✓'; }, () => {}));
  return b;
}

// ---------------------------------------------------------------- page types
const PAGES = {
  links(d) {
    const rows = list(d.links, 20).map(l => row(safeUrl(l.url), l.label || l.url));
    return [card(h('div', { class: 'center' }, avatar(d.avatar), title(d.title), para(d.description))), filled(...rows) && card(...rows)];
  },

  business(d) {
    const hours = str(d.hours).split('\n').map(s => s.trim()).filter(Boolean).slice(0, 14).map(line => {
      const i = line.search(/[:：]/);
      return h('div', { class: 'item' }, h('span', { text: i > 0 ? line.slice(0, i).trim() : line, dir: 'auto' }), h('span', { text: i > 0 ? line.slice(i + 1).trim() : '', dir: 'auto' }));
    });
    const contacts = [
      row(telHref(d.phone), d.phone, 'Phone', 'phone'),
      row(waUrl(d.whatsapp), d.whatsapp, 'WhatsApp', 'whatsapp'),
      row(mailUrl(d.email), d.email, 'Email', 'mail'),
      row(safeUrl(d.website), d.website, 'Website', 'globe'),
      row(mapsUrl(d.address, d.map), d.address || 'Open in Google Maps', 'Get directions', 'pin'),
    ];
    return [
      card(h('div', { class: 'center' }, avatar(d.logo), title(d.name), para(d.tagline)), btn(telHref(d.phone), 'Call us')),
      str(d.description) && card(h('h2', { text: 'About' }), para(d.description)),
      hours.length && card(h('h2', { text: 'Opening hours' }), ...hours),
      filled(...contacts) && card(...contacts),
    ];
  },

  social(d) {
    const NAMES = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', x: 'X (Twitter)', youtube: 'YouTube', linkedin: 'LinkedIn', snapchat: 'Snapchat', telegram: 'Telegram', whatsapp: 'WhatsApp' };
    const p = d.profiles && typeof d.profiles === 'object' ? d.profiles : {};
    const rows = Object.keys(NAMES).map(k => row(socialUrl(k, str(p[k], 300)), NAMES[k], str(p[k], 300), k));
    return [card(h('div', { class: 'center' }, avatar(d.avatar), title(d.title), para(d.description))), filled(...rows) && card(...rows)];
  },

  menu(d) {
    const cur = str(d.currency, 10);
    const sections = list(d.sections, 15).map(s => card(h('h2', { text: str(s.name, 100), dir: 'auto' }),
      ...list(s.items, 30).map(i => h('div', { class: 'item' },
        h('span', { dir: 'auto' }, h('b', { text: str(i.name, 150) }), str(i.description) ? h('small', { text: str(i.description, 300) }) : null),
        str(i.price) ? h('span', { class: 'price', text: `${str(i.price, 20)} ${cur}`.trim() }) : null))));
    return [card(h('div', { class: 'center' }, avatar(d.logo), title(d.restaurant), para(d.description))), ...sections];
  },

  apps(d) {
    const ios = safeUrl(d.ios), android = safeUrl(d.android), web = safeUrl(d.web);
    // auto-open the right store — but only real store addresses, so this page can't be abused as a redirect
    const ua = navigator.userAgent;
    const host = (u) => { try { return new URL(u).hostname; } catch { return ''; } };
    if (/iphone|ipad|ipod/i.test(ua) && ios && /(^|\.)apple\.com$/.test(host(ios))) location.replace(ios);
    else if (/android/i.test(ua) && android && host(android) === 'play.google.com') location.replace(android);
    return [card(h('div', { class: 'center' }, avatar(d.logo), title(d.name), para(d.description)),
      btn(ios, 'Download on the App Store'), btn(android, 'Get it on Google Play'), btn(web, 'Website', true))];
  },

  coupon(d) {
    const code = str(d.code, 60);
    return [card(h('div', { class: 'center' },
      cover(d.image),
      str(d.business) ? h('span', { class: 'badge', text: str(d.business, 80), dir: 'auto' }) : null,
      title(d.headline),
      str(d.discount) ? h('p', { class: 'big', text: str(d.discount, 60), dir: 'auto' }) : null,
      para(d.description),
      code ? h('div', { class: 'code', text: code }) : null),
      code ? copyBtn(code, 'Copy code') : null,
      btn(safeUrl(d.url), 'Use it now', true),
      str(d.valid_until) ? h('p', { class: 'center mt' }, 'Valid until ', h('b', { text: str(d.valid_until, 20) })) : null,
      str(d.terms) ? h('p', { class: 'small', text: str(d.terms), dir: 'auto' }) : null)];
  },

  event(d) {
    const start = new Date(d.start), end = new Date(d.end);
    const ok = (t) => !isNaN(t);
    const fmt = (t) => t.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });
    const ics = () => {
      const z = (t) => t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const e = (s) => str(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
      const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//QR Melano//EN', 'BEGIN:VEVENT',
        `UID:${Date.now()}@qrmelano`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(start)}`, `DTEND:${z(ok(end) ? end : new Date(start.getTime() + 3600e3))}`,
        `SUMMARY:${e(d.title)}`, str(d.location) && `LOCATION:${e(d.location)}`, str(d.description) && `DESCRIPTION:${e(d.description)}`,
        safeUrl(d.url) && `URL:${safeUrl(d.url)}`, 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
      const a = h('a', { href: URL.createObjectURL(new Blob([body], { type: 'text/calendar' })), download: 'event.ics' });
      document.body.append(a); a.click(); a.remove();
    };
    return [card(cover(d.cover), h('span', { class: 'badge', text: 'Event' }), title(d.title),
      str(d.organizer) ? h('p', { text: `by ${str(d.organizer, 120)}`, dir: 'auto' }) : null,
      ok(start) ? h('div', { class: 'row' }, icon('clock'), h('span', {}, fmt(start), ok(end) ? h('small', { text: `until ${fmt(end)}` }) : null)) : null,
      row(mapsUrl(d.location), d.location, 'Location', 'pin'),
      para(d.description),
      ok(start) ? h('button', { class: 'btn', type: 'button', onclick: ics }, 'Add to calendar') : null,
      btn(safeUrl(d.url), 'More info / tickets', true))];
  },
};

// ---------------------------------------------------------------- start
const app = document.getElementById('app');

function show() {
  const hash = location.hash.slice(1);
  const dot = hash.indexOf('.');
  const type = dot > 0 ? hash.slice(0, dot) : '';
  let d = null;
  if (Object.hasOwn(PAGES, type)) { try { d = decode(hash.slice(dot + 1)); } catch { d = null; } }
  if (!d) {
    document.title = 'QR Melano';
    app.replaceChildren(card(h('div', { class: 'center' }, h('h1', { text: 'Link not readable' }),
      h('p', { text: 'This QR code link is incomplete or damaged. Try scanning it again.' }), btn('/', 'Go to QR Melano'))));
    return;
  }
  if (/^#[0-9a-f]{6}$/i.test(d._c || '')) document.documentElement.style.setProperty('--c', d._c);
  const name = str(d.title || d.name || d.restaurant || d.headline, 80);
  document.title = name || 'QR Melano';
  app.replaceChildren(...PAGES[type](d).filter(Boolean));
}
addEventListener('hashchange', show);
show();
