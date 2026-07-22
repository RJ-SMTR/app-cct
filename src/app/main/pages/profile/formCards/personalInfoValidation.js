import * as yup from "yup";

export function createPersonalInfoSchema() {
  return yup.object().shape({
    phone: yup.string(),
  });
}
