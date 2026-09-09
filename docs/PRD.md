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


## Monthly payment switching regression (2026-09-09)

### Problem Statement
Switching months on an agent dashboard can leave previous orders visible. Monthly row keys reuse grouped order IDs without distinguishing repeated rows, and overlapping requests can overwrite the current dashboard.

### Solution and User Stories
1. As an administrator, I want the table to show only the latest selected month's response.
2. As an administrator, I want repeated order groups to render and disappear correctly when switching months.
3. As an administrator, I want loading, errors, and retry to follow the current selection.

### Acceptance Criteria
- AC-M1: Rows have distinct React identities even when grouped order IDs repeat, including identical records.
- AC-M2: Previous requests cannot replace current data, report stale errors, or end current loading.
- AC-M3: Switching month clears previous data; empty results and failures do not show old orders. Retry remains available. Unmounted views ignore pending results.
- AC-M4: Preserve API parameters, payment status/value/date semantics and all rows returned for the selected month.

### Implementation Decisions
Keep normalization in the agent service. Isolate monthly request state in a local hook with effect cleanup and retry. Include row position in grouped row identities.

### Testing Decisions
Use existing service tests for repeated keys and React DOM hook integration tests with controlled promises for month switching, loading, stale success/error, empty responses, retry and unmount. Run focused Jest checks.

### Out of Scope
Backend changes, filtering orders by attempted payment date, deduplication of legitimate records, redesign, and weekly/daily request behavior.
