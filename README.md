# Benedetta Paglacci

Site de cardápio e pedidos via WhatsApp para a pizzaria artesanal Benedetta Paglacci, em Trindade/GO.

## Comandos

```bash
npm install
npm run dev
npm run build
```

O servidor local usa `http://127.0.0.1:4321/` para evitar erro `431` causado por cookies grandes acumulados em `localhost`.

## Cardápio

Os sabores, tamanhos e preços ficam em `src/data/menu.js`. O carrinho usa os mesmos dados para calcular subtotal, total e montar a mensagem do pedido.
