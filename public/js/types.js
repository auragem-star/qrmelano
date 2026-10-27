// QR code types: icon, form fields, and what the QR actually encodes.
import { safeUrl, socialUrl } from './util.js';
import { encode } from './codec.js';

const svg = (p) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;

export const ICONS = {
  website: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  pdf: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 15h6M9 11h3"/>'),
  links: svg('<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>'),
  vcard: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.5 1.7-2 3-2s2.4.5 3 2M15 10h3M15 13h3"/>'),
  business: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>'),
  video: svg('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>'),
  images: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
  facebook: svg('<circle cx="12" cy="12" r="9"/><path d="M14.5 8H13a2 2 0 0 0-2 2v11M9 13h5"/>'),
  instagram: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>'),
  social: svg('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><circle cx="12" cy="12" r="3"/><path d="m8 8 2 2m6-2-2 2m-6 6 2-2m6 2-2-2"/>'),
  whatsapp: svg('<path d="M3 21l1.6-4.6A9 9 0 1 1 8 20z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2z"/>'),
  mp3: svg('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>'),
  menu: svg('<circle cx="12" cy="12" r="9"/><path d="M8 9h8M8 12h8M8 15h8"/>'),
  apps: svg('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
  coupon: svg('<path d="M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5z"/><path d="m9 14 6-6M9.5 8.5h.01M14.5 13.5h.01"/>'),
  wifi: svg('<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>'),
  event: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M12 13l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 15.3l2-.3z"/>'),
  email: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
};

const T = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const IMG = (key, label) => T(key, label, { type: 'url', hint: 'Optional — paste a link to an image (e.g. from your website).' });
const FILE_HINT = 'Upload the file to Google Drive, Dropbox or your website, then paste its share link here.';

// kind: 'url'  → the QR opens that link directly
//       'text' → the QR holds the data itself (contact card, Wi-Fi, email)
//       'page' → the QR opens a mobile landing page on this site; its content is packed inside the link
export const TYPES = [
  { id: 'website', name: 'Website', desc: 'Link to any website URL', kind: 'url', fields: [
    T('url', 'Website URL', { type: 'url', required: true, placeholder: 'https://melanopharma.store' })] },
  { id: 'pdf', name: 'PDF', desc: 'Show a PDF', kind: 'url', fields: [
    T('url', 'PDF link', { type: 'url', required: true, placeholder: 'https://drive.google.com/…', hint: FILE_HINT })] },
  { id: 'links', name: 'List of Links', desc: 'Share multiple links', kind: 'page', fields: [
    T('title', 'Title', { required: true }), T('description', 'Description', { type: 'textarea' }),
    IMG('avatar', 'Profile image link'),
    { key: 'links', label: 'Links', itemLabel: 'Link', type: 'repeater', addLabel: 'Add link', min: 1, max: 20,
      fields: [T('label', 'Label', { required: true }), T('url', 'URL', { type: 'url', required: true })] }] },
  { id: 'vcard', name: 'vCard', desc: 'Share a digital business card', kind: 'text', fields: [
    T('first_name', 'First name', { required: true }), T('last_name', 'Last name'),
    T('company', 'Company'), T('job_title', 'Job title'),
    T('mobile', 'Mobile', { type: 'tel' }), T('phone', 'Work phone', { type: 'tel' }),
    T('email', 'Email', { type: 'email' }), T('website', 'Website', { type: 'url' }),
    T('address', 'Address'), T('note', 'Note', { type: 'textarea' })] },
  { id: 'business', name: 'Business', desc: 'Share information about your business', kind: 'page', fields: [
    T('name', 'Business name', { required: true }), T('tagline', 'Tagline'),
    T('description', 'About', { type: 'textarea' }), IMG('logo', 'Logo link'),
    T('phone', 'Phone', { type: 'tel' }), T('whatsapp', 'WhatsApp number', { type: 'tel' }), T('email', 'Email', { type: 'email' }),
    T('website', 'Website', { type: 'url' }), T('address', 'Address'),
    T('map', 'Google Maps link', { type: 'url' }),
    T('hours', 'Opening hours', { type: 'textarea', placeholder: 'Sat–Thu: 9:00 – 22:00\nFri: Closed', hint: 'One line per day, “Day: hours”' })] },
  { id: 'video', name: 'Video', desc: 'Show a video', kind: 'url', fields: [
    T('url', 'Video link', { type: 'url', required: true, placeholder: 'https://youtube.com/watch?v=…', hint: 'YouTube, Facebook, TikTok, Google Drive…' })] },
  { id: 'images', name: 'Images', desc: 'Share multiple images', kind: 'url', fields: [
    T('url', 'Album / gallery link', { type: 'url', required: true, placeholder: 'https://photos.app.goo.gl/…', hint: 'A shared Google Photos / Drive album, Instagram post or any gallery page.' })] },
  { id: 'facebook', name: 'Facebook', desc: 'Share your Facebook page', kind: 'url', fields: [
    T('url', 'Facebook page link', { type: 'url', required: true, placeholder: 'https://facebook.com/yourpage' })] },
  { id: 'instagram', name: 'Instagram', desc: 'Share your Instagram', kind: 'url', fields: [
    T('username', 'Instagram username or link', { required: true, placeholder: '@yourbrand' })] },
  { id: 'social', name: 'Social Media', desc: 'Share your social channels', kind: 'page', fields: [
    T('title', 'Title', { required: true }), T('description', 'Description', { type: 'textarea' }),
    IMG('avatar', 'Logo / photo link'),
    { key: 'profiles', label: 'Profiles (username or link)', type: 'group', fields: [
      T('facebook', 'Facebook'), T('instagram', 'Instagram'), T('tiktok', 'TikTok'), T('x', 'X (Twitter)'),
      T('youtube', 'YouTube'), T('linkedin', 'LinkedIn'), T('snapchat', 'Snapchat'), T('telegram', 'Telegram'),
      T('whatsapp', 'WhatsApp number')] }] },
  { id: 'whatsapp', name: 'WhatsApp', desc: 'Get WhatsApp messages', kind: 'url', fields: [
    T('phone', 'WhatsApp number', { type: 'tel', required: true, placeholder: '201001234567', hint: 'With country code, e.g. 20 for Egypt' }),
    T('message', 'Pre-filled message', { type: 'textarea' })] },
  { id: 'mp3', name: 'MP3', desc: 'Share an audio file', kind: 'url', fields: [
    T('url', 'Audio link', { type: 'url', required: true, placeholder: 'https://soundcloud.com/…', hint: 'SoundCloud, Spotify, Anghami, or a file link. ' + FILE_HINT })] },
  { id: 'menu', name: 'Menu', desc: 'Create a restaurant menu', kind: 'page', fields: [
    T('restaurant', 'Restaurant name', { required: true }), T('description', 'Description', { type: 'textarea' }),
    IMG('logo', 'Logo link'), T('currency', 'Currency', { placeholder: 'EGP' }),
    { key: 'sections', label: 'Sections', itemLabel: 'Section', type: 'repeater', addLabel: 'Add section', min: 1, max: 15, fields: [
      T('name', 'Section name', { required: true, placeholder: 'Starters' }),
      { key: 'items', label: 'Items', itemLabel: 'Item', type: 'repeater', addLabel: 'Add item', min: 1, max: 30, fields: [
        T('name', 'Item', { required: true }), T('price', 'Price'), T('description', 'Description')] }] }] },
  { id: 'apps', name: 'Apps', desc: 'Redirect to an app store', kind: 'page', fields: [
    T('name', 'App name', { required: true }), T('description', 'Description', { type: 'textarea' }),
    IMG('logo', 'App icon link'),
    T('ios', 'App Store link', { type: 'url' }), T('android', 'Google Play link', { type: 'url' }),
    T('web', 'Website', { type: 'url' })] },
  { id: 'coupon', name: 'Coupon', desc: 'Share a coupon', kind: 'page', fields: [
    T('business', 'Business name'), T('headline', 'Headline', { required: true, placeholder: 'Summer sale' }),
    T('discount', 'Discount', { placeholder: '20% OFF' }), T('description', 'Description', { type: 'textarea' }),
    T('code', 'Coupon code'), T('valid_until', 'Valid until', { type: 'date' }),
    T('url', 'Shop link', { type: 'url' }), T('terms', 'Terms', { type: 'textarea' }), IMG('image', 'Image link')] },
  { id: 'wifi', name: 'WiFi', desc: 'Connect to a Wi-Fi network', kind: 'text', fields: [
    T('ssid', 'Network name (SSID)', { required: true }), T('password', 'Password'),
    { key: 'encryption', label: 'Security', type: 'select', options: [['WPA', 'WPA/WPA2/WPA3'], ['WEP', 'WEP'], ['nopass', 'None (open)']] },
    { key: 'hidden', label: 'Hidden network', type: 'checkbox' }] },
  { id: 'event', name: 'Event', desc: 'Promote any event', kind: 'page', fields: [
    T('title', 'Event name', { required: true }), T('organizer', 'Organizer'),
    T('start', 'Starts', { type: 'datetime', required: true }), T('end', 'Ends', { type: 'datetime' }),
    T('location', 'Location'), T('description', 'Description', { type: 'textarea' }),
    T('url', 'Tickets / info link', { type: 'url' }), IMG('cover', 'Cover image link')] },
  { id: 'email', name: 'Email', desc: 'Send and receive emails', kind: 'text', fields: [
    T('to', 'Email address', { type: 'email', required: true }), T('subject', 'Subject'), T('body', 'Message', { type: 'textarea' })] },
];

export const typeById = (id) => TYPES.find(t => t.id === id);

const wifiEsc = (s) => String(s ?? '').replace(/([\;,:"])/g, '\\$1');
const vEsc = (s) => String(s ?? '').trim().replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');

export function vcardText(d) {
  return ['BEGIN:VCARD', 'VERSION:3.0',
    `N:${vEsc(d.last_name)};${vEsc(d.first_name)};;;`,
    `FN:${vEsc([d.first_name, d.last_name].map(s => (s || '').trim()).filter(Boolean).join(' '))}`,
    d.company && `ORG:${vEsc(d.company)}`, d.job_title && `TITLE:${vEsc(d.job_title)}`,
    d.mobile && `TEL;TYPE=CELL:${vEsc(d.mobile)}`, d.phone && `TEL;TYPE=WORK:${vEsc(d.phone)}`,
    d.email && `EMAIL:${vEsc(d.email)}`, d.website && `URL:${vEsc(d.website)}`,
    d.address && `ADR;TYPE=WORK:;;${vEsc(d.address)};;;;`, d.note && `NOTE:${vEsc(d.note)}`,
    'END:VCARD'].filter(Boolean).join('\r\n');
}

/** Address of the landing page for 'page' types. */
export const pageUrl = (type, data, pageColor) =>
  `${location.origin}/v.html#${type}.${encode({ ...data, _c: pageColor })}`;

/** Exactly what the QR image encodes. Returns '' while required info is still missing. */
export function qrValue(type, d = {}, style = {}) {
  const t = typeById(type);
  if (!t) return '';
  switch (type) {
    case 'website': case 'pdf': case 'video': case 'images': case 'facebook': case 'mp3':
      return safeUrl(d.url);
    case 'instagram': return socialUrl('instagram', d.username);
    case 'whatsapp': {
      const n = String(d.phone || '').replace(/[^\d]/g, '');
      if (!n) return '';
      const msg = String(d.message || '').trim();
      return `https://wa.me/${n}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
    }
    case 'vcard': return (d.first_name || '').trim() ? vcardText(d) : '';
    case 'wifi': {
      if (!(d.ssid || '').trim()) return '';
      const enc = d.encryption || 'WPA';
      return `WIFI:T:${enc};S:${wifiEsc(d.ssid)};${enc !== 'nopass' ? `P:${wifiEsc(d.password)};` : ''}${d.hidden ? 'H:true;' : ''};`;
    }
    case 'email': {
      const to = String(d.to || '').trim();
      if (!to) return '';
      const q = [d.subject && `subject=${encodeURIComponent(d.subject.trim())}`, d.body && `body=${encodeURIComponent(d.body.trim())}`].filter(Boolean).join('&');
      return `mailto:${to}${q ? '?' + q : ''}`;
    }
    default: { // landing pages — wait until the main required field is filled
      const first = t.fields.find(f => f.required && f.type !== 'repeater');
      if (first && !String(d[first.key] || '').trim()) return '';
      return pageUrl(type, d, style.pageColor);
    }
  }
}
