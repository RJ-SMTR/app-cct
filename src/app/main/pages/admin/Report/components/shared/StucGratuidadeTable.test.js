import { explodeStucGratuidadeRows } from "./StucGratuidadeTable";

describe("explodeStucGratuidadeRows", () => {
  const nome = (r) => r.nomes;
  const cpfCnpj = (r) => r.cpfCnpj;
  const valor = (r) => r.valor;

  it("keeps a day with valorOrdemPagamentoN = 0 as its own row, not just a day with a value", () => {
    const report = {
      nomes: "Fulano",
      cpfCnpj: "12345678900",
      valor: 10,
      dataOrdemPagamento1: "23/10/2026",
      valorOrdemPagamento1: 10,
      dataOrdemPagamento2: "24/10/2026",
      valorOrdemPagamento2: 0,
      dataOrdemPagamento3: null,
      valorOrdemPagamento3: null,
      dataOrdemPagamento4: null,
      valorOrdemPagamento4: null,
    };

    const rows = explodeStucGratuidadeRows([report], { nome, cpfCnpj, valor });

    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual(
      expect.objectContaining({ dataOrdem: "24/10/2026", valorOrdem: 0 }),
    );
  });

  it("does not create a row for a day that never existed in the window (null date and null value)", () => {
    const report = {
      nomes: "Fulano",
      cpfCnpj: "12345678900",
      valor: 1,
      dataOrdemPagamento1: "27/10/2026",
      valorOrdemPagamento1: 1,
      dataOrdemPagamento2: "28/10/2026",
      valorOrdemPagamento2: 0,
      dataOrdemPagamento3: "29/10/2026",
      valorOrdemPagamento3: 3,
      dataOrdemPagamento4: null,
      valorOrdemPagamento4: null,
    };

    const rows = explodeStucGratuidadeRows([report], { nome, cpfCnpj, valor });

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.dataOrdem)).toEqual([
      "27/10/2026",
      "28/10/2026",
      "29/10/2026",
    ]);
  });
});
