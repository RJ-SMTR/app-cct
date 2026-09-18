import { getForgotPasswordCoverImage } from './forgotPasswordCoverImage';

describe('getForgotPasswordCoverImage', () => {
  it('shows the agentes photo for recovery originating from guardador login', () => {
    expect(getForgotPasswordCoverImage('guardador')).toBe('assets/images/etc/agentes.jpeg');
  });

  it.each(['permissionario', null, '', 'unknown'])(
    'retains the kombi photo for role %s',
    (role) => {
      expect(getForgotPasswordCoverImage(role)).toBe('assets/images/etc/kombi.jpg');
    }
  );
});
