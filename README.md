# Brasa Burger 🍔🔥

App de pedidos de fast food (marca fictícia) feito com **HTML, CSS e JavaScript puro** — sem build, sem dependências.

## Funcionalidades

- **Apresentação** no primeiro acesso (3 telas) com bônus de 60 pontos
- **Início**: saudação com pontos, escolha do restaurante, carrossel de banners, pop-up de promoção, oferta em destaque, "Ofertas deliciosas" e trilha de recompensas
- **Peça & Retire**: cardápio em abas (Lançamentos, Mais vendidos, Burgers…) com preço individual e combo; monte o lanche (tamanho do combo, bebida, tirar ingredientes, extras)
- **Cupons**: ofertas de preço fechado em seções (Black Friday, Favoritos, Monte seu combo, Só no app, Só no drive…) e "Use seus pontos"
- **Clube Brasa**: código de membro, saldo, extrato, marcos de 50 a 250 pontos, recompensas e destaques
- **Delivery**: abre o iFood (configure o link em `IFOOD_URL`, no `js/data.js`)
- **Sacola e checkout** com retirada no balcão ou drive-thru, senha do pedido e acompanhamento em tempo real (simulado)
- Menu lateral com meus pedidos, meus dados e extrato; tema claro/escuro; PWA instalável
- **Painel de administrador** (menu ☰ → Administrador, ou a engrenagem na tela inicial): edite marca, cores, logo, produtos (fotos, preços, combos, categorias, ingredientes), categorias, cupons e seções, banners, pop-up, recompensas, adicionais, tamanhos, bebidas do combo, restaurantes, link do iFood e pontos. Inclui exportar/importar a configuração em JSON.

As ilustrações dos lanches são desenhadas em SVG pelo próprio app (`js/art.js`).
Os dados ficam salvos no navegador (`localStorage`). É uma demonstração: nenhum pedido real é enviado e nenhum pagamento é cobrado.

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
js/art.js       # ilustrações SVG dos produtos
js/data.js      # cardápio, ofertas, recompensas, lojas e link do iFood
js/app.js       # telas, sacola, checkout, pedidos e Clube Brasa
sw.js           # service worker (offline)
manifest.json   # instalação como app (PWA)
```

## Painel de administrador

- **Versão publicada no Claude:** só quem pode editar o app vê o painel. As mudanças aparecem na hora para você; ao tocar em **Publicar**, o app é republicado e todos os clientes passam a ver a nova versão. As fotos ficam guardadas no armazenamento do próprio app.
- **Versão local (este repositório):** o painel pede uma senha (inicial `1234`, troque em Configurações) e salva só no navegador do aparelho. A senha fica no código do navegador, então não é proteção de verdade: para um site público, use um servidor com login. Use **Exportar** para guardar a configuração num arquivo `.json`.

A configuração padrão fica em `js/data.js`.
