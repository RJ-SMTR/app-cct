import * as yup from "yup";

export function createPersonalInfoSchema() {
  return yup.object().shape({
    phone: yup.string(),
    email: yup
      .string()
      .trim()
      .email("Insira um e-mail valido")
      .nullable(),
  });
}
