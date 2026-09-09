## Problem Statement

On the `agentes/:id` screen, an admin can edit a guardador's email in the shared `PersonalInfo` form. When the guardador has no celular saved, the form currently blocks submission because `phone` is always required, even when the field is disabled and cannot be edited in that context.

## Solution

Allow the shared profile form to save changes without requiring celular. The field may remain editable where the current flow allows it, but its absence must not block saving email or other allowed profile data.

## User Stories

1. As an admin, I want to update a guardador's email even when that guardador has no celular registered, so that I can correct invitation and login data without being blocked by an unrelated field.
2. As an admin, I want disabled fields to stop blocking form submission, so that the save action matches what the UI allows me to edit.
3. As a guardador editing my own profile, I want to save my profile even if I do not provide celular, so that contact data is not a blocker for other profile changes.
4. As a developer, I want the validation rule for `PersonalInfo` to stop treating celular as mandatory, so that the shared form behaves consistently across admin and self-service contexts.
5. As a developer, I want a regression test around the validation rule, so that future edits do not reintroduce the email-save block.

## Implementation Decisions

- The fix stays inside the shared `PersonalInfo` flow because `AgentesApp` reuses that form for guardador profile data.
- The `phone` validation rule no longer requires a value in the shared `PersonalInfo` form.
- The submit payload omits `phone` entirely when the current user cannot edit it, reducing the chance of backend validation on a disabled field.
- The phone field error wiring is corrected so the visible error matches the actual form field name.

## Testing Decisions

- Add a focused regression test around the validation seam instead of a broad UI test, because the bug is caused by form validation rather than table/dashboard behavior.
- The test should verify external behavior of the validation rule:
  - `phone` is optional.
- Manual validation remains relevant for the end-to-end admin flow on `agentes/:id`.

## Out of Scope

- Changes to backend validation rules.
- Changes to bank data, invite resend, or dashboard behavior in `AgentesApp`.
- Broad refactors of the profile form system.

## Further Notes

- This PRD is intentionally narrow because the requested work is a targeted bug fix on an existing shared form.
