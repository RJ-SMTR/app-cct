import {
  getPersonalInfoEmailErrorMessage,
  isDuplicateEmailError,
} from "./personalInfoApiErrors";

describe("personalInfoApiErrors", () => {
  it("recognizes duplicate email from body.message", () => {
    const apiError = {
      message: "emailAlreadyExists",
    };

    expect(isDuplicateEmailError(apiError)).toBe(true);
    expect(getPersonalInfoEmailErrorMessage(apiError)).toBe("Este e-mail já está em uso");
  });

  it("recognizes duplicate email from body.errors.email", () => {
    const apiError = {
      errors: {
        email: "emailAlreadyExists",
      },
    };

    expect(isDuplicateEmailError(apiError)).toBe(true);
    expect(getPersonalInfoEmailErrorMessage(apiError)).toBe("Este e-mail já está em uso");
  });
});
