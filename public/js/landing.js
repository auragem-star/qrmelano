import { $, h } from './util.js';
import { TYPES, ICONS } from './types.js';

$('#typeGrid').append(...TYPES.map(t =>
  h('a', { class: 'type', href: `/create.html?type=${t.id}` },
    h('span', { class: 'ic', icon: ICONS[t.id] }),
    h('span', {}, h('b', { text: t.name }), h('small', { text: t.desc })))));

new window.QRCodeStyling({
  width: 360, height: 360, type: 'canvas', data: location.origin, margin: 0,
  qrOptions: { errorCorrectionLevel: 'M' },
  dotsOptions: { type: 'rounded', color: '#0b1020' },
  cornersSquareOptions: { type: 'extra-rounded', color: '#2b59ff' },
  cornersDotOptions: { type: 'dot', color: '#0b1020' },
  backgroundOptions: { color: '#ffffff' },
}).append($('#heroQr'));
