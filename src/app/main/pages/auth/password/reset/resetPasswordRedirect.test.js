import { getResetPasswordRedirectTo } from './resetPasswordRedirect';

describe('getResetPasswordRedirectTo', () => {
  it('returns the backend redirect for permissionary sign-in', () => {
    const redirectTo = getResetPasswordRedirectTo({
      data: {
        redirectTo: '/sign-in',
      },
    });

    expect(redirectTo).toBe('/sign-in');
  });

  it('returns the backend redirect for agent sign-in', () => {
    const redirectTo = getResetPasswordRedirectTo({
      data: {
        redirectTo: '/agentes/sign-in',
      },
    });

    expect(redirectTo).toBe('/agentes/sign-in');
  });
});
