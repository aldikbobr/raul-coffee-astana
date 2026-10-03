const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const TG = 'https://t.me/coffee_raul_bot';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const num = n => n.toLocaleString('ru-RU').replace(/\s/g, ' ');
const tenge = n => num(n) + ' ₸';

/* ---------- header, mobile bar, menu ---------- */
const header = $('#header'), bar = $('.mobile-bar'), menu = $('#menu');
const onScroll = () => {
  header.classList.toggle('scrolled', scrollY > 10);
  bar.classList.toggle('show', scrollY > 560);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();
$$('a', menu).forEach(a => a.addEventListener('click', () => { if (menu.matches(':popover-open')) menu.hidePopover(); }));

/* ---------- open now (Astana, UTC+5) ---------- */
const hour = (new Date().getUTCHours() + 5) % 24;
if (hour >= 8) $('#status-text').textContent = 'Открыто сейчас · до 24:00 · Туркестан, 16, 22 этаж';
else { $('#status').classList.add('closed'); $('#status-text').textContent = 'Сейчас закрыто · откроемся в 8:00'; }

/* ---------- marquees: duplicate content for a seamless loop ---------- */
$$('.ticker-track, .rv-track').forEach(t => t.append(...[...t.children].map(n => {
  const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c;
})));

/* ---------- staggered reveal ---------- */
const grid = $('#grid'), cards = [...grid.children];
cards.forEach((c, i) => {
  c.classList.add('reveal');
  c.style.setProperty('--d', (i % 4) * 0.08 + 's');
  c.style.viewTransitionName = 'c-' + c.dataset.id;
});
$$('.why-grid .feat').forEach((el, i) => el.style.setProperty('--d', (i % 3) * 0.1 + 's'));
$$('.sale-grid .offer, .cats-row .cat').forEach((el, i) => el.style.setProperty('--d', (i % 5) * 0.08 + 's'));

/* ---------- reveal + count-up ---------- */
const countUp = el => {
  const to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, t0 = performance.now();
  const fmt = v => dec ? v.toFixed(dec) : num(Math.round(v));
  const step = t => {
    const k = Math.min((t - t0) / 1400, 1);
    el.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  if (reduce) el.textContent = fmt(to); else requestAnimationFrame(step);
};
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  if (e.target.dataset.count) countUp(e.target);
  io.unobserve(e.target);
}), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
$$('.reveal, [data-count]').forEach(el => io.observe(el));

/* ---------- falling coffee beans in the hero ---------- */
const cv = $('.petals');
if (cv && !reduce) {
  const ctx = cv.getContext('2d'), colors = ['#6B4430', '#8A5A3B', '#4A2E1F', '#A87553'];
  let W = 0, H = 0, raf = 0;
  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  const bean = y => ({ x: Math.random() * W, y: y ?? -20, s: 5 + Math.random() * 6, vy: 0.3 + Math.random() * 0.5, vx: -0.15 + Math.random() * 0.3, a: Math.random() * 6.3, va: -0.015 + Math.random() * 0.03, w: Math.random() * 6.3, c: colors[Math.random() * colors.length | 0], o: 0.35 + Math.random() * 0.35 });
  size();
  const bs = Array.from({ length: W < 700 ? 10 : 18 }, () => bean(Math.random() * H));
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const b of bs) {
      b.w += 0.02; b.x += b.vx + Math.sin(b.w) * 0.35; b.y += b.vy; b.a += b.va;
      if (b.y > H + 20) Object.assign(b, bean());
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.scale(0.75 + 0.25 * Math.sin(b.w * 1.3), 1);
      ctx.globalAlpha = b.o; ctx.fillStyle = b.c;
      ctx.beginPath(); ctx.ellipse(0, 0, b.s * 0.68, b.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 240, 220, .45)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -b.s * 0.8); ctx.quadraticCurveTo(b.s * 0.38, 0, 0, b.s * 0.8); ctx.stroke();
      ctx.restore();
    }
    raf = requestAnimationFrame(draw);
  };
  new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) draw(); }).observe(cv);
  addEventListener('resize', size);
}

