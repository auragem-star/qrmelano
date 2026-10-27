import { $, $$, h, toast, safeUrl, isEmail, store } from './util.js';
import { TYPES, ICONS, typeById, qrValue } from './types.js';
import { makeQR, downloadQR, DEFAULT_STYLE } from './qrstyle.js';

const STYLE_KEY = 'qrmelano.style';
const state = { type: null, data: {}, style: { ...DEFAULT_STYLE, ...(store.get(STYLE_KEY) || {}) } };
let current = ''; // what the QR encodes right now

// ------------------------------------------------------------------ steps
function showStep(n) {
  $('#stepType').classList.toggle('hidden', n !== 1);
  $('#stepBuild').classList.toggle('hidden', n !== 2);
  $$('.step').forEach(s => {
    const k = Number(s.dataset.step);
    s.classList.toggle('on', k === n);
    s.classList.toggle('done', k < n);
  });
  scrollTo({ top: 0, behavior: 'smooth' });
}

$('#typeGrid').append(...TYPES.map(t =>
  h('button', { class: 'type', type: 'button', onclick: () => pickType(t.id) },
    h('span', { class: 'ic', icon: ICONS[t.id] }),
    h('span', {}, h('b', { text: t.name }), h('small', { text: t.desc })))));

const KIND_NOTE = {
  url: 'Scanning opens this link directly.',
  text: 'The details are stored inside the code itself — it works even without internet.',
  page: 'Scanning opens a mobile page with this content. The content is stored inside the code, so make sure it is final before printing.',
};

function pickType(id) {
  const t = typeById(id);
  if (!t) return showStep(1);
  if (state.type !== id) state.data = {};
  state.type = id;
  $('#typeTitle').textContent = t.name;
  $('#typeIcon').innerHTML = ICONS[id];
  $('#kindNote').textContent = KIND_NOTE[t.kind];
  $('#pageColorField').classList.toggle('hidden', t.kind !== 'page');
  $('#fileName').value = `${t.name} QR`;
  history.replaceState(null, '', `/create.html?type=${id}`);
  renderForm();
  showStep(2);
  refresh();
}
$('#changeType').addEventListener('click', () => { history.replaceState(null, '', '/create.html'); showStep(1); });
$('#stepBack').addEventListener('click', () => { if (state.type) { history.replaceState(null, '', '/create.html'); showStep(1); } });

// ------------------------------------------------------------------ form builder
const LIMIT = { text: 200, url: 1000, email: 254, tel: 20, textarea: 1500, date: 10 };

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso); if (isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function renderForm() {
  const box = $('#form'); box.replaceChildren();
  renderFields(typeById(state.type).fields, state.data, box);
}
function renderFields(fields, obj, container) { for (const f of fields) container.append(renderField(f, obj)); }

let uid = 0;
function renderField(f, obj) {
  const id = 'f' + (++uid);
  const label = h('label', { class: 'f', for: id }, f.label, f.required ? h('span', { class: 'req', text: ' *' }) : null);
  const hint = f.hint ? h('div', { class: 'hint', text: f.hint }) : null;
  const wrap = (...els) => h('div', { class: 'field' }, ...els);

  switch (f.type) {
    case 'textarea': {
      const el = h('textarea', { class: 'input', id, maxlength: LIMIT.textarea, placeholder: f.placeholder || '' });
      el.value = obj[f.key] || '';
      el.addEventListener('input', () => { obj[f.key] = el.value; refresh(); });
      return wrap(label, el, hint);
    }
    case 'select': {
      const el = h('select', { class: 'input', id }, ...f.options.map(([v, l]) => h('option', { value: v, text: l })));
      el.value = obj[f.key] || f.options[0][0]; obj[f.key] = el.value;
      el.addEventListener('change', () => { obj[f.key] = el.value; refresh(); });
      return wrap(label, el);
    }
    case 'checkbox': {
      const el = h('input', { type: 'checkbox', id }); el.checked = !!obj[f.key];
      el.addEventListener('change', () => { obj[f.key] = el.checked; refresh(); });
      return wrap(h('label', { class: 'check', for: id }, el, f.label));
    }
    case 'datetime': {
      const el = h('input', { class: 'input', id, type: 'datetime-local' });
      el.value = toLocalInput(obj[f.key]);
      el.addEventListener('change', () => { obj[f.key] = el.value ? new Date(el.value).toISOString() : ''; refresh(); });
      return wrap(label, el, hint);
    }
    case 'group': {
      obj[f.key] = obj[f.key] && typeof obj[f.key] === 'object' ? obj[f.key] : {};
      const inner = h('div', { class: 'row2' });
      renderFields(f.fields, obj[f.key], inner);
      return h('div', { class: 'field' }, h('label', { class: 'f', text: f.label }), inner);
    }
    case 'repeater': return repeaterField(f, obj);
    default: {
      const type = f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : f.type === 'date' ? 'date' : 'text';
      const el = h('input', { class: 'input', id, type, maxlength: LIMIT[f.type] || LIMIT.text, placeholder: f.placeholder || '',
        inputmode: f.type === 'url' ? 'url' : null, autocomplete: 'off', spellcheck: f.type === 'url' ? 'false' : null, dir: 'auto' });
      el.value = obj[f.key] || '';
      el.addEventListener('input', () => { obj[f.key] = el.value; refresh(); });
      return wrap(label, el, hint);
    }
  }
}

function repeaterField(f, obj) {
  obj[f.key] = Array.isArray(obj[f.key]) && obj[f.key].length ? obj[f.key] : Array.from({ length: f.min || 1 }, () => ({}));
  const box = h('div');
  const draw = () => {
    box.replaceChildren();
    obj[f.key].forEach((item, i) => {
      const card = h('div', { class: 'rep' },
        h('div', { class: 'rep-head' }, h('span', { text: `${f.itemLabel} ${i + 1}` }),
          obj[f.key].length > (f.min || 0) ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { obj[f.key].splice(i, 1); draw(); refresh(); } }, 'Remove') : null));
      renderFields(f.fields, item, card);
      box.append(card);
    });
    if (obj[f.key].length < (f.max || 20)) {
      box.append(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { obj[f.key].push({}); draw(); refresh(); } }, '+ ' + f.addLabel));
    }
  };
  draw();
  return h('div', { class: 'field' }, h('label', { class: 'f', text: f.label }), box);
}

