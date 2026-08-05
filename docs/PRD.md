## Problem Statement

Na tela `agentes/:id`, as tabelas de drilldown do dashboard ainda exibem algumas colunas que o usuário não quer mostrar visualmente agora. O pedido não é remover a implementação de vez, mas deixar essas partes comentadas para reutilização futura.

## Solution

Ocultar visualmente, por comentário no JSX, as colunas e o bloco de rejeição indicados no dashboard de guardador:

- na visão mensal: `Total fotos` e `Fotos Válidas`;
- na visão semanal: `Fotos Válidas`.
- na visão diária: `Motivo da rejeição`;
- no dashboard do mês: o bloco `Motivos de rejeição`.

A lógica associada deve permanecer fácil de reativar depois, sem reescrever o comportamento.

## User Stories

1. As an admin viewing the guardador dashboard, I want the monthly drilldown table to stop showing `Total fotos`, so that the table matches the current reporting need.
2. As an admin viewing the guardador dashboard, I want the monthly drilldown table to stop showing `Fotos Válidas`, so that the table displays only the columns still relevant right now.
3. As an admin viewing the guardador dashboard, I want the weekly drilldown table to stop showing `Fotos Válidas`, so that the weekly view stays visually aligned with the reduced scope.
4. As an admin viewing the day-level photo drilldown, I want `Motivo da rejeição` hidden for now, so that the detailed table stays visually simpler.
5. As an admin viewing the dashboard month summary, I want the `Motivos de rejeição` block hidden for now, so that the page focuses only on the currently relevant summaries.
6. As a developer, I want those hidden columns and rejection blocks preserved as code comments instead of deleted, so that they can be restored quickly in a future iteration.
7. As a developer, I want the supporting table layout such as `colSpan` values to remain consistent after hiding the columns, so that loading and empty states still render correctly.

## Implementation Decisions

- The change stays inside the existing `AgentesApp` drilldown table rendering.
- The requested columns are hidden by commenting out their JSX instead of deleting the code outright.
- Supporting table structure such as `colSpan` values must be updated to reflect the currently visible columns.
- Hidden helper logic that exists only for the removed visual columns may also be preserved as comments to avoid leaving unused runtime code behind.
- The day-level photo detail table follows the same preservation rule for `Motivo da rejeição`.
- The monthly `Motivos de rejeição` summary card follows the same preservation rule as the hidden drilldown columns.

## Testing Decisions

- Validate the change at the highest practical seam for this narrow UI adjustment: the rendered table structure in `AgentesApp`.
- Prefer lightweight static validation for this change because the repository does not currently expose an existing focused test seam for this table.
- Run targeted syntax/lint validation on `AgentesApp.js` to catch JSX or unused-symbol regressions introduced by commenting out the columns.
- Manual review remains relevant for confirming that the monthly and weekly tables still align after the columns are hidden and that the rejection-reasons block no longer renders.

## Out of Scope

- Changes to backend dashboard APIs or payloads.
- Changes to summary cards such as `Fotos válidas` and `Fotos rejeitadas`.
- Permanent removal or refactor of historical photo-count logic.
- Changes to rejection/payment status behavior beyond hiding the rejection-reason UI.

## Further Notes

- This PRD is intentionally narrow and reflects the clarified request to preserve the hidden code for future reuse.
