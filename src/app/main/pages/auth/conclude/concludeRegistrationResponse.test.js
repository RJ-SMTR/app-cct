import {
  getConcludeRegistrationInviteData,
  getConcludeRegistrationRegisterData,
} from './concludeRegistrationResponse';

describe('concludeRegistrationResponse', () => {
  it('reads invite data when the backend redirects agentes to agentes sign-in', () => {
    const inviteData = getConcludeRegistrationInviteData({
      data: {
        fullName: 'Maria da Silva',
        email: 'maria@example.com',
        permitCode: '12345',
        roleId: 6,
        redirectTo: '/agentes/sign-in',
      },
    });

    expect(inviteData).toEqual({
      fullName: 'Maria da Silva',
      email: 'maria@example.com',
      permitCode: '12345',
      roleId: 6,
      redirectTo: '/agentes/sign-in',
    });
  });

  it('reads invite data when the backend redirects non-agentes to generic sign-in', () => {
    const inviteData = getConcludeRegistrationInviteData({
      data: {
        fullName: 'Joao Pereira',
        email: 'joao@example.com',
        permitCode: '54321',
        roleId: null,
        redirectTo: '/sign-in',
      },
    });

    expect(inviteData).toEqual({
      fullName: 'Joao Pereira',
      email: 'joao@example.com',
      permitCode: '54321',
      roleId: null,
      redirectTo: '/sign-in',
    });
  });

  it('reads register success data when the backend redirects agentes to agentes sign-in', () => {
    const registerData = getConcludeRegistrationRegisterData({
      data: {
        roleId: 6,
        redirectTo: '/agentes/sign-in',
      },
    });

    expect(registerData).toEqual({
      fullName: undefined,
      email: undefined,
      permitCode: undefined,
      roleId: 6,
      redirectTo: '/agentes/sign-in',
    });
  });

  it('reads register success data when the backend redirects non-agentes to generic sign-in', () => {
    const registerData = getConcludeRegistrationRegisterData({
      data: {
        roleId: null,
        redirectTo: '/sign-in',
      },
    });

    expect(registerData).toEqual({
      fullName: undefined,
      email: undefined,
      permitCode: undefined,
      roleId: null,
      redirectTo: '/sign-in',
    });
  });
});