// ------------------------------------------------------------------ validation (runs before download)
function validate(fields, obj, path = '') {
  for (const f of fields) {
    const where = path + f.label;
    if (f.type === 'repeater') {
      const list = obj[f.key] || [];
      if (list.length < (f.min || 0)) return `${where}: add at least ${f.min}`;
      for (const [i, item] of list.entries()) { const e = validate(f.fields, item, `${f.itemLabel} ${i + 1} → `); if (e) return e; }
      continue;
    }
    if (f.type === 'group') { const e = validate(f.fields, obj[f.key] || {}, ''); if (e) return e; continue; }
    const v = typeof obj[f.key] === 'string' ? obj[f.key].trim() : obj[f.key];
    if (f.required && (v === undefined || v === '' || v === null)) return `${where} is required`;
    if (!v) continue;
    if (f.type === 'url' && !safeUrl(v)) return `${where}: please enter a valid link (https://…)`;
    if (f.type === 'email' && !isEmail(v)) return `${where}: please enter a valid email`;
    if (f.type === 'tel' && !/^\+?[\d\s()-]{6,20}$/.test(v)) return `${where}: please enter a valid number`;
  }
  return null;
}

/** Turn typed links into clean https:// links before encoding. */
function normalize(fields, obj) {
  for (const f of fields) {
    if (f.type === 'repeater') (obj[f.key] || []).forEach(it => normalize(f.fields, it));
    else if (f.type === 'group') normalize(f.fields, obj[f.key] || {});
    else if (f.type === 'url' && obj[f.key]) obj[f.key] = safeUrl(obj[f.key]) || obj[f.key];
  }
}

// ------------------------------------------------------------------ design panel
const OPTS = {
  dots: [['square', 'Square'], ['rounded', 'Rounded'], ['extra-rounded', 'Soft'], ['dots', 'Dots'], ['classy', 'Classy'], ['classy-rounded', 'Classy round']],
  corners: [['square', 'Square'], ['extra-rounded', 'Rounded'], ['dot', 'Circle']],
  cornerDots: [['square', 'Square'], ['dot', 'Circle']],
};
const PALETTES = [
  ['#0b1020', '#0b1020', '#ffffff'], ['#0b1020', '#2b59ff', '#ffffff'], ['#1d4ed8', '#1d4ed8', '#ffffff'],
  ['#064e3b', '#059669', '#ffffff'], ['#7c2d12', '#ea580c', '#fffbeb'], ['#581c87', '#a21caf', '#ffffff'],
];

for (const [key, opts] of Object.entries(OPTS)) {
  $(`[data-opt="${key}"]`).append(...opts.map(([v, l]) =>
    h('button', { class: 'opt', type: 'button', 'data-v': v, onclick: () => { state.style[key] = v; syncDesign(); refresh(); } }, l)));
}
$('#swatches').append(...PALETTES.map(([fg, eye, bg]) => {
  const b = h('button', { class: 'swatch', type: 'button', title: 'Apply colors', 'aria-label': 'Apply color palette',
    onclick: () => { Object.assign(state.style, { fg, eye, bg }); syncDesign(); refresh(); } });
  b.style.background = `linear-gradient(135deg,${fg} 50%,${eye} 50%)`;
  return b;
}));
for (const k of ['fg', 'eye', 'bg', 'pageColor']) {
  $('#' + k).addEventListener('input', (e) => { state.style[k] = e.target.value; checkContrast(); refresh(); });
}
$('#resetDesign').addEventListener('click', () => { state.style = { ...DEFAULT_STYLE }; $('#logo').value = ''; syncDesign(); refresh(); });

function syncDesign() {
  for (const k of ['fg', 'eye', 'bg', 'pageColor']) $('#' + k).value = state.style[k] || DEFAULT_STYLE[k];
  for (const key of Object.keys(OPTS)) $$(`[data-opt="${key}"] .opt`).forEach(b => b.classList.toggle('sel', b.dataset.v === state.style[key]));
  drawLogoState(); checkContrast();
}

