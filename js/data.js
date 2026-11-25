// Dados da Brasa Burger (marca fictícia). Edite aqui cardápio, ofertas, recompensas e lojas.

// Link do botão "Delivery" (troque pelo link da sua loja no iFood)
const IFOOD_URL = 'https://www.ifood.com.br/';

const L = {
  classic: ['lettuce', 'tomato', 'onion', 'cheese', 'patty'],
  classic2: ['lettuce', 'tomato', 'onion', 'cheese', 'patty', 'cheese', 'patty'],
  bacon: ['sauce', 'bacon', 'cheese', 'patty'],
  duplo: ['bacon', 'cheese', 'patty', 'bacon', 'cheese', 'patty'],
  melt: ['onion', 'cheese', 'cheese', 'patty'],
  picante: ['lettuce', 'sauce', 'cheese', 'patty'],
  kids: ['cheese', 'patty'],
  veggie: ['lettuce', 'tomato', 'cheese', 'veggie'],
  crispy: ['lettuce', 'tomato', 'sauce', 'chicken'],
  chickenBacon: ['bacon', 'cheese', 'chicken'],
};

// Abas do Peça & Retire
const MENU_TABS = [
  { id: 'lancamentos', name: 'Lançamentos' },
  { id: 'maisvendidos', name: 'Mais vendidos' },
  { id: 'burgers', name: 'Burgers' },
  { id: 'frango', name: 'Frango & Veggie' },
  { id: 'acompanhamentos', name: 'Acompanhamentos' },
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'sobremesas', name: 'Sobremesas' },
];

const EXTRAS = [
  { id: 'bacon', name: 'Bacon extra', price: 4.0 },
  { id: 'cheese', name: 'Queijo cheddar extra', price: 3.0 },
  { id: 'patty', name: 'Carne extra (120 g)', price: 8.5 },
  { id: 'onion', name: 'Cebola crispy', price: 2.5 },
  { id: 'sauce', name: 'Molho da casa extra', price: 1.5 },
];

const COMBO_DRINKS = [
  { id: 'refri', name: 'Refrigerante', add: 0 },
  { id: 'suco', name: 'Suco natural', add: 2 },
  { id: 'agua', name: 'Água mineral', add: 0 },
];

const SIZES = [
  { id: 'P', name: 'Pequeno', add: 0 },
  { id: 'M', name: 'Médio', add: 3 },
  { id: 'G', name: 'Grande', add: 5 },
];

