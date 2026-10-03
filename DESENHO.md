# O Último Pedido — base atual

## Base e escopo

Esta pasta contém somente a versão atual de **O Último Pedido**, ambientada no Restaurante São Bento. A experiência roda em primeira pessoa com Three.js local e não depende de versões anteriores.

## Ciclo principal

Um pedido por turno: retirar a comanda → pegar ingredientes → cortar o tomate → montar pão e tomate → tostar o pão e fritar o ovo → recolher → entregar no balcão → bater o ponto para o próximo turno. O sexto pedido entregue libera a saída e o encerramento.

## Seis turnos

1. 22:10: introdução ao preparo e aos controles.
2. 23:40: os primeiros sinais estranhos aparecem.
3. 01:15: batidas, vulto e documentos aprofundam a história.
4. 02:17: o horário central da narrativa ganha contexto.
5. 03:33: o salão vazio passa a responder de forma anormal.
6. 06:00: Pedido 217, ligado a Otávio, conduz ao encerramento.

Renato, Otávio, Bento, Mesa 04, 02:17 e Pedido 217 são elementos centrais da narrativa. Os sinais usam cena, som procedural e texto, sem depender de flashes fortes.

## Corte 3D

O tomate usa geometria 3D segmentada por planos preparados de corte. A casca curva, as faces internas, a polpa e as sementes são reveladas conforme a faca atravessa o fruto até a tábua. Cada gesto separa uma fatia e preserva o fluxo atual de preparo.

## Tela inicial

A tela inicial usa a arte `assets/referencia-o-ultimo-pedido.png` como fundo cinematográfico, com título **O Último Pedido**, entrada suave, movimento ambiental leve e chuva estilizada por CSS. Há suporte a `prefers-reduced-motion`.

## Verificação

Os testes automatizados cobrem a progressão dos seis turnos e regras de serviço. Para publicação, também é recomendado abrir a página em navegador com WebGL e validar interface, corte, áudio opcional e controles de teclado/toque.
