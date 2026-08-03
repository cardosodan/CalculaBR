// Utilidades compartilhadas por todas as calculadoras — formatação de
// moeda/percentual em pt-BR e parsing de input numérico (o usuário digita
// "1234,56", o <input type="number"> nativo só aceita ponto, então cada
// calculadora usa um <input type="text" inputmode="decimal"> e passa o
// valor por aqui em vez de confiar no parsing nativo do navegador).

const formatadorBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarBRL(valor) {
  if (!Number.isFinite(valor)) return "—";
  return formatadorBRL.format(valor);
}

function formatarPercentual(valor, casas = 1) {
  if (!Number.isFinite(valor)) return "—";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) + "%";
}

// "1.234,56" ou "1234,56" ou "1234.56" -> 1234.56 (number). Vazio/inválido -> NaN.
function parseNumeroBR(texto) {
  if (typeof texto !== "string") return NaN;
  const limpo = texto.trim().replace(/\./g, "").replace(",", ".");
  return limpo === "" ? NaN : Number(limpo);
}

// Conta meses "cheios" entre duas datas pra fins de proporcionalidade
// (férias/13º): a CLT considera mês completo quando trabalhado 15 dias ou
// mais dele — por isso não é uma divisão de dias corrida, é contagem de
// meses calendário com a regra do dia 15.
function mesesProporcionais(dataInicio, dataFim) {
  if (dataFim <= dataInicio) return 0;
  let meses = (dataFim.getFullYear() - dataInicio.getFullYear()) * 12
    + (dataFim.getMonth() - dataInicio.getMonth());
  if (dataFim.getDate() >= 15) meses += 1;
  return Math.max(0, Math.min(12, meses));
}

function anosCompletos(dataInicio, dataFim) {
  let anos = dataFim.getFullYear() - dataInicio.getFullYear();
  const aniversarioAinda = (dataFim.getMonth() < dataInicio.getMonth()) ||
    (dataFim.getMonth() === dataInicio.getMonth() && dataFim.getDate() < dataInicio.getDate());
  if (aniversarioAinda) anos -= 1;
  return Math.max(0, anos);
}

// Igual a mesesProporcionais, mas sem o teto de 12 — usada pra medir o
// tempo TOTAL de contrato (ex: pra estimar depósito de FGTS acumulado),
// não uma proporcionalidade dentro de um único período aquisitivo.
function mesesTotalContrato(dataInicio, dataFim) {
  if (dataFim <= dataInicio) return 0;
  let meses = (dataFim.getFullYear() - dataInicio.getFullYear()) * 12
    + (dataFim.getMonth() - dataInicio.getMonth());
  if (dataFim.getDate() >= 15) meses += 1;
  return Math.max(0, meses);
}

function somarDias(data, dias) {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function parseDataInput(iso) {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR");
}
