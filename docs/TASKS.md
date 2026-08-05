## Source Context

- PRD: `docs/PRD.md`
- Contract: `dashboard-api-contract.md`
- Project memory consulted: repository `AGENTS.md` instructions, no `PROJECT.md`, no `CONTEXT.md`, no `WORKFLOW.md` found in the repository
- Relevant modules:
  - `src/app/main/pages/agentes/AgentesApp.js`
  - `src/app/main/pages/agentes/services/agentesService.js`
  - `src/app/main/pages/agentes/agentesMonthSelection.js`
  - `src/app/auth/services/jwtService/jwtServiceConfig.js`
- Relevant existing tests:
  - `src/app/main/pages/agentes/agentesMonthSelection.test.js`
  - `src/app/store/agentConsolidatedReportUtils.test.js`
- Relevant scripts:
  - `npm test -- --runInBand --watch=false`

## Implementation Goal

Atualizar o dashboard de agentes para consumir o contrato novo de `GET /v1/agentes/dashboard`, adicionando o toggle de `dateType`, recarga consistente de dados e `availableMonths`, e navegação mensal -> semanal -> diária guiada pelo próprio contrato.

## Non-Goals

- Não implementar `pendência paga`.
- Não alterar endpoints além da rota de dashboard usada por esta tela.
- Não refatorar as áreas de perfil, convite ou dados bancários.
- Não redesenhar toda a experiência visual da página.

## Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) | Test(s) | Status |
| --- | --- | --- | --- |
| Dashboard sends mandatory `month` and explicit `dateType` to the new endpoint | T1 | service contract test | planned |
| Screen supports toggling between tentative and effective modes | T1, T2 | service contract test + manual toggle flow | planned |
| Changing `dateType` reloads data and refreshes `availableMonths` | T1, T2 | month-selection helper test + manual toggle flow | planned |
| Effective mode does not assume pending behavior | T2 | manual status rendering review | planned |
| Dashboard handles loading, error and empty states | T2 | manual query-state review | planned |
| Drill-down monthly -> weekly -> daily uses contract parameters | T1, T2 | service contract test + query-state helper test + manual navigation | planned |

## Task Breakdown

## T1 — Adapt service and contract helpers

Objective:
Align the agents dashboard service with the new endpoint and formalize the payload shape and query rules around `month`, `dateType`, `paymentDate` and `workDate`.

Affected files / areas:
`src/app/main/pages/agentes/services/agentesService.js`
New helper/types file under `src/app/main/pages/agentes/services/`
`src/app/auth/services/jwtService/jwtServiceConfig.js`
`src/app/main/pages/agentes/agentesMonthSelection.js`

Test-first plan:
Add a focused contract test that proves the request params and normalized response shape match `dashboard-api-contract.md`. Extend month-selection tests for `availableMonths` behavior when the active mode changes.

Implementation notes:
Keep normalization defensive and local to the service seam. Export pure helpers when needed so query-state rules remain testable without UI coupling.

Dependencies:
None.

Completion signal:
The service always sends `month` and `dateType`, points to `/v1/agentes/dashboard`, normalizes the new response fields, and exposes helpers needed by the screen state.

## T2 — Refactor dashboard query state and drill-down UI

Objective:
Replace duplicated drill-down fetch state with a single dashboard query flow, add the `dateType` toggle, and render monthly, weekly and daily views from the contract response.

Affected files / areas:
`src/app/main/pages/agentes/AgentesApp.js`
Possible small presentation helpers colocated with the page

Test-first plan:
Use the pure helpers from T1/T2 to lock down state transitions for month/dateType/paymentDate/workDate. Validate visual behavior manually on the page for loading, error, empty state and navigation.

Implementation notes:
Use the response `dateType` as the active toggle state and the response `currentView` as the rendered drill-down state. Clear `paymentDate` and `workDate` appropriately on month or `dateType` changes. Do not preserve the old pending-specific badge semantics.

Dependencies:
T1.

Completion signal:
The screen can switch date modes, reload on query changes, respect `availableMonths`, and drill from monthly to weekly to daily using only the contract-driven state.

## Test Strategy

- Automated:
  - Add a Jest test for the dashboard service contract seam.
  - Extend the month-selection test file for `availableMonths` reconciliation.
  - Add a focused pure-helper test if query-state transitions are extracted.
- Manual:
  - Confirm `tentative` and `effective` toggle reloads data.
  - Confirm month options update after changing `dateType`.
  - Confirm a monthly row opens weekly data and a weekly row opens daily data.
  - Confirm effective mode does not show invented pending behavior.
  - Confirm loading, error and empty states render sensibly.
- Expected commands:
  - `npm test -- --runInBand --watch=false src/app/main/pages/agentes/agentesMonthSelection.test.js`
  - `npm test -- --runInBand --watch=false src/app/main/pages/agentes/services/agentesService.test.js`

## Risk Plan

- Risk: the returned `availableMonths` may not contain the current month after a `dateType` switch.
  - Mitigation: reconcile the selected month against the returned list and realign to a valid month when needed.
- Risk: mixing local drill-down state with response state can create stale UI.
  - Mitigation: collapse the query state into one source of truth and derive the visible level from `currentView`.
- Risk: old pending badge semantics may misrepresent effective-mode statuses.
  - Mitigation: render backend statuses directly and only use `pendingReason` as complementary information.
- Risk: free-form month picking may request unsupported months.
  - Mitigation: drive navigation from `availableMonths` rather than assuming contiguous months.

## Execution Order

1. Add failing tests for request params, response normalization and month reconciliation helpers.
2. Update the dashboard service, endpoint config and typing helpers.
3. Refactor the dashboard page state to use `month`, `dateType`, `paymentDate` and `workDate`.
4. Add the toggle, month navigation and contract-driven drill-down rendering.
5. Run focused tests, then do a manual review of the dashboard states.

## Open Questions

No blocking open questions.

## Handoff to tdd

Ready for tdd. Start with T1 and write the failing contract test for the dashboard service request and normalized response.
