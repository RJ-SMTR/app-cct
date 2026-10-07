# Débitos técnicos

Registro único do que foi adiado de propósito, por quê e por quem. Serve para não perder a dívida de vista e para saber o que precisa ser verdade para ela ser paga.

## Regras

- **Só acrescentar.** Entradas novas vão ao final, com o próximo `TD-n`. Ids nunca são reutilizados.
- **Nunca apagar.** Ao resolver, mude o status para `pago` e preencha _Pago por_, _Data do pagamento_ e _Referência_ (commit ou PR). O critério de pagamento precisa estar cumprido.
- **Status:** `aberto`, `em andamento`, `pago`, `descartado` (com o motivo no texto).
- **Datas** em AAAA-MM-DD. **Detectado por** é `agente` ou `pessoa`.

## Índice

| ID | Título | Status | Registrado por | Data |
| --- | --- | --- | --- | --- |
| [TD-1](#td-1) | Campo "Selecionar Específicos" com `id="status"` e options errada no Consolidado | aberto | Rayanne | 2026-10-07 |

## Entradas

## TD-1
**Campo "Selecionar Específicos" com `id="status"` e options errada no Consolidado**

- **Status:** aberto
- **Registrado por:** Rayanne · **Detectado por:** agente · **Data:** 2026-10-07
- **Contexto:** em `src/app/main/pages/admin/Report/components/ConsolidatedReport.js`, no formulário de filtros, o `Autocomplete` rotulado "Selecionar Específicos" está com `id="status"` (duplicando o id do filtro de status real, que existe em outro `Autocomplete` no mesmo formulário) e usa `options={específicos}` em vez de `options={especificos}` (nome de variável com acento, provavelmente um erro de digitação/encoding). Encontrado ao reordenar os filtros de pesquisa dos relatórios (PR #572), sem alterar essa lógica por estar fora do escopo pedido.
- **Impacto/risco:** `id` duplicado no DOM pode confundir testes automatizados, acessibilidade (labels associadas por id) e scripts que selecionem por id; se `específicos` (com acento) não for de fato a variável de opções de "Específicos", o filtro pode estar exibindo as opções erradas ou undefined silenciosamente.
- **Critério de pagamento:** `id` do campo corrigido para algo como `especificos` (sem colidir com o `id="status"` do filtro de status real) e `options` apontando para a variável correta de opções de "Específicos", com verificação manual de que o filtro exibe e filtra como esperado.
