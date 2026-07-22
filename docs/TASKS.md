## Source Context

- PRD: `docs/PRD.md`
- Project memory consulted: repository `AGENTS.md` instructions, no `PROJECT.md`, no `CONTEXT.md`, no `WORKFLOW.md` found in the repository
- Relevant modules:
  - `src/app/main/pages/agentes/AgentesApp.js`
  - `src/app/main/pages/profile/formCards/formCards.js`
  - `src/app/auth/AuthContext.js`
- Relevant scripts:
  - `npm test`

## Implementation Goal

Fix the shared `PersonalInfo` form so profile changes can be saved without requiring celular, including the admin email edit flow on `agentes/:id`.

## Non-Goals

- Do not change backend APIs.
- Do not alter guardador dashboard data loading.
- Do not change bank information flows.
- Do not redesign the shared profile form beyond the minimal validation/payload fix.

## Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) | Test(s) | Status |
| --- | --- | --- | --- |
| Admin can save email without celular when celular is disabled | T1, T2 | validation regression + manual admin flow review | planned |
| Self-edit flow can also save without celular | T1, T2 | validation regression | planned |
| Phone validation feedback points to the correct field | T2 | manual form review | planned |

## Task Breakdown

## T1 — Relax phone validation

Objective:
Create a small validation seam for the shared `PersonalInfo` form so `phone` is optional.

Affected files / areas:
`src/app/main/pages/profile/formCards/formCards.js`
Potential helper file under the same folder.

Test-first plan:
Add a focused regression test that proves empty `phone` is accepted.

Implementation notes:
Keep the logic local to the shared profile form area. Avoid changing unrelated form behavior.

Dependencies:
None.

Completion signal:
Automated test covers the optional phone outcome.

## T2 — Update shared submit behavior

Objective:
Prevent the shared form from sending a disabled phone field in admin-only email edits and correct the phone field error binding.

Affected files / areas:
`src/app/main/pages/profile/formCards/formCards.js`

Test-first plan:
Use the validation regression from T1 and manually review the submit payload path in code.

Implementation notes:
Only include `phone` in the patch payload when the current user can edit it. Keep the existing success/error behavior otherwise.

Dependencies:
T1.

Completion signal:
The form can submit without a phone value in non-editable contexts, and the field reads its own error state.

## Test Strategy

- Automated:
  - Run a focused Jest test for the extracted validation rule.
- Manual:
  - Review the `PersonalInfo` submit path for admin editing another user.
  - Confirm self-edit no longer blocks save when celular is empty.
- Expected command:
  - `npm test -- --runInBand --watch=false src/app/main/pages/profile/formCards/personalInfoValidation.test.js`

## Risk Plan

- Risk: the backend may still reject empty phone values in some flows.
  - Mitigation: keep the payload behavior narrow and validate the main admin flow first.
- Risk: backend still rejects disabled phone values.
  - Mitigation: omit `phone` from the payload when it is not editable.
- Risk: hidden UI regression from shared form reuse.
  - Mitigation: keep the change narrow and confined to `PersonalInfo`.

## Execution Order

1. Add validation seam and regression test.
2. Update `PersonalInfo` to use the conditional schema.
3. Adjust submit payload and phone error binding.
4. Run the focused test command.

## Open Questions

No blocking open questions.

## Handoff to tdd

Ready for tdd. Start with T1 and write the failing validation test for optional phone behavior.
