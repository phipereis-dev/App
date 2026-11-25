// Brasa Burger — app de pedidos (HTML/CSS/JS puro)
(() => {
  'use strict';

  // ---------- Estado persistido ----------
  const STORE_KEY = 'brasa-burger-v2';
  const newCode = () => 'BR-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const defaultState = () => ({
    onboarded: false,
    name: '',
    storeId: null,
    cart: [],
    orders: [],
    points: WELCOME_POINTS,
    history: [{ t: Date.now(), desc: 'Bônus de boas-vindas', pts: WELCOME_POINTS }],
    memberCode: newCode(),
  });

  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return { ...defaultState(), ...JSON.parse(raw) };
    } catch (e) { /* armazenamento indisponível */ }
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
    updateChrome();
  }

  // ---------- Utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const product = (id) => PRODUCTS.find((p) => p.id === id);
  const offer = (id) => OFFERS.find((o) => o.id === id);
  const reward = (id) => REWARDS.find((r) => r.id === id);
  const store = () => STORES.find((s) => s.id === state.storeId);
  const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const firstName = () => (state.name || '').trim().split(/\s+/)[0];

  const ICONS = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    burger: '<path d="M4 10a8 6 0 0 1 16 0z"/><path d="M3 14h18"/><path d="M4 17h16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="2 2.5"/>',
    flame: '<path d="M12 3c1 4 6 5 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-8z"/>',
    scooter: '<circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.5 17h7M15 6h2l2.5 8.5M17 11h-6l-2 3.5H4.5V11h5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  };
  const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2300);
  }

  // ---------- Sacola ----------
  function unitPrice(item) {
    if (item.kind === 'offer') return offer(item.id).price;
    if (item.kind === 'reward') return reward(item.id).price;
    const p = product(item.id);
    let price = item.mode === 'combo' ? p.combo : p.price;
    if (item.mode === 'combo') {
      if (item.comboSize === 'G') price += 4;
      price += COMBO_DRINKS.find((d) => d.id === item.drink)?.add || 0;
    } else if (p.sized && item.size) price += SIZES.find((s) => s.id === item.size).add;
    (item.extras || []).forEach((id) => { price += EXTRAS.find((e) => e.id === id)?.price || 0; });
    return price;
  }
  function itemName(item) {
    if (item.kind === 'offer') return offer(item.id).name;
    if (item.kind === 'reward') return reward(item.id).name;
    const p = product(item.id);
    return item.mode === 'combo' ? `Combo ${p.name}` : p.name;
  }
  function itemArt(item) {
    if (item.kind === 'offer') return offer(item.id).art;
    if (item.kind === 'reward') return reward(item.id).art;
    const p = product(item.id);
    return item.mode === 'combo' ? { type: 'combo', main: p.art } : p.art;
  }
  function itemDetails(item) {
    const parts = [];
    if (item.kind === 'offer') return offer(item.id).includes.join(' · ');
    if (item.kind === 'reward') return `Resgate: ${reward(item.id).points * item.qty} pontos`;
    if (item.mode === 'combo') {
      parts.push(`Combo ${item.comboSize === 'G' ? 'grande' : 'médio'}`);
      parts.push(COMBO_DRINKS.find((d) => d.id === item.drink)?.name);
    } else if (item.size) parts.push(SIZES.find((s) => s.id === item.size).name);
    (item.removed || []).forEach((r) => parts.push(`sem ${r.toLowerCase()}`));
    (item.extras || []).forEach((id) => parts.push(`+ ${EXTRAS.find((e) => e.id === id)?.name.toLowerCase()}`));
    return parts.filter(Boolean).join(' · ');
  }

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
  const art = (spec, cls) => Art.render(spec, cls);

  function appBar(title, { back = null, store: showStore = false, brand = false } = {}) {
    const s = store();
    return `
      <header class="appbar ${back ? 'with-back' : ''}">
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
    <a class="offer-card ${dark ? 'dark' : ''}" href="#cupom-${o.id}">
      ${o.flag ? `<span class="flag">${esc(o.flag)}</span>` : ''}
      <div class="offer-art">${art(o.art)}</div>
      <h3>${esc(o.name)}</h3>
      <div class="offer-price">${money(o.price)}</div>
      <span class="earn">Ganhe ${Math.floor(o.price)} pontos ${icon('flame')}</span>
    </a>`;

  function rewardCard(r) {
    const missing = r.points - availablePoints();
    return `
      <a class="reward-card ${missing > 0 ? 'locked' : ''}" href="#recompensas">
        <span class="reward-status">${missing > 0 ? `${icon('lock')} Faltam ${missing} pts` : `${icon('check')} Disponível`}</span>
        <div class="offer-art">${art(r.art)}</div>
        <h3>${esc(r.name)}</h3>
        <span class="reward-cost">${icon(missing > 0 ? 'lock' : 'flame')} ${r.points} pts${r.price ? ` + ${money(r.price)}` : ''}</span>
      </a>`;
  }

  function milestones() {
    // Os marcos ficam no centro de cada coluna; a barra avança proporcionalmente entre eles
    const n = MILESTONES.length;
    const pos = (i) => ((i + 0.5) / n) * 100;
    let pct = 100;
    const pts = state.points;
    for (let i = 0; i < n; i++) {
      if (pts < MILESTONES[i]) {
        const prevV = i ? MILESTONES[i - 1] : 0, prevP = i ? pos(i - 1) : 0;
        pct = prevP + ((pts - prevV) / (MILESTONES[i] - prevV)) * (pos(i) - prevP);
        break;
      }
    }
    return `
      <div class="milestones" role="img" aria-label="Você tem ${state.points} pontos">
        <div class="ms-labels">${MILESTONES.map((m, i) => `<span>${m}${i === MILESTONES.length - 1 ? '+' : ''} pts</span>`).join('')}</div>
        <div class="ms-track">
          <div class="ms-fill" style="width:${pct}%"></div>
          ${MILESTONES.map((m, i) => `<span class="ms-node ${state.points >= m ? 'on' : ''}" style="left:${pos(i)}%">${icon(state.points >= m ? 'check' : 'lock')}</span>`).join('')}
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
    inicio: renderHome,
    retire: renderMenu,
    produto: (el, id) => renderProduct(el, id, 'single'),
    combo: (el, id) => renderProduct(el, id, 'combo'),
    cupons: renderCoupons,
    cupom: renderOffer,
    secao: renderSection,
    clube: renderClub,
    recompensas: renderRewards,
    extrato: renderStatement,
    sacola: renderCart,
    checkout: renderCheckout,
    pedido: renderOrder,
    pedidos: renderOrders,
    perfil: renderProfile,
  };
  const TAB_OF = { inicio: 'inicio', retire: 'retire', produto: 'retire', combo: 'retire', cupons: 'cupons', cupom: 'cupons', secao: 'cupons', clube: 'clube', recompensas: 'clube', extrato: 'clube' };
  const SHOW_BAG = ['inicio', 'retire', 'cupons', 'secao', 'clube', 'recompensas'];

  let currentPath = 'inicio';
  let timers = [];
  const clearTimers = () => { timers.forEach(clearInterval); timers = []; };

  function router() {
    clearTimers();
    const hash = location.hash.slice(1);
    const cut = hash.indexOf('-');
    let path = cut < 0 ? hash : hash.slice(0, cut);
    const param = cut < 0 ? undefined : decodeURIComponent(hash.slice(cut + 1));
    if (!routes[path]) path = 'inicio';
    currentPath = path;
    const old = $('#view');
    const main = old.cloneNode(false);
    old.replaceWith(main);
    main.dataset.page = path;
    routes[path](main, param);
    window.scrollTo(0, 0);
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
    document.body.classList.toggle('has-bag', showBag);
  }

  // ---------- Telas ----------
  function renderHome(el) {
    const s = store();
    const featured = OFFERS.filter((o) => o.section === 'favoritos');
    const big = offer('o-4itens');
    el.innerHTML = `
      <header class="homebar">
        <p class="hello">Oi${firstName() ? `, <span>${esc(firstName())}</span>` : ''}!</p>
        <a class="points-pill" href="#clube" aria-label="Seus pontos no Clube Brasa">${icon('flame')}<span data-points>${state.points}</span></a>
        <button class="icon-btn" type="button" data-open-drawer aria-label="Abrir menu">${icon('menu')}</button>
      </header>

      <div class="where">
        ${icon('pin', 'where-pin')}
        <span class="where-q">${s ? 'Retirar em' : 'Onde vamos?'}</span>
        <button class="btn btn-outline btn-sm" type="button" data-open-store>${s ? esc(s.name) : 'Selecione um restaurante'}</button>
      </div>

      <section class="carousel" aria-label="Destaques">
        <div class="slides" id="slides">
          ${BANNERS.map((b, i) => `
            <a class="banner tone-${b.tone}" href="${b.href}" aria-label="${esc(b.title)}" data-i="${i}">
              <div class="banner-copy">
                <h2>${esc(b.title)}</h2>
                <p>${esc(b.text)}</p>
                <span class="btn btn-primary btn-sm">${esc(b.cta)}</span>
              </div>
              <div class="banner-art">${art(b.art)}</div>
            </a>`).join('')}
        </div>
        <div class="dots" id="dots">${BANNERS.map((_, i) => `<button type="button" aria-label="Banner ${i + 1}" data-dot="${i}" class="${i === 0 ? 'on' : ''}"></button>`).join('')}</div>
      </section>

      <a class="hero-offer" href="#cupom-${big.id}">
        <div class="hero-offer-top">
          <div class="hero-offer-copy">
            <span class="hero-kicker">Black Friday</span>
            <div class="hero-price"><b>4</b><small>itens<br>por</small><b>19</b><sup>,90</sup></div>
            <span class="btn btn-primary btn-sm">Eu quero</span>
          </div>
          <div class="hero-offer-art">${art(big.art)}</div>
        </div>
        <div class="hero-offer-body">
          <h2>Leve 4 itens por R$ 19,90</h2>
          <p class="muted">Sanduíche, batata, refri e casquinha. Peça pelo app e retire no restaurante.</p>
        </div>
      </a>

      <section>
        <div class="sec-head"><h2>${icon('flame', 'sec-ic')}Ofertas deliciosas</h2></div>
        <div class="hscroll">
          ${featured.map((o) => `
            <a class="wide-offer" href="#cupom-${o.id}">
              <div class="wide-copy">
                <span class="earn-badge">Ganhe<br><b>${Math.floor(o.price)}</b><br>pontos</span>
                <span class="btn btn-primary btn-sm">Peça agora</span>
              </div>
              <div class="wide-art">${art(o.art)}</div>
              <div class="wide-price"><small>R$</small><b>${Math.floor(o.price)}</b><sup>,${o.price.toFixed(2).split('.')[1]}</sup><span>${esc(o.name)}</span></div>
            </a>`).join('')}
        </div>
      </section>

      <section>
        ${sectionHead('Recompensas', '#recompensas', 'Todas')}
        <div class="card">${milestones()}</div>
        <div class="hscroll">${REWARDS.map(rewardCard).join('')}</div>
      </section>`;

    // Carrossel com rolagem automática
    const slides = $('#slides', el);
    const dots = $$('[data-dot]', el);
    let idx = 0;
    const go = (i) => { idx = (i + BANNERS.length) % BANNERS.length; slides.scrollTo({ left: slides.clientWidth * idx, behavior: 'smooth' }); };
    slides.addEventListener('scroll', () => {
      const i = Math.round(slides.scrollLeft / slides.clientWidth);
      if (i !== idx) idx = i;
      dots.forEach((d, j) => d.classList.toggle('on', j === i));
    }, { passive: true });
    dots.forEach((d) => d.addEventListener('click', () => go(Number(d.dataset.dot))));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timers.push(setInterval(() => { if (!document.hidden && !$('.modal.open')) go(idx + 1); }, 5000));
    }
    maybeShowPromo();
  }

  function renderMenu(el, tab = MENU_TABS[0].id) {
    if (!MENU_TABS.some((t) => t.id === tab)) tab = MENU_TABS[0].id;
    const items = PRODUCTS.filter((p) => p.cats.includes(tab));
    el.innerHTML = `
      ${appBar('Peça & Retire', { store: true })}
      <nav class="tabs-band" aria-label="Categorias">
        <div class="tabs-scroll">
          ${MENU_TABS.map((t) => `<a class="tab-chip ${t.id === tab ? 'active' : ''}" href="#retire-${t.id}">${t.name}</a>`).join('')}
        </div>
      </nav>
      <div class="menu-grid">
        ${items.map((p) => `
          <article class="menu-card">
            <a class="menu-art" href="#produto-${p.id}" aria-label="${esc(p.name)}">
              ${p.badge ? `<span class="badge-new">${esc(p.badge)}</span>` : ''}
              ${art(p.art)}
            </a>
            <div class="menu-body">
              <h3><a href="#produto-${p.id}">${esc(p.name)}</a></h3>
              <p class="clamp">${esc(p.desc)}</p>
            </div>
            <div class="menu-prices ${p.combo ? '' : 'single'}">
              <a href="#produto-${p.id}"><span>Individual</span><b>${money(p.price)}</b></a>
              ${p.combo ? `<a href="#combo-${p.id}"><span>Combo</span><b>${money(p.combo)}</b></a>` : ''}
            </div>
          </article>`).join('')}
      </div>`;
    $('.tab-chip.active', el)?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  function qtyStepper(id = 'qty') {
    return `
      <div class="stepper" role="group" aria-label="Quantidade">
        <button type="button" data-step="-1" aria-label="Diminuir">−</button>
        <output id="${id}">1</output>
        <button type="button" data-step="1" aria-label="Aumentar">+</button>
      </div>`;
  }

  function renderProduct(el, id, startMode) {
    const p = product(id);
    if (!p) { el.innerHTML = appBar('Produto', { back: '#retire' }) + emptyState('Produto não encontrado', 'Esse item saiu do cardápio.', 'Voltar ao cardápio', '#retire'); return; }
    const isBurger = p.art.type === 'burger';
    const sel = { qty: 1, mode: p.combo ? startMode : 'single', size: p.sized ? 'M' : null, comboSize: 'M', drink: 'refri', removed: new Set(), extras: new Set() };
    const backTab = p.cats[0];

    el.innerHTML = `
      ${appBar(p.name, { back: `#retire-${backTab}` })}
      <div class="detail-art">${p.badge ? `<span class="badge-new">${esc(p.badge)}</span>` : ''}<div id="detail-art"></div></div>
      <div class="detail-head">
        <h2>${esc(p.name)}</h2>
        <p class="muted">${esc(p.desc)}</p>
        <p class="kcal">${p.kcal} kcal · ganhe 1 ponto a cada R$ 1</p>
      </div>
      <form id="pform" class="stack">
        ${p.combo ? `
        <div class="segmented" role="radiogroup" aria-label="Individual ou combo">
          <label><input type="radio" name="mode" value="single" ${sel.mode === 'single' ? 'checked' : ''}><span>Individual<small>${money(p.price)}</small></span></label>
          <label><input type="radio" name="mode" value="combo" ${sel.mode === 'combo' ? 'checked' : ''}><span>Combo<small>${money(p.combo)}</small></span></label>
        </div>` : ''}

        <fieldset class="opt-group" id="combo-opts">
          <legend>Tamanho do combo <small>batata + bebida</small></legend>
          <label class="opt"><input type="radio" name="comboSize" value="M" checked><span>Médio</span><span class="muted">incluso</span></label>
          <label class="opt"><input type="radio" name="comboSize" value="G"><span>Grande</span><span class="muted">+ ${money(4)}</span></label>
        </fieldset>
        <fieldset class="opt-group" id="drink-opts">
          <legend>Bebida do combo</legend>
          ${COMBO_DRINKS.map((d, i) => `<label class="opt"><input type="radio" name="drink" value="${d.id}" ${i === 0 ? 'checked' : ''}><span>${d.name}</span><span class="muted">${d.add ? '+ ' + money(d.add) : 'incluso'}</span></label>`).join('')}
        </fieldset>

        ${p.sized ? `
        <fieldset class="opt-group">
          <legend>Tamanho</legend>
          ${SIZES.map((s) => `<label class="opt"><input type="radio" name="size" value="${s.id}" ${s.id === 'M' ? 'checked' : ''}><span>${s.name}</span><span class="muted">${s.add ? '+ ' + money(s.add) : 'incluso'}</span></label>`).join('')}
        </fieldset>` : ''}

        ${p.ingredients.length ? `
        <fieldset class="opt-group">
          <legend>Ingredientes <small>desmarque para remover</small></legend>
          ${p.ingredients.map((ing, i) => `<label class="opt"><input type="checkbox" name="ing" value="${esc(ing)}" checked id="ing-${i}"><span>${esc(ing)}</span></label>`).join('')}
        </fieldset>` : ''}

        ${isBurger ? `
        <fieldset class="opt-group">
          <legend>Turbine seu lanche</legend>
          ${EXTRAS.map((x) => `<label class="opt"><input type="checkbox" name="extra" value="${x.id}"><span>${esc(x.name)}</span><span class="muted">+ ${money(x.price)}</span></label>`).join('')}
        </fieldset>` : ''}
      </form>
      <div class="action-bar">
        ${qtyStepper()}
        <button class="btn btn-primary grow" id="add" type="button">Adicionar <span id="line-total"></span></button>
      </div>`;

    const refresh = () => {
      $('#combo-opts', el).hidden = sel.mode !== 'combo';
      $('#drink-opts', el).hidden = sel.mode !== 'combo';
      $('#detail-art', el).innerHTML = art(sel.mode === 'combo' ? { type: 'combo', main: p.art, drink: { type: sel.drink === 'suco' ? 'juice' : sel.drink === 'agua' ? 'water' : 'drink' } } : p.art);
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

  function bindStepper(el, onStep) {
    $$('[data-step]', el).forEach((b) => b.addEventListener('click', () => onStep(Number(b.dataset.step))));
  }

  function renderOffer(el, id) {
    const o = offer(id);
    if (!o) { el.innerHTML = appBar('Cupom', { back: '#cupons' }) + emptyState('Cupom não encontrado', 'Essa oferta já acabou.', 'Ver cupons', '#cupons'); return; }
    const sec = OFFER_SECTIONS.find((s) => s.id === o.section);
    let qty = 1;
    el.innerHTML = `
      ${appBar('Cupom', { back: '#cupons' })}
      <div class="detail-art ${sec.dark ? 'dark' : ''}">${o.flag ? `<span class="badge-new">${esc(o.flag)}</span>` : ''}${art(o.art)}</div>
      <div class="detail-head">
        <p class="eyebrow">${esc(sec.name)}</p>
        <h2>${esc(o.name)}</h2>
        <div class="offer-big-price">${money(o.price)}</div>
        <span class="earn">Ganhe ${Math.floor(o.price)} pontos ${icon('flame')}</span>
      </div>
      <div class="card">
        <h3 class="card-title">O que vem</h3>
        <ul class="includes">${o.includes.map((i) => `<li>${icon('check')}${esc(i)}</li>`).join('')}</ul>
        ${o.drive ? `<p class="note">${icon('info')} Válido só para retirada no drive-thru.</p>` : ''}
        <p class="note">${icon('info')} Oferta por tempo limitado, enquanto durarem os estoques.</p>
      </div>
      <div class="action-bar">
        ${qtyStepper()}
        <button class="btn btn-primary grow" id="add" type="button">Adicionar <span id="line-total">${money(o.price)}</span></button>
      </div>`;
    bindStepper(el, (d) => {
      qty = Math.min(10, Math.max(1, qty + d));
      $('#qty', el).textContent = qty;
      $('#line-total', el).textContent = money(o.price * qty);
    });
    $('#add', el).addEventListener('click', () => {
      addToCart({ kind: 'offer', id: o.id, qty });
      toast(`${o.name} na sacola`);
      location.hash = '#cupons';
    });
  }

  function useYourPoints() {
    return `
      <section>
        <div class="sec-head points-head">
          <span class="my-points"><small>Meus</small><b data-points>${state.points}</b><small>pontos</small></span>
          <h2>${icon('flame', 'sec-ic')}Use seus pontos</h2>
          <a class="sec-link" href="#recompensas">Ver todas ${icon('chevron')}</a>
        </div>
        <div class="hscroll">
          ${REWARDS.map((r) => `
            <a class="offer-card" href="#recompensas">
              <div class="offer-art">${art(r.art)}</div>
              <h3>${esc(r.name)}</h3>
              <div class="offer-price">${r.price ? `${money(r.price)} + ` : ''}${r.points} pts</div>
              ${r.price ? `<span class="earn">Ganhe ${Math.floor(r.price)} pontos ${icon('flame')}</span>` : ''}
            </a>`).join('')}
        </div>
      </section>`;
  }

  function renderCoupons(el) {
    el.innerHTML = `
      ${appBar('Cupons', { store: true })}
      ${OFFER_SECTIONS.map((s) => {
        const list = OFFERS.filter((o) => o.section === s.id);
        return `
        <section>
          ${sectionHead(s.name, `#secao-${s.id}`)}
          <div class="hscroll">${list.map((o) => offerCard(o, s.dark)).join('')}</div>
        </section>`;
      }).join('')}
      ${useYourPoints()}`;
  }

  function renderSection(el, id) {
    const s = OFFER_SECTIONS.find((x) => x.id === id);
    if (!s) { location.hash = '#cupons'; return; }
    el.innerHTML = `
      ${appBar(s.name, { back: '#cupons', store: true })}
      <div class="offer-grid">${OFFERS.filter((o) => o.section === id).map((o) => offerCard(o, s.dark)).join('')}</div>`;
  }

  function memberCodeArt() {
    // Padrão visual gerado a partir do código de membro (decorativo)
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
      ${appBar('Clube Brasa', { brand: true })}
      <div class="club-sheet">
        <div class="member">
          <div class="member-code">${memberCodeArt()}</div>
          <div class="grow">
            <p class="muted small">Pontuações e recompensas de:</p>
            <p class="member-name">${esc(state.name || 'Visitante')}</p>
            <p class="muted small">Código de membro <code>${esc(state.memberCode)}</code></p>
          </div>
        </div>
        <div class="club-points">
          <p><b data-points>${state.points}</b> pontos</p>
          <a class="btn btn-outline" href="#extrato">Extrato</a>
        </div>
        <p class="notice">${icon('info')} Seus pontos entram assim que o pedido é feito. Confira tudo no extrato.</p>
        ${milestones()}
        <a class="btn btn-primary block" href="#recompensas">Ver recompensas</a>
      </div>
      <section class="club-highlights">
        <h2 class="speech">Destaques</h2>
        <div class="hscroll center-snap">
          ${REWARDS.slice().sort((a, b) => b.points - a.points).map((r) => `
            <a class="highlight-card" href="#recompensas">
              <div class="offer-art">${art(r.art)}</div>
              <h3>${esc(r.name)}</h3>
              <span class="hl-pts">${r.points} pontos${r.price ? ` + ${money(r.price)}` : ''}</span>
            </a>`).join('')}
        </div>
      </section>
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
        ${REWARDS.map((r) => {
          const ok = availablePoints() >= r.points;
          return `
          <div class="card reward-row">
            <div class="thumb">${art(r.art)}</div>
            <div class="grow">
              <h3>${esc(r.name)}</h3>
              <p class="small muted">${r.points} pontos${r.price ? ` + ${money(r.price)}` : ''}</p>
              ${ok ? '' : `<p class="small lock-note">${icon('lock')} Faltam ${r.points - availablePoints()} pts</p>`}
            </div>
            <button class="btn ${ok ? 'btn-primary' : 'btn-outline'} btn-sm" type="button" data-reward="${r.id}" ${ok ? '' : 'disabled'}>Resgatar</button>
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
            <div class="thumb">${art(itemArt(i))}</div>
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
      const mode = form.mode.value;
      const s = store();
      $('#mode-hint', el).textContent = mode === 'drive'
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
        id: uid(),
        code: String(100 + Math.floor(Math.random() * 900)),
        createdAt: Date.now(),
        items: state.cart.map((i) => ({ name: itemName(i), qty: i.qty, details: itemDetails(i), total: unitPrice(i) * i.qty, raw: i })),
        total: sub, store: s, mode, name, payment: form.pay.value, earned, spent,
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
        o.items.forEach((i) => { if (i.raw && i.raw.kind !== 'reward') { const { key, ...rest } = i.raw; addToCart(rest); } });
        toast('Itens adicionados à sacola');
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
      <div class="card">
        <h3 class="card-title">Código de membro</h3>
        <p><code>${esc(state.memberCode)}</code></p>
      </div>`;
    $('#profile', el).addEventListener('submit', (e) => {
      e.preventDefault();
      state.name = e.target.name.value.trim();
      save();
      toast('Dados salvos');
    });
  }

  // ---------- Janelas sobrepostas ----------
  function openModal(id) { $(id).classList.add('open'); $(id).setAttribute('aria-hidden', 'false'); }
  function closeModal(el) { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-close]');
    if (t) closeModal(t.closest('.modal'));
    if (e.target.classList.contains('modal')) closeModal(e.target);
    if (e.target.closest('[data-open-store]')) openStorePicker();
    if (e.target.closest('[data-open-drawer]')) openDrawer();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal.open').forEach(closeModal); });

  function openStorePicker() {
    const list = $('#store-list');
    list.innerHTML = STORES.map((s) => `
      <label class="opt store-opt">
        <input type="radio" name="store" value="${s.id}" ${s.id === state.storeId ? 'checked' : ''}>
        <span><b>${esc(s.name)}</b><small>${esc(s.address)}</small></span>
        ${s.drive ? '<span class="pill">Drive-thru</span>' : ''}
      </label>`).join('');
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
        <a href="${IFOOD_URL}" target="_blank" rel="noopener">Delivery pelo iFood ${icon('chevron')}</a>
      </nav>
      <button class="btn btn-ghost-danger" type="button" id="reset">Apagar meus dados</button>
      <p class="small muted">Brasa Burger · app de demonstração</p>`;
    $('#replay-intro').onclick = () => { closeModal($('#drawer')); showOnboarding(); };
    const reset = $('#reset');
    reset.onclick = () => {
      if (reset.dataset.armed) {
        state = defaultState(); save(); closeModal($('#drawer')); location.hash = '#inicio'; router(); showOnboarding();
      } else { reset.dataset.armed = '1'; reset.textContent = 'Toque de novo para confirmar'; }
    };
    openModal('#drawer');
  }

  let promoShownThisSession = false;
  function maybeShowPromo() {
    if (!state.onboarded || promoShownThisSession) return;
    try { if (sessionStorage.getItem('brasa-promo')) return; sessionStorage.setItem('brasa-promo', '1'); } catch (e) { /* ignora */ }
    promoShownThisSession = true;
    $('#promo-art').innerHTML = art({ type: 'shake' });
    setTimeout(() => openModal('#promo'), 600);
  }

  // ---------- Apresentação (primeiro acesso) ----------
  function showOnboarding() {
    const ob = $('#onboarding');
    let slide = 0;
    const total = 3;
    const go = (i) => {
      slide = i;
      $$('.ob-slide', ob).forEach((s, j) => { s.hidden = j !== i; });
      $$('.ob-dots span', ob).forEach((d, j) => d.classList.toggle('on', j === i));
      $('#ob-next').textContent = i === total - 1 ? 'Começar' : 'Saiba mais';
      if (i === total - 1) setTimeout(() => $('#ob-name').focus(), 50);
    };
    $('#ob-art-1').innerHTML = art({ type: 'combo', main: { type: 'burger', layers: L.classic } });
    $('#ob-art-2').innerHTML = art({ type: 'group', items: [{ type: 'drink' }, { type: 'burger', layers: L.duplo }] });
    $('#ob-art-3').innerHTML = art({ type: 'cone' });
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

  // ---------- Inicialização ----------
  $('#bagbar').addEventListener('click', () => { location.hash = '#sacola'; });
  $('#delivery-tab').href = IFOOD_URL;
  $('#promo-shake').onclick = () => { closeModal($('#promo')); location.hash = '#cupom-o-shake40'; };
  $('#promo-mix').onclick = () => { closeModal($('#promo')); location.hash = '#cupom-o-mix10'; };
  window.addEventListener('hashchange', router);
  window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) { state = load(); router(); } });
  router();
  if (!state.onboarded) showOnboarding();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
