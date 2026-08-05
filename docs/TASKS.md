## Source Context

- PRD: `docs/PRD.md`
- Project memory consulted: repository `AGENTS.md` instructions, no `PROJECT.md`, no `CONTEXT.md`, no `WORKFLOW.md` found in the repository
- Relevant modules:
  - `src/app/main/pages/agentes/AgentesApp.js`
- Relevant tests/scripts:
  - no focused existing test found for the drilldown table
  - `npx eslint --no-ignore src/app/main/pages/agentes/AgentesApp.js`

## Implementation Goal

Ocultar visualmente, mas preservar em comentário, as colunas pedidas nas tabelas de drilldown do dashboard de guardador em `AgentesApp`, mantendo a estrutura da tabela consistente.

## Non-Goals

- Não alterar endpoints ou transformação de dados do dashboard.
- Não remover definitivamente a lógica das colunas ocultadas.
- Não mexer nos cards-resumo superiores.
- Não alterar o comportamento da tabela de fotos do dia além de esconder `Motivo da rejeição`.

## Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) | Test(s) | Status |
| --- | --- | --- | --- |
| Visão mensal deixa de mostrar `Total fotos` | T1 | JSX/lint validation + manual table review | planned |
| Visão mensal deixa de mostrar `Fotos Válidas` | T1 | JSX/lint validation + manual table review | planned |
| Visão semanal deixa de mostrar `Fotos Válidas` | T1 | JSX/lint validation + manual table review | planned |
| Visão diária deixa de mostrar `Motivo da rejeição` | T1 | JSX/lint validation + manual table review | planned |
| Código ocultado permanece fácil de restaurar depois | T1 | code review of preserved comments | planned |
| Loading and empty states continuam alinhados à nova contagem de colunas | T2 | JSX/lint validation + manual table review | planned |

## Task Breakdown

## T1 — Comentar as colunas pedidas no drilldown

Objective:
Comentar os cabeçalhos e células das colunas solicitadas nas visões mensal, semanal e diária, preservando o trecho para futura reativação.

Affected files / areas:
`src/app/main/pages/agentes/AgentesApp.js`

Test-first plan:
Como não há uma suíte focada já existente para essa tabela, validar primeiro o desenho atual do JSX e depois rodar lint focado no arquivo alterado para detectar regressões sintáticas ou símbolos órfãos.

Implementation notes:
Preservar os blocos ocultados em comentários JSX claros. Se uma função auxiliar ficar sem uso apenas por causa da ocultação, preservar sua intenção em comentário em vez de deixá-la como código morto executável.

Dependencies:
None.

Completion signal:
As colunas deixam de aparecer na UI renderizada e o código continua claramente reaproveitável.

## T2 — Ajustar a estrutura remanescente da tabela

Objective:
Atualizar `colSpan` e demais detalhes estruturais para refletir apenas as colunas ainda visíveis.

Affected files / areas:
`src/app/main/pages/agentes/AgentesApp.js`

Test-first plan:
Revisar os `colSpan` de estados vazio/carregando antes da edição e depois validar o arquivo com lint focado.

Implementation notes:
Manter a tabela coerente entre visão mensal e semanal, sem alterar a navegação entre mês, semana e fotos do dia.

Dependencies:
T1.

Completion signal:
Os estados vazio e carregando continuam ocupando a largura correta da tabela após a ocultação das colunas.

## Test Strategy

- Automated:
  - Rodar `npx eslint --no-ignore src/app/main/pages/agentes/AgentesApp.js`.
- Manual:
  - Revisar a visão mensal para confirmar que `Total fotos` e `Fotos Válidas` não aparecem.
  - Revisar a visão semanal para confirmar que `Fotos Válidas` não aparece.
  - Revisar a visão diária para confirmar que `Motivo da rejeição` não aparece.
  - Confirmar que os estados de loading e empty state continuam alinhados à quantidade visível de colunas.

## Risk Plan

- Risk: deixar `colSpan` antigo e quebrar alinhamento visual da tabela.
  - Mitigation: ajustar todos os `colSpan` afetados na mesma alteração.
- Risk: introduzir erro de JSX ao comentar colunas e células.
  - Mitigation: validar o arquivo com lint focado após a edição.
- Risk: deixar helpers sem uso e causar falha de lint.
  - Mitigation: preservar helpers afetados apenas como comentário quando não houver mais uso em runtime.

## Execution Order

1. Comentar as colunas e células pedidas na visão mensal, semanal e diária.
2. Ajustar `colSpan` e quaisquer helpers que virem código morto.
3. Rodar lint focado em `AgentesApp.js`.
4. Revisar o diff final antes de publicar.

## Open Questions

No blocking open questions.

## Handoff to tdd

Ready for tdd. Start with T1 in `AgentesApp.js`, then run focused lint validation on the edited file.
