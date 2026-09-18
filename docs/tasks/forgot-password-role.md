# Forgot-password role implementation plan

## Source Context

- Specification: the forgot-password role section of `docs/PRD.md`.
- Memory: `CONTEXT.md`; no PROJECT.md, WORKFLOW.md, or repository-local AGENTS.md found.
- Login screens: `src/app/main/pages/auth/sign-in/SignInPage.js` and `src/app/main/pages/agentes/sign-in/AgentesSignInPage.js`.
- Recovery: `src/app/main/pages/auth/password/forgot/ForgotPassword.js`.
- Prior tests: resetPasswordCoverImage.test.js. Command: npm test (react-app-rewired/Jest).

## Implementation Goal

Carry the originating role in the recovery URL and display its existing cover image.

## Non-Goals

Backend, recovery submission, authorization, other login screens, and layout changes.

## Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) | Test(s) | Status |
| --- | --- | --- | --- |
| AC-F1: guardador link carries role and shows agentes photo | T1, T2 | cover selection + link inspection | complete |
| AC-F2: permissionário link carries role and shows kombi photo | T1, T2 | cover selection + link inspection | complete |
| AC-F3: absent/invalid role retains kombi photo | T1 | fallback cases | complete |

## Task Breakdown

### T1 — Select the recovery cover

Objective: resolve the existing cover image from a role string.
Affected files: forgot/forgotPasswordCoverImage.js and its test.
Test-first plan: fail the guardador case, implement it, then cover permissionário and missing/invalid values.
Implementation notes: explicit guardador match; all other values retain the current cover.
Dependencies: none.
Completion signal: focused Jest tests pass.

### T2 — Connect login links and recovery page

Objective: pass role=guardador or role=permissionario and read it with useSearchParams.
Affected files: the two login screens and ForgotPassword.js.
Test-first plan: use T1's cover regression and inspect the two link destinations and recovery wiring.
Implementation notes: update photo alt text to match its subject; query parameter affects presentation only.
Dependencies: T1.
Completion signal: destinations carry the specified values and recovery uses the query value.

## Test Strategy

Run `npm test -- --watch=false --runInBand src/app/main/pages/auth/password/forgot/forgotPasswordCoverImage.test.js src/app/main/pages/auth/password/reset/resetPasswordCoverImage.test.js`.
Inspect both link destinations and query wiring. Browser validation should click each recovery link and inspect the desktop cover.

## Risk Plan

Unknown or missing role must preserve the existing photo. Query input must never affect authorization or the recovery API call. Keep unrelated untracked files intact.

## Execution Order

T1 red-green, fallback verification, T2 wiring, focused tests and diff review.

## Open Questions

No blocking open questions.

## Handoff to tdd

Ready for tdd. Start with the failing guardador image selection test.

## Validation Results

Implemented T1 and T2. The initial guardador test failed before the selection helper existed and passed after implementation. Both focused suites pass (8 tests). Link destinations and query wiring were reviewed, both image assets exist, and git diff --check passes. Browser validation was not performed.