const PRODUCTS = [
  { id: 'classico', name: 'Brasa Clássico 1.0', price: 29.9, combo: 36.9, kcal: 640, badge: 'Novo', cats: ['lancamentos', 'burgers', 'maisvendidos'],
    art: { type: 'burger', layers: L.classic }, ingredients: ['Alface', 'Tomate', 'Cebola roxa', 'Queijo', 'Maionese da casa'],
    desc: 'Chegou o novo Brasa Clássico! Carne bovina grelhada no fogo, queijo, alface, tomate, cebola roxa e maionese da casa no pão brioche.' },
  { id: 'classico2', name: 'Brasa Clássico 2.0', price: 37.9, combo: 44.9, kcal: 910, badge: 'Novo', cats: ['lancamentos', 'burgers'],
    art: { type: 'burger', layers: L.classic2 }, ingredients: ['Alface', 'Tomate', 'Cebola roxa', 'Queijo duplo', 'Maionese da casa'],
    desc: 'Dois burgers grelhados no fogo, queijo em dobro, alface, tomate, cebola roxa e maionese da casa.' },
  { id: 'bacon', name: 'Brasa Bacon', price: 34.9, combo: 41.9, kcal: 820, badge: 'Novo', cats: ['lancamentos', 'burgers', 'maisvendidos'],
    art: { type: 'burger', layers: L.bacon }, ingredients: ['Bacon', 'Cheddar', 'Molho defumado'],
    desc: 'Burger na brasa, cheddar, muito bacon crocante e molho defumado.' },
  { id: 'duplo', name: 'Duplo Fogo', price: 39.9, combo: 46.9, kcal: 1080, cats: ['lancamentos', 'burgers'],
    art: { type: 'burger', layers: L.duplo }, ingredients: ['Bacon', 'Cheddar duplo', 'Molho barbecue'],
    desc: 'Dois burgers na brasa, cheddar duplo, bacon em dobro e molho barbecue.' },
  { id: 'melt', name: 'Cheddar Melt', price: 31.9, combo: 38.9, kcal: 780, cats: ['burgers', 'maisvendidos'],
    art: { type: 'burger', layers: L.melt }, ingredients: ['Cheddar cremoso', 'Cebola caramelizada'],
    desc: 'Burger coberto com cheddar cremoso e cebola caramelizada no pão australiano.' },
  { id: 'picante', name: 'Brasa Picante', price: 32.9, combo: 39.9, kcal: 720, cats: ['burgers'],
    art: { type: 'burger', layers: L.picante }, ingredients: ['Alface', 'Jalapeño', 'Pepper jack', 'Maionese de chipotle'],
    desc: 'Burger na brasa, queijo pepper jack, jalapeño, alface e maionese de chipotle.' },
  { id: 'brasinha', name: 'Brasinha', price: 16.9, combo: 24.9, kcal: 360, cats: ['burgers'],
    art: { type: 'burger', layers: L.kids }, ingredients: ['Queijo', 'Ketchup'],
    desc: 'Burger menor com queijo e ketchup. Perfeito para os pequenos.' },
  { id: 'crispy', name: 'Crispy Chicken', price: 28.9, combo: 35.9, kcal: 680, cats: ['frango', 'maisvendidos'],
    art: { type: 'burger', layers: L.crispy }, ingredients: ['Alface', 'Tomate', 'Maionese'],
    desc: 'Filé de frango empanado e crocante, alface, tomate e maionese no pão com gergelim.' },
  { id: 'chickenbacon', name: 'Chicken Bacon', price: 32.9, combo: 39.9, kcal: 790, badge: 'Novo', cats: ['frango', 'lancamentos'],
    art: { type: 'burger', layers: L.chickenBacon }, ingredients: ['Bacon', 'Cheddar', 'Maionese'],
    desc: 'Frango crocante, cheddar, bacon e maionese da casa.' },
  { id: 'veggie', name: 'Veggie Brasa', price: 30.9, combo: 37.9, kcal: 520, cats: ['frango'],
    art: { type: 'burger', layers: L.veggie }, ingredients: ['Alface', 'Tomate', 'Queijo', 'Molho verde'],
    desc: 'Burger de grão-de-bico e cogumelos, queijo, alface, tomate e molho verde.' },
  { id: 'nuggets', name: 'Nuggets (10 un.)', price: 19.9, combo: 27.9, kcal: 450, cats: ['frango'],
    art: { type: 'nuggets' }, ingredients: [], desc: '10 pedaços de frango empanado com 2 molhos à sua escolha.' },

  { id: 'fritas', name: 'Batata Frita', price: 10.9, kcal: 380, sized: true, cats: ['acompanhamentos', 'maisvendidos'],
    art: { type: 'fries' }, ingredients: [], desc: 'Batatas fritas crocantes por fora e macias por dentro.' },
  { id: 'balde', name: 'Balde de Batata', price: 22.9, kcal: 900, cats: ['acompanhamentos'],
    art: { type: 'bucket' }, ingredients: [], desc: 'Um balde cheio de batata frita para dividir (ou não).' },
  { id: 'aneis', name: 'Anéis de Cebola', price: 13.9, kcal: 410, cats: ['acompanhamentos'],
    art: { type: 'rings' }, ingredients: [], desc: 'Anéis de cebola empanados e dourados.' },
  { id: 'bolinhas', name: 'Bolinhas de Queijo + Molho', price: 15.9, kcal: 430, cats: ['acompanhamentos'],
    art: { type: 'balls' }, ingredients: [], desc: '4 bolinhas recheadas com queijo e molho de páprica.' },

  { id: 'refri', name: 'Refrigerante', price: 8.9, kcal: 180, sized: true, cats: ['bebidas'],
    art: { type: 'drink' }, ingredients: ['Gelo'], desc: 'Copo de refrigerante gelado com refil no balcão.' },
  { id: 'suco', name: 'Suco Natural', price: 10.9, kcal: 140, cats: ['bebidas'],
    art: { type: 'juice' }, ingredients: ['Gelo', 'Açúcar'], desc: 'Suco de laranja ou limão feito na hora.' },
  { id: 'agua', name: 'Água Mineral', price: 5.0, kcal: 0, cats: ['bebidas'],
    art: { type: 'water' }, ingredients: [], desc: 'Água mineral 500 ml, com ou sem gás.' },
  { id: 'shake', name: 'Shake', price: 16.9, kcal: 560, sized: true, cats: ['bebidas', 'sobremesas', 'lancamentos'],
    art: { type: 'shake' }, ingredients: ['Chantilly', 'Calda'], desc: 'Shake cremoso de chocolate, morango ou doce de leite com biscoito.' },

  { id: 'mix', name: 'Copo Gelado Mix', price: 14.9, kcal: 480, cats: ['sobremesas', 'lancamentos'],
    art: { type: 'mixCup' }, ingredients: ['Calda'], desc: 'Sorvete de baunilha batido com pedaços de biscoito e calda.' },
  { id: 'casquinha', name: 'Casquinha', price: 4.9, kcal: 180, cats: ['sobremesas'],
    art: { type: 'cone' }, ingredients: [], desc: 'Sorvete de baunilha na casquinha crocante.' },
  { id: 'sundae', name: 'Sundae', price: 11.9, kcal: 330, cats: ['sobremesas'],
    art: { type: 'sundae' }, ingredients: ['Calda', 'Amendoim'], desc: 'Sorvete com calda quente de chocolate, caramelo ou morango.' },
  { id: 'torta', name: 'Torta de Maçã', price: 8.9, kcal: 260, cats: ['sobremesas'],
    art: { type: 'pie' }, ingredients: [], desc: 'Massa crocante recheada com maçã e canela.' },
];

