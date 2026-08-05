## Problem Statement

Na tela `agentes/:id`, o dashboard ainda usa a modelagem anterior de dados e não suporta o contrato atualizado de `GET /v1/agentes/dashboard`. Isso impede alternar entre visualização por `data tentativa` e `data efetiva`, não usa `dateType` como fonte de verdade do modo ativo e mantém um fluxo de drill-down parcial, com buscas separadas e suposições antigas sobre pendências.

## Solution

Atualizar o dashboard de agentes para consumir o contrato novo de forma centralizada, com um estado de consulta explícito baseado em `month`, `dateType`, `paymentDate` e `workDate`. A tela deve permitir alternar entre `tentative` e `effective`, recarregar dados ao trocar o tipo de data, respeitar `availableMonths` retornado pela API e suportar navegação mensal, semanal e diária a partir do mesmo endpoint.

## User Stories

1. As an agente, I want to switch between tentative and effective date modes, so that I can inspect my dashboard using the correct payment reference.
2. As an admin, I want the selected date mode to persist in the screen state based on the API response, so that the UI always reflects the backend contract.
3. As an agente, I want the dashboard to always send a month when loading data, so that the API can return a valid contracted response.
4. As an admin, I want the available month options to refresh when I change the date mode, so that I only navigate across months supported by that mode.
5. As an agente, I want to click a monthly payment and drill into its weekly breakdown, so that I can inspect the covered work days for that payment cycle.
6. As an agente, I want to click a day inside a payment cycle and drill into the daily photo list, so that I can understand which captured entries compose that total.
7. As an admin, I want loading, error and empty states to reflect the current query, so that the dashboard remains understandable while data is being fetched or when no records exist.
8. As a developer, I want the dashboard payload to be normalized and typed according to the backend contract, so that the screen logic is resilient to optional fields and response variations.
9. As a developer, I want `effective` mode to stop assuming pending behavior, so that the UI does not invent unsupported states such as paid-pending handling.
10. As a developer, I want the drill-down to be driven by the contract query parameters instead of duplicated local fetch state, so that monthly, weekly and daily navigation stay consistent.

## Implementation Decisions

- The agents dashboard continues to use a single endpoint, now aligned to `GET /v1/agentes/dashboard`.
- The active query state is modeled around the contract inputs:
  - `month` is always sent.
  - `dateType` is always sent and defaults to `tentative` only before the first response.
  - `paymentDate` is sent only for weekly or daily drill-down.
  - `workDate` is sent only for daily drill-down.
- The response `dateType` becomes the source of truth for the active dashboard mode after each successful request.
- The response `currentView` becomes the source of truth for which drill-down level is rendered.
- The dashboard uses the backend-provided `availableMonths` to keep month navigation aligned to the selected `dateType`.
- If the current month is no longer available for the returned `dateType`, the screen may realign to a valid available month instead of keeping an invalid selection.
- The previous status presentation that collapsed rejected or estorno entries into a generic pending badge is removed from the dashboard flow touched by this feature.
- `effective` mode does not assume pending entries exist and does not introduce any `pendência paga` behavior.
- Payload shape is documented through code-level typings derived from the contract, even though the repository is implemented in JavaScript rather than TypeScript.

## Testing Decisions

- Tests should verify external behavior of the dashboard seams, not component internals.
- A good test in this feature checks:
  - request params sent to the dashboard endpoint;
  - normalized response shape returned by the service layer;
  - month-selection rules derived from `availableMonths`;
  - drill-down state transitions that can be expressed through pure helpers.
- Prioritize unit tests for pure normalization and month-selection logic because the repository already has this style of deterministic contract-focused testing.
- Prefer testing the service seam over broad UI snapshots, since the behavior change is primarily driven by contract adaptation and query-state transitions.
- Manual validation remains relevant for the visual toggle flow and the end-to-end monthly -> weekly -> daily navigation.

## Out of Scope

- Implementing `pendência paga`.
- Changing unrelated agent profile or bank information flows.
- Creating an alternative dashboard endpoint.
- Redesigning the overall agents page layout outside the new toggle and drill-down behavior.
- Backend contract changes beyond consuming the fields documented in `dashboard-api-contract.md`.

## Further Notes

- `dashboard-api-contract.md` is the source of truth for this feature.
- No `PROJECT.md`, `CONTEXT.md`, ADR or glossary entry was available for this area during planning.
