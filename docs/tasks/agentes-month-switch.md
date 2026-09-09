# Agent monthly switching fix

## Source Context
- docs/PRD.md: Monthly payment switching regression; CONTEXT.md.
- No PROJECT.md or WORKFLOW.md found. Existing service tests and React/Jest scripts inspected.
- Areas: agentes/AgentesApp.js and agentes/services/agentesService.js.

## Implementation Goal
Prevent old monthly orders from remaining visible after a selection change.

## Non-Goals
No backend, date filtering, payment status, or weekly/daily behavior changes.

## Acceptance Criteria Mapping
| Criterion | Task | Test | Status |
| --- | --- | --- | --- |
| AC-M1 | T1 | Repeated grouped IDs | complete |
| AC-M2 | T2 | Out-of-order success/error | complete |
| AC-M3 | T2 | Loading, empty, failure, retry, unmount | complete |
| AC-M4 | T1, T2 | Existing normalization tests and code review | complete |

## T1 — Unique monthly row identities
Objective: distinguish repeated grouped orders.
Affected files: services/agentesService.js and its existing test.
Test-first plan: assert distinct keys for identical grouped rows; observe failure before adding positional discriminator.
Dependencies: none. Completion: regression and existing tests pass.

## T2 — Current-selection request lifecycle
Objective: only current monthly requests update state.
Affected files: AgentesApp.js, local useAgentesDashboard.js and test.
Test-first plan: render hook via React DOM, switch month with requests pending and resolve out of order. Then cover stale rejection, current error/retry, empty data and unmount.
Implementation: effect cleanup invalidates old requests; clear prior data on load; keep retry and error notification through existing app UI.
Dependencies: T1. Completion: lifecycle tests pass and app uses the hook.

## Test Strategy
Run CI=true npm test -- --watch=false --runInBand --runTestsByPath for the service and hook tests. Use jsdom for React tests. Manually verify August/September switching with real API data when an authenticated session is available.

## Risk Plan
Repeated rows may be legitimate: never remove or filter them. Ignore obsolete errors as well as successful responses. Keep notification behavior for current errors.

## Execution Order
T1 red/green, T2 red/green, focused checks and review.

## Open Questions
No blocking open questions.

## Handoff to tdd
Ready for tdd, starting with T1.

## Validation Results
- Service regression failed with 1 distinct key instead of 3 before the fix, then passed.
- Lifecycle regression reproduced August overwriting September before cleanup was added.
- Data-clearing regression failed before clearing state at request start, then passed.
- Focused Jest run: 2 suites, 11 tests passed. New hook and test pass ESLint with no errors.
- The user confirmed that month switching now works correctly after testing the corrected version. The agent did not use an authenticated browser session.