const combo = (main, extra = {}) => ({ type: 'combo', main: { type: 'burger', layers: main }, ...extra });

// Cupons: ofertas com preço fechado, organizadas em seções
const OFFER_SECTIONS = [
  { id: 'black', name: 'Black Friday da Brasa', dark: true },
  { id: 'favoritos', name: 'Favoritos' },
  { id: 'monte', name: 'Monte seu combo' },
  { id: 'maispedidas', name: 'Mais pedidas' },
  { id: 'soapp', name: 'Só no app' },
  { id: 'carnes', name: 'Carnes' },
  { id: 'frango', name: 'Frango + Veggie' },
  { id: 'drive', name: 'Só no drive' },
  { id: 'acomp', name: 'Acompanhamentos' },
  { id: 'sobremesas', name: 'Sobremesas' },
  { id: 'relampago', name: 'Ofertas relâmpago' },
];

const OFFERS = [
  { id: 'o-4itens', section: 'black', name: '1 sanduíche + batata P + refri + casquinha', short: '4 itens', price: 19.9, flag: 'Peça & Retire',
    art: combo(L.classic), includes: ['Brasinha', 'Batata frita P', 'Refrigerante P', 'Casquinha'] },
  { id: 'o-mix10', section: 'black', name: 'Copo Gelado Mix', price: 10.0, art: { type: 'mixCup' }, includes: ['Copo Gelado Mix'] },
  { id: 'o-shake40', section: 'black', name: 'Shake 40% OFF', price: 10.14, art: { type: 'shake' }, includes: ['Shake M'] },

  { id: 'o-cclassico', section: 'favoritos', name: 'Combo Brasa Clássico', price: 33.9, art: combo(L.classic), includes: ['Brasa Clássico 1.0', 'Batata frita M', 'Refrigerante M'] },
  { id: 'o-cbacon', section: 'favoritos', name: 'Combo Duplo Bacon', price: 33.9, art: combo(L.duplo), includes: ['Duplo Fogo', 'Batata frita M', 'Refrigerante M'] },
  { id: 'o-ccrispy', section: 'favoritos', name: 'Combo Crispy Chicken', price: 31.9, art: combo(L.crispy), includes: ['Crispy Chicken', 'Batata frita M', 'Refrigerante M'] },

  { id: 'o-dobro', section: 'monte', name: 'Brasa em Dobro', price: 20.9, flag: 'Escolha 2',
    art: { type: 'group', items: [{ type: 'burger', layers: L.classic }, { type: 'burger', layers: L.crispy }] }, includes: ['2 sanduíches à escolha (Brasinha, Crispy ou Picante)'] },
  { id: 'o-dobrocombo', section: 'monte', name: 'Brasa em Dobro + batata M + refri', price: 36.8, flag: 'Escolha 2',
    art: combo(L.classic, { side: { type: 'fries' } }), includes: ['2 sanduíches à escolha', 'Batata frita M', 'Refrigerante M'] },

  { id: 'o-ckids', section: 'maispedidas', name: 'Combo Brasinha', price: 26.9, art: combo(L.kids, { drink: { type: 'juice' } }), includes: ['Brasinha', 'Batata frita P', 'Suco natural', 'Brinde'] },
  { id: 'o-cclassico2', section: 'maispedidas', name: 'Combo Brasa Clássico 2.0', price: 42.9, art: combo(L.classic2), includes: ['Brasa Clássico 2.0', 'Batata frita M', 'Refrigerante M'] },

  { id: 'o-cpicante', section: 'soapp', name: 'Combo Brasa Picante', price: 36.9, flag: 'Peça & Retire', art: combo(L.picante), includes: ['Brasa Picante', 'Batata frita M', 'Refrigerante M'] },
  { id: 'o-cmelt', section: 'soapp', name: 'Combo Cheddar Melt', price: 35.9, flag: 'Peça & Retire', art: combo(L.melt), includes: ['Cheddar Melt', 'Batata frita M', 'Refrigerante M'] },

  { id: 'o-kidsrefri', section: 'carnes', name: 'Brasinha + Refri', price: 22.9, art: { type: 'group', items: [{ type: 'drink' }, { type: 'burger', layers: L.kids }] }, includes: ['Brasinha', 'Refrigerante M'] },
  { id: 'o-cbaconc', section: 'carnes', name: 'Combo Brasa Bacon', price: 39.9, art: combo(L.bacon), includes: ['Brasa Bacon', 'Batata frita M', 'Refrigerante M'] },

  { id: 'o-cchickenbacon', section: 'frango', name: 'Combo Chicken Bacon', price: 37.9, art: combo(L.chickenBacon), includes: ['Chicken Bacon', 'Batata frita M', 'Refrigerante M'] },
  { id: 'o-cveggie', section: 'frango', name: 'Combo Veggie Brasa', price: 35.9, art: combo(L.veggie, { drink: { type: 'juice' } }), includes: ['Veggie Brasa', 'Batata frita M', 'Suco natural'] },

  { id: 'o-drive4', section: 'drive', name: '2 Crispy + 2 Brasinha + 2 refris', price: 64.8, flag: 'Só no drive',
    art: { type: 'group', items: [{ type: 'burger', layers: L.crispy }, { type: 'burger', layers: L.kids }, { type: 'drink' }] }, includes: ['2 Crispy Chicken', '2 Brasinha', '2 Refrigerantes M'], drive: true },
  { id: 'o-drivebalde', section: 'drive', name: '2 sanduíches + balde + 2 refris', price: 64.8, flag: 'Só no drive',
    art: { type: 'group', items: [{ type: 'burger', layers: L.classic }, { type: 'bucket' }, { type: 'drink' }] }, includes: ['2 sanduíches à escolha', 'Balde de batata', '2 Refrigerantes M'], drive: true },

  { id: 'o-bolinhas', section: 'acomp', name: 'Bolinhas de Queijo + Molho', price: 15.8, art: { type: 'balls' }, includes: ['4 bolinhas de queijo', 'Molho de páprica'] },
  { id: 'o-2fritas', section: 'acomp', name: '2 Batatas Médias', price: 19.9, art: { type: 'group', items: [{ type: 'fries' }, { type: 'fries' }] }, includes: ['2 Batatas fritas M'] },

  { id: 'o-sundae', section: 'sobremesas', name: 'Sundae', price: 9.9, art: { type: 'sundae' }, includes: ['Sundae com calda à escolha'] },
  { id: 'o-2casq', section: 'sobremesas', name: '2 Casquinhas', price: 7.9, art: { type: 'group', items: [{ type: 'cone' }, { type: 'cone' }] }, includes: ['2 Casquinhas'] },

  { id: 'o-crispy', section: 'relampago', name: 'Crispy Chicken', price: 9.9, flag: 'Só no app', art: { type: 'burger', layers: L.crispy }, includes: ['Crispy Chicken'] },
  { id: 'o-nuggets', section: 'relampago', name: '10 Nuggets', price: 9.9, flag: 'Só no app', art: { type: 'nuggets' }, includes: ['10 Nuggets', '2 molhos'] },
];

