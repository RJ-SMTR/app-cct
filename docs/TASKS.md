## Source Context

- PRD: `docs/PRD.md`
- Project memory consulted: repository `AGENTS.md` instructions, no `PROJECT.md`, no `CONTEXT.md`, no `WORKFLOW.md` found in the repository
- Relevant modules:
  - `src/app/main/pages/auth/password/reset/ResetPassword.js`
  - `src/app/auth/AuthContext.js`
  - `src/app/auth/services/jwtService/jwtServiceConfig.js`
- Relevant tests:
  - `src/app/main/pages/profile/formCards/personalInfoValidation.test.js` as the local Jest style reference
- Relevant scripts:
  - `npm test -- --runInBand --watch=false`

## Implementation Goal

Adapt the reset password success flow so the frontend reads the backend-provided `redirectTo` value and navigates to that exact path after a successful password reset, without changing the forgot password flow or app routes.

## Non-Goals

- Do not change the forgot password request flow.
- Do not change route definitions or add new routes.
- Do not add frontend role-based redirect logic.
- Do not refactor unrelated authentication modules.

## Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) | Test(s) | Status |
| --- | --- | --- | --- |
| Reset password success uses backend `redirectTo` instead of a hardcoded local path | T1, T2 | focused redirect contract regression | planned |
| Backend return `/sign-in` keeps redirecting to `/sign-in` | T1, T2 | unit regression for `/sign-in` | planned |
| Backend return `/agentes/sign-in` redirects to `/agentes/sign-in` | T1, T2 | unit regression for `/agentes/sign-in` | planned |
| Existing loading, error, and success behavior is preserved | T2 | manual code-path review + focused app test run | planned |

## Task Breakdown

## T1 — Create a test seam for reset success redirect

Objective:

Create a small seam inside the reset password flow that exposes the backend-provided redirect target for focused regression testing.

Affected files / areas:

`src/app/main/pages/auth/password/reset/`

Test-first plan:

Add a Jest test that validates the seam returns `/sign-in` and `/agentes/sign-in` exactly as provided by the backend success payload.

Implementation notes:

Keep the seam local to the reset password feature. Do not introduce frontend role inference or broader auth abstractions.

Dependencies:

None.

Completion signal:

Automated coverage exists for both supported redirect paths.

## T2 — Wire the screen to the new reset response contract

Objective:

Update the reset password submit success path to use the backend-provided redirect target while preserving the current success timing and messaging behavior.

Affected files / areas:

`src/app/main/pages/auth/password/reset/ResetPassword.js`
`src/app/auth/AuthContext.js`

Test-first plan:

Use the failing regression from T1, then update the screen flow so the production path consumes the same seam.

Implementation notes:

Keep the existing `setTimeout`-based delayed navigation, current error handling, and success message dispatch. Only replace the post-success destination source.

Dependencies:

T1.

Completion signal:

The screen navigates using `response.data.redirectTo` after a successful reset and no hardcoded local path remains in this flow.

## Test Strategy

- Automated:
  - Add a focused Jest test for the reset success redirect seam covering `/sign-in` and `/agentes/sign-in`.
- Manual:
  - Review the reset password submit path to confirm success and error handling are unchanged.
  - Confirm the forgot password flow remains untouched.
- Expected command:
  - `npm test -- --runInBand --watch=false --runTestsByPath src/app/main/pages/auth/password/reset/resetPasswordRedirect.test.js`

## Risk Plan

- Risk: the UI may still hardcode a destination elsewhere in the flow.
  - Mitigation: keep the redirect source centralized in the reset success path and remove the local hardcoded path there.
- Risk: the success response shape may be accessed inconsistently.
  - Mitigation: use one local seam and consume it from the screen.
- Risk: a broader auth refactor could accidentally alter current success/error UX.
  - Mitigation: keep the change scoped to the post-success navigation behavior only.

## Execution Order

1. Add the focused redirect regression test.
2. Introduce the local seam needed for the test.
3. Update the reset password screen to navigate from the backend payload.
4. Run the focused test command.

## Open Questions

No blocking open questions.

## Handoff to tdd

Ready for tdd. Start with T1 and write the failing regression for the two backend-provided redirect targets.