function lum(hex) {
  const n = String(hex || '#000000').replace('#', '');
  const v = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function checkContrast() {
  const a = Math.max(lum(state.style.fg), lum(state.style.eye)), b = lum(state.style.bg);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  $('#contrastWarn').classList.toggle('hidden', ratio >= 3 && b > a);
}

function drawLogoState() {
  const box = $('#logoState'); box.replaceChildren();
  if (state.style.logo) box.append(h('div', { class: 'thumbs' }, h('div', { class: 't' }, h('img', { src: state.style.logo, alt: 'Logo' }),
    h('button', { type: 'button', title: 'Remove logo', 'aria-label': 'Remove logo', onclick: () => { state.style.logo = ''; $('#logo').value = ''; drawLogoState(); refresh(); } }, '×'))));
}

// the logo never leaves the computer: it is read locally and drawn into the image
$('#logo').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { toast('Logo must be PNG, JPG or WEBP'); e.target.value = ''; return; }
  if (file.size > 1024 * 1024) { toast('Logo is too large (max 1 MB)'); e.target.value = ''; return; }
  const r = new FileReader();
  r.onload = () => { state.style.logo = String(r.result); drawLogoState(); refresh(); };
  r.readAsDataURL(file);
});

// ------------------------------------------------------------------ preview
const fmtBytes = (n) => n.toLocaleString('en-US');
let refreshTimer;
function refresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(draw, 150);
}

function draw() {
  if (!state.type) return;
  store.set(STYLE_KEY, state.style);
  const t = typeById(state.type);
  const box = $('#preview');
  const info = $('#previewInfo');
  const dens = $('#density');
  current = qrValue(state.type, state.data, state.style);
  dens.className = 'hidden';

  if (!current) {
    delete box.dataset.value;
    box.replaceChildren(h('div', { class: 'qr-empty' }, h('span', { icon: ICONS[state.type] }), h('p', { text: 'Fill in the required fields to see your QR code.' })));
    info.textContent = '';
    setActions(false);
    return;
  }
  try {
    const { qr, ec, modules } = makeQR(current, state.style, 320);
    box.replaceChildren(); qr.append(box);
    box.dataset.value = current; // lets you (and tests) see exactly what the code holds
    info.textContent = t.kind === 'text' ? (state.type === 'vcard' ? 'Contact card' : state.type === 'wifi' ? 'Wi-Fi network' : 'Email draft')
      : `Opens: ${t.kind === 'page' ? location.host + '/v.html…' : current}`;
    if (modules >= 69) {
      dens.className = 'alert alert-warn';
      dens.textContent = `Dense code (${fmtBytes(current.length)} characters). Print it at least 3 × 3 cm${state.style.logo ? ', or remove the logo' : ''}, and test it with your phone before printing.`;
    } else if (state.style.logo && ec !== 'H') {
      dens.className = 'alert alert-warn';
      dens.textContent = 'There is a lot of content for a logo — remove the logo or shorten the text for a more reliable scan.';
    }
    setActions(true);
  } catch {
    box.replaceChildren(h('div', { class: 'qr-empty' }, h('p', { text: 'Too much content for one QR code. Please shorten the text or remove some items.' })));
    info.textContent = `${fmtBytes(current.length)} characters`;
    setActions(false);
  }
}

function setActions(on) {
  $$('[data-dl]').forEach(b => (b.disabled = !on));
  const t = typeById(state.type);
  const linkable = on && /^https?:/.test(current);
  $('#testLink').classList.toggle('hidden', !linkable);
  $('#copyLink').classList.toggle('hidden', !linkable);
  if (linkable) $('#testLink').href = current;
  $('#testLink').textContent = t?.kind === 'page' ? 'Preview landing page ↗' : 'Test link ↗';
}

// ------------------------------------------------------------------ download
function dlMsg(text) { $('#dlMsg').replaceChildren(text ? h('div', { class: 'alert alert-bad', text }) : ''); }

$$('[data-dl]').forEach(b => b.addEventListener('click', async () => {
  dlMsg('');
  const t = typeById(state.type);
  const err = validate(t.fields, state.data);
  if (err) return dlMsg(err);
  if (state.type === 'apps' && !state.data.ios && !state.data.android && !state.data.web) return dlMsg('Add at least one store link or website.');
  normalize(t.fields, state.data);
  draw();
  if (!current) return dlMsg('Please complete the required fields.');
  b.disabled = true;
  try { await downloadQR(current, state.style, $('#fileName').value, b.dataset.dl, 2000); toast('Downloaded ✓'); }
  catch { dlMsg('Could not create the file. Please shorten the content and try again.'); }
  finally { b.disabled = false; }
}));

$('#copyLink').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(current); toast('Link copied'); } catch { toast('Could not copy'); }
});

// ------------------------------------------------------------------ start
syncDesign();
const pre = new URLSearchParams(location.search).get('type');
if (pre && typeById(pre)) pickType(pre); else showStep(1);
