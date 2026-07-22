## Problem Statement

Na tela de edição de usuário que salva via `PATCH /users/:id`, o frontend não trata corretamente o retorno `422` para e-mail duplicado. Quando a API informa `emailAlreadyExists`, o formulário mantém o tratamento genérico e não traduz esse caso para uma mensagem clara no campo de e-mail.

## Solution

Ajustar o fluxo de edição de dados cadastrais para detectar o erro de e-mail duplicado tanto em `body.message` quanto em `body.errors.email`, exibir `Este e-mail já está em uso` no campo de e-mail e manter o tratamento atual dos outros erros `422`.

## User Stories

1. As an admin editing a user, I want to see a clear email field error when the email is already in use, so that I can correct it immediately.
2. As a user editing profile data, I want duplicate-email validation to appear inline on the email field, so that the form does not look like it saved successfully.
3. As a developer, I want the duplicate-email API contract to be handled in one small seam, so that both supported backend payload shapes behave the same way.
4. As a developer, I want the existing handling of other `422` validation errors to remain unchanged, so that this bug fix does not regress phone or bank field feedback.

## Implementation Decisions

- The fix stays in the shared user edit flow used by `PersonalInfo`.
- `patchInfo` must expose enough of the `422` response payload for the form to inspect `body.message` and `body.errors.email`.
- Duplicate-email detection must support both payload shapes described by the backend.
- Existing non-duplicate validation handling must be preserved.
- A focused helper is preferred over spreading backend payload checks inline through the component.

## Testing Decisions

- Add a focused unit test around the duplicate-email error extraction seam.
- Validate both supported API shapes:
  - `body.message = 'emailAlreadyExists'`
  - `body.errors.email = 'emailAlreadyExists'`
- Keep the test behavior-focused and avoid introducing a broad UI harness where the repository currently only has narrow Jest tests in this area.

## Out of Scope

- Changes to the save route itself.
- Changes to unrelated validation messages.
- Broad refactors of profile or bank forms.

## Further Notes

- The field message for this case must be exactly `Este e-mail já está em uso`.
