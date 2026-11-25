// Brasa Burger — app de pedidos com painel de administrador (HTML/CSS/JS puro)
(() => {
  'use strict';

  // Na versão publicada como página única, a estrutura vem num <template>; monta antes de tudo.
  const shellTpl = document.getElementById('app-shell');
  const BUNDLED = !!shellTpl;
  if (BUNDLED) document.body.appendChild(shellTpl.content.cloneNode(true));

  // ---------- Utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const newId = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 8)}`;
  const safeImg = (u) => (typeof u === 'string' && (/^https:\/\//.test(u) || /^\/_blob\//.test(u) || /^data:image\/(png|jpe?g|webp|gif|svg\+xml);/.test(u)) ? u : '');
  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v || '');
  const safeHref = (l) => (typeof l === 'string' && (/^#[a-z0-9-]*$/i.test(l) || /^https:\/\//.test(l)) ? l : '#inicio');
  const linkAttrs = (l) => { const h = safeHref(l); return h.startsWith('https://') ? `href="${esc(h)}" target="_blank" rel="noopener"` : `href="${esc(h)}"`; };
  const fmtNum = (v) => (v === '' || v == null || isNaN(v) ? '' : Number(v).toFixed(2).replace('.', ','));
  const parseMoney = (s) => {
    s = String(s ?? '').trim().replace(/[R$\s]/g, '');
    if (!s) return null;
    const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
    return isNaN(n) ? NaN : Math.round(n * 100) / 100;
  };
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 + amt))));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
  }

  // ---------- Configuração (conteúdo editável) ----------
  const CONFIG_KEY = 'brasa-config-v1';
  const DRAFT_KEY = 'brasa-draft-v1';
  const LIST_KEYS = ['categories', 'products', 'extras', 'comboDrinks', 'sizes', 'offerSections', 'offers', 'rewards', 'banners', 'stores'];
  function normalize(raw) {
    const d = clone(DEFAULT_CONFIG);
    if (!raw || typeof raw !== 'object') return d;
    const out = { ...d, ...raw };
    for (const k of ['brand', 'general', 'home', 'promo']) out[k] = { ...d[k], ...(raw[k] || {}) };
    out.brand.colors = { ...d.brand.colors, ...((raw.brand || {}).colors || {}) };
    for (const k of LIST_KEYS) if (!Array.isArray(out[k])) out[k] = d[k];
    if (!Array.isArray(out.general.milestones) || !out.general.milestones.length) out.general.milestones = d.general.milestones;
    return out;
  }
  function loadPublished() {
    const el = document.getElementById('app-config');
    if (el) { try { return normalize(JSON.parse(el.textContent || '{}')); } catch (e) { return normalize(null); } }
    try { const raw = localStorage.getItem(CONFIG_KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) { /* ignora */ }
    return normalize(null);
  }
  let PUBLISHED = loadPublished();
  let CFG = clone(PUBLISHED);

  const product = (id) => CFG.products.find((p) => p.id === id);
  const offer = (id) => CFG.offers.find((o) => o.id === id);
  const reward = (id) => CFG.rewards.find((r) => r.id === id);
  const visibleProducts = () => CFG.products.filter((p) => !p.hidden);
  const visibleOffers = () => CFG.offers.filter((o) => !o.hidden);
  const fullBrand = () => `${CFG.brand.name} ${CFG.brand.accent}`.trim();

  // ---------- Estado do cliente (por aparelho) ----------
  const STORE_KEY = 'brasa-burger-v2';
  const newCode = () => 'BR-' + uid().slice(0, 4) + '-' + uid().slice(0, 4);
  const defaultState = () => ({
    onboarded: false, name: '', storeId: null, cart: [], orders: [],
    points: Number(CFG.general.welcomePoints) || 0,
    history: [{ t: Date.now(), desc: 'Bônus de boas-vindas', pts: Number(CFG.general.welcomePoints) || 0 }],
    memberCode: newCode(),
  });
  let state = load();
  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) return { ...defaultState(), ...JSON.parse(raw) }; } catch (e) { /* ignora */ }
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
    updateChrome();
  }
  const store = () => CFG.stores.find((s) => s.id === state.storeId);
  const firstName = () => (state.name || '').trim().split(/\s+/)[0];

  const ICONS = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    burger: '<path d="M4 10a8 6 0 0 1 16 0z"/><path d="M3 14h18"/><path d="M4 17h16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
    flame: '<path d="M12 3c1 4 6 5 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-8z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  };
  const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ---------- Imagens ----------
  const art = (spec, cls) => Art.render(spec || ART.classico, cls);
  function visual(item, fallbackArt) {
    const src = safeImg(item && item.image);
    if (src) return `<img class="photo" src="${esc(src)}" alt="" loading="lazy" decoding="async">`;
    return art((item && item.art) || fallbackArt);
  }
  function comboVisual(p, drinkType) {
    if (safeImg(p.image)) return visual(p);
    if (p.art && p.art.type === 'burger') return art({ type: 'combo', main: p.art, drink: { type: drinkType || 'drink' } });
    return art(p.art);
  }

  // ---------- Sacola ----------
  function unitPrice(item) {
    if (item.kind === 'offer') return offer(item.id)?.price || 0;
    if (item.kind === 'reward') return reward(item.id)?.price || 0;
    const p = product(item.id);
    if (!p) return 0;
    let price = item.mode === 'combo' ? Number(p.combo) : Number(p.price);
    if (item.mode === 'combo') {
      if (item.comboSize === 'G') price += Number(CFG.general.comboUpgrade) || 0;
      price += CFG.comboDrinks.find((d) => d.id === item.drink)?.add || 0;
    } else if (p.sized && item.size) price += CFG.sizes.find((s) => s.id === item.size)?.add || 0;
    (item.extras || []).forEach((id) => { price += CFG.extras.find((e) => e.id === id)?.price || 0; });
    return price;
  }
  function itemName(item) {
    if (item.kind === 'offer') return offer(item.id).name;
    if (item.kind === 'reward') return reward(item.id).name;
    const p = product(item.id);
    return item.mode === 'combo' ? `Combo ${p.name}` : p.name;
  }
  function itemVisual(item) {
    if (item.kind === 'offer') return visual(offer(item.id));
    if (item.kind === 'reward') return visual(reward(item.id));
    const p = product(item.id);
    return item.mode === 'combo' ? comboVisual(p) : visual(p);
  }
  function itemDetails(item) {
    if (item.kind === 'offer') return (offer(item.id).includes || []).join(' · ');
    if (item.kind === 'reward') return `Resgate: ${reward(item.id).points * item.qty} pontos`;
    const parts = [];
    if (item.mode === 'combo') {
      parts.push(`Combo ${item.comboSize === 'G' ? 'grande' : 'médio'}`);
      parts.push(CFG.comboDrinks.find((d) => d.id === item.drink)?.name);
    } else if (item.size) parts.push(CFG.sizes.find((s) => s.id === item.size)?.name);
    (item.removed || []).forEach((r) => parts.push(`sem ${r.toLowerCase()}`));
    (item.extras || []).forEach((id) => parts.push(`+ ${(CFG.extras.find((e) => e.id === id)?.name || '').toLowerCase()}`));
    return parts.filter(Boolean).join(' · ');
  }
  const validItem = (i) => (i.kind === 'offer' ? !!offer(i.id) : i.kind === 'reward' ? !!reward(i.id) : !!product(i.id) && (i.mode !== 'combo' || !!product(i.id).combo));
  const cartCount = () => state.cart.reduce((n, i) => n + i.qty, 0);
  const subtotal = () => state.cart.reduce((s, i) => s + unitPrice(i) * i.qty, 0);
  const pointsInCart = () => state.cart.filter((i) => i.kind === 'reward').reduce((s, i) => s + reward(i.id).points * i.qty, 0);
  const availablePoints = () => state.points - pointsInCart();
  function addToCart(item) {
    const { qty, ...rest } = item;
    const key = JSON.stringify(rest);
    const existing = state.cart.find((i) => i.key === key);
    if (existing) existing.qty += qty;
    else state.cart.push({ ...item, key });
    save();
  }

  // ---------- Componentes ----------
  function appBar(title, { back = null, store: showStore = false, brand = false } = {}) {
    const s = store();
    return `
      <header class="appbar">
        ${back ? `<a class="appbar-back" href="${back}" aria-label="Voltar">${icon('back')}</a>` : ''}
        <h1 class="appbar-title">${brand ? `<span class="club-mark">${icon('flame')}</span>` : ''}${esc(title)}</h1>
      </header>
      ${showStore ? `
      <button class="storebar" type="button" data-open-store>
        <span class="storebar-pin">${icon('pin')}</span>
        <span class="grow">
          ${s ? `<span class="storebar-label">Retirar em: <b>${esc(s.name)}</b></span><span class="storebar-addr">${esc(s.address)}</span>`
              : `<span class="storebar-label"><b>Selecione um restaurante</b></span><span class="storebar-addr">Escolha onde vai retirar seu pedido</span>`}
        </span>
        ${icon('chevron')}
      </button>` : ''}`;
  }
  const sectionHead = (title, href, linkText = 'Ver tudo') => `
    <div class="sec-head">
      <h2>${icon('burger', 'sec-ic')}${esc(title)}</h2>
      ${href ? `<a class="sec-link" href="${href}">${linkText} ${icon('chevron')}</a>` : ''}
    </div>`;
  const offerCard = (o, dark = false) => `
    <a class="offer-card ${dark ? 'dark' : ''}" href="#cupom-${esc(o.id)}">
      ${o.flag ? `<span class="flag">${esc(o.flag)}</span>` : ''}
      <div class="offer-art">${visual(o)}</div>
      <h3>${esc(o.name)}</h3>
      <div class="offer-price">${money(o.price)}</div>
      <span class="earn">Ganhe ${Math.floor(o.price)} pontos ${icon('flame')}</span>
    </a>`;
  function rewardCard(r) {
    const missing = r.points - availablePoints();
    return `
      <a class="reward-card ${missing > 0 ? 'locked' : ''}" href="#recompensas">
        <span class="reward-status">${missing > 0 ? `${icon('lock')} Faltam ${missing} pts` : `${icon('check')} Disponível`}</span>
        <div class="offer-art">${visual(r)}</div>
        <h3>${esc(r.name)}</h3>
        <span class="reward-cost">${icon(missing > 0 ? 'lock' : 'flame')} ${r.points} pts${r.price ? ` + ${money(r.price)}` : ''}</span>
      </a>`;
  }
  function milestones() {
    const ms = CFG.general.milestones.map(Number).filter((n) => n > 0).sort((a, b) => a - b);
    const n = ms.length;
    const pos = (i) => ((i + 0.5) / n) * 100;
    let pct = 100;
    for (let i = 0; i < n; i++) {
      if (state.points < ms[i]) {
        const pv = i ? ms[i - 1] : 0, pp = i ? pos(i - 1) : 0;
        pct = pp + ((state.points - pv) / (ms[i] - pv)) * (pos(i) - pp);
        break;
      }
    }
    return `
      <div class="milestones" role="img" aria-label="Você tem ${state.points} pontos">
        <div class="ms-labels" style="grid-template-columns:repeat(${n},1fr)">${ms.map((m, i) => `<span>${m}${i === n - 1 ? '+' : ''} pts</span>`).join('')}</div>
        <div class="ms-track">
          <div class="ms-fill" style="width:${pct}%"></div>
          ${ms.map((m, i) => `<span class="ms-node ${state.points >= m ? 'on' : ''}" style="left:${pos(i)}%">${icon(state.points >= m ? 'check' : 'lock')}</span>`).join('')}
        </div>
      </div>`;
  }
  const emptyState = (title, text, cta, href) => `
    <div class="empty">
      <div class="empty-art">${art({ type: 'burger', layers: ['lettuce', 'cheese', 'patty'] })}</div>
      <h2>${title}</h2>
      <p class="muted">${text}</p>
      ${cta ? `<a class="btn btn-primary" href="${href}">${cta}</a>` : ''}
    </div>`;

  // ---------- Roteamento ----------
  const routes = {
    inicio: renderHome, retire: renderMenu,
    produto: (el, id) => renderProduct(el, id, 'single'), combo: (el, id) => renderProduct(el, id, 'combo'),
    cupons: renderCoupons, cupom: renderOffer, secao: renderSection,
    clube: renderClub, recompensas: renderRewards, extrato: renderStatement,
    sacola: renderCart, checkout: renderCheckout, pedido: renderOrder, pedidos: renderOrders, perfil: renderProfile,
    admin: renderAdmin,
  };
  const TAB_OF = { inicio: 'inicio', retire: 'retire', produto: 'retire', combo: 'retire', cupons: 'cupons', cupom: 'cupons', secao: 'cupons', clube: 'clube', recompensas: 'clube', extrato: 'clube' };
  const SHOW_BAG = ['inicio', 'retire', 'cupons', 'secao', 'clube', 'recompensas'];
  let currentPath = 'inicio';
  let currentHash = '';
  let timers = [];
  const clearTimers = () => { timers.forEach(clearInterval); timers = []; };

  function router() {
    clearTimers();
    const hash = location.hash.slice(1);
    const sameView = hash === currentHash;
    currentHash = hash;
    const cut = hash.indexOf('-');
    let path = cut < 0 ? hash : hash.slice(0, cut);
    const param = cut < 0 ? undefined : decodeURIComponent(hash.slice(cut + 1));
    if (!routes[path]) path = 'inicio';
    currentPath = path;
    state.cart = state.cart.filter(validItem);
    const y = window.scrollY;
    const old = $('#view');
    const main = old.cloneNode(false);
    old.replaceWith(main);
    main.dataset.page = path;
    routes[path](main, param);
    window.scrollTo(0, sameView ? y : 0);
    $$('.tabbar [data-tab]').forEach((a) => a.classList.toggle('active', a.dataset.tab === TAB_OF[path]));
    updateChrome();
  }

  function updateChrome() {
    const n = cartCount();
    $$('[data-points]').forEach((el) => { el.textContent = state.points; });
    const bag = $('#bagbar');
    const showBag = n > 0 && SHOW_BAG.includes(currentPath);
    bag.hidden = !showBag;
    if (showBag) bag.innerHTML = `<span class="bag-count">${n}</span><span class="grow">Ver sacola</span><strong>${money(subtotal())}</strong>`;
    $('#order-fab').hidden = !(currentPath === 'inicio' && n === 0);
    const pub = $('#publishbar');
    const showPub = isAdmin() && isDirty() && currentPath !== 'admin';
    pub.hidden = !showPub;
    if (showPub) {
      pub.innerHTML = `<span class="pub-dot"></span><span class="grow">${admin.mode === 'artifact' ? 'Alterações não publicadas' : 'Alterações não salvas'}</span>
        ${currentPath !== 'admin' ? '<a class="btn btn-sm btn-light" href="#admin">Painel</a>' : ''}
        <button class="btn btn-sm btn-gold" type="button" id="pub-now">${admin.mode === 'artifact' ? 'Publicar' : 'Salvar'}</button>`;
      $('#pub-now').onclick = publishConfig;
    }
  }

  // ---------- Telas do cliente ----------
  function renderHome(el) {
    const s = store();
    const featured = visibleOffers().filter((o) => o.section === CFG.home.featuredSection);
    const big = offer(CFG.home.heroOfferId);
    const logo = safeImg(CFG.brand.logo);
    const cents = (v) => Number(v).toFixed(2).split('.')[1];
    el.innerHTML = `
      <header class="homebar">
        ${logo ? `<img class="brand-logo" src="${esc(logo)}" alt="${esc(fullBrand())}">` : ''}
        <p class="hello">Oi${firstName() ? `, <span>${esc(firstName())}</span>` : ''}!</p>
        <a class="points-pill" href="#clube" aria-label="Seus pontos">${icon('flame')}<span data-points>${state.points}</span></a>
        ${isAdmin() ? `<a class="icon-btn" href="#admin" aria-label="Administrador">${icon('gear')}</a>` : ''}
        <button class="icon-btn" type="button" data-open-drawer aria-label="Abrir menu">${icon('menu')}</button>
      </header>
      <div class="where">
        ${icon('pin', 'where-pin')}
        <span class="where-q">${s ? 'Retirar em' : 'Onde vamos?'}</span>
        <button class="btn btn-outline btn-sm" type="button" data-open-store>${s ? esc(s.name) : 'Selecione um restaurante'}</button>
      </div>
      ${CFG.banners.length ? `
      <section class="carousel" aria-label="Destaques">
        <div class="slides" id="slides">
          ${CFG.banners.map((b) => `
            <a class="banner tone-${esc(b.tone || 'night')}" ${linkAttrs(b.link)} aria-label="${esc(b.title)}">
              <div class="banner-copy">
                <h2>${esc(b.title)}</h2>
                <p>${esc(b.text)}</p>
                ${b.cta ? `<span class="btn btn-primary btn-sm">${esc(b.cta)}</span>` : ''}
              </div>
              <div class="banner-art">${visual(b)}</div>
            </a>`).join('')}
        </div>
        <div class="dots">${CFG.banners.map((_, i) => `<button type="button" aria-label="Banner ${i + 1}" data-dot="${i}" class="${i === 0 ? 'on' : ''}"></button>`).join('')}</div>
      </section>` : ''}
      ${big ? `
      <a class="hero-offer" href="#cupom-${esc(big.id)}">
        <div class="hero-offer-top">
          <div class="hero-offer-copy">
            <span class="hero-kicker">${esc(CFG.offerSections.find((x) => x.id === big.section)?.name || 'Oferta')}</span>
            <div class="hero-price"><small>R$</small><b>${Math.floor(big.price)}</b><sup>,${cents(big.price)}</sup></div>
            <span class="btn btn-primary btn-sm">Eu quero</span>
          </div>
          <div class="hero-offer-art">${visual(big)}</div>
        </div>
        <div class="hero-offer-body">
          <h2>${esc(CFG.home.heroTitle || big.name)}</h2>
          <p class="muted">${esc(CFG.home.heroText)}</p>
        </div>
      </a>` : ''}
      ${featured.length ? `
      <section>
        <div class="sec-head"><h2>${icon('flame', 'sec-ic')}${esc(CFG.home.featuredTitle)}</h2></div>
        <div class="hscroll">
          ${featured.map((o) => `
            <a class="wide-offer" href="#cupom-${esc(o.id)}">
              <div class="wide-copy">
                <span class="earn-badge">Ganhe<br><b>${Math.floor(o.price)}</b><br>pontos</span>
                <span class="btn btn-primary btn-sm">Peça agora</span>
              </div>
              <div class="wide-art">${visual(o)}</div>
              <div class="wide-price"><small>R$</small><b>${Math.floor(o.price)}</b><sup>,${cents(o.price)}</sup><span>${esc(o.name)}</span></div>
            </a>`).join('')}
        </div>
      </section>` : ''}
      ${CFG.rewards.length ? `
      <section>
        ${sectionHead('Recompensas', '#recompensas', 'Todas')}
        <div class="card">${milestones()}</div>
        <div class="hscroll">${CFG.rewards.map(rewardCard).join('')}</div>
      </section>` : ''}`;

    const slides = $('#slides', el);
    if (slides) {
      const dots = $$('[data-dot]', el);
      let idx = 0;
      const count = CFG.banners.length;
      const go = (i) => { idx = (i + count) % count; slides.scrollTo({ left: slides.clientWidth * idx, behavior: 'smooth' }); };
      slides.addEventListener('scroll', () => {
        idx = Math.round(slides.scrollLeft / slides.clientWidth);
        dots.forEach((d, j) => d.classList.toggle('on', j === idx));
      }, { passive: true });
      dots.forEach((d) => d.addEventListener('click', () => go(Number(d.dataset.dot))));
      if (count > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timers.push(setInterval(() => { if (!document.hidden && !$('.modal.open')) go(idx + 1); }, 5000));
      }
    }
    maybeShowPromo();
  }

  function renderMenu(el, tab) {
    const cats = CFG.categories;
    if (!cats.some((t) => t.id === tab)) tab = cats[0]?.id;
    const items = visibleProducts().filter((p) => (p.cats || []).includes(tab));
    el.innerHTML = `
      ${appBar('Peça & Retire', { store: true })}
      <nav class="tabs-band" aria-label="Categorias">
        <div class="tabs-scroll">
          ${cats.map((t) => `<a class="tab-chip ${t.id === tab ? 'active' : ''}" href="#retire-${esc(t.id)}">${esc(t.name)}</a>`).join('')}
        </div>
      </nav>
      ${items.length ? `<div class="menu-grid">
        ${items.map((p) => `
          <article class="menu-card">
            <a class="menu-art" href="#produto-${esc(p.id)}" aria-label="${esc(p.name)}">
              ${p.badge ? `<span class="badge-new">${esc(p.badge)}</span>` : ''}
              ${visual(p)}
            </a>
            <div class="menu-body">
              <h3><a href="#produto-${esc(p.id)}">${esc(p.name)}</a></h3>
              <p class="clamp">${esc(p.desc)}</p>
            </div>
            <div class="menu-prices ${p.combo ? '' : 'single'}">
              <a href="#produto-${esc(p.id)}"><span>Individual</span><b>${money(p.price)}</b></a>
              ${p.combo ? `<a href="#combo-${esc(p.id)}"><span>Combo</span><b>${money(p.combo)}</b></a>` : ''}
            </div>
          </article>`).join('')}
      </div>` : emptyState('Nada por aqui ainda', 'Esta categoria ainda não tem produtos.', '', '')}`;
    $('.tab-chip.active', el)?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  const qtyStepper = () => `
    <div class="stepper" role="group" aria-label="Quantidade">
      <button type="button" data-step="-1" aria-label="Diminuir">−</button>
      <output id="qty">1</output>
      <button type="button" data-step="1" aria-label="Aumentar">+</button>
    </div>`;
  const bindStepper = (el, fn) => $$('[data-step]', el).forEach((b) => b.addEventListener('click', () => fn(Number(b.dataset.step))));

  function renderProduct(el, id, startMode) {
    const p = product(id);
    if (!p) { el.innerHTML = appBar('Produto', { back: '#retire' }) + emptyState('Produto não encontrado', 'Esse item saiu do cardápio.', 'Voltar ao cardápio', '#retire'); return; }
    const sizes = CFG.sizes;
    const drinks = CFG.comboDrinks;
    const sel = { qty: 1, mode: p.combo ? startMode : 'single', size: p.sized && sizes.length ? (sizes[1] || sizes[0]).id : null, comboSize: 'M', drink: drinks[0]?.id || null, removed: new Set(), extras: new Set() };
    const backTab = (p.cats || [])[0] || '';
    const up = Number(CFG.general.comboUpgrade) || 0;
    el.innerHTML = `
      ${appBar(p.name, { back: `#retire-${esc(backTab)}` })}
      <div class="detail-art">${p.badge ? `<span class="badge-new">${esc(p.badge)}</span>` : ''}<div id="detail-art"></div></div>
      <div class="detail-head">
        <h2>${esc(p.name)}</h2>
        <p class="muted">${esc(p.desc)}</p>
        ${p.kcal ? `<p class="kcal">${esc(p.kcal)} kcal · ganhe 1 ponto a cada R$ 1</p>` : ''}
      </div>
      <form id="pform" class="stack">
        ${p.combo ? `
        <div class="segmented" role="radiogroup" aria-label="Individual ou combo">
          <label><input type="radio" name="mode" value="single" ${sel.mode === 'single' ? 'checked' : ''}><span>Individual<small>${money(p.price)}</small></span></label>
          <label><input type="radio" name="mode" value="combo" ${sel.mode === 'combo' ? 'checked' : ''}><span>Combo<small>${money(p.combo)}</small></span></label>
        </div>
        <fieldset class="opt-group" id="combo-opts">
          <legend>Tamanho do combo <small>batata + bebida</small></legend>
          <label class="opt"><input type="radio" name="comboSize" value="M" checked><span>Médio</span><span class="muted">incluso</span></label>
          ${up ? `<label class="opt"><input type="radio" name="comboSize" value="G"><span>Grande</span><span class="muted">+ ${money(up)}</span></label>` : ''}
        </fieldset>
        ${drinks.length ? `<fieldset class="opt-group" id="drink-opts">
          <legend>Bebida do combo</legend>
          ${drinks.map((d, i) => `<label class="opt"><input type="radio" name="drink" value="${esc(d.id)}" ${i === 0 ? 'checked' : ''}><span>${esc(d.name)}</span><span class="muted">${d.add ? '+ ' + money(d.add) : 'incluso'}</span></label>`).join('')}
        </fieldset>` : ''}` : ''}
        ${p.sized && sizes.length ? `
        <fieldset class="opt-group" id="size-opts">
          <legend>Tamanho</legend>
          ${sizes.map((s) => `<label class="opt"><input type="radio" name="size" value="${esc(s.id)}" ${s.id === sel.size ? 'checked' : ''}><span>${esc(s.name)}</span><span class="muted">${s.add ? '+ ' + money(s.add) : 'incluso'}</span></label>`).join('')}
        </fieldset>` : ''}
        ${(p.ingredients || []).length ? `
        <fieldset class="opt-group">
          <legend>Ingredientes <small>desmarque para remover</small></legend>
          ${p.ingredients.map((ing) => `<label class="opt"><input type="checkbox" name="ing" value="${esc(ing)}" checked><span>${esc(ing)}</span></label>`).join('')}
        </fieldset>` : ''}
        ${p.allowExtras && CFG.extras.length ? `
        <fieldset class="opt-group">
          <legend>Turbine seu lanche</legend>
          ${CFG.extras.map((x) => `<label class="opt"><input type="checkbox" name="extra" value="${esc(x.id)}"><span>${esc(x.name)}</span><span class="muted">+ ${money(x.price)}</span></label>`).join('')}
        </fieldset>` : ''}
      </form>
      <div class="action-bar">
        ${qtyStepper()}
        <button class="btn btn-primary grow" id="add" type="button">Adicionar <span id="line-total"></span></button>
      </div>`;
    const drinkArt = (d) => (d === 'suco' ? 'juice' : d === 'agua' ? 'water' : 'drink');
    const refresh = () => {
      const isCombo = sel.mode === 'combo';
      if ($('#combo-opts', el)) $('#combo-opts', el).hidden = !isCombo;
      if ($('#drink-opts', el)) $('#drink-opts', el).hidden = !isCombo;
      if ($('#size-opts', el)) $('#size-opts', el).hidden = isCombo;
      $('#detail-art', el).innerHTML = isCombo ? comboVisual(p, drinkArt(sel.drink)) : visual(p);
      $('#qty', el).textContent = sel.qty;
      const item = { kind: 'product', id: p.id, mode: sel.mode, size: sel.size, comboSize: sel.comboSize, drink: sel.drink, extras: [...sel.extras] };
      $('#line-total', el).textContent = money(unitPrice(item) * sel.qty);
    };
    $('#pform', el).addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'mode') sel.mode = t.value;
      if (t.name === 'size') sel.size = t.value;
      if (t.name === 'comboSize') sel.comboSize = t.value;
      if (t.name === 'drink') sel.drink = t.value;
      if (t.name === 'ing') t.checked ? sel.removed.delete(t.value) : sel.removed.add(t.value);
      if (t.name === 'extra') t.checked ? sel.extras.add(t.value) : sel.extras.delete(t.value);
      refresh();
    });
    bindStepper(el, (d) => { sel.qty = Math.min(20, Math.max(1, sel.qty + d)); refresh(); });
    $('#add', el).addEventListener('click', () => {
      const combo = sel.mode === 'combo';
      addToCart({
        kind: 'product', id: p.id, mode: sel.mode, qty: sel.qty,
        size: combo ? null : sel.size, comboSize: combo ? sel.comboSize : null, drink: combo ? sel.drink : null,
        removed: [...sel.removed].sort(), extras: [...sel.extras].sort(),
      });
      toast(`${combo ? 'Combo ' : ''}${p.name} na sacola`);
      location.hash = `#retire-${backTab}`;
    });
    refresh();
  }

  function renderOffer(el, id) {
    const o = offer(id);
    if (!o) { el.innerHTML = appBar('Cupom', { back: '#cupons' }) + emptyState('Cupom não encontrado', 'Essa oferta já acabou.', 'Ver cupons', '#cupons'); return; }
    const sec = CFG.offerSections.find((s) => s.id === o.section) || { name: 'Cupom' };
    let qty = 1;
    el.innerHTML = `
      ${appBar('Cupom', { back: '#cupons' })}
      <div class="detail-art ${sec.dark ? 'dark' : ''}">${o.flag ? `<span class="badge-new">${esc(o.flag)}</span>` : ''}${visual(o)}</div>
      <div class="detail-head">
        <p class="eyebrow">${esc(sec.name)}</p>
        <h2>${esc(o.name)}</h2>
        <div class="offer-big-price">${money(o.price)}</div>
        <span class="earn">Ganhe ${Math.floor(o.price)} pontos ${icon('flame')}</span>
      </div>
      <div class="card">
        <h3 class="card-title">O que vem</h3>
        <ul class="includes">${(o.includes || []).map((i) => `<li>${icon('check')}${esc(i)}</li>`).join('')}</ul>
        ${o.drive ? `<p class="note">${icon('info')} Válido só para retirada no drive-thru.</p>` : ''}
        <p class="note">${icon('info')} Oferta por tempo limitado, enquanto durarem os estoques.</p>
      </div>
      <div class="action-bar">
        ${qtyStepper()}
        <button class="btn btn-primary grow" id="add" type="button">Adicionar <span id="line-total">${money(o.price)}</span></button>
      </div>`;
    bindStepper(el, (d) => { qty = Math.min(10, Math.max(1, qty + d)); $('#qty', el).textContent = qty; $('#line-total', el).textContent = money(o.price * qty); });
    $('#add', el).addEventListener('click', () => { addToCart({ kind: 'offer', id: o.id, qty }); toast(`${o.name} na sacola`); location.hash = '#cupons'; });
  }

  function renderCoupons(el) {
    el.innerHTML = `
      ${appBar('Cupons', { store: true })}
      ${CFG.offerSections.map((s) => {
        const list = visibleOffers().filter((o) => o.section === s.id);
        if (!list.length) return '';
        return `<section>${sectionHead(s.name, `#secao-${esc(s.id)}`)}<div class="hscroll">${list.map((o) => offerCard(o, s.dark)).join('')}</div></section>`;
      }).join('')}
      ${CFG.rewards.length ? `
      <section>
        <div class="sec-head points-head">
          <span class="my-points"><small>Meus</small><b data-points>${state.points}</b><small>pontos</small></span>
          <h2>${icon('flame', 'sec-ic')}Use seus pontos</h2>
          <a class="sec-link" href="#recompensas">Ver todas ${icon('chevron')}</a>
        </div>
        <div class="hscroll">
          ${CFG.rewards.map((r) => `
            <a class="offer-card" href="#recompensas">
              <div class="offer-art">${visual(r)}</div>
              <h3>${esc(r.name)}</h3>
              <div class="offer-price">${r.price ? `${money(r.price)} + ` : ''}${r.points} pts</div>
              ${r.price ? `<span class="earn">Ganhe ${Math.floor(r.price)} pontos ${icon('flame')}</span>` : ''}
            </a>`).join('')}
        </div>
      </section>` : ''}`;
  }

  function renderSection(el, id) {
    const s = CFG.offerSections.find((x) => x.id === id);
    if (!s) { location.hash = '#cupons'; return; }
    el.innerHTML = `${appBar(s.name, { back: '#cupons', store: true })}
      <div class="offer-grid">${visibleOffers().filter((o) => o.section === id).map((o) => offerCard(o, s.dark)).join('')}</div>`;
  }

  function memberCodeArt() {
    let h = 0;
    for (const c of state.memberCode) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const inFinder = (x, y) => (x < 4 && y < 4) || (x > 6 && y < 4) || (x < 4 && y > 6);
    let cells = '';
    for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      if (!inFinder(x, y) && (h >>> 16) & 1) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="3" height="3"/><rect x="${x + 0.5}" y="${y + 0.5}" width="2" height="2" class="qr-hole"/><rect x="${x + 1}" y="${y + 1}" width="1" height="1"/>`;
    return `<svg viewBox="-0.5 -0.5 12 12" class="member-qr" aria-hidden="true"><g fill="currentColor">${cells}${finder(0, 0)}${finder(8, 0)}${finder(0, 8)}</g></svg>`;
  }

  function renderClub(el) {
    el.innerHTML = `
      ${appBar(CFG.brand.club, { brand: true })}
      <div class="club-sheet">
        <div class="member">
          <div class="member-code">${memberCodeArt()}</div>
          <div class="grow">
            <p class="muted small">Pontuações e recompensas de:</p>
            <p class="member-name">${esc(state.name || 'Visitante')}</p>
            <p class="muted small">Código de membro <code>${esc(state.memberCode)}</code></p>
          </div>
        </div>
        <div class="club-points"><p><b data-points>${state.points}</b> pontos</p><a class="btn btn-outline" href="#extrato">Extrato</a></div>
        <p class="notice">${icon('info')} Seus pontos entram assim que o pedido é feito. Confira tudo no extrato.</p>
        ${milestones()}
        <a class="btn btn-primary block" href="#recompensas">Ver recompensas</a>
      </div>
      ${CFG.rewards.length ? `
      <section class="club-highlights">
        <h2 class="speech">Destaques</h2>
        <div class="hscroll">
          ${CFG.rewards.slice().sort((a, b) => b.points - a.points).map((r) => `
            <a class="highlight-card" href="#recompensas">
              <div class="offer-art">${visual(r)}</div>
              <h3>${esc(r.name)}</h3>
              <span class="hl-pts">${r.points} pontos${r.price ? ` + ${money(r.price)}` : ''}</span>
            </a>`).join('')}
        </div>
      </section>` : ''}
      <section class="card how">
        <h2 class="card-title">Como funciona</h2>
        <ol>
          <li><b>Peça pelo app</b> e retire no restaurante.</li>
          <li><b>Ganhe 1 ponto</b> a cada R$ 1 gasto.</li>
          <li><b>Troque seus pontos</b> por lanches e sobremesas.</li>
        </ol>
      </section>`;
  }

  function renderRewards(el) {
    el.innerHTML = `
      ${appBar('Recompensas', { back: '#clube' })}
      <div class="card"><p class="small muted">Você tem</p><p class="club-points-inline"><b data-points>${state.points}</b> pontos${pointsInCart() ? ` <span class="muted small">(${pointsInCart()} reservados na sacola)</span>` : ''}</p>${milestones()}</div>
      <div class="reward-list">
        ${CFG.rewards.map((r) => {
          const ok = availablePoints() >= r.points;
          return `
          <div class="card reward-row">
            <div class="thumb">${visual(r)}</div>
            <div class="grow">
              <h3>${esc(r.name)}</h3>
              <p class="small muted">${r.points} pontos${r.price ? ` + ${money(r.price)}` : ''}</p>
              ${ok ? '' : `<p class="small lock-note">${icon('lock')} Faltam ${r.points - availablePoints()} pts</p>`}
            </div>
            <button class="btn ${ok ? 'btn-primary' : 'btn-outline'} btn-sm" type="button" data-reward="${esc(r.id)}" ${ok ? '' : 'disabled'}>Resgatar</button>
          </div>`;
        }).join('')}
      </div>`;
    $$('[data-reward]', el).forEach((b) => b.addEventListener('click', () => {
      const r = reward(b.dataset.reward);
      if (availablePoints() < r.points) { toast('Pontos insuficientes'); return; }
      addToCart({ kind: 'reward', id: r.id, qty: 1 });
      toast(`${r.name} na sacola`);
      router();
    }));
  }

  function renderStatement(el) {
    el.innerHTML = `
      ${appBar('Extrato', { back: '#clube' })}
      <div class="card"><p class="small muted">Saldo atual</p><p class="club-points-inline"><b data-points>${state.points}</b> pontos</p></div>
      <ul class="statement">
        ${state.history.slice().reverse().map((h) => `
          <li class="card">
            <div class="grow"><p>${esc(h.desc)}</p><p class="small muted">${new Date(h.t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p></div>
            <b class="${h.pts >= 0 ? 'plus' : 'minus'}">${h.pts >= 0 ? '+' : '−'}${Math.abs(h.pts)}</b>
          </li>`).join('')}
      </ul>`;
  }

  function renderCart(el) {
    if (!state.cart.length) {
      el.innerHTML = appBar('Sacola', { back: '#retire' }) + emptyState('Sua sacola está vazia', 'Escolha um lanche no cardápio ou aproveite um cupom.', 'Ver cardápio', '#retire');
      return;
    }
    const sub = subtotal();
    el.innerHTML = `
      ${appBar('Sacola', { back: '#retire', store: true })}
      <ul class="cart-list">
        ${state.cart.map((i, idx) => `
          <li class="card cart-item">
            <div class="thumb">${itemVisual(i)}</div>
            <div class="grow">
              <h3>${esc(itemName(i))}</h3>
              <p class="small muted">${esc(itemDetails(i))}</p>
              <div class="row-between">
                <strong>${unitPrice(i) ? money(unitPrice(i) * i.qty) : 'Grátis'}</strong>
                <div class="stepper small" role="group" aria-label="Quantidade de ${esc(itemName(i))}">
                  <button type="button" data-idx="${idx}" data-d="-1" aria-label="${i.qty === 1 ? 'Remover' : 'Diminuir'}">${i.qty === 1 ? icon('close') : '−'}</button>
                  <output>${i.qty}</output>
                  <button type="button" data-idx="${idx}" data-d="1" aria-label="Aumentar">+</button>
                </div>
              </div>
            </div>
          </li>`).join('')}
      </ul>
      <div class="card summary">
        <div class="row-between"><span>Subtotal</span><span>${money(sub)}</span></div>
        ${pointsInCart() ? `<div class="row-between"><span>Pontos usados</span><span>${pointsInCart()} pts</span></div>` : ''}
        <div class="row-between total"><span>Total</span><span>${money(sub)}</span></div>
        <p class="small earn-line">${icon('flame')} Você ganha <b>${Math.floor(sub)} pontos</b> com este pedido</p>
      </div>
      <div class="action-bar">
        <a class="btn btn-outline" href="#retire">Adicionar mais</a>
        <a class="btn btn-primary grow" href="#checkout">Continuar</a>
      </div>`;
    $$('[data-idx]', el).forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.idx);
      const item = state.cart[i];
      const d = Number(b.dataset.d);
      if (d > 0 && item.kind === 'reward' && availablePoints() < reward(item.id).points) { toast('Pontos insuficientes'); return; }
      item.qty += d;
      if (item.qty <= 0) state.cart.splice(i, 1);
      save(); router();
    }));
  }

  function renderCheckout(el) {
    if (!state.cart.length) { location.hash = '#sacola'; return; }
    const sub = subtotal();
    const needsDrive = state.cart.some((i) => i.kind === 'offer' && offer(i.id).drive);
    el.innerHTML = `
      ${appBar('Finalizar pedido', { back: '#sacola', store: true })}
      <form id="checkout" class="stack" novalidate>
        <fieldset class="card form-card">
          <legend>Como vai retirar?</legend>
          <div class="segmented">
            <label><input type="radio" name="mode" value="balcao" ${needsDrive ? '' : 'checked'}><span>No balcão</span></label>
            <label><input type="radio" name="mode" value="drive" ${needsDrive ? 'checked' : ''}><span>No drive-thru</span></label>
          </div>
          <p class="small muted" id="mode-hint"></p>
        </fieldset>
        <fieldset class="card form-card">
          <legend>Seus dados</legend>
          <label for="f-name">Nome para chamar no pedido</label>
          <input id="f-name" name="name" value="${esc(state.name)}" autocomplete="name" placeholder="Seu nome">
        </fieldset>
        <fieldset class="card form-card">
          <legend>Pagamento</legend>
          <label class="opt"><input type="radio" name="pay" value="Pix" checked><span>Pix</span></label>
          <label class="opt"><input type="radio" name="pay" value="Cartão na retirada"><span>Cartão na retirada</span></label>
          <label class="opt"><input type="radio" name="pay" value="Dinheiro na retirada"><span>Dinheiro na retirada</span></label>
        </fieldset>
        <div class="card summary">
          ${state.cart.map((i) => `<div class="row-between small"><span>${i.qty}× ${esc(itemName(i))}</span><span>${unitPrice(i) ? money(unitPrice(i) * i.qty) : 'Grátis'}</span></div>`).join('')}
          <div class="row-between total"><span>Total</span><span>${money(sub)}</span></div>
          <p class="small earn-line">${icon('flame')} Você ganha <b>${Math.floor(sub)} pontos</b>${pointsInCart() ? ` e usa ${pointsInCart()} pontos` : ''}</p>
        </div>
        <p class="small muted center">App de demonstração: nenhum pedido real é enviado e nenhum pagamento é cobrado.</p>
      </form>
      <div class="action-bar">
        <button class="btn btn-primary grow" type="submit" form="checkout">Fazer pedido · ${money(sub)}</button>
      </div>`;
    const form = $('#checkout', el);
    const hint = () => {
      const s = store();
      $('#mode-hint', el).textContent = form.mode.value === 'drive'
        ? (s && !s.drive ? 'Este restaurante não tem drive-thru. Troque o restaurante ou retire no balcão.' : 'Informe seu nome no alto-falante do drive.')
        : (needsDrive ? 'Sua sacola tem oferta válida só no drive-thru.' : 'Acompanhe a senha na tela do restaurante.');
    };
    form.addEventListener('change', hint);
    hint();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = store();
      const mode = form.mode.value;
      const name = form.name.value.trim();
      if (!s) { toast('Selecione o restaurante de retirada'); openStorePicker(); return; }
      if (!name) { form.name.classList.add('invalid'); form.name.focus(); toast('Informe seu nome'); return; }
      if (mode === 'drive' && !s.drive) { toast('Este restaurante não tem drive-thru'); return; }
      if (mode === 'balcao' && needsDrive) { toast('Há uma oferta só para drive-thru na sacola'); return; }
      state.name = name;
      const earned = Math.floor(sub);
      const spent = pointsInCart();
      const order = {
        id: uid(), code: String(100 + Math.floor(Math.random() * 900)), createdAt: Date.now(),
        items: state.cart.map((i) => ({ name: itemName(i), qty: i.qty, details: itemDetails(i), total: unitPrice(i) * i.qty, raw: i })),
        total: sub, store: { name: s.name, address: s.address }, mode, name, payment: form.pay.value, earned, spent,
      };
      state.points = state.points - spent + earned;
      if (spent) state.history.push({ t: Date.now(), desc: `Resgate no pedido #${order.id}`, pts: -spent });
      state.history.push({ t: Date.now(), desc: `Pedido #${order.id}`, pts: earned });
      state.orders.unshift(order);
      state.cart = [];
      save();
      location.hash = `#pedido-${order.id}`;
    });
  }

  function orderStatus(o) {
    const secs = (Date.now() - o.createdAt) / 1000;
    const steps = [['Pedido recebido', 0], ['Preparando no fogo', 15], [o.mode === 'drive' ? 'Pronto, siga para o drive' : 'Pronto para retirada', 45], ['Retirado', 90]];
    let current = 0;
    steps.forEach((s, i) => { if (secs >= s[1]) current = i; });
    return { steps, current, done: current === steps.length - 1 };
  }

  function renderOrder(el, id) {
    const o = state.orders.find((x) => x.id === id);
    if (!o) { el.innerHTML = appBar('Pedido', { back: '#pedidos' }) + emptyState('Pedido não encontrado', '', 'Meus pedidos', '#pedidos'); return; }
    const draw = () => {
      const { steps, current, done } = orderStatus(o);
      el.innerHTML = `
        ${appBar(`Pedido #${o.id}`, { back: '#pedidos' })}
        <div class="ticket ${done ? 'done' : ''}">
          <p class="ticket-label">${o.mode === 'drive' ? 'Drive-thru' : 'Sua senha'}</p>
          <p class="ticket-code">${esc(o.mode === 'drive' ? (o.name || o.code) : o.code)}</p>
          <p class="ticket-status">${steps[current][0]}</p>
          <p class="small">${done ? `Bom apetite! Você ganhou ${o.earned} pontos.` : `${esc(o.store.name)} · ${o.mode === 'drive' ? 'drive-thru' : 'balcão'}`}</p>
        </div>
        <ol class="timeline" aria-label="Status do pedido">
          ${steps.map((s, i) => `<li class="${i < current ? 'past' : i === current ? 'current' : ''}"><span class="dot"></span>${s[0]}</li>`).join('')}
        </ol>
        <div class="card">
          <h3 class="card-title">Retirar em</h3>
          <p><b>${esc(o.store.name)}</b><br><span class="muted small">${esc(o.store.address)}</span></p>
          <h3 class="card-title">Pagamento</h3>
          <p>${esc(o.payment)}</p>
        </div>
        <div class="card summary">
          ${o.items.map((i) => `<div class="row-between"><span>${i.qty}× ${esc(i.name)}${i.details ? `<br><small class="muted">${esc(i.details)}</small>` : ''}</span><span>${i.total ? money(i.total) : 'Grátis'}</span></div>`).join('')}
          <div class="row-between total"><span>Total</span><span>${money(o.total)}</span></div>
          <p class="small earn-line">${icon('flame')} +${o.earned} pontos${o.spent ? ` · −${o.spent} pontos resgatados` : ''}</p>
        </div>
        ${done ? `<button class="btn btn-primary block" id="reorder" type="button">Pedir de novo</button>` : ''}`;
      $('#reorder', el)?.addEventListener('click', () => {
        let added = 0;
        o.items.forEach((i) => { if (i.raw && i.raw.kind !== 'reward' && validItem(i.raw)) { const { key, ...rest } = i.raw; addToCart(rest); added++; } });
        toast(added ? 'Itens adicionados à sacola' : 'Esses itens não estão mais disponíveis');
        location.hash = '#sacola';
      });
      if (done) clearTimers();
    };
    draw();
    timers.push(setInterval(draw, 3000));
  }

  function renderOrders(el) {
    if (!state.orders.length) {
      el.innerHTML = appBar('Meus pedidos', { back: '#inicio' }) + emptyState('Nenhum pedido ainda', 'Seus pedidos aparecem aqui para você acompanhar.', 'Fazer meu primeiro pedido', '#retire');
      return;
    }
    el.innerHTML = `
      ${appBar('Meus pedidos', { back: '#inicio' })}
      <ul class="order-list">
        ${state.orders.map((o) => {
          const { steps, current, done } = orderStatus(o);
          return `
          <li><a class="card order-card" href="#pedido-${o.id}">
            <div class="row-between"><strong>#${o.id}</strong><span class="status ${done ? 'done' : 'live'}">${steps[current][0]}</span></div>
            <p class="small muted">${new Date(o.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · ${esc(o.store.name)}</p>
            <p class="small">${o.items.map((i) => `${i.qty}× ${esc(i.name)}`).join(', ')}</p>
            <strong>${money(o.total)}</strong>
          </a></li>`;
        }).join('')}
      </ul>`;
  }

  function renderProfile(el) {
    el.innerHTML = `
      ${appBar('Meus dados', { back: '#inicio', store: true })}
      <form id="profile" class="card form-card">
        <label for="p-name">Nome</label>
        <input id="p-name" name="name" value="${esc(state.name)}" autocomplete="name" placeholder="Como podemos te chamar?">
        <button class="btn btn-primary" type="submit">Salvar</button>
      </form>
      <div class="card"><h3 class="card-title">Código de membro</h3><p><code>${esc(state.memberCode)}</code></p></div>`;
    $('#profile', el).addEventListener('submit', (e) => { e.preventDefault(); state.name = e.target.name.value.trim(); save(); toast('Dados salvos'); });
  }

  // ---------- Janelas ----------
  function openModal(id) { const m = $(id); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
  function closeModal(el) { if (!el) return; el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-close]');
    if (t) closeModal(t.closest('.modal'));
    if (e.target.classList && e.target.classList.contains('modal')) closeModal(e.target);
    if (e.target.closest('[data-open-store]')) openStorePicker();
    if (e.target.closest('[data-open-drawer]')) openDrawer();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal.open').forEach(closeModal); });

  function openStorePicker() {
    const list = $('#store-list');
    list.innerHTML = CFG.stores.length ? CFG.stores.map((s) => `
      <label class="opt store-opt">
        <input type="radio" name="store" value="${esc(s.id)}" ${s.id === state.storeId ? 'checked' : ''}>
        <span><b>${esc(s.name)}</b><small>${esc(s.address)}</small></span>
        ${s.drive ? '<span class="pill">Drive-thru</span>' : ''}
      </label>`).join('') : '<p class="muted">Nenhum restaurante cadastrado.</p>';
    list.onchange = (e) => {
      state.storeId = e.target.value;
      save();
      closeModal($('#store-modal'));
      toast(`Retirar em ${store().name}`);
      router();
    };
    openModal('#store-modal');
  }

  function openDrawer() {
    const d = $('#drawer-body');
    d.innerHTML = `
      <p class="drawer-hello">Oi${firstName() ? `, ${esc(firstName())}` : ''}!</p>
      <nav class="drawer-nav">
        <a href="#pedidos" data-close>Meus pedidos ${icon('chevron')}</a>
        <a href="#perfil" data-close>Meus dados ${icon('chevron')}</a>
        <a href="#extrato" data-close>Extrato de pontos ${icon('chevron')}</a>
        <button type="button" data-close data-open-store>Restaurante ${icon('chevron')}</button>
        <button type="button" id="replay-intro">Ver apresentação ${icon('chevron')}</button>
        <a ${linkAttrs(CFG.general.ifoodUrl)}>Delivery pelo iFood ${icon('chevron')}</a>
        ${isAdmin() || admin.mode === 'local' ? `<a href="#admin" data-close class="drawer-admin">${icon('gear')} Administrador ${icon('chevron')}</a>` : ''}
      </nav>
      <button class="btn btn-ghost-danger" type="button" id="reset">Apagar meus dados</button>
      <p class="small muted">${esc(fullBrand())}</p>`;
    $('#replay-intro').onclick = () => { closeModal($('#drawer')); showOnboarding(); };
    const reset = $('#reset');
    reset.onclick = () => {
      if (reset.dataset.armed) { state = defaultState(); save(); closeModal($('#drawer')); location.hash = '#inicio'; router(); showOnboarding(); }
      else { reset.dataset.armed = '1'; reset.textContent = 'Toque de novo para confirmar'; }
    };
    openModal('#drawer');
  }

  let promoShownThisSession = false;
  function renderPromo() {
    const p = CFG.promo;
    $('#promo-card').innerHTML = `
      <button class="promo-close" type="button" data-close aria-label="Fechar">${icon('close')}</button>
      <p class="promo-title">${esc(p.title)}</p>
      ${p.pill ? `<span class="promo-pill">${esc(p.pill)}</span>` : ''}
      <div class="promo-main">
        <div class="promo-art">${visual(p)}</div>
        <div class="promo-side">
          ${p.off ? `<span class="promo-off"><b>${esc(p.off)}</b><small>OFF</small></span>` : ''}
          <p>${esc(p.text)}</p>
        </div>
      </div>
      ${p.save ? `<p class="promo-save">${esc(p.save)}</p>` : ''}
      <div class="promo-actions">
        ${p.b1Label ? `<a class="btn btn-light" data-close ${linkAttrs(p.b1Link)}>${esc(p.b1Label)}</a>` : ''}
        ${p.b2Label ? `<a class="btn btn-gold" data-close ${linkAttrs(p.b2Link)}>${esc(p.b2Label)}</a>` : ''}
      </div>
      ${p.foot ? `<p class="promo-foot">${esc(p.foot)}</p>` : ''}`;
  }
  function maybeShowPromo() {
    if (!state.onboarded || promoShownThisSession || !CFG.promo.enabled) return;
    try { if (sessionStorage.getItem('brasa-promo')) return; sessionStorage.setItem('brasa-promo', '1'); } catch (e) { /* ignora */ }
    promoShownThisSession = true;
    renderPromo();
    setTimeout(() => openModal('#promo'), 600);
  }

  function showOnboarding() {
    const ob = $('#onboarding');
    let slide = 0;
    const total = 3;
    $$('[data-brand-full]').forEach((e) => { e.textContent = fullBrand() + '!'; });
    $$('[data-welcome-points]').forEach((e) => { e.textContent = CFG.general.welcomePoints; });
    const go = (i) => {
      slide = i;
      $$('.ob-slide', ob).forEach((s, j) => { s.hidden = j !== i; });
      $$('.ob-dots span', ob).forEach((d, j) => d.classList.toggle('on', j === i));
      $('#ob-next').textContent = i === total - 1 ? 'Começar' : 'Saiba mais';
    };
    $('#ob-art-1').innerHTML = art(ART.combo);
    $('#ob-art-2').innerHTML = art({ type: 'group', items: [{ type: 'drink' }, ART.duplo] });
    $('#ob-art-3').innerHTML = art(ART.casquinha);
    $('#ob-name').value = state.name;
    const finish = () => {
      const n = $('#ob-name').value.trim();
      if (n) state.name = n;
      state.onboarded = true;
      save();
      ob.hidden = true;
      document.body.classList.remove('locked');
      router();
    };
    $('#ob-next').onclick = () => (slide < total - 1 ? go(slide + 1) : finish());
    $('#ob-skip').onclick = () => (slide < total - 1 ? go(total - 1) : finish());
    $('#ob-form').onsubmit = (e) => { e.preventDefault(); finish(); };
    ob.hidden = false;
    document.body.classList.add('locked');
    go(0);
  }

  // ---------- Marca e cores ----------
  function applyBrand() {
    const c = CFG.brand.colors;
    const d = DEFAULT_CONFIG.brand.colors;
    const st = document.documentElement.style;
    const set = (v, def, vars) => {
      if (isHex(v) && v.toLowerCase() !== def.toLowerCase()) vars.forEach(([name, fn]) => st.setProperty(name, fn(v)));
      else vars.forEach(([name]) => st.removeProperty(name));
    };
    set(c.primary, d.primary, [['--flame', (v) => v], ['--flame-2', (v) => shade(v, -0.18)]]);
    set(c.dark, d.dark, [['--band', (v) => v]]);
    set(c.accent, d.accent, [['--gold', (v) => v]]);
    document.title = fullBrand();
    $$('[data-club-name]').forEach((e) => { e.textContent = CFG.brand.club; });
    const del = $('#delivery-tab');
    const href = safeHref(CFG.general.ifoodUrl);
    del.href = href;
    if (href.startsWith('https://')) { del.target = '_blank'; del.rel = 'noopener'; } else { del.removeAttribute('target'); }
  }

  // =====================================================================
  // ---------- Administrador ----------
  // =====================================================================
  const admin = { mode: BUNDLED ? 'artifact' : 'local', ok: false, unlocked: false, artifact: null, assets: null, downloads: null, publishing: false };
  try { admin.unlocked = sessionStorage.getItem('brasa-admin') === '1' && admin.mode === 'local'; } catch (e) { /* ignora */ }
  const isAdmin = () => admin.ok || admin.unlocked;
  const isDirty = () => JSON.stringify(CFG) !== JSON.stringify(PUBLISHED);

  function saveDraft() {
    try { if (isDirty()) localStorage.setItem(DRAFT_KEY, JSON.stringify(CFG)); else localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignora */ }
  }
  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = normalize(JSON.parse(raw));
      if (JSON.stringify(d) === JSON.stringify(PUBLISHED)) { localStorage.removeItem(DRAFT_KEY); return; }
      CFG = d;
      applyBrand();
      toast('Rascunho do painel restaurado');
    } catch (e) { /* ignora */ }
  }
  let dirtyTimer;
  function changed({ rerender = false } = {}) {
    applyBrand();
    clearTimeout(dirtyTimer);
    dirtyTimer = setTimeout(saveDraft, 300);
    if (rerender) router(); else updateChrome();
  }

  // Página única publicada: gera o documento completo a partir das partes fixas + configuração
  const RESET_CSS = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
  const FONT_LINKS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;500;600;700&display=swap">';
  function buildDocument(cfg) {
    const part = (id) => document.getElementById(id).textContent;
    const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
    const S = 'script';
    return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' + RESET_CSS + '</style></head><body>'
      + `<title>${esc(`${cfg.brand.name} ${cfg.brand.accent}`.trim())}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${FONT_LINKS}\n`
      + `<style id="app-style">${part('app-style')}</style>\n`
      + `<template id="app-shell">${shellTpl.innerHTML}</template>\n`
      + `<${S} type="application/json" id="app-config">${json}</${S}>\n`
      + `<${S} id="app-art">${part('app-art')}</${S}>\n`
      + `<${S} id="app-data">${part('app-data')}</${S}>\n`
      + `<${S} id="app-main">${part('app-main')}</${S}>\n`
      + '</body></html>';
  }

  async function publishConfig() {
    if (admin.publishing) return;
    if (admin.mode === 'local') {
      try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(CFG));
        PUBLISHED = clone(CFG);
        saveDraft();
        toast('Salvo neste aparelho');
      } catch (e) { toast('Não coube no armazenamento do navegador. Use fotos menores.'); }
      updateChrome();
      if (currentPath === 'admin') router();
      return;
    }
    if (!admin.artifact) { toast('Publicar não está disponível nesta visualização'); return; }
    admin.publishing = true;
    const btn = $('#pub-now');
    if (btn) { btn.disabled = true; btn.textContent = 'Publicando…'; }
    saveDraft();
    try {
      await admin.artifact.publish(buildDocument(CFG));
      toast('Publicado! Atualizando o app…');
    } catch (e) {
      const code = e && e.code;
      if (code === 'conflict') toast('Outra versão foi publicada antes. O app vai recarregar e seu rascunho continua salvo.');
      else if (code === 'not_writer' || code === 'not_granted' || code === 'consent_required') { admin.ok = false; toast('Você não tem permissão para publicar este app.'); router(); }
      else if (code === 'rate_limited') toast('Muitas publicações seguidas. Aguarde um pouco e tente de novo.');
      else toast(`Não foi possível publicar (${code || 'erro'}). Tente de novo.`);
    } finally {
      admin.publishing = false;
      updateChrome();
    }
  }

  async function prepareImage(file, max) {
    if (file.type === 'image/svg+xml') return file;
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * s));
    c.height = Math.max(1, Math.round(bmp.height * s));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    let blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.86));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    return blob;
  }
  async function storeImage(file) {
    if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem');
    if (admin.mode === 'artifact') {
      if (!admin.assets) throw new Error('Envio de fotos indisponível nesta visualização');
      const r = await admin.assets.upload(await prepareImage(file, 1000));
      return safeImg(r.url) || `/_blob/${r.id}`;
    }
    const blob = await prepareImage(file, 600);
    return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(new Error('Falha ao ler a imagem')); fr.readAsDataURL(blob); });
  }

  // --- Esquemas dos formulários ---
  const opt = (arr) => () => arr;
  const linkOptions = () => [
    ['#inicio', 'Tela: Início'], ['#retire', 'Tela: Peça & Retire'], ['#cupons', 'Tela: Cupons'], ['#clube', `Tela: ${CFG.brand.club}`], ['#recompensas', 'Tela: Recompensas'],
    ...CFG.categories.map((c) => ['#retire-' + c.id, 'Categoria: ' + c.name]),
    ...CFG.products.map((p) => ['#produto-' + p.id, 'Produto: ' + p.name]),
    ...CFG.offers.map((o) => ['#cupom-' + o.id, 'Cupom: ' + o.name]),
  ];
  const artOptions = () => [['', '(sem ilustração)'], ...Object.entries(ART_NAMES)];
  const SCHEMAS = {
    brand: [
      { k: 'name', label: 'Nome da marca', type: 'text', req: true },
      { k: 'accent', label: 'Segunda parte do nome (destacada)', type: 'text' },
      { k: 'club', label: 'Nome do clube de pontos', type: 'text', req: true },
      { k: 'logo', label: 'Logo (aparece no topo da tela inicial)', type: 'image' },
      { k: 'colors.primary', label: 'Cor principal (botões e preços)', type: 'color' },
      { k: 'colors.dark', label: 'Cor das faixas escuras', type: 'color' },
      { k: 'colors.accent', label: 'Cor de destaque (pontos e selos)', type: 'color' },
    ],
    home: [
      { k: 'heroOfferId', label: 'Cupom em destaque', type: 'select', options: () => [['', '(nenhum)'], ...CFG.offers.map((o) => [o.id, o.name])] },
      { k: 'heroTitle', label: 'Título do destaque', type: 'text' },
      { k: 'heroText', label: 'Texto do destaque', type: 'textarea' },
      { k: 'featuredTitle', label: 'Título da faixa de ofertas', type: 'text' },
      { k: 'featuredSection', label: 'Seção de cupons mostrada na faixa', type: 'select', options: () => [['', '(nenhuma)'], ...CFG.offerSections.map((s) => [s.id, s.name])] },
    ],
    promo: [
      { k: 'enabled', label: 'Mostrar o pop-up ao abrir o app', type: 'bool' },
      { k: 'title', label: 'Título', type: 'text' },
      { k: 'pill', label: 'Faixa abaixo do título', type: 'text' },
      { k: 'off', label: 'Selo de desconto (ex.: 40%)', type: 'text' },
      { k: 'text', label: 'Texto ao lado da imagem', type: 'text' },
      { k: 'image', label: 'Foto', type: 'image' },
      { k: 'art', label: 'Ilustração (se não houver foto)', type: 'art' },
      { k: 'save', label: 'Chamada (ex.: Salve seu cupom)', type: 'text' },
      { k: 'b1Label', label: 'Botão 1: texto', type: 'text' },
      { k: 'b1Link', label: 'Botão 1: abre', type: 'select', options: linkOptions },
      { k: 'b2Label', label: 'Botão 2: texto', type: 'text' },
      { k: 'b2Link', label: 'Botão 2: abre', type: 'select', options: linkOptions },
      { k: 'foot', label: 'Rodapé', type: 'text' },
    ],
    general: [
      { k: 'ifoodUrl', label: 'Link do botão Delivery (sua loja no iFood)', type: 'url' },
      { k: 'welcomePoints', label: 'Pontos de boas-vindas', type: 'int' },
      { k: 'milestones', label: 'Marcos de pontos do clube (separe por vírgula)', type: 'numlist' },
      { k: 'comboUpgrade', label: 'Acréscimo do combo grande (R$)', type: 'money' },
      ...(BUNDLED ? [] : [{ k: 'adminPin', label: 'Senha do painel (só nesta versão local)', type: 'text', req: true }]),
    ],
    categories: [{ k: 'name', label: 'Nome da categoria', type: 'text', req: true }],
    products: [
      { k: 'name', label: 'Nome', type: 'text', req: true },
      { k: 'image', label: 'Foto', type: 'image' },
      { k: 'art', label: 'Ilustração (usada se não houver foto)', type: 'art' },
      { k: 'desc', label: 'Descrição', type: 'textarea' },
      { k: 'price', label: 'Preço individual (R$)', type: 'money', req: true },
      { k: 'combo', label: 'Preço do combo (R$). Deixe vazio se não tiver combo', type: 'money' },
      { k: 'cats', label: 'Categorias', type: 'multi', options: () => CFG.categories.map((c) => [c.id, c.name]) },
      { k: 'badge', label: 'Selo (ex.: Novo)', type: 'text' },
      { k: 'kcal', label: 'Calorias (kcal)', type: 'int' },
      { k: 'ingredients', label: 'Ingredientes que o cliente pode tirar (um por linha)', type: 'lines' },
      { k: 'sized', label: 'Vende em tamanhos (P, M, G)', type: 'bool' },
      { k: 'allowExtras', label: 'Aceita adicionais (bacon, queijo…)', type: 'bool' },
      { k: 'hidden', label: 'Esconder do cardápio', type: 'bool' },
    ],
    extras: [{ k: 'name', label: 'Nome', type: 'text', req: true }, { k: 'price', label: 'Preço (R$)', type: 'money', req: true }],
    sizes: [{ k: 'name', label: 'Nome do tamanho', type: 'text', req: true }, { k: 'add', label: 'Acréscimo (R$)', type: 'money', req: true }],
    comboDrinks: [{ k: 'name', label: 'Bebida', type: 'text', req: true }, { k: 'add', label: 'Acréscimo (R$)', type: 'money', req: true }],
    offerSections: [{ k: 'name', label: 'Nome da seção', type: 'text', req: true }, { k: 'dark', label: 'Cartões com fundo escuro', type: 'bool' }],
    offers: [
      { k: 'name', label: 'Nome', type: 'text', req: true },
      { k: 'image', label: 'Foto', type: 'image' },
      { k: 'art', label: 'Ilustração (usada se não houver foto)', type: 'art' },
      { k: 'price', label: 'Preço (R$)', type: 'money', req: true },
      { k: 'section', label: 'Seção', type: 'select', options: () => CFG.offerSections.map((s) => [s.id, s.name]), req: true },
      { k: 'flag', label: 'Etiqueta no topo (ex.: Só no app)', type: 'text' },
      { k: 'includes', label: 'O que vem (um item por linha)', type: 'lines' },
      { k: 'drive', label: 'Válido só no drive-thru', type: 'bool' },
      { k: 'hidden', label: 'Esconder do app', type: 'bool' },
    ],
    rewards: [
      { k: 'name', label: 'Nome', type: 'text', req: true },
      { k: 'image', label: 'Foto', type: 'image' },
      { k: 'art', label: 'Ilustração (usada se não houver foto)', type: 'art' },
      { k: 'points', label: 'Pontos necessários', type: 'int', req: true },
      { k: 'price', label: 'Valor a pagar além dos pontos (R$)', type: 'money' },
    ],
    banners: [
      { k: 'title', label: 'Título', type: 'text', req: true },
      { k: 'text', label: 'Texto', type: 'textarea' },
      { k: 'cta', label: 'Texto do botão', type: 'text' },
      { k: 'link', label: 'Ao tocar, abre', type: 'select', options: linkOptions },
      { k: 'tone', label: 'Estilo de fundo', type: 'select', options: opt([['night', 'Escuro'], ['flame', 'Cor principal'], ['cream', 'Claro'], ['gold', 'Dourado']]) },
      { k: 'image', label: 'Foto', type: 'image' },
      { k: 'art', label: 'Ilustração (usada se não houver foto)', type: 'art' },
    ],
    stores: [
      { k: 'name', label: 'Nome do restaurante', type: 'text', req: true },
      { k: 'address', label: 'Endereço', type: 'text', req: true },
      { k: 'drive', label: 'Tem drive-thru', type: 'bool' },
    ],
  };

  const ADMIN_SECTIONS = [
    { id: 'marca', name: 'Marca e cores', obj: 'brand' },
    { id: 'produtos', name: 'Produtos', list: 'products', prefix: 'p-', sub: (p) => `${money(p.price)}${p.combo ? ` · combo ${money(p.combo)}` : ''}${p.hidden ? ' · escondido' : ''}`, search: true, newItem: () => ({ name: '', desc: '', price: 0, combo: null, cats: CFG.categories[0] ? [CFG.categories[0].id] : [], badge: '', kcal: '', ingredients: [], art: clone(ART.classico), image: '', allowExtras: true }) },
    { id: 'categorias', name: 'Categorias', list: 'categories', prefix: 'c-', sub: (c) => `${CFG.products.filter((p) => (p.cats || []).includes(c.id)).length} produtos`, newItem: () => ({ name: '' }) },
    { id: 'cupons', name: 'Cupons', list: 'offers', prefix: 'o-', sub: (o) => `${money(o.price)} · ${CFG.offerSections.find((s) => s.id === o.section)?.name || 'sem seção'}${o.hidden ? ' · escondido' : ''}`, search: true, newItem: () => ({ name: '', price: 0, section: CFG.offerSections[0]?.id || '', flag: '', includes: [], art: clone(ART.combo), image: '' }) },
    { id: 'secoes', name: 'Seções de cupons', list: 'offerSections', prefix: 's-', sub: (s) => `${CFG.offers.filter((o) => o.section === s.id).length} cupons${s.dark ? ' · fundo escuro' : ''}`, newItem: () => ({ name: '', dark: false }) },
    { id: 'inicio', name: 'Tela inicial', obj: 'home' },
    { id: 'banners', name: 'Banners', list: 'banners', prefix: 'b-', titleKey: 'title', sub: (b) => b.text, newItem: () => ({ title: '', text: '', cta: 'Eu quero', link: '#retire', tone: 'night', art: clone(ART.combo), image: '' }) },
    { id: 'popup', name: 'Pop-up', obj: 'promo' },
    { id: 'recompensas', name: 'Recompensas', list: 'rewards', prefix: 'r-', sub: (r) => `${r.points} pts${r.price ? ` + ${money(r.price)}` : ''}`, newItem: () => ({ name: '', points: 100, price: 0, art: clone(ART.casquinha), image: '' }) },
    { id: 'adicionais', name: 'Adicionais', list: 'extras', prefix: 'x-', sub: (x) => money(x.price), newItem: () => ({ name: '', price: 0 }) },
    { id: 'tamanhos', name: 'Tamanhos', list: 'sizes', prefix: 'z-', sub: (s) => (s.add ? `+ ${money(s.add)}` : 'sem acréscimo'), newItem: () => ({ name: '', add: 0 }) },
    { id: 'bebidas', name: 'Bebidas do combo', list: 'comboDrinks', prefix: 'd-', sub: (s) => (s.add ? `+ ${money(s.add)}` : 'sem acréscimo'), newItem: () => ({ name: '', add: 0 }) },
    { id: 'lojas', name: 'Restaurantes', list: 'stores', prefix: 'l-', sub: (s) => `${s.address}${s.drive ? ' · drive-thru' : ''}`, newItem: () => ({ name: '', address: '', drive: false }) },
    { id: 'geral', name: 'Configurações', obj: 'general' },
  ];
  const SCHEMA_OF = { brand: 'brand', home: 'home', promo: 'promo', general: 'general' };

  const getPath = (o, k) => k.split('.').reduce((a, p) => (a == null ? a : a[p]), o);
  const setPath = (o, k, v) => { const ps = k.split('.'); const last = ps.pop(); ps.reduce((a, p) => (a[p] ??= {}), o)[last] = v; };
  const artKeyOf = (spec) => { if (!spec) return ''; const j = JSON.stringify(spec); return Object.keys(ART).find((k) => JSON.stringify(ART[k]) === j) ?? '__custom'; };

  function fieldHTML(f, obj, uidp) {
    const id = `${uidp}-${f.k.replace(/\./g, '_')}`;
    const v = getPath(obj, f.k);
    const lab = `<span class="fld-label">${esc(f.label)}${f.req ? ' <i>*</i>' : ''}</span>`;
    switch (f.type) {
      case 'textarea': return `<label class="fld" for="${id}">${lab}<textarea id="${id}" data-k="${f.k}" rows="3">${esc(v)}</textarea></label>`;
      case 'lines': return `<label class="fld" for="${id}">${lab}<textarea id="${id}" data-k="${f.k}" rows="4">${esc((v || []).join('\n'))}</textarea></label>`;
      case 'money': return `<label class="fld" for="${id}">${lab}<input id="${id}" data-k="${f.k}" inputmode="decimal" value="${esc(fmtNum(v))}" placeholder="0,00"></label>`;
      case 'int': return `<label class="fld" for="${id}">${lab}<input id="${id}" data-k="${f.k}" inputmode="numeric" value="${esc(v ?? '')}"></label>`;
      case 'numlist': return `<label class="fld" for="${id}">${lab}<input id="${id}" data-k="${f.k}" inputmode="numeric" value="${esc((v || []).join(', '))}"></label>`;
      case 'url': return `<label class="fld" for="${id}">${lab}<input id="${id}" data-k="${f.k}" type="url" value="${esc(v)}" placeholder="https://"></label>`;
      case 'bool': return `<label class="fld fld-check" for="${id}"><input id="${id}" data-k="${f.k}" type="checkbox" ${v ? 'checked' : ''}><span>${esc(f.label)}</span></label>`;
      case 'color': return `<label class="fld" for="${id}">${lab}<span class="color-row"><input id="${id}" data-k="${f.k}" type="color" value="${isHex(v) ? v : '#000000'}"><code>${esc(v)}</code></span></label>`;
      case 'select': {
        const opts = f.options();
        const has = opts.some(([val]) => val === (v ?? ''));
        return `<label class="fld" for="${id}">${lab}<select id="${id}" data-k="${f.k}">${has ? '' : `<option value="${esc(v ?? '')}" selected>(atual)</option>`}${opts.map(([val, l]) => `<option value="${esc(val)}" ${val === (v ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
      }
      case 'multi': return `<fieldset class="fld"><legend class="fld-label">${esc(f.label)}</legend><div class="chips-multi">${f.options().map(([val, l]) => `<label class="chip-check"><input type="checkbox" data-multi="${f.k}" value="${esc(val)}" ${(v || []).includes(val) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div></fieldset>`;
      case 'art': {
        const key = artKeyOf(v);
        return `<label class="fld" for="${id}">${lab}<span class="art-row"><span class="art-prev" data-art-prev="${f.k}">${v ? art(v) : ''}</span><select id="${id}" data-k="${f.k}" data-art>${key === '__custom' ? '<option value="__custom" selected>(personalizada)</option>' : ''}${artOptions().map(([val, l]) => `<option value="${val}" ${val === key ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></span></label>`;
      }
      case 'image': {
        const src = safeImg(v);
        const canUpload = admin.mode === 'local' || !!admin.assets;
        return `<div class="fld"><span class="fld-label">${esc(f.label)}</span>
          <div class="img-field" data-img="${f.k}">
            <div class="img-prev">${src ? `<img src="${esc(src)}" alt="">` : icon('image')}</div>
            <div class="img-actions">
              ${canUpload ? `<label class="btn btn-outline btn-sm">${src ? 'Trocar foto' : 'Enviar foto'}<input type="file" accept="image/*" data-file="${f.k}" hidden></label>` : '<span class="small muted">Envio de fotos indisponível aqui.</span>'}
              ${src ? `<button class="btn btn-link btn-sm" type="button" data-clear-img="${f.k}">Remover foto</button>` : ''}
              <span class="small muted" data-img-status="${f.k}">${admin.mode === 'local' ? 'Fica salva neste aparelho. Use fotos leves.' : 'PNG com fundo transparente fica melhor.'}</span>
            </div>
          </div></div>`;
      }
      default: return `<label class="fld" for="${id}">${lab}<input id="${id}" data-k="${f.k}" value="${esc(v ?? '')}"></label>`;
    }
  }
  const formHTML = (schema, obj, uidp) => schema.map((f) => fieldHTML(f, obj, uidp)).join('');

  // Lê um campo do formulário para o objeto; devolve mensagem de erro ou ''
  function readField(f, root, obj) {
    if (f.type === 'image') return '';
    if (f.type === 'multi') { setPath(obj, f.k, $$(`[data-multi="${f.k}"]`, root).filter((c) => c.checked).map((c) => c.value)); return ''; }
    const el = $(`[data-k="${f.k}"]`, root);
    if (!el) return '';
    const raw = el.type === 'checkbox' ? el.checked : el.value;
    let v;
    switch (f.type) {
      case 'bool': v = !!raw; break;
      case 'money': v = parseMoney(raw); if (Number.isNaN(v)) return `${f.label}: valor inválido`; if (v == null) { if (f.req) return `${f.label}: obrigatório`; v = f.k === 'combo' ? null : 0; } break;
      case 'int': v = String(raw).trim() === '' ? (f.req ? NaN : '') : parseInt(raw, 10); if (Number.isNaN(v)) return `${f.label}: informe um número`; break;
      case 'numlist': v = String(raw).split(/[,;\s]+/).map((n) => parseInt(n, 10)).filter((n) => n > 0).sort((a, b) => a - b); if (!v.length) return `${f.label}: informe ao menos um número`; break;
      case 'lines': v = String(raw).split('\n').map((s) => s.trim()).filter(Boolean); break;
      case 'url': v = String(raw).trim(); if (v && !/^https:\/\//.test(v)) return `${f.label}: o link precisa começar com https://`; break;
      case 'art': if (raw === '__custom') return ''; v = raw ? clone(ART[raw]) : null; break;
      default: v = String(raw).trim(); if (f.req && !v) return `${f.label}: obrigatório`;
    }
    setPath(obj, f.k, v);
    return '';
  }

  // Liga envio/remoção de fotos e prévia de ilustração dentro de um formulário
  function bindMedia(root, obj, onChange) {
    $$('[data-file]', root).forEach((input) => input.addEventListener('change', async () => {
      const k = input.dataset.file;
      const file = input.files[0];
      if (!file) return;
      const status = $(`[data-img-status="${k}"]`, root);
      status.textContent = 'Enviando…';
      try {
        const url = await storeImage(file);
        setPath(obj, k, url);
        $(`[data-img="${k}"] .img-prev`, root).innerHTML = `<img src="${esc(url)}" alt="">`;
        status.textContent = 'Foto pronta.';
        onChange();
      } catch (e) {
        status.textContent = (e && e.message) || 'Não foi possível enviar a foto.';
      }
    }));
    $$('[data-clear-img]', root).forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.clearImg;
      setPath(obj, k, '');
      $(`[data-img="${k}"] .img-prev`, root).innerHTML = icon('image');
      b.remove();
      onChange();
    }));
    $$('[data-art]', root).forEach((s) => s.addEventListener('change', () => {
      const prev = $(`[data-art-prev="${s.dataset.k}"]`, root);
      if (prev && s.value !== '__custom') prev.innerHTML = s.value ? art(ART[s.value]) : '';
    }));
    $$('input[type=color]', root).forEach((c) => c.addEventListener('input', () => { c.nextElementSibling.textContent = c.value; }));
  }

  // Editor de um item de lista numa folha deslizante
  function openEditor(sec, index) {
    const list = CFG[sec.list];
    const isNew = index == null;
    const item = isNew ? { id: newId(sec.prefix), ...sec.newItem() } : clone(list[index]);
    const schema = SCHEMAS[sec.list];
    const body = $('#editor-body');
    body.innerHTML = `
      <div class="sheet-head"><h2>${isNew ? 'Adicionar' : 'Editar'}: ${esc(sec.name.toLowerCase())}</h2><button class="icon-btn" type="button" data-close aria-label="Fechar">${icon('close')}</button></div>
      <form id="editor-form" class="adm-form" novalidate>
        ${formHTML(schema, item, 'ed')}
        <p class="form-error" id="editor-error" role="alert"></p>
        <div class="editor-actions">
          ${isNew ? '' : '<button class="btn btn-ghost-danger" type="button" id="editor-delete">Excluir</button>'}
          <button class="btn btn-primary grow" type="submit">${isNew ? 'Adicionar' : 'Salvar'}</button>
        </div>
      </form>`;
    const form = $('#editor-form');
    bindMedia(form, item, () => {});
    form.onsubmit = (e) => {
      e.preventDefault();
      const errs = schema.map((f) => readField(f, form, item)).filter(Boolean);
      if (errs.length) { $('#editor-error').textContent = errs[0]; return; }
      if (isNew) list.push(item); else list[index] = item;
      closeModal($('#editor'));
      toast(isNew ? 'Item adicionado' : 'Alterações aplicadas');
      changed({ rerender: true });
    };
    const del = $('#editor-delete');
    if (del) del.onclick = () => {
      const block = deleteBlocker(sec.list, list[index]);
      if (block) { $('#editor-error').textContent = block; return; }
      if (!del.dataset.armed) { del.dataset.armed = '1'; del.textContent = 'Toque de novo para excluir'; return; }
      removeItem(sec.list, index);
      closeModal($('#editor'));
      toast('Item excluído');
      changed({ rerender: true });
    };
    openModal('#editor');
  }

  function deleteBlocker(key, item) {
    if (key === 'offerSections' && CFG.offers.some((o) => o.section === item.id)) return 'Mova ou exclua os cupons desta seção antes de excluí-la.';
    if (key === 'categories' && CFG.categories.length === 1) return 'O cardápio precisa de ao menos uma categoria.';
    return '';
  }
  function removeItem(key, index) {
    const [it] = CFG[key].splice(index, 1);
    if (key === 'categories') CFG.products.forEach((p) => { p.cats = (p.cats || []).filter((c) => c !== it.id); });
    if (key === 'offers' && CFG.home.heroOfferId === it.id) CFG.home.heroOfferId = '';
    if (key === 'offerSections' && CFG.home.featuredSection === it.id) CFG.home.featuredSection = '';
  }

  function adminLocked(el) {
    if (admin.mode === 'artifact') {
      el.innerHTML = appBar('Administrador', { back: '#inicio' }) + emptyState('Acesso restrito', 'Só quem pode editar este app acessa o painel. Se você é o dono, abra o app pela sua conta.', 'Voltar ao início', '#inicio');
      return;
    }
    el.innerHTML = `
      ${appBar('Administrador', { back: '#inicio' })}
      <form class="card form-card" id="pin-form">
        <legend>Entrar no painel</legend>
        <label for="pin">Senha do administrador</label>
        <input id="pin" type="password" inputmode="numeric" autocomplete="current-password">
        <p class="form-error" id="pin-error" role="alert"></p>
        <button class="btn btn-primary" type="submit">Entrar</button>
        <p class="small muted">A senha inicial é 1234. Troque em Configurações depois de entrar.</p>
      </form>`;
    $('#pin-form', el).onsubmit = (e) => {
      e.preventDefault();
      if ($('#pin', el).value === String(CFG.general.adminPin)) {
        admin.unlocked = true;
        try { sessionStorage.setItem('brasa-admin', '1'); } catch (er) { /* ignora */ }
        restoreDraft();
        router();
      } else $('#pin-error', el).textContent = 'Senha incorreta.';
    };
  }

  let adminQuery = '';
  function renderAdmin(el, secId) {
    if (!isAdmin()) { adminLocked(el); return; }
    const sec = ADMIN_SECTIONS.find((s) => s.id === secId) || ADMIN_SECTIONS[0];
    const dirty = isDirty();
    el.innerHTML = `
      ${appBar('Administrador', { back: '#inicio' })}
      <div class="adm-status ${dirty ? 'dirty' : ''}">
        <p><b>${dirty ? (admin.mode === 'artifact' ? 'Você tem alterações não publicadas.' : 'Você tem alterações não salvas.') : 'Tudo publicado.'}</b>
        ${admin.mode === 'artifact' ? 'As mudanças já aparecem para você. Toque em <b>Publicar</b> para os clientes verem.' : 'Esta versão salva só neste aparelho. Use Exportar para levar as mudanças para outro lugar.'}</p>
        ${dirty ? `<div class="adm-status-actions"><button class="btn btn-outline btn-sm" type="button" id="adm-discard">Descartar</button><button class="btn btn-primary btn-sm" type="button" id="adm-publish">${admin.mode === 'artifact' ? 'Publicar' : 'Salvar'}</button></div>` : ''}
      </div>
      <nav class="adm-nav" aria-label="Seções do painel">
        ${ADMIN_SECTIONS.map((s) => `<a class="adm-chip ${s.id === sec.id ? 'active' : ''}" href="#admin-${s.id}">${esc(s.name)}</a>`).join('')}
      </nav>
      <section id="adm-body"></section>`;
    $('.adm-chip.active', el)?.scrollIntoView({ inline: 'center', block: 'nearest' });
    $('#adm-publish', el)?.addEventListener('click', publishConfig);
    const discard = $('#adm-discard', el);
    if (discard) discard.onclick = () => {
      if (!discard.dataset.armed) { discard.dataset.armed = '1'; discard.textContent = 'Confirmar descarte'; return; }
      CFG = clone(PUBLISHED); saveDraft(); applyBrand(); toast('Alterações descartadas'); router();
    };
    const body = $('#adm-body', el);
    if (sec.obj) renderAdminObject(body, sec);
    else renderAdminList(body, sec);
  }

  function renderAdminObject(body, sec) {
    const schema = SCHEMAS[SCHEMA_OF[sec.obj]];
    const obj = CFG[sec.obj];
    body.innerHTML = `
      <form class="card adm-form" id="obj-form" novalidate>
        <h2 class="adm-title">${esc(sec.name)}</h2>
        ${sec.obj === 'promo' ? '<p class="small muted">O pop-up aparece uma vez por visita, na tela inicial. <button type="button" class="btn btn-link btn-sm" id="preview-promo">Ver como fica</button></p>' : ''}
        ${formHTML(schema, obj, 'ob')}
        <p class="form-error" id="obj-error" role="alert"></p>
        <p class="small muted">As mudanças entram no app assim que você sai de cada campo.</p>
      </form>
      ${sec.obj === 'general' ? adminToolsHTML() : ''}`;
    const form = $('#obj-form', body);
    bindMedia(form, obj, () => changed());
    form.addEventListener('change', (e) => {
      if (e.target.type === 'file') return;
      const f = schema.find((x) => x.k === (e.target.dataset.k || e.target.dataset.multi));
      if (!f) return;
      const err = readField(f, form, obj);
      $('#obj-error', body).textContent = err;
      if (!err) changed();
    });
    $('#preview-promo', body)?.addEventListener('click', () => { renderPromo(); openModal('#promo'); });
    if (sec.obj === 'general') bindAdminTools(body);
  }

  function renderAdminList(body, sec) {
    const list = CFG[sec.list];
    const titleKey = sec.titleKey || 'name';
    const hasVisual = SCHEMAS[sec.list].some((f) => f.type === 'image' || f.type === 'art');
    const q = sec.search ? adminQuery.trim().toLowerCase() : '';
    const rows = list.map((it, i) => [it, i]).filter(([it]) => !q || String(it[titleKey] || '').toLowerCase().includes(q));
    body.innerHTML = `
      <div class="adm-head">
        <h2 class="adm-title">${esc(sec.name)} <small>${list.length}</small></h2>
        <button class="btn btn-primary btn-sm" type="button" id="adm-add">${icon('plus')} Adicionar</button>
      </div>
      ${sec.search ? `<input class="adm-search" id="adm-search" type="search" placeholder="Buscar pelo nome" value="${esc(adminQuery)}" aria-label="Buscar">` : ''}
      <ul class="adm-list">
        ${rows.map(([it, i]) => `
          <li class="adm-row ${it.hidden ? 'is-hidden' : ''}">
            ${hasVisual ? `<div class="thumb">${visual(it)}</div>` : ''}
            <button class="adm-row-main" type="button" data-edit="${i}">
              <b>${esc(it[titleKey] || '(sem nome)')}</b>
              <small>${esc(sec.sub ? sec.sub(it) : '')}</small>
            </button>
            <div class="adm-move">
              <button type="button" class="icon-btn sm" data-move="${i}" data-dir="-1" aria-label="Mover para cima" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
              <button type="button" class="icon-btn sm" data-move="${i}" data-dir="1" aria-label="Mover para baixo" ${i === list.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
            </div>
          </li>`).join('')}
      </ul>
      ${rows.length ? '' : '<p class="muted center">Nada encontrado.</p>'}
      <p class="small muted">Toque num item para editar. Use as setas para mudar a ordem em que aparece no app.</p>`;
    $('#adm-add', body).onclick = () => openEditor(sec, null);
    $$('[data-edit]', body).forEach((b) => b.addEventListener('click', () => openEditor(sec, Number(b.dataset.edit))));
    $$('[data-move]', body).forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.move);
      const j = i + Number(b.dataset.dir);
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      changed({ rerender: true });
    }));
    const search = $('#adm-search', body);
    if (search) search.addEventListener('input', () => { adminQuery = search.value; const pos = search.selectionStart; renderAdminList(body, sec); const s2 = $('#adm-search', body); s2.focus(); s2.setSelectionRange(pos, pos); });
  }

  function adminToolsHTML() {
    return `
      <div class="card adm-form">
        <h2 class="adm-title">Cópia de segurança</h2>
        <p class="small muted">Exporte toda a configuração do app (textos, preços, cores e links das fotos) num arquivo, ou importe um arquivo exportado antes.</p>
        <div class="adm-tools">
          <button class="btn btn-outline btn-sm" type="button" id="adm-export">Exportar</button>
          <label class="btn btn-outline btn-sm">Importar<input type="file" accept="application/json,.json" id="adm-import" hidden></label>
          <button class="btn btn-ghost-danger btn-sm" type="button" id="adm-reset">Voltar ao padrão</button>
        </div>
        <p class="small" id="adm-tools-msg" role="status"></p>
      </div>`;
  }
  function bindAdminTools(body) {
    const msg = $('#adm-tools-msg', body);
    $('#adm-export', body).onclick = async () => {
      const data = JSON.stringify(CFG, null, 2);
      const filename = 'configuracao-app.json';
      try {
        if (admin.downloads) { await admin.downloads.save({ filename, data: new Blob([data], { type: 'application/json' }) }); msg.textContent = 'Arquivo pronto.'; return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        msg.textContent = 'Arquivo baixado.';
      } catch (e) { msg.textContent = 'Não foi possível salvar o arquivo aqui.'; }
    };
    $('#adm-import', body).onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!parsed || typeof parsed !== 'object' || !parsed.brand) throw new Error();
        CFG = normalize(parsed);
        msg.textContent = 'Configuração importada. Confira e publique.';
        changed({ rerender: true });
      } catch (er) { msg.textContent = 'Arquivo inválido. Use um arquivo exportado por este painel.'; }
    };
    const reset = $('#adm-reset', body);
    reset.onclick = () => {
      if (!reset.dataset.armed) { reset.dataset.armed = '1'; reset.textContent = 'Toque de novo para confirmar'; return; }
      const pin = CFG.general.adminPin;
      CFG = normalize(null);
      CFG.general.adminPin = pin;
      toast('Configuração padrão carregada. Publique para valer.');
      changed({ rerender: true });
    };
  }

  // Detecta se quem está vendo pode editar (versão publicada)
  async function detectAdmin() {
    if (!BUNDLED || !window.claude || typeof window.claude.use !== 'function') return;
    try {
      const [user, artifact] = await Promise.all([window.claude.use('user'), window.claude.use('artifact')]);
      const can = user ? await user.canEdit() : false;
      if (!can || !artifact) return;
      admin.artifact = artifact;
      admin.ok = true;
      const [assets, downloads] = await Promise.all([window.claude.use('assets'), window.claude.use('downloads')]);
      admin.assets = assets;
      admin.downloads = downloads;
      restoreDraft();
      router();
    } catch (e) { /* sem acesso de administrador */ }
  }

  // ---------- Inicialização ----------
  $('#bagbar').addEventListener('click', () => { location.hash = '#sacola'; });
  window.addEventListener('hashchange', router);
  window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) { state = load(); router(); } });
  if (admin.unlocked) restoreDraft();
  applyBrand();
  router();
  if (!state.onboarded && !location.hash.startsWith('#admin')) showOnboarding();
  detectAdmin();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !BUNDLED) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
