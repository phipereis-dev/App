// Brasa Burger — app de pedidos (HTML/CSS/JS puro)
(() => {
  'use strict';

  // ---------- Estado persistido ----------
  const STORE_KEY = 'brasa-burger-v1';
  const defaultState = () => ({
    cart: [],
    orders: [],
    points: 200, // bônus de boas-vindas
    coupon: null,
    profile: { name: '', street: '', number: '', district: '', complement: '' },
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
    updateBadges();
  }

  // ---------- Utilidades ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const money = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const product = (id) => PRODUCTS.find((p) => p.id === id);
  const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ---------- Carrinho e totais ----------
  function lineUnitPrice(item) {
    const p = product(item.productId);
    if (item.reward) return 0;
    let price = p.price;
    if (item.size) price += (SIZES.find((s) => s.id === item.size)?.add || 0);
    const extras = EXTRAS[p.extras] || [];
    item.extras.forEach((id) => { price += extras.find((e) => e.id === id)?.price || 0; });
    return price;
  }

  const cartCount = () => state.cart.reduce((n, i) => n + i.qty, 0);
  const subtotal = () => state.cart.reduce((s, i) => s + lineUnitPrice(i) * i.qty, 0);
  const reservedPoints = () => state.cart.filter((i) => i.reward).reduce((s, i) => s + i.rewardCost * i.qty, 0);
  const availablePoints = () => state.points - reservedPoints();

  function couponDiscount(code, mode) {
    const c = COUPONS.find((x) => x.code === code);
    if (!c) return { ok: false, msg: 'Cupom inválido.' };
    const sub = subtotal();
    if (sub < c.min) return { ok: false, msg: `Pedido mínimo de ${money(c.min)} para este cupom.` };
    if (c.type === 'percent') return { ok: true, discount: +(sub * c.value / 100).toFixed(2), freeDelivery: false };
    if (c.type === 'fixed') return { ok: true, discount: Math.min(c.value, sub), freeDelivery: false };
    if (c.type === 'delivery') return { ok: true, discount: 0, freeDelivery: true, msg: mode === 'pickup' ? 'Entrega grátis só vale para pedidos com entrega.' : '' };
    if (c.type === 'combo') {
      const combos = state.cart.filter((i) => product(i.productId).cat === 'combos' && !i.reward).reduce((n, i) => n + i.qty, 0);
      if (combos < 2) return { ok: false, msg: 'Adicione pelo menos 2 combos para usar este cupom.' };
      return { ok: true, discount: Math.min(c.value, sub), freeDelivery: false };
    }
    return { ok: false, msg: 'Cupom inválido.' };
  }

  function totals(mode = 'delivery') {
    const sub = subtotal();
    let discount = 0;
    let fee = mode === 'delivery' && state.cart.length ? DELIVERY_FEE : 0;
    let couponMsg = '';
    if (state.coupon) {
      const r = couponDiscount(state.coupon, mode);
      if (r.ok) {
        discount = r.discount;
        if (r.freeDelivery) fee = 0;
        couponMsg = r.msg || '';
      } else couponMsg = r.msg;
    }
    return { sub, discount, fee, total: Math.max(0, sub - discount + fee), couponMsg };
  }

  function addToCart(item) {
    const key = JSON.stringify([item.productId, item.size, [...item.removed].sort(), [...item.extras].sort(), !!item.reward]);
    const existing = state.cart.find((i) => i.key === key);
    if (existing) existing.qty += item.qty;
    else state.cart.push({ ...item, key });
    save();
  }

  // ---------- Roteamento ----------
  const routes = {
    '': renderHome,
    menu: renderMenu,
    produto: renderProduct,
    carrinho: renderCart,
    checkout: renderCheckout,
    pedido: renderOrder,
    pedidos: renderOrders,
    cupons: renderCoupons,
    pontos: renderRewards,
  };

  let trackingTimer = null;

  function router() {
    clearInterval(trackingTimer);
    // Rotas no formato #tela ou #tela-parametro (ex.: #produto-duplo-fogo)
    const hash = location.hash.slice(1);
    const cut = hash.indexOf('-');
    let path = cut < 0 ? hash : hash.slice(0, cut);
    const param = cut < 0 ? undefined : decodeURIComponent(hash.slice(cut + 1));
    if (!routes[path]) path = '';
    const view = routes[path];
    // Novo container a cada tela para não acumular listeners da tela anterior
    const old = $('#view');
    const main = old.cloneNode(false);
    old.replaceWith(main);
    view(main, param);
    window.scrollTo(0, 0);
    $$('.tabbar a').forEach((a) => {
      const target = a.getAttribute('href').slice(1);
      a.classList.toggle('active', target === path || (target === 'inicio' && path === '') || (target === 'pedidos' && path === 'pedido'));
    });
    updateBadges();
  }

  function updateBadges() {
    const n = cartCount();
    $$('[data-cart-count]').forEach((el) => { el.textContent = n; el.hidden = n === 0; });
    $$('[data-points]').forEach((el) => { el.textContent = state.points; });
  }

  // ---------- Componentes ----------
  const productCard = (p) => `
    <a class="card product-card" href="#produto-${p.id}">
      <div class="product-art" aria-hidden="true">${p.emoji}</div>
      <div class="product-info">
        ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
        <h3>${esc(p.name)}</h3>
        <p class="muted clamp">${esc(p.desc)}</p>
        <div class="row-between">
          <strong class="price">${money(p.price)}</strong>
          <span class="add-btn" aria-hidden="true">+</span>
        </div>
      </div>
    </a>`;

  const emptyState = (icon, title, text, cta, href) => `
    <div class="empty">
      <div class="empty-icon" aria-hidden="true">${icon}</div>
      <h2>${title}</h2>
      <p class="muted">${text}</p>
      ${cta ? `<a class="btn btn-primary" href="${href}">${cta}</a>` : ''}
    </div>`;

  // ---------- Telas ----------
  function renderHome(el) {
    const featured = ['duplo-fogo', 'combo-classico', 'picante', 'crispy'].map(product);
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const name = state.profile.name ? `, ${esc(state.profile.name.split(' ')[0])}` : '';
    el.innerHTML = `
      <section class="hero">
        <p class="hero-greet">${greet}${name}! 👋</p>
        <h1>Feito na brasa,<br>do jeito que você quer.</h1>
        <p>Monte seu lanche, junte pontos e receba quentinho em casa.</p>
        <a class="btn btn-light" href="#menu">Ver cardápio</a>
        <div class="hero-art" aria-hidden="true">🍔</div>
      </section>

      <section class="promo-strip" aria-label="Promoções">
        <a class="promo promo-a" href="#cupons"><strong>10% OFF</strong><span>com BRASA10</span></a>
        <a class="promo promo-b" href="#cupons"><strong>Entrega grátis</strong><span>com ENTREGA0</span></a>
        <a class="promo promo-c" href="#pontos"><strong>${state.points} pts</strong><span>troque por lanches</span></a>
      </section>

      <section>
        <h2 class="section-title">Categorias</h2>
        <div class="cat-grid">
          ${CATEGORIES.map((c) => `<a class="cat" href="#menu-${c.id}"><span aria-hidden="true">${c.icon}</span>${c.name}</a>`).join('')}
        </div>
      </section>

      <section>
        <div class="row-between"><h2 class="section-title">Destaques</h2><a class="link" href="#menu">Ver tudo</a></div>
        <div class="product-list">${featured.map(productCard).join('')}</div>
      </section>`;
  }

  function renderMenu(el, catId = CATEGORIES[0].id) {
    if (!CATEGORIES.some((c) => c.id === catId)) catId = CATEGORIES[0].id;
    el.innerHTML = `
      <h1 class="page-title">Cardápio</h1>
      <label class="search"><span aria-hidden="true">🔎</span><input id="search" type="search" placeholder="Buscar no cardápio" autocomplete="off"></label>
      <nav class="chips" aria-label="Categorias">
        ${CATEGORIES.map((c) => `<a class="chip ${c.id === catId ? 'active' : ''}" href="#menu-${c.id}">${c.icon} ${c.name}</a>`).join('')}
      </nav>
      <div class="product-list" id="menu-list"></div>`;
    const list = $('#menu-list', el);
    const draw = (q = '') => {
      const term = q.trim().toLowerCase();
      const items = term
        ? PRODUCTS.filter((p) => (p.name + ' ' + p.desc).toLowerCase().includes(term))
        : PRODUCTS.filter((p) => p.cat === catId);
      list.innerHTML = items.length ? items.map(productCard).join('') : `<p class="muted center">Nenhum item encontrado.</p>`;
    };
    $('#search', el).addEventListener('input', (e) => draw(e.target.value));
    $('.chips .active', el)?.scrollIntoView({ inline: 'center', block: 'nearest' });
    draw();
  }

  function renderProduct(el, id) {
    const p = product(id);
    if (!p) { el.innerHTML = emptyState('🤔', 'Produto não encontrado', 'Esse item não está mais no cardápio.', 'Voltar ao cardápio', '#menu'); return; }
    const extras = EXTRAS[p.extras] || [];
    const hasSize = p.sized || p.cat === 'combos' && p.combo;
    const sel = { qty: 1, size: hasSize ? 'M' : null, removed: new Set(), extras: new Set() };

    el.innerHTML = `
      <a class="back" href="#menu-${p.cat}">← Voltar</a>
      <div class="detail-art" aria-hidden="true">${p.emoji}</div>
      <div class="detail-head">
        ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
        <h1>${esc(p.name)}</h1>
        <p class="muted">${esc(p.desc)}</p>
        <p class="kcal">${p.kcal} kcal</p>
      </div>

      ${hasSize ? `
      <fieldset class="opt-group">
        <legend>${p.combo ? 'Tamanho do combo (batata e bebida)' : 'Tamanho'}</legend>
        ${SIZES.map((s) => `
          <label class="opt">
            <input type="radio" name="size" value="${s.id}" ${s.id === sel.size ? 'checked' : ''}>
            <span>${s.name}</span><span class="muted">${s.add ? '+ ' + money(s.add) : 'incluso'}</span>
          </label>`).join('')}
      </fieldset>` : ''}

      ${p.ingredients.length ? `
      <fieldset class="opt-group">
        <legend>Ingredientes <small>desmarque para remover</small></legend>
        ${p.ingredients.map((ing) => `
          <label class="opt">
            <input type="checkbox" name="ing" value="${esc(ing)}" checked>
            <span>${esc(ing)}</span>
          </label>`).join('')}
      </fieldset>` : ''}

      ${extras.length ? `
      <fieldset class="opt-group">
        <legend>Turbine seu pedido</legend>
        ${extras.map((x) => `
          <label class="opt">
            <input type="checkbox" name="extra" value="${x.id}">
            <span>${esc(x.name)}</span><span class="muted">+ ${money(x.price)}</span>
          </label>`).join('')}
      </fieldset>` : ''}

      <div class="sticky-cta">
        <div class="stepper" role="group" aria-label="Quantidade">
          <button type="button" data-step="-1" aria-label="Diminuir">−</button>
          <output id="qty">1</output>
          <button type="button" data-step="1" aria-label="Aumentar">+</button>
        </div>
        <button class="btn btn-primary grow" id="add">Adicionar <span id="line-total"></span></button>
      </div>`;

    const refresh = () => {
      $('#qty', el).textContent = sel.qty;
      const unit = lineUnitPrice({ productId: p.id, size: sel.size, extras: [...sel.extras] });
      $('#line-total', el).textContent = money(unit * sel.qty);
    };
    el.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'size') sel.size = t.value;
      if (t.name === 'ing') t.checked ? sel.removed.delete(t.value) : sel.removed.add(t.value);
      if (t.name === 'extra') t.checked ? sel.extras.add(t.value) : sel.extras.delete(t.value);
      refresh();
    });
    $$('[data-step]', el).forEach((b) => b.addEventListener('click', () => {
      sel.qty = Math.min(20, Math.max(1, sel.qty + Number(b.dataset.step)));
      refresh();
    }));
    $('#add', el).addEventListener('click', () => {
      addToCart({ productId: p.id, qty: sel.qty, size: sel.size, removed: [...sel.removed], extras: [...sel.extras] });
      toast(`${p.name} adicionado ao carrinho`);
      location.hash = `#menu-${p.cat}`;
    });
    refresh();
  }

  function itemDetails(item) {
    const p = product(item.productId);
    const parts = [];
    if (item.size) parts.push(SIZES.find((s) => s.id === item.size).name);
    item.removed.forEach((r) => parts.push(`sem ${r.toLowerCase()}`));
    const ex = EXTRAS[p.extras] || [];
    item.extras.forEach((id) => parts.push(`+ ${ex.find((e) => e.id === id)?.name.toLowerCase()}`));
    if (item.reward) parts.push(`resgatado com ${item.rewardCost} pts`);
    return parts.join(' · ');
  }

  function renderCart(el) {
    if (!state.cart.length) {
      el.innerHTML = emptyState('🛒', 'Seu carrinho está vazio', 'Que tal um Brasa Clássico saindo da grelha?', 'Ver cardápio', '#menu');
      return;
    }
    const t = totals('delivery');
    el.innerHTML = `
      <h1 class="page-title">Carrinho</h1>
      <ul class="cart-list">
        ${state.cart.map((i, idx) => {
          const p = product(i.productId);
          return `
          <li class="card cart-item">
            <div class="cart-art" aria-hidden="true">${p.emoji}</div>
            <div class="grow">
              <h3>${esc(p.name)}</h3>
              <p class="muted small">${esc(itemDetails(i)) || '&nbsp;'}</p>
              <div class="row-between">
                <strong>${i.reward ? 'Grátis' : money(lineUnitPrice(i) * i.qty)}</strong>
                <div class="stepper small" role="group" aria-label="Quantidade de ${esc(p.name)}">
                  <button type="button" data-idx="${idx}" data-d="-1" aria-label="Diminuir">${i.qty === 1 ? '🗑' : '−'}</button>
                  <output>${i.qty}</output>
                  <button type="button" data-idx="${idx}" data-d="1" aria-label="Aumentar">+</button>
                </div>
              </div>
            </div>
          </li>`;
        }).join('')}
      </ul>

      <form class="card coupon-form" id="coupon-form">
        <label for="coupon">Cupom de desconto</label>
        <div class="row">
          <input id="coupon" name="coupon" placeholder="Ex.: BRASA10" value="${esc(state.coupon || '')}" autocapitalize="characters">
          ${state.coupon ? `<button class="btn btn-ghost" type="button" id="rm-coupon">Remover</button>` : `<button class="btn btn-dark" type="submit">Aplicar</button>`}
        </div>
        ${t.couponMsg ? `<p class="small warn">${esc(t.couponMsg)}</p>` : state.coupon ? `<p class="small ok">Cupom ${esc(state.coupon)} aplicado ✓</p>` : ''}
      </form>

      <div class="card summary">
        <div class="row-between"><span>Subtotal</span><span>${money(t.sub)}</span></div>
        ${t.discount ? `<div class="row-between ok"><span>Desconto</span><span>− ${money(t.discount)}</span></div>` : ''}
        <div class="row-between muted"><span>Entrega (estimada)</span><span>${t.fee ? money(t.fee) : 'Grátis'}</span></div>
        <div class="row-between total"><span>Total</span><span>${money(t.total)}</span></div>
      </div>

      <div class="sticky-cta">
        <a class="btn btn-ghost" href="#menu">Adicionar mais</a>
        <a class="btn btn-primary grow" href="#checkout">Continuar · ${money(t.total)}</a>
      </div>`;

    $$('[data-idx]', el).forEach((b) => b.addEventListener('click', () => {
      const item = state.cart[Number(b.dataset.idx)];
      const d = Number(b.dataset.d);
      if (d > 0 && item.reward && availablePoints() < item.rewardCost) { toast('Pontos insuficientes'); return; }
      item.qty += d;
      if (item.qty <= 0) state.cart.splice(Number(b.dataset.idx), 1);
      save(); router();
    }));
    $('#coupon-form', el).addEventListener('submit', (e) => {
      e.preventDefault();
      const code = $('#coupon', el).value.trim().toUpperCase();
      if (!code) return;
      const r = couponDiscount(code, 'delivery');
      if (!r.ok) { toast(r.msg); return; }
      state.coupon = code; save(); toast('Cupom aplicado!'); router();
    });
    $('#rm-coupon', el)?.addEventListener('click', () => { state.coupon = null; save(); router(); });
  }

  const STORES = [
    'Brasa Burger — Av. Paulista, 1000',
    'Brasa Burger — Shopping Centro Norte',
    'Brasa Burger — Rua das Flores, 250',
  ];

  function renderCheckout(el) {
    if (!state.cart.length) { location.hash = '#carrinho'; return; }
    const pr = state.profile;
    let mode = 'delivery';
    el.innerHTML = `
      <a class="back" href="#carrinho">← Carrinho</a>
      <h1 class="page-title">Finalizar pedido</h1>
      <form id="checkout" novalidate>
        <div class="segmented" role="radiogroup" aria-label="Tipo de pedido">
          <label><input type="radio" name="mode" value="delivery" checked><span>🛵 Entrega</span></label>
          <label><input type="radio" name="mode" value="pickup"><span>🏪 Retirada</span></label>
        </div>

        <fieldset class="card form-card">
          <legend>Seus dados</legend>
          <label>Nome<input name="name" required value="${esc(pr.name)}" autocomplete="name"></label>
        </fieldset>

        <fieldset class="card form-card" id="address-box">
          <legend>Endereço de entrega</legend>
          <label>Rua<input name="street" value="${esc(pr.street)}" autocomplete="address-line1"></label>
          <div class="row">
            <label class="w-30">Número<input name="number" value="${esc(pr.number)}" inputmode="numeric"></label>
            <label class="grow">Bairro<input name="district" value="${esc(pr.district)}"></label>
          </div>
          <label>Complemento (opcional)<input name="complement" value="${esc(pr.complement)}" autocomplete="address-line2"></label>
        </fieldset>

        <fieldset class="card form-card" id="store-box" hidden>
          <legend>Restaurante para retirada</legend>
          ${STORES.map((s, i) => `<label class="opt"><input type="radio" name="store" value="${esc(s)}" ${i === 0 ? 'checked' : ''}><span>${esc(s)}</span></label>`).join('')}
        </fieldset>

        <fieldset class="card form-card">
          <legend>Pagamento <small>na entrega/retirada</small></legend>
          <label class="opt"><input type="radio" name="pay" value="Pix" checked><span>⚡ Pix</span></label>
          <label class="opt"><input type="radio" name="pay" value="Cartão (maquininha)"><span>💳 Cartão na maquininha</span></label>
          <label class="opt"><input type="radio" name="pay" value="Dinheiro"><span>💵 Dinheiro</span></label>
          <label id="change-box" hidden>Troco para quanto?<input name="change" inputmode="decimal" placeholder="Ex.: 100"></label>
        </fieldset>

        <div class="card summary" id="summary"></div>
        <p class="small muted center">Este é um app de demonstração: nenhum pedido real é enviado e nenhum pagamento é cobrado.</p>

        <div class="sticky-cta">
          <button class="btn btn-primary grow" type="submit" id="place">Fazer pedido</button>
        </div>
      </form>`;

    const form = $('#checkout', el);
    const drawSummary = () => {
      const t = totals(mode);
      $('#summary', el).innerHTML = `
        <div class="row-between"><span>Subtotal</span><span>${money(t.sub)}</span></div>
        ${t.discount ? `<div class="row-between ok"><span>Desconto (${esc(state.coupon)})</span><span>− ${money(t.discount)}</span></div>` : ''}
        ${mode === 'delivery' ? `<div class="row-between"><span>Entrega</span><span>${t.fee ? money(t.fee) : 'Grátis'}</span></div>` : ''}
        <div class="row-between total"><span>Total</span><span>${money(t.total)}</span></div>
        <p class="small muted">Você ganha <strong>${Math.floor(t.total)} pontos</strong> com este pedido.</p>`;
      $('#place', el).textContent = `Fazer pedido · ${money(t.total)}`;
    };
    form.addEventListener('change', (e) => {
      if (e.target.name === 'mode') {
        mode = e.target.value;
        $('#address-box', el).hidden = mode !== 'delivery';
        $('#store-box', el).hidden = mode !== 'pickup';
        drawSummary();
      }
      if (e.target.name === 'pay') $('#change-box', el).hidden = e.target.value !== 'Dinheiro';
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const missing = [];
      if (!fd.name.trim()) missing.push('name');
      if (mode === 'delivery') ['street', 'number', 'district'].forEach((k) => { if (!fd[k].trim()) missing.push(k); });
      $$('input', form).forEach((i) => i.classList.toggle('invalid', missing.includes(i.name)));
      if (missing.length) { toast('Preencha os campos destacados'); form.querySelector('.invalid')?.focus(); return; }

      state.profile = { name: fd.name.trim(), street: fd.street?.trim() || pr.street, number: fd.number?.trim() || pr.number, district: fd.district?.trim() || pr.district, complement: fd.complement?.trim() || '' };
      const t = totals(mode);
      const earned = Math.floor(t.total);
      const order = {
        id: uid(),
        createdAt: Date.now(),
        items: state.cart.map((i) => ({ name: product(i.productId).name, emoji: product(i.productId).emoji, qty: i.qty, details: itemDetails(i), total: lineUnitPrice(i) * i.qty })),
        ...t,
        coupon: state.coupon,
        mode,
        destination: mode === 'delivery' ? `${fd.street}, ${fd.number} — ${fd.district}${fd.complement ? ' (' + fd.complement + ')' : ''}` : fd.store,
        payment: fd.pay + (fd.pay === 'Dinheiro' && fd.change ? ` (troco para R$ ${fd.change})` : ''),
        earned,
      };
      state.points = state.points - reservedPoints() + earned;
      state.orders.unshift(order);
      state.cart = [];
      state.coupon = null;
      save();
      $('#toast').classList.remove('show');
      location.hash = `#pedido-${order.id}`;
    });
    drawSummary();
  }

  function orderSteps(order) {
    const secs = (Date.now() - order.createdAt) / 1000;
    const last = order.mode === 'delivery' ? ['Saiu para entrega', '🛵'] : ['Pronto para retirada', '🛍️'];
    const steps = [['Pedido recebido', '🧾', 0], ['Preparando na brasa', '🔥', 15], [last[0], last[1], 45], [order.mode === 'delivery' ? 'Entregue' : 'Retirado', '✅', 90]];
    let current = 0;
    steps.forEach((s, i) => { if (secs >= s[2]) current = i; });
    return { steps, current, done: current === steps.length - 1 };
  }

  function renderOrder(el, id) {
    const order = state.orders.find((o) => o.id === id);
    if (!order) { el.innerHTML = emptyState('🧾', 'Pedido não encontrado', '', 'Meus pedidos', '#pedidos'); return; }
    const draw = () => {
      const { steps, current, done } = orderSteps(order);
      el.innerHTML = `
        <a class="back" href="#pedidos">← Meus pedidos</a>
        <div class="order-hero ${done ? 'done' : ''}">
          <div class="order-hero-icon" aria-hidden="true">${steps[current][1]}</div>
          <p class="muted small">Pedido #${order.id}</p>
          <h1>${steps[current][0]}</h1>
          ${!done ? `<p class="muted">${order.mode === 'delivery' ? 'Previsão de entrega: 25–35 min' : 'Previsão para retirada: 15 min'}</p>` : `<p class="muted">Bom apetite! 🍔 Você ganhou ${order.earned} pontos.</p>`}
        </div>
        <ol class="timeline" aria-label="Status do pedido">
          ${steps.map((s, i) => `<li class="${i < current ? 'past' : i === current ? 'current' : ''}"><span class="dot"></span>${s[0]}</li>`).join('')}
        </ol>
        <div class="card">
          <h2 class="card-title">${order.mode === 'delivery' ? 'Entregar em' : 'Retirar em'}</h2>
          <p>${esc(order.destination)}</p>
          <h2 class="card-title">Pagamento</h2>
          <p>${esc(order.payment)}</p>
        </div>
        <div class="card summary">
          ${order.items.map((i) => `<div class="row-between"><span>${i.qty}× ${i.emoji} ${esc(i.name)}${i.details ? `<br><small class="muted">${esc(i.details)}</small>` : ''}</span><span>${i.total ? money(i.total) : 'Grátis'}</span></div>`).join('')}
          <hr>
          ${order.discount ? `<div class="row-between ok"><span>Desconto</span><span>− ${money(order.discount)}</span></div>` : ''}
          ${order.mode === 'delivery' ? `<div class="row-between"><span>Entrega</span><span>${order.fee ? money(order.fee) : 'Grátis'}</span></div>` : ''}
          <div class="row-between total"><span>Total</span><span>${money(order.total)}</span></div>
        </div>
        ${done ? `<button class="btn btn-primary block" id="reorder">Pedir de novo</button>` : ''}`;
      $('#reorder', el)?.addEventListener('click', () => reorder(order));
      if (done) clearInterval(trackingTimer);
    };
    draw();
    trackingTimer = setInterval(draw, 3000);
  }

  function reorder(order) {
    let added = 0;
    order.items.forEach((i) => {
      const p = PRODUCTS.find((x) => x.name === i.name);
      if (p && i.total > 0) { addToCart({ productId: p.id, qty: i.qty, size: p.sized || p.combo ? 'M' : null, removed: [], extras: [] }); added++; }
    });
    toast(added ? 'Itens adicionados ao carrinho' : 'Nada para adicionar');
    location.hash = '#carrinho';
  }

  function renderOrders(el) {
    if (!state.orders.length) {
      el.innerHTML = emptyState('🧾', 'Nenhum pedido ainda', 'Seus pedidos aparecem aqui para você acompanhar.', 'Fazer meu primeiro pedido', '#menu');
      return;
    }
    el.innerHTML = `
      <h1 class="page-title">Meus pedidos</h1>
      <ul class="order-list">
        ${state.orders.map((o) => {
          const { steps, current, done } = orderSteps(o);
          return `
          <li><a class="card order-card" href="#pedido-${o.id}">
            <div class="row-between"><strong>#${o.id}</strong><span class="status ${done ? 'done' : 'live'}">${steps[current][0]}</span></div>
            <p class="muted small">${new Date(o.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · ${o.mode === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            <p class="small">${o.items.map((i) => `${i.qty}× ${esc(i.name)}`).join(', ')}</p>
            <strong>${money(o.total)}</strong>
          </a></li>`;
        }).join('')}
      </ul>`;
  }

  function renderCoupons(el) {
    el.innerHTML = `
      <h1 class="page-title">Cupons</h1>
      <p class="muted">Toque em um cupom para aplicá-lo ao seu carrinho.</p>
      <ul class="coupon-list">
        ${COUPONS.map((c) => `
          <li class="coupon ${state.coupon === c.code ? 'applied' : ''}">
            <div class="coupon-left"><span aria-hidden="true">🏷️</span></div>
            <div class="grow">
              <h3>${esc(c.title)}</h3>
              <p class="muted small">${esc(c.desc)}</p>
              <code>${c.code}</code>
            </div>
            <button class="btn ${state.coupon === c.code ? 'btn-ghost' : 'btn-dark'}" data-code="${c.code}">${state.coupon === c.code ? 'Aplicado' : 'Usar'}</button>
          </li>`).join('')}
      </ul>`;
    $$('[data-code]', el).forEach((b) => b.addEventListener('click', () => {
      state.coupon = state.coupon === b.dataset.code ? null : b.dataset.code;
      save();
      toast(state.coupon ? `Cupom ${state.coupon} selecionado` : 'Cupom removido');
      router();
    }));
  }

  function renderRewards(el) {
    const avail = availablePoints();
    const next = REWARDS.find((r) => r.cost > state.points);
    el.innerHTML = `
      <h1 class="page-title">Brasa Pontos</h1>
      <div class="points-card">
        <p>Seu saldo</p>
        <strong>${state.points} <small>pontos</small></strong>
        ${next ? `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${next.cost}" aria-valuenow="${state.points}"><span style="width:${Math.min(100, (state.points / next.cost) * 100)}%"></span></div>
        <p class="small">Faltam ${next.cost - state.points} pontos para ${esc(product(next.productId).name)}</p>` : '<p class="small">Você pode resgatar qualquer recompensa! 🎉</p>'}
        <p class="small">Ganhe 1 ponto a cada R$ 1 gasto.</p>
      </div>
      <h2 class="section-title">Troque seus pontos</h2>
      <ul class="reward-list">
        ${REWARDS.map((r) => {
          const p = product(r.productId);
          return `
          <li class="card reward">
            <div class="cart-art" aria-hidden="true">${p.emoji}</div>
            <div class="grow"><h3>${esc(p.name)}</h3><p class="muted small">${r.cost} pontos</p></div>
            <button class="btn btn-dark" data-reward="${r.id}" ${avail < r.cost ? 'disabled' : ''}>Resgatar</button>
          </li>`;
        }).join('')}
      </ul>
      ${reservedPoints() ? `<p class="small muted center">${reservedPoints()} pontos reservados para recompensas no carrinho.</p>` : ''}`;
    $$('[data-reward]', el).forEach((b) => b.addEventListener('click', () => {
      const r = REWARDS.find((x) => x.id === b.dataset.reward);
      if (availablePoints() < r.cost) { toast('Pontos insuficientes'); return; }
      const p = product(r.productId);
      addToCart({ productId: p.id, qty: 1, size: p.sized ? 'P' : null, removed: [], extras: [], reward: true, rewardCost: r.cost });
      toast(`${p.name} grátis adicionado ao carrinho`);
      router();
    }));
  }

  // ---------- Inicialização ----------
  window.addEventListener('hashchange', router);
  window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) { state = load(); router(); } });
  router();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
