import {
  getConcludeRegistrationCoverImage,
  getConcludeRegistrationInviteData,
  getConcludeRegistrationRegisterData,
  getConcludeRegistrationPrimaryInfo,
  isConcludeRegistrationAgente,
} from './concludeRegistrationResponse';

describe('concludeRegistrationResponse', () => {
  it('reads invite data when the backend redirects agentes to agentes sign-in', () => {
    const inviteData = getConcludeRegistrationInviteData({
      data: {
        user: {
          fullName: 'Maria da Silva',
          email: 'maria@example.com',
          permitCode: '12345',
          cpfCnpj: '12345678901',
          role: {
            id: 6,
            name: 'agentes',
          },
        },
        roleId: 6,
        redirectTo: '/agentes/sign-in',
      },
    });

    expect(inviteData).toEqual({
      fullName: 'Maria da Silva',
      email: 'maria@example.com',
      permitCode: '12345',
      cpfCnpj: '12345678901',
      roleId: 6,
      roleName: 'agentes',
      redirectTo: '/agentes/sign-in',
    });
  });

  it('reads invite data when the backend redirects non-agentes to generic sign-in', () => {
    const inviteData = getConcludeRegistrationInviteData({
      data: {
        user: {
          fullName: 'Joao Pereira',
          email: 'joao@example.com',
          permitCode: '54321',
          cpfCnpj: '10987654321',
          role: {
            id: 2,
            name: 'user',
          },
        },
        roleId: null,
        redirectTo: '/sign-in',
      },
    });

    expect(inviteData).toEqual({
      fullName: 'Joao Pereira',
      email: 'joao@example.com',
      permitCode: '54321',
      cpfCnpj: '10987654321',
      roleId: null,
      roleName: 'user',
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
      cpfCnpj: undefined,
      roleId: 6,
      roleName: undefined,
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
      cpfCnpj: undefined,
      roleId: null,
      roleName: undefined,
      redirectTo: '/sign-in',
    });
  });

  it('identifies agente variants from backend role data', () => {
    const inviteData = getConcludeRegistrationInviteData({
      data: {
        user: {
          role: {
            id: 6,
            name: 'agentes',
          },
          cpfCnpj: '12345678901',
          permitCode: '0052',
        },
        roleId: 6,
        redirectTo: '/agentes/sign-in',
      },
    });

    expect(isConcludeRegistrationAgente(inviteData)).toBe(true);
    expect(getConcludeRegistrationPrimaryInfo(inviteData)).toEqual({
      label: 'CPF',
      value: '12345678901',
    });
    expect(getConcludeRegistrationCoverImage(inviteData)).toBe('assets/images/etc/agentes.jpeg');
  });

  it('keeps the default permissionary variant for non-agentes', () => {
    const inviteData = getConcludeRegistrationInviteData({
      data: {
        user: {
          role: {
            id: 2,
            name: 'user',
          },
          cpfCnpj: '10987654321',
          permitCode: '1234',
        },
        roleId: 2,
        redirectTo: '/sign-in',
      },
    });

    expect(isConcludeRegistrationAgente(inviteData)).toBe(false);
    expect(getConcludeRegistrationPrimaryInfo(inviteData)).toEqual({
      label: 'Código de permissão',
      value: '1234',
    });
    expect(getConcludeRegistrationCoverImage(inviteData)).toBe('assets/images/etc/kombi.jpg');
  });
});
