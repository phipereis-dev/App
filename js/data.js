// Dados do cardápio da Brasa Burger (marca fictícia)
const CATEGORIES = [
  { id: 'burgers', name: 'Burgers', icon: '🍔' },
  { id: 'combos', name: 'Combos', icon: '🍱' },
  { id: 'chicken', name: 'Frango', icon: '🍗' },
  { id: 'sides', name: 'Acompanhamentos', icon: '🍟' },
  { id: 'drinks', name: 'Bebidas', icon: '🥤' },
  { id: 'desserts', name: 'Sobremesas', icon: '🍦' },
];

const EXTRAS = {
  burger: [
    { id: 'bacon', name: 'Bacon extra', price: 4.0 },
    { id: 'cheese', name: 'Queijo cheddar extra', price: 3.0 },
    { id: 'patty', name: 'Carne extra (120g)', price: 8.5 },
    { id: 'onion', name: 'Cebola crispy', price: 2.5 },
    { id: 'jalapeno', name: 'Jalapeño', price: 2.0 },
  ],
  chicken: [
    { id: 'cheese', name: 'Queijo cheddar extra', price: 3.0 },
    { id: 'bacon', name: 'Bacon extra', price: 4.0 },
    { id: 'sauce', name: 'Molho extra', price: 1.5 },
  ],
};