/* ---------- menu filters (animated with View Transitions where supported) ---------- */
const filter = { cat: 'all', tier: 'all' };
const applyFilter = () => {
  let n = 0;
  for (const c of cards) {
    const ok = (filter.cat === 'all' || c.dataset.cat === filter.cat) && (filter.tier === 'all' || c.dataset.tier === filter.tier);
    c.hidden = !ok; n += ok;
  }
  $('#found').textContent = `Показано ${n} из ${cards.length}`;
  $('#empty').hidden = n > 0;
  // fewer cards shrink the page: keep the first results right under the sticky filters
  const gap = $('#found').getBoundingClientRect().top - $('.filters').getBoundingClientRect().bottom;
  if (gap < 0) scrollBy(0, gap - 4);
};
const setFilter = patch => {
  Object.assign(filter, patch);
  $$('[data-filter]').forEach(g => $$('button', g).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === filter[g.dataset.filter])));
  if (document.startViewTransition && !reduce) document.startViewTransition(applyFilter); else applyFilter();
};
$$('[data-filter]').forEach(g => g.addEventListener('click', e => {
  const b = e.target.closest('button'); if (b) setFilter({ [g.dataset.filter]: b.dataset.v });
}));
$$('[data-go]').forEach(b => b.addEventListener('click', () => {
  setFilter({ cat: b.dataset.go, tier: 'all' });
  $('#menu-sec').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* ---------- order to go: lines { key: { name, price, qty } } ---------- */
const P = Object.fromEntries(cards.map(c => {
  const size = c.dataset.size;
  return [c.dataset.id, { name: $('h3', c).textContent + (size ? ` (${size})` : ''), price: +c.dataset.price, img: $('img', c) }];
}));
let cart = {};
try { cart = JSON.parse(localStorage.getItem('raul-cart')) || {}; } catch { cart = {}; }
for (const k in cart) { const l = cart[k]; if (!l || typeof l.name !== 'string' || !(l.price >= 0) || !(l.qty > 0)) delete cart[k]; }
const save = () => { try { localStorage.setItem('raul-cart', JSON.stringify(cart)); } catch { /* private mode */ } };

const dlg = $('#cart'), list = $('#cart-list'), form = $('#cart-form');
const total = () => Object.values(cart).reduce((s, l) => s + l.price * l.qty, 0);
const render = () => {
  const keys = Object.keys(cart), count = keys.reduce((s, k) => s + cart[k].qty, 0);
  $$('[data-cart-count]').forEach(b => { b.textContent = count; b.hidden = !count; });
  list.replaceChildren(...keys.map(k => {
    const l = cart[k], li = document.createElement('li');
    li.dataset.key = k;
    li.innerHTML = `${P[k] ? `<img src="${P[k].img.currentSrc || P[k].img.src}" alt="" width="60" height="72">` : '<span class="ci-icon"><svg class="i"><use href="#i-cup"/></svg></span>'}<div><div class="ci-name"></div><div class="ci-price">${tenge(l.price)}</div></div><div class="qty"><button type="button" data-q="-1" aria-label="Убрать одну"><svg class="i"><use href="#i-minus"/></svg></button><span>${l.qty}</span><button type="button" data-q="1" aria-label="Добавить ещё"><svg class="i"><use href="#i-plus"/></svg></button></div>`;
    $('.ci-name', li).textContent = l.name;
    return li;
  }));
  $('#cart-empty').hidden = !!count;
  form.hidden = $('#cart-foot').hidden = !count;
  $('#cart-total').textContent = tenge(total());
};

const toast = $('#toast');
let toastT;
const say = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2600); };

const fly = el => {
  const target = $('.cart-btn');
  if (reduce || !el || !target) return;
  const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
  if (!a.width) return;
  const c = el.cloneNode(true);
  c.removeAttribute('loading'); c.removeAttribute('id'); c.setAttribute('class', 'fly'); c.setAttribute('aria-hidden', 'true');
  Object.assign(c.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
  document.body.append(c);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  c.animate([
    { transform: 'none', opacity: 1 },
    { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(.45) rotate(-8deg)`, opacity: 0.95, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.06)`, opacity: 0.3 },
  ], { duration: 850, easing: 'cubic-bezier(.45,0,.55,1)' }).onfinish = () => {
    c.remove();
    $$('[data-cart-count]').forEach(n => { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); });
  };
};

const add = (key, line, from, btn) => {
  cart[key] = cart[key] ? { ...cart[key], qty: cart[key].qty + 1 } : { ...line, qty: 1 };
  save(); render(); fly(from);
  say(`«${line.name}» — в заказе`);
  if (btn && btn.classList.contains('add')) {
    btn.classList.add('done'); $('use', btn).setAttribute('href', '#i-check');
    setTimeout(() => { btn.classList.remove('done'); $('use', btn).setAttribute('href', '#i-plus'); }, 1400);
  }
};
grid.addEventListener('click', e => {
  const b = e.target.closest('.add'); if (!b) return;
  const id = b.closest('.card').dataset.id, p = P[id];
  add(id, { name: p.name, price: p.price }, p.img, b);
});
list.addEventListener('click', e => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  const k = b.closest('li').dataset.key;
  cart[k].qty += +b.dataset.q;
  if (cart[k].qty <= 0) delete cart[k];
  save(); render();
});

$$('[data-cart-open]').forEach(b => b.addEventListener('click', () => dlg.showModal()));
$$('[data-cart-close]').forEach(b => b.addEventListener('click', () => dlg.close()));
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

