import { getResetPasswordCoverImage } from './resetPasswordCoverImage';

describe('getResetPasswordCoverImage', () => {
  it('returns the guardador cover image for roleId 6', () => {
    expect(getResetPasswordCoverImage(6)).toBe('assets/images/etc/agentes.jpeg');
  });

  it('returns the default cover image for other role ids', () => {
    expect(getResetPasswordCoverImage(2)).toBe('assets/images/etc/kombi.jpg');
  });

  it('returns the default cover image when the role could not be resolved', () => {
    expect(getResetPasswordCoverImage(null)).toBe('assets/images/etc/kombi.jpg');
  });
});
