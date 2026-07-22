import { createPersonalInfoSchema } from "./personalInfoValidation";

describe("createPersonalInfoSchema", () => {
  it("allows empty phone", async () => {
    const schema = createPersonalInfoSchema();

    await expect(
      schema.validate({ phone: "" }, { abortEarly: false })
    ).resolves.toEqual({ phone: "" });
  });
});
