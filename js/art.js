// Ilustrações vetoriais dos produtos (SVG gerado por código, sem imagens externas)
const Art = (() => {
  const C = {
    bun: '#e39a43', bunShade: '#c57a2a', seed: '#fff4dc', lettuce: '#5aa83c', tomato: '#e0452f',
    cheese: '#ffc93a', patty: '#5b3422', pattyLine: '#3f2216', bacon: '#b8432c', chicken: '#e0a24c',
    chickenDot: '#c4832f', onion: '#f5e7c8', sauce: '#f07a2a', veggie: '#7a8f3a',
    brand: '#e8590c', brandDark: '#a9400b', gold: '#ffc94d', cream: '#fff8ef', ink: '#2a1d16',
  };

  // Hambúrguer montado em camadas (de cima para baixo)
  function burger(layers = ['lettuce', 'tomato', 'cheese', 'patty']) {
    const parts = [];
    let y = 34;
    const wave = (yy, color, h = 7) => {
      let d = `M8 ${yy + 2}`;
      for (let x = 8; x < 112; x += 8) d += ` Q${x + 4} ${yy + h} ${x + 8} ${yy + 2}`;
      return `<path d="${d} L112 ${yy - 2} L8 ${yy - 2}Z" fill="${color}"/>`;
    };
    for (const l of layers) {
      if (l === 'lettuce') { parts.push(wave(y, C.lettuce)); y += 5; }
      else if (l === 'tomato') { parts.push(`<rect x="16" y="${y}" width="88" height="6" rx="3" fill="${C.tomato}"/>`); y += 6; }
      else if (l === 'onion') { parts.push(`<rect x="18" y="${y}" width="84" height="4" rx="2" fill="${C.onion}"/>`); y += 4; }
      else if (l === 'sauce') { parts.push(wave(y, C.sauce, 5)); y += 3; }
      else if (l === 'cheese') {
        parts.push(`<path d="M10 ${y} H110 L106 ${y + 5} L94 ${y + 5} L90 ${y + 12} L86 ${y + 5} L44 ${y + 5} L39 ${y + 10} L34 ${y + 5} L14 ${y + 5}Z" fill="${C.cheese}"/>`);
        y += 5;
      } else if (l === 'patty' || l === 'veggie') {
        const col = l === 'patty' ? C.patty : C.veggie;
        parts.push(`<rect x="9" y="${y}" width="102" height="13" rx="6.5" fill="${col}"/><path d="M22 ${y + 4} h14 M48 ${y + 8} h16 M74 ${y + 4} h14" stroke="${C.pattyLine}" stroke-width="2" stroke-linecap="round" opacity=".5"/>`);
        y += 13;
      } else if (l === 'bacon') {
        let d = `M12 ${y + 3}`;
        for (let x = 12; x < 108; x += 12) d += ` q6 -5 12 0`;
        parts.push(`<path d="${d}" stroke="${C.bacon}" stroke-width="5" fill="none" stroke-linecap="round"/>`);
        y += 6;
      } else if (l === 'chicken') {
        parts.push(`<rect x="6" y="${y}" width="108" height="15" rx="7.5" fill="${C.chicken}"/>` +
          [20, 36, 54, 72, 90, 102].map((x, i) => `<circle cx="${x}" cy="${y + 5 + (i % 2) * 5}" r="1.6" fill="${C.chickenDot}"/>`).join(''));
        y += 15;
      }
    }
    // pão de baixo
    parts.push(`<rect x="13" y="${y}" width="94" height="14" rx="7" fill="${C.bun}"/><rect x="13" y="${y + 8}" width="94" height="6" rx="3" fill="${C.bunShade}" opacity=".45"/>`);
    y += 14;
    // pão de cima por último (fica por cima das bordas)
    const seeds = [[40, 12], [56, 8], [72, 12], [48, 20], [66, 19], [82, 20], [32, 22], [88, 13]]
      .map(([x, yy]) => `<ellipse cx="${x}" cy="${yy}" rx="2.6" ry="1.4" fill="${C.seed}" transform="rotate(-20 ${x} ${yy})"/>`).join('');
    const top = `<path d="M12 36 Q12 0 60 0 Q108 0 108 36 Q108 38 104 38 L16 38 Q12 38 12 36Z" fill="${C.bun}"/><path d="M20 10 Q34 3 46 4" stroke="#fff" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>${seeds}`;
    return { vb: [0, -2, 120, y + 4], body: parts.reverse().join('') + top };
  }

  const fries = (box = C.brand) => ({
    vb: [0, 0, 80, 100],
    body:
      [[18, 14, -8], [26, 4, -4], [34, 10, -2], [42, 2, 2], [50, 8, 5], [58, 14, 9], [30, 18, 0], [46, 16, 3]]
        .map(([x, y, r]) => `<rect x="${x}" y="${y}" width="7" height="44" rx="2" fill="#f7c844" stroke="#e0a92a" stroke-width="1" transform="rotate(${r} ${x} ${y + 40})"/>`).join('') +
      `<path d="M8 40 Q40 50 72 40 L64 98 L16 98Z" fill="${box}"/><path d="M8 40 Q40 50 72 40" stroke="${C.brandDark}" stroke-width="2" fill="none"/>` +
      flameMark(40, 74, 0.9),
  });

  function flameMark(cx, cy, s = 1) {
    return `<g transform="translate(${cx} ${cy}) scale(${s})"><path d="M0 -12 C3 -6 9 -3 9 3 A9 9 0 0 1 -9 3 C-9 -1 -6 -3 -5 -6 C-4 -3 -2 -2 -1 -2 C-2 -6 -1 -9 0 -12Z" fill="${C.gold}"/></g>`;
  }

  const drink = (liquid = '#3b1d12') => ({
    vb: [0, 0, 70, 112],
    body:
      `<rect x="40" y="0" width="5" height="26" rx="2" fill="${C.brand}" transform="rotate(12 42 26)"/>` +
      `<rect x="6" y="18" width="58" height="8" rx="4" fill="#e9e1d6"/>` +
      `<path d="M10 26 L60 26 L54 108 L16 108Z" fill="#fff"/>` +
      `<path d="M12 50 L58 50 L55 86 L15 86Z" fill="${C.brand}"/>` + flameMark(35, 70, 0.9) +
      `<path d="M10 26 L60 26 L59 34 L11 34Z" fill="${liquid}" opacity=".15"/>`,
  });

  const shake = (top = '#8a4b2a', body = '#f3d9c4') => ({
    vb: [0, 0, 70, 120],
    body:
      `<circle cx="22" cy="20" r="10" fill="#fff"/><circle cx="35" cy="14" r="12" fill="#fff"/><circle cx="48" cy="20" r="10" fill="#fff"/>` +
      `<path d="M24 12 l3 -2 M36 8 l2 3 M44 14 l3 -1 M30 20 l2 2" stroke="${top}" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M10 26 L60 26 L54 116 L16 116Z" fill="${body}" stroke="#ffffff" stroke-opacity=".6" stroke-width="2"/>` +
      `<path d="M14 40 Q30 50 22 66 Q14 84 30 96 M46 34 Q38 56 50 70 Q58 84 46 106" stroke="${top}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`,
  });

  const cone = () => ({
    vb: [0, 0, 60, 110],
    body:
      `<path d="M14 50 L46 50 L30 108Z" fill="#d99a4e"/><path d="M18 58 L40 80 M42 58 L22 80 M24 50 L37 96 M36 50 L24 96" stroke="#b5762f" stroke-width="1.5"/>` +
      `<ellipse cx="30" cy="46" rx="20" ry="9" fill="${C.cream}"/><ellipse cx="30" cy="34" rx="15" ry="8" fill="${C.cream}"/><ellipse cx="30" cy="23" rx="10" ry="7" fill="${C.cream}"/><path d="M30 10 q4 4 0 9" fill="${C.cream}"/>` +
      `<path d="M18 40 q8 4 16 -2" stroke="#e7dccb" stroke-width="2" fill="none"/>`,
  });

  const sundae = (syrup = '#5a2d17') => ({
    vb: [0, 0, 80, 100],
    body:
      `<ellipse cx="40" cy="44" rx="26" ry="10" fill="${C.cream}"/><ellipse cx="40" cy="32" rx="19" ry="9" fill="${C.cream}"/><ellipse cx="40" cy="21" rx="12" ry="7" fill="${C.cream}"/>` +
      `<path d="M22 30 q4 10 8 2 q4 12 10 2 q6 10 10 0 q4 8 8 0" stroke="${syrup}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<path d="M10 48 L70 48 L62 96 L18 96Z" fill="#fff"/><path d="M14 62 L66 62 L63 78 L17 78Z" fill="${C.brand}"/>` + flameMark(40, 72, 0.6),
  });

  const mixCup = (bits = '#3a1f12') => ({
    vb: [0, 0, 80, 100],
    body:
      `<path d="M10 30 Q40 12 70 30 Z" fill="${C.cream}"/>` +
      [[24, 24], [34, 20], [46, 22], [56, 26], [40, 27], [30, 28]].map(([x, y]) => `<rect x="${x}" y="${y}" width="5" height="4" rx="1" fill="${bits}" transform="rotate(${x} ${x} ${y})"/>`).join('') +
      `<path d="M8 30 L72 30 L64 96 L16 96Z" fill="${C.brand}"/><path d="M12 44 L68 44 L66 58 L14 58Z" fill="${C.cream}" opacity=".9"/>` +
      `<text x="40" y="55" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="11" fill="${C.brand}">MIX</text>` + flameMark(40, 80, 0.8),
  });

  const nuggets = () => ({
    vb: [0, 0, 100, 80],
    body: [[22, 52, 16, 12], [48, 58, 17, 12], [74, 52, 16, 13], [34, 34, 15, 11], [60, 36, 16, 12], [48, 20, 14, 10]]
      .map(([x, y, rx, ry], i) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.chicken}" transform="rotate(${i * 17 - 30} ${x} ${y})"/><circle cx="${x - 4}" cy="${y - 2}" r="1.8" fill="${C.chickenDot}"/><circle cx="${x + 5}" cy="${y + 3}" r="1.5" fill="${C.chickenDot}"/>`).join(''),
  });

  const rings = () => ({
    vb: [0, 0, 100, 80],
    body: [[30, 48], [56, 54], [44, 30], [72, 34]]
      .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="13" fill="none" stroke="${C.chicken}" stroke-width="9"/><ellipse cx="${x}" cy="${y}" rx="17" ry="13" fill="none" stroke="${C.chickenDot}" stroke-width="1.5" stroke-dasharray="2 5"/>`).join(''),
  });

  const balls = () => ({
    vb: [0, 0, 100, 80],
    body:
      `<path d="M62 30 h30 l-3 34 h-24z" fill="#fff"/><path d="M63 30 h28 v6 h-28z" fill="${C.sauce}"/>` +
      [[20, 54], [40, 58], [30, 36], [50, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.chicken}"/><circle cx="${x - 3}" cy="${y - 3}" r="3" fill="${C.cheese}"/><circle cx="${x + 4}" cy="${y + 3}" r="2" fill="${C.chickenDot}"/>`).join(''),
  });

  const pie = () => ({
    vb: [0, 0, 100, 70],
    body: `<rect x="10" y="16" width="80" height="40" rx="12" fill="#e0a24c"/><path d="M24 20 v32 M40 18 v36 M56 18 v36 M72 20 v32" stroke="#c4832f" stroke-width="3"/><path d="M14 30 h72 M14 44 h72" stroke="#f0bf72" stroke-width="3"/>`,
  });

  const bucket = () => ({
    vb: [0, 0, 90, 100],
    body:
      [[18, 6, -10], [28, 0, -4], [38, 4, 0], [48, 0, 4], [58, 6, 8], [68, 10, 12], [34, 12, -2], [54, 12, 6]]
        .map(([x, y, r]) => `<rect x="${x}" y="${y}" width="7" height="44" rx="2" fill="#f7c844" stroke="#e0a92a" stroke-width="1" transform="rotate(${r} ${x} ${y + 40})"/>`).join('') +
      `<path d="M8 36 L82 36 L74 98 L16 98Z" fill="#fff"/><path d="M10 48 L80 48 L78 62 L12 62Z M13 72 L77 72 L76 82 L14 82Z" fill="${C.brand}"/>` + flameMark(45, 92, 0.5),
  });

  const water = () => ({
    vb: [0, 0, 50, 110],
    body: `<rect x="18" y="2" width="14" height="10" rx="3" fill="#3a7bd5"/><path d="M16 14 h18 l4 14 v76 q0 4 -4 4 h-18 q-4 0 -4 -4 v-76z" fill="#cfe6fb" stroke="#9cc8f0" stroke-width="2"/><rect x="12" y="50" width="26" height="26" fill="#3a7bd5"/>`,
  });

  const juice = () => drink('#f59e0b');

  const PIECES = { fries, drink, shake, cone, sundae, mixCup, nuggets, rings, balls, pie, bucket, water, juice };

  function piece(spec) {
    if (spec.type === 'burger') return burger(spec.layers);
    return PIECES[spec.type](...(spec.args || []));
  }

  const nest = (p, x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${p.vb.join(' ')}">${p.body}</svg>`;

  // spec: {type:'burger'|..., layers} | {type:'combo', main:spec, side?:spec, drink?:spec} | {type:'group', items:[spec]}
  function render(spec, cls = '') {
    let vb, body;
    if (spec.type === 'combo') {
      vb = [0, 0, 170, 120];
      body =
        nest(piece(spec.drink || { type: 'drink' }), 4, 8, 50, 86) +
        nest(piece(spec.side || { type: 'fries' }), 116, 14, 52, 74) +
        nest(piece(spec.main), 30, 30, 112, 90);
    } else if (spec.type === 'group') {
      const n = spec.items.length;
      vb = [0, 0, 60 + n * 55, 110];
      body = spec.items.map((s, i) => nest(piece(s), i * 55, i % 2 ? 22 : 8, 110, 88)).join('');
    } else {
      const p = piece(spec);
      vb = p.vb; body = p.body;
    }
    return `<svg class="art ${cls}" viewBox="${vb.join(' ')}" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
  }

  return { render, burger };
})();