form.addEventListener('submit', async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form)), lines = Object.values(cart);
  if (!lines.length) return;
  const text = ['Здравствуйте! Заказ с собой с сайта Raul:', ...lines.map(l => `• ${l.name} × ${l.qty} — ${tenge(l.price * l.qty)}`), `Итого по меню: ${tenge(total())}`];
  if (f.name.trim()) text.push('Имя: ' + f.name.trim());
  if (f.time) text.push('К времени: ' + f.time);
  if (f.note.trim()) text.push('Комментарий: ' + f.note.trim());
  // copy first: the clipboard needs this tab focused, and the click still allows window.open afterwards
  let copied = false;
  try { await navigator.clipboard.writeText(text.join('\n')); copied = true; } catch { /* no clipboard access */ }
  const tab = window.open(TG, '_blank');
  if (tab) tab.opener = null;
  say(copied ? 'Заказ скопирован — вставьте его в чат' : 'Не удалось скопировать — перепишите заказ в чат');
});
render();

/* ---------- drink builder: layers in the glass follow the choice ---------- */
const DRINKS = {
  cappuccino: { name: 'Капучино', sizes: { S: 1500, M: 1700, L: 1900 }, layers: [['espresso', 0.28], ['milk', 0.34], ['foam', 0.3]] },
  latte: { name: 'Латте', sizes: { M: 1700, L: 1900 }, layers: [['espresso', 0.2], ['milk', 0.58], ['foam', 0.14]] },
  americano: { name: 'Американо', sizes: { S: 1300, M: 1500 }, layers: [['coffee', 0.84], ['crema', 0.06]] },
  flatwhite: { name: 'Флэт уайт', sizes: { S: 1700 }, layers: [['espresso', 0.36], ['milk', 0.48], ['foam', 0.08]] },
  matcha: { name: 'Матча латте', sizes: { M: 2100 }, layers: [['matcha', 0.26], ['milk', 0.52], ['foam', 0.14]] },
  cocoa: { name: 'Какао', sizes: { M: 1500 }, layers: [['cocoa', 0.72], ['foam', 0.18]] },
};
const ADDONS = { syrup: ['сироп', 300], alt: ['альтернативное молоко', 600], lactose: ['безлактозное молоко', 500], decaf: ['без кофеина', 600], cheese: ['сырная шапка', 300] };
const COLORS = { espresso: '#4A2A1A', coffee: '#3B2218', crema: '#B8834F', milk: '#F1E6D6', altmilk: '#E8D8BE', foam: '#FFFBF4', matcha: '#8DAE62', cocoa: '#7A4B33', syrup: '#C98A4B', cheese: '#F3E2AE' };
const SCALE = { S: 0.84, M: 0.92, L: 1 };
const TOP = 77, BOTTOM = 339, FILL = 0.92;
const bForm = $('#build-form'), layersG = $('#cup-layers');
const rects = Array.from({ length: 6 }, () => {
  const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  r.setAttribute('class', 'layer'); r.setAttribute('x', 60); r.setAttribute('width', 200);
  r.setAttribute('y', BOTTOM); r.setAttribute('height', 0);
  layersG.append(r);
  return r;
});
const build = () => {
  const el = bForm.elements, d = DRINKS[el.drink.value];
  // only sizes the menu actually has; keep the choice if possible
  $$('input[name="size"]', bForm).forEach(i => { i.disabled = !(i.value in d.sizes); });
  if (!(el.size.value in d.sizes)) $(`input[name="size"][value="${Object.keys(d.sizes)[0]}"]`, bForm).checked = true;
  const size = el.size.value, adds = $$('input[name="add"]:checked', bForm).map(i => i.value);
  const price = d.sizes[size] + adds.reduce((s, a) => s + ADDONS[a][1], 0);
  const name = `${d.name} · ${size}` + (adds.length ? ' + ' + adds.map(a => ADDONS[a][0]).join(', ') : '');

  let layers = d.layers.map(([k, h]) => [k === 'milk' && (adds.includes('alt') || adds.includes('lactose')) ? 'altmilk' : k, h]);
  if (adds.includes('syrup')) layers.unshift(['syrup', 0.08]);
  if (adds.includes('cheese')) layers.push(['cheese', 0.1]);
  const sum = layers.reduce((s, [, h]) => s + h, 0), k = Math.min(1, FILL / sum), H = BOTTOM - TOP;
  let y = BOTTOM;
  rects.forEach((r, i) => {
    const l = layers[i], h = l ? l[1] * k * H : 0;
    y -= h;
    // attributes for every browser; CSS y/height on top so Chromium animates them
    r.setAttribute('y', y); r.setAttribute('height', h);
    r.style.y = y + 'px'; r.style.height = h + 'px';
    if (l) r.style.fill = COLORS[l[0]];
  });
  $('#cup-body').style.transform = `scale(${SCALE[size]})`;
  $('#build-name').textContent = name;
  $('#bv').textContent = num(price);
  return { name, price };
};
bForm.addEventListener('change', e => {
  const other = { alt: 'lactose', lactose: 'alt' }[e.target.value]; // one kind of milk at a time
  if (other && e.target.checked) $(`input[value="${other}"]`, bForm).checked = false;
  build();
});
bForm.addEventListener('submit', e => {
  e.preventDefault();
  const { name, price } = build();
  add('b:' + name, { name, price }, $('#cup'));
});
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { build(); o.disconnect(); } }, { threshold: 0.3 }).observe($('#cup'));
