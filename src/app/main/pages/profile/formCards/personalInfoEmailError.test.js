import { getEmailErrorMessage } from './personalInfoEmailError';

describe('getEmailErrorMessage', () => {
  it('explains that the e-mail is already in use', () => {
    expect(getEmailErrorMessage('emailAlreadyExists')).toBe('E-mail já está sendo usado.');
  });

  it('keeps the invalid e-mail message for other validation errors', () => {
    expect(getEmailErrorMessage('email must be an email')).toBe('E-mail inválido');
  });

  it('falls back to the invalid e-mail message when the error is not a known code', () => {
    expect(getEmailErrorMessage(undefined)).toBe('E-mail inválido');
  });
});