const PRODUCTS = [
  { id: 'brasa-classico', cat: 'burgers', name: 'Brasa Clássico', emoji: '🍔', price: 24.9, kcal: 640,
    desc: 'Carne grelhada na brasa, queijo, alface, tomate, cebola roxa, picles e maionese da casa no pão brioche.',
    ingredients: ['Alface', 'Tomate', 'Cebola roxa', 'Picles', 'Maionese da casa'], extras: 'burger', tag: 'Mais pedido' },
  { id: 'duplo-fogo', cat: 'burgers', name: 'Duplo Fogo', emoji: '🍔', price: 32.9, kcal: 920,
    desc: 'Duas carnes na brasa, cheddar duplo, bacon crocante e molho barbecue defumado.',
    ingredients: ['Bacon', 'Molho barbecue', 'Cebola caramelizada'], extras: 'burger', tag: 'Novo' },
  { id: 'cheddar-melt', cat: 'burgers', name: 'Cheddar Melt', emoji: '🧀', price: 27.9, kcal: 780,
    desc: 'Carne na brasa coberta com cheddar cremoso e cebola caramelizada no pão australiano.',
    ingredients: ['Cheddar cremoso', 'Cebola caramelizada'], extras: 'burger' },
  { id: 'picante', cat: 'burgers', name: 'Brasa Picante', emoji: '🌶️', price: 28.9, kcal: 710,
    desc: 'Carne na brasa, pepper jack, jalapeño, cebola crispy e maionese de chipotle.',
    ingredients: ['Jalapeño', 'Cebola crispy', 'Maionese chipotle', 'Alface'], extras: 'burger' },
  { id: 'veggie', cat: 'burgers', name: 'Veggie Brasa', emoji: '🥬', price: 26.9, kcal: 520,
    desc: 'Hambúrguer de grão-de-bico e cogumelos, queijo, alface, tomate e molho verde.',
    ingredients: ['Alface', 'Tomate', 'Molho verde', 'Queijo'], extras: 'burger', tag: 'Vegetariano' },
  { id: 'kids', cat: 'burgers', name: 'Brasinha', emoji: '🍔', price: 14.9, kcal: 360,
    desc: 'Hambúrguer menor com queijo e ketchup. Perfeito para os pequenos.',
    ingredients: ['Queijo', 'Ketchup'], extras: 'burger' },

  { id: 'crispy', cat: 'chicken', name: 'Crispy Chicken', emoji: '🍗', price: 25.9, kcal: 680,
    desc: 'Filé de frango empanado crocante, alface, tomate e maionese no pão com gergelim.',
    ingredients: ['Alface', 'Tomate', 'Maionese'], extras: 'chicken' },
  { id: 'nuggets-10', cat: 'chicken', name: 'Nuggets (10 un.)', emoji: '🍗', price: 19.9, kcal: 450,
    desc: '10 pedaços de frango empanado com 2 molhos à sua escolha.', ingredients: [], extras: 'chicken' },
  { id: 'tiras', cat: 'chicken', name: 'Tiras de Frango', emoji: '🍗', price: 21.9, kcal: 520,
    desc: '5 tiras de frango empanadas e temperadas com páprica defumada.', ingredients: [], extras: 'chicken' },

  { id: 'fritas', cat: 'sides', name: 'Batata Frita', emoji: '🍟', price: 11.9, kcal: 380, sized: true,
    desc: 'Batatas fritas crocantes por fora e macias por dentro.', ingredients: [] },
  { id: 'onion-rings', cat: 'sides', name: 'Anéis de Cebola', emoji: '🧅', price: 13.9, kcal: 410,
    desc: 'Anéis de cebola empanados e dourados.', ingredients: [] },
  { id: 'fritas-cheddar', cat: 'sides', name: 'Fritas com Cheddar e Bacon', emoji: '🍟', price: 18.9, kcal: 690,
    desc: 'Batata frita coberta com cheddar cremoso e bacon em cubos.', ingredients: ['Cheddar', 'Bacon'] },

  { id: 'refri', cat: 'drinks', name: 'Refrigerante', emoji: '🥤', price: 8.9, kcal: 180, sized: true,
    desc: 'Copo de refrigerante gelado. Escolha o sabor no balcão de bebidas.', ingredients: ['Gelo'] },
  { id: 'suco', cat: 'drinks', name: 'Suco Natural', emoji: '🧃', price: 10.9, kcal: 140,
    desc: 'Suco de laranja ou limão feito na hora.', ingredients: ['Gelo', 'Açúcar'] },
  { id: 'agua', cat: 'drinks', name: 'Água Mineral', emoji: '💧', price: 5.0, kcal: 0,
    desc: 'Água mineral 500 ml, com ou sem gás.', ingredients: [] },
  { id: 'milkshake', cat: 'drinks', name: 'Milkshake', emoji: '🥛', price: 16.9, kcal: 560, sized: true,
    desc: 'Milkshake cremoso de chocolate, morango ou baunilha.', ingredients: ['Chantilly', 'Calda'] },

  { id: 'casquinha', cat: 'desserts', name: 'Casquinha', emoji: '🍦', price: 4.9, kcal: 180,
    desc: 'Sorvete de baunilha na casquinha crocante.', ingredients: [] },
  { id: 'sundae', cat: 'desserts', name: 'Sundae', emoji: '🍨', price: 11.9, kcal: 330,
    desc: 'Sorvete de baunilha com calda quente de chocolate ou caramelo.', ingredients: ['Calda', 'Amendoim'] },
  { id: 'torta', cat: 'desserts', name: 'Torta de Maçã', emoji: '🥧', price: 8.9, kcal: 260,
    desc: 'Massa crocante recheada com maçã e canela.', ingredients: [] },

  { id: 'combo-classico', cat: 'combos', name: 'Combo Brasa Clássico', emoji: '🍔', price: 36.9, kcal: 1200, combo: 'brasa-classico',
    desc: 'Brasa Clássico + batata frita + refrigerante.', ingredients: ['Alface', 'Tomate', 'Cebola roxa', 'Picles', 'Maionese da casa'], extras: 'burger', tag: 'Economize R$ 8' },
  { id: 'combo-duplo', cat: 'combos', name: 'Combo Duplo Fogo', emoji: '🔥', price: 44.9, kcal: 1480, combo: 'duplo-fogo',
    desc: 'Duplo Fogo + batata frita + refrigerante.', ingredients: ['Bacon', 'Molho barbecue', 'Cebola caramelizada'], extras: 'burger' },
  { id: 'combo-crispy', cat: 'combos', name: 'Combo Crispy Chicken', emoji: '🍗', price: 37.9, kcal: 1240, combo: 'crispy',
    desc: 'Crispy Chicken + batata frita + refrigerante.', ingredients: ['Alface', 'Tomate', 'Maionese'], extras: 'chicken' },
  { id: 'combo-familia', cat: 'combos', name: 'Combo Família', emoji: '👨‍👩‍👧', price: 99.9, kcal: 3900,
    desc: '2 Brasa Clássico + 2 Brasinha + 2 fritas grandes + nuggets (10) + 4 refrigerantes.', ingredients: [], tag: 'Para dividir' },
];

const SIZES = [
  { id: 'P', name: 'Pequeno', add: 0 },
  { id: 'M', name: 'Médio', add: 3 },
  { id: 'G', name: 'Grande', add: 5 },
];

const COUPONS = [
  { code: 'BRASA10', title: '10% OFF no pedido', desc: 'Válido para pedidos acima de R$ 40.', type: 'percent', value: 10, min: 40 },
  { code: 'FRITAGRATIS', title: 'Batata frita grátis', desc: 'Desconto de R$ 11,90 em pedidos acima de R$ 50.', type: 'fixed', value: 11.9, min: 50 },
  { code: 'ENTREGA0', title: 'Entrega grátis', desc: 'Frete zerado em qualquer pedido com entrega.', type: 'delivery', value: 0, min: 0 },
  { code: 'COMBO15', title: 'R$ 15 OFF em combos', desc: 'Para pedidos com pelo menos 2 combos.', type: 'combo', value: 15, min: 0 },
];

const REWARDS = [
  { id: 'r-casquinha', productId: 'casquinha', cost: 150 },
  { id: 'r-fritas', productId: 'fritas', cost: 300 },
  { id: 'r-classico', productId: 'brasa-classico', cost: 600 },
];

const DELIVERY_FEE = 6.99;
