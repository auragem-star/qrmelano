// Landing-page content is stored INSIDE the QR link itself (after the #), compressed.
// No database, no server: the text never leaves the browser except inside the printed code.
// Uses fflate (public/vendor/fflate.js), loaded before this module.

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function toB64url(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < bytes.length) out += B64[(n >> 6) & 63];
    if (i + 2 < bytes.length) out += B64[n & 63];
  }
  return out;
}

function fromB64url(str) {
  const clean = str.replace(/[^A-Za-z0-9_-]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let j = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i + 1]) << 12)
      | ((B64.indexOf(clean[i + 2] ?? 'A') & 63) << 6) | (B64.indexOf(clean[i + 3] ?? 'A') & 63);
    if (j < bytes.length) bytes[j++] = (n >> 16) & 255;
    if (j < bytes.length) bytes[j++] = (n >> 8) & 255;
    if (j < bytes.length) bytes[j++] = n & 255;
  }
  return bytes;
}

/** Drop empty strings / empty lists so the code stays as small as possible. */
export function compact(v) {
  if (Array.isArray(v)) { const a = v.map(compact).filter(x => x !== undefined); return a.length ? a : undefined; }
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) { const c = compact(x); if (c !== undefined) o[k] = c; }
    return Object.keys(o).length ? o : undefined;
  }
  if (typeof v === 'string') { const t = v.trim(); return t ? t : undefined; }
  return v === false || v == null ? undefined : v;
}

export function encode(obj) {
  const { deflateSync, strToU8 } = window.fflate;
  return toB64url(deflateSync(strToU8(JSON.stringify(compact(obj) || {})), { level: 9 }));
}

export const MAX_PAYLOAD = 8000; // characters — far beyond what fits in a QR code anyway

export function decode(str) {
  if (!str || str.length > MAX_PAYLOAD) throw new Error('bad payload');
  const { inflateSync, strFromU8 } = window.fflate;
  const json = strFromU8(inflateSync(fromB64url(str)));
  if (json.length > 200000) throw new Error('payload too large');
  const obj = JSON.parse(json);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('bad payload');
  return obj;
}
