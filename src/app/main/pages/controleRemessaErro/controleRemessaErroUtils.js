export const STATUS_OPCOES = ['Pago', 'Pago parcial', 'Não Pago', 'Aguardando Pagamento', 'Pgto. Pendentes', 'FRAUDE', 'Mudança de escopo', 'Outro'];

export const ORIGEM_ROTULO = { automatico: 'Automático', manual: 'Manual' };

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatBRL = (valor) => (valor === null || valor === undefined || valor === '' ? '—' : brl.format(Number(valor) || 0));

export const formatData = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
};

/** Aceita "1.234,56", "1234,56" ou "1234.56"; vazio vira null e texto inválido vira NaN. */
export function parseValor(texto) {
  const bruto = String(texto ?? '').replace(/[R$\s]/g, '');
  if (!bruto) return null;
  const normalizado = bruto.includes(',') ? bruto.replace(/\./g, '').replace(',', '.') : bruto;
  return Number(normalizado);
}

const hoje = () => new Date().toISOString().slice(0, 10);

export const FORMULARIO_VAZIO = {
  dataGeracao: '',
  dataPagamento: '',
  nomeRemessa: '',
  favorecido: '',
  valorPagar: '',
  valorPagoJuizo: '',
  valorTotalPago: '',
  status: '',
  ocorrencia: '',
};

export const formularioNovo = () => ({ ...FORMULARIO_VAZIO, dataGeracao: hoje() });

const valorParaCampo = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','));

export function formularioDe(item) {
  return {
    dataGeracao: item.dataGeracao || '',
    dataPagamento: item.dataPagamento || '',
    nomeRemessa: item.nomeRemessa || '',
    favorecido: item.favorecido || '',
    valorPagar: valorParaCampo(item.valorPagar),
    valorPagoJuizo: valorParaCampo(item.valorPagoJuizo),
    valorTotalPago: valorParaCampo(item.valorTotalPago),
    status: item.status || '',
    ocorrencia: item.ocorrencia || '',
  };
}

/** Valida o formulário e monta o corpo da API. Devolve { erro } ou { corpo }. */
export function corpoDoFormulario(form) {
  if (!form.dataGeracao) return { erro: 'Informe a data de geração da remessa.' };
  const valores = {};
  for (const [campo, rotulo] of [['valorPagar', 'Valor p/ pgto'], ['valorPagoJuizo', 'Valor pago em juízo'], ['valorTotalPago', 'Valor total pago']]) {
    const valor = parseValor(form[campo]);
    if (Number.isNaN(valor)) return { erro: `Valor inválido em ${rotulo}.` };
    valores[campo] = valor;
  }
  return {
    corpo: {
      dataGeracao: form.dataGeracao,
      dataPagamento: form.dataPagamento || null,
      nomeRemessa: form.nomeRemessa.trim() || null,
      favorecido: form.favorecido.trim() || null,
      ...valores,
      status: form.status || null,
      ocorrencia: form.ocorrencia.trim() || null,
    },
  };
}

/** Id da API ("man-12") para o id numérico do lançamento manual. */
export const idManual = (id) => Number(String(id).replace('man-', ''));
