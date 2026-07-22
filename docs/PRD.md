## Problem Statement

Na tela de redefinição de senha, o frontend ainda assume que o endpoint `POST /api/v1/auth/reset/password` conclui sem corpo e sempre redireciona o usuário para `/sign-in`. O backend passou a decidir o destino correto após o reset com base no papel associado ao hash e agora retorna `200` com `redirectTo`. Enquanto o frontend ignorar esse contrato, usuários do fluxo de agentes serão enviados para a tela errada após redefinir a senha.

## Solution

Atualizar o fluxo de redefinição de senha para consumir o novo payload de sucesso do backend e usar exatamente o valor de `redirectTo` na navegação pós-reset, preservando o comportamento atual de loading, mensagens de erro, mensagem de sucesso e atraso antes do redirecionamento.

## User Stories

1. As a permissionary user, I want to be redirected to `/sign-in` after resetting my password, so that I land on the correct login screen for my flow.
2. As an agent user, I want to be redirected to `/agentes/sign-in` after resetting my password, so that I return to the correct login screen without frontend role inference.
3. As a developer, I want the reset password flow to consume the backend response contract directly, so that role-based routing logic stays centralized on the server.
4. As a developer, I want the reset password screen to preserve its current loading, success, and error behavior, so that only the post-success navigation changes.
5. As a developer, I want regression coverage for both redirect targets returned by the backend, so that future changes do not reintroduce a hardcoded redirect.

## Implementation Decisions

- The change stays limited to the password reset flow and must not alter the reset email request flow.
- The frontend must read `response.data.redirectTo` from the successful reset password response and navigate using that exact value.
- Any local rule that infers the destination from role, route shape, or other frontend state is out of scope and must not be introduced.
- The existing delay before navigation and the current success/error messaging behavior must remain unchanged.
- If a reusable response seam is needed for testing, it should stay local to the reset password flow rather than introducing broad auth abstractions.
- There is no TypeScript contract in this area today; no synthetic typing layer should be introduced just for this bug fix.

## Testing Decisions

- Favor a focused regression seam around the reset success redirect behavior instead of a broad end-to-end auth test.
- Test external behavior of the new contract handling by validating both backend-provided redirect targets:
  - `/sign-in`
  - `/agentes/sign-in`
- Reuse the repository's existing Jest style for narrow unit tests where possible.
- Manual validation should confirm the screen still shows the current success path and only changes destination after a successful reset.

## Out of Scope

- Changes to `POST /api/v1/auth/forgot/password`.
- Changes to application route definitions.
- Any frontend role detection or redirect heuristics beyond consuming `redirectTo`.
- Broader authentication refactors outside the reset password success path.

## Further Notes

- This is a narrow backend contract alignment on an existing screen.
- The payload shape expected from the backend success response is:
  - `redirectTo: string`