// Clube Brasa: marcos de pontos e recompensas
const MILESTONES = [50, 100, 150, 200, 250];
const REWARDS = [
  { id: 'r-casquinha', name: '1 Casquinha', points: 50, price: 0, art: { type: 'cone' } },
  { id: 'r-sundae', name: '1 Sundae', points: 45, price: 5.5, art: { type: 'sundae' } },
  { id: 'r-fritas', name: '1 Batata P', points: 100, price: 0, art: { type: 'fries' } },
  { id: 'r-shake', name: '1 Shake', points: 110, price: 6.9, art: { type: 'shake' } },
  { id: 'r-mix', name: '1 Copo Gelado Mix', points: 110, price: 6.9, art: { type: 'mixCup' } },
  { id: 'r-balde', name: '1 Balde de Batata', points: 200, price: 0, art: { type: 'bucket' } },
  { id: 'r-classico', name: '1 Brasa Clássico', points: 250, price: 0, art: { type: 'burger', layers: L.classic } },
];
const WELCOME_POINTS = 60;

// Banners do carrossel da tela inicial
const BANNERS = [
  { title: 'Black Friday da Brasa', text: '4 itens por R$ 19,90. Só no app, por tempo limitado.', cta: 'Eu quero', href: '#cupom-o-4itens', tone: 'night', art: combo(L.classic) },
  { title: 'Novo Brasa Clássico 2.0', text: 'Dois burgers no fogo e queijo em dobro.', cta: 'Experimente', href: '#produto-classico2', tone: 'flame', art: { type: 'burger', layers: L.classic2 } },
  { title: 'Copo Gelado Mix', text: 'Sorvete batido com biscoito. Difícil dividir.', cta: 'Experimente', href: '#produto-mix', tone: 'cream', art: { type: 'mixCup' } },
  { title: 'Clube Brasa', text: 'Ganhe 1 ponto por real e troque por lanches.', cta: 'Ver recompensas', href: '#recompensas', tone: 'gold', art: { type: 'cone' } },
];

const STORES = [
  { id: 's1', name: 'Shopping Central', address: 'Av. Central, 1500 — Centro' },
  { id: 's2', name: 'Drive Via Norte', address: 'Rod. Via Norte, km 12 — Jardim Norte', drive: true },
  { id: 's3', name: 'Praça das Flores', address: 'Rua das Flores, 250 — Vila Nova' },
  { id: 's4', name: 'Drive Lago Sul', address: 'Av. do Lago, 3200 — Lago Sul', drive: true },
];
