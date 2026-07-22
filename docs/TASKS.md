## Source Context

- PRD: `docs/PRD.md`
- Project memory consulted: repository `AGENTS.md` instructions, no `PROJECT.md`, no `CONTEXT.md`, no `WORKFLOW.md` found in the repository
- Relevant modules:
  - `src/app/main/pages/profile/formCards/formCards.js`
  - `src/app/auth/AuthContext.js`
- Relevant tests:
  - `src/app/main/pages/profile/formCards/personalInfoValidation.test.js`
- Relevant scripts:
  - `npm test -- --runInBand --watch=false --runTestsByPath`

## Implementation Goal

Handle duplicate-email `422` responses in the shared user edit form so the email field shows `Este e-mail já está em uso`, while preserving the current handling for other validation errors.

## Non-Goals

- Do not change the `PATCH /users/:id` route.
- Do not change unrelated form flows.
- Do not change bank form validation behavior beyond adapting to the richer rejected payload format.

## Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) | Test(s) | Status |
| --- | --- | --- | --- |
| Duplicate email in `body.message` shows the correct email field message | T1, T2 | focused unit regression | planned |
| Duplicate email in `body.errors.email` shows the correct email field message | T1, T2 | focused unit regression | planned |
| Other existing `422` handling remains intact | T2 | code-path review + focused test run | planned |

## Task Breakdown

## T1 — Add duplicate-email error seam

Objective:

Create a small seam that recognizes duplicate-email API payloads for the personal info form.

Affected files / areas:

`src/app/main/pages/profile/formCards/`

Test-first plan:

Add a Jest test covering both supported backend payload shapes.

Implementation notes:

Keep the seam local to the personal info form area and avoid introducing generic API abstraction.

Dependencies:

None.

Completion signal:

Automated coverage exists for both duplicate-email payload variants.

## T2 — Wire the personal info form to the richer `422` payload

Objective:

Update `patchInfo` consumers so the personal info form can show the duplicate-email field message while preserving the existing handling of other validation errors.

Affected files / areas:

`src/app/main/pages/profile/formCards/formCards.js`
`src/app/auth/AuthContext.js`

Test-first plan:

Use the failing regression from T1, then route the production form logic through the same seam.

Implementation notes:

Preserve the current success path and the current non-duplicate validation behavior.

Dependencies:

T1.

Completion signal:

The personal info form maps duplicate-email API responses to the required field message and other error handling still follows the existing behavior.

## Test Strategy

- Automated:
  - Run a focused Jest test for the duplicate-email extraction seam.
- Manual:
  - Review the personal info submit catch path for duplicate and non-duplicate errors.
- Expected command:
  - `npm test -- --runInBand --watch=false --runTestsByPath src/app/main/pages/profile/formCards/personalInfoApiErrors.test.js`

## Risk Plan

- Risk: changing `patchInfo` reject shape could break other consumers.
  - Mitigation: keep the change scoped to the known consumers in `formCards.js`.
- Risk: generic email validation message could be lost.
  - Mitigation: preserve the existing fallback path for non-duplicate email errors.

## Execution Order

1. Add the focused duplicate-email regression test.
2. Implement the local error extraction seam.
3. Update `patchInfo` reject handling and form error mapping.
4. Run the focused test command.

## Open Questions

No blocking open questions.

## Handoff to tdd

Ready for tdd. Start with T1 and write the failing regression for the two duplicate-email payload variants.
