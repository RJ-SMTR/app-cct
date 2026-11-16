import { MOTIVO_OBRIGATORIO_MENSAGEM, motivoObrigatorioFaltando } from "./reportRequestUtils";

// Pendência de Pagamento sem motivo não pode ser pesquisada: sem motivo, o filtro não vira
// Estorno/Rejeitado/OPs atrasadas e a busca saía com outro status (ou não saía), sem aviso claro.
describe("motivoObrigatorioFaltando", () => {
  it("bloqueia quando Pendência de Pagamento está selecionada e nenhum motivo foi escolhido", () => {
    expect(motivoObrigatorioFaltando({ showErroStatus: true, selectedErroStatus: [] })).toBe(true);
  });

  it("libera quando há pelo menos um motivo", () => {
    expect(motivoObrigatorioFaltando({ showErroStatus: true, selectedErroStatus: [{ label: "Estorno" }] })).toBe(false);
  });

  it("não exige motivo quando Pendência de Pagamento não está selecionada", () => {
    expect(motivoObrigatorioFaltando({ showErroStatus: false, selectedErroStatus: [] })).toBe(false);
  });

  it("trata seleção ausente como vazia", () => {
    expect(motivoObrigatorioFaltando({ showErroStatus: true, selectedErroStatus: undefined })).toBe(true);
  });

  it("tem uma mensagem para o campo e para o aviso", () => {
    expect(MOTIVO_OBRIGATORIO_MENSAGEM).toBe("Selecione um motivo para a Pendência de Pagamento.");
  });
});
