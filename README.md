# Brasa Burger 🍔🔥

App de pedidos de fast food (marca fictícia) feito com **HTML, CSS e JavaScript puro** — sem build, sem dependências.

## Funcionalidades

- **Início** com destaques, promoções e categorias
- **Cardápio** por categoria (burgers, combos, frango, acompanhamentos, bebidas, sobremesas) com busca
- **Monte seu lanche**: escolha tamanho, remova ingredientes e adicione extras (bacon, queijo, carne…)
- **Carrinho** com quantidades e cupons de desconto (`BRASA10`, `FRITAGRATIS`, `ENTREGA0`, `COMBO15`)
- **Checkout** com entrega ou retirada, endereço e forma de pagamento (Pix, cartão na maquininha, dinheiro com troco)
- **Acompanhamento do pedido** em tempo real (simulado): recebido → preparando → saiu para entrega → entregue
- **Brasa Pontos**: 1 ponto por real gasto, troque por casquinha, batata ou lanche grátis
- **Histórico de pedidos** com "Pedir de novo"
- Tema claro/escuro automático, layout para celular e **PWA** instalável que funciona offline

Os dados (carrinho, pedidos e pontos) ficam salvos no navegador (`localStorage`). É uma demonstração: nenhum pedido real é enviado e nenhum pagamento é cobrado.

## Como rodar

Abra `index.html` no navegador, ou sirva a pasta para habilitar o modo offline/instalação:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

## Estrutura

```
index.html      # casca do app (topo, área das telas, barra de navegação)
css/styles.css  # estilos (mobile-first, tema escuro)
js/data.js      # cardápio, cupons e recompensas
js/app.js       # rotas, telas, carrinho, checkout, pedidos e pontos
sw.js           # service worker (offline)
manifest.json   # instalação como app (PWA)
```

Para mudar o cardápio, preços ou cupons, edite `js/data.js`.
