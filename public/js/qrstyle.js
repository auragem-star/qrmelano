// Builds the styled QR image with qr-code-styling (public/vendor/qr-code-styling.js).

export const DEFAULT_STYLE = {
  fg: '#0b1020', bg: '#ffffff', eye: '#0b1020',
  dots: 'rounded', corners: 'extra-rounded', cornerDots: 'dot',
  logo: '', pageColor: '#2b59ff',
};

/**
 * The QR library writes each character as ONE byte, which breaks Arabic and emoji.
 * So we hand it the UTF-8 bytes (one char per byte) — phones then read the text correctly.
 */
export function utf8Bytes(str) {
  const bytes = new TextEncoder().encode(str);
  let out = '';
  for (const b of bytes) out += String.fromCharCode(b);
  return out;
}

function options(value, s, size, kind, ec) {
  return {
    width: size, height: size, type: kind, margin: Math.round(size * 0.04), data: utf8Bytes(value),
    image: s.logo || undefined,
    qrOptions: { errorCorrectionLevel: ec, mode: 'Byte' },
    imageOptions: { crossOrigin: 'anonymous', margin: Math.round(size * 0.01), imageSize: 0.3, hideBackgroundDots: true },
    dotsOptions: { type: s.dots, color: s.fg },
    cornersSquareOptions: { type: s.corners, color: s.eye || s.fg },
    cornersDotOptions: { type: s.cornerDots, color: s.eye || s.fg },
    backgroundOptions: { color: s.bg },
  };
}

/**
 * Returns { qr, ec, modules } — tries the strongest error-correction first
 * (a logo needs H) and steps down if the content is too long to fit.
 * Throws Error('too-long') when nothing fits.
 */
export function makeQR(value, style, size = 1000, kind = 'canvas') {
  const s = { ...DEFAULT_STYLE, ...(style || {}) };
  const levels = s.logo ? ['H', 'Q', 'M'] : ['M', 'L'];
  for (const ec of levels) {
    try {
      const qr = new window.QRCodeStyling(options(value, s, size, kind, ec));
      const modules = qr._qr?.getModuleCount?.() || 0;
      if (!qr._qr) throw new Error('no qr');
      return { qr, ec, modules };
    } catch (e) { /* try a lower level */ }
  }
  throw new Error('too-long');
}

const fileName = (name) => (String(name || 'qr-code').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'qr-code');

export async function downloadQR(value, style, name, ext = 'png', size = 2000) {
  const { qr } = makeQR(value, style, size, ext === 'svg' ? 'svg' : 'canvas');
  await qr.download({ name: fileName(name), extension: ext });
}
