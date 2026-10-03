# O Último Pedido

Versão limpa do Projeto J, contendo apenas a base atual do Restaurante São Bento. A abertura usa cinco botões reais e animados: Continuar, Novo Turno, Configurações, História e Sair.

## Abrir localmente

Com Node.js instalado:

```bash
npm start
```

Depois abra `http://127.0.0.1:8770`.

## Testes

```bash
npm test
```

## Publicação

O `index.html` está na raiz desta pasta e todos os recursos usados pela página estão incluídos localmente (`assets/`, `vendor/` e módulos JavaScript).

A arte da tela inicial está em `assets/pagina-inicial-j-referencia.png`. O menu animado é construído em HTML/CSS/JavaScript sobre essa arte, portanto os botões respondem a foco, mouse/toque e clique.
