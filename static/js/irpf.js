// Reaproveita calcularIRRFMensal (common.js) — a tabela ANUAL é
// exatamente a tabela mensal × 12 (verificado nas fontes: cada faixa e o
// próprio redutor batem exatos ao multiplicar por 12), então
// baseAnual/12 → calcularIRRFMensal → × 12 dá o imposto anual correto,
// sem duplicar uma segunda tabela só pra declaração anual.
function calcularIRAnual(baseTributavelAnual) {
  return calcularIRRFMensal(Math.max(0, baseTributavelAnual) / 12, 0) * 12;
}

const LIMITE_DESCONTO_SIMPLIFICADO_ANUAL = 17640.00;
const LIMITE_EDUCACAO_POR_PESSOA_ANUAL = 3561.50;

document.getElementById("btn-calcular").addEventListener("click", () => {
  const rendimentos = parseNumeroBR(document.getElementById("rendimentos").value);
  if (!Number.isFinite(rendimentos) || rendimentos <= 0) return;

  const dependentes = parseInt(document.getElementById("dependentes").value, 10) || 0;
  const inssPago = parseNumeroBR(document.getElementById("inss-pago").value) || 0;
  const despesasSaude = parseNumeroBR(document.getElementById("despesas-saude").value) || 0;
  const despesasEducacaoInformada = parseNumeroBR(document.getElementById("despesas-educacao").value) || 0;
  const previdenciaInformada = parseNumeroBR(document.getElementById("previdencia").value) || 0;
  const irRetidoTexto = document.getElementById("ir-retido").value;
  const irRetido = irRetidoTexto.trim() === "" ? NaN : parseNumeroBR(irRetidoTexto);

  // Tetos legais aplicados automaticamente, mesmo se o usuário informar mais.
  const limiteEducacao = LIMITE_EDUCACAO_POR_PESSOA_ANUAL * (1 + dependentes);
  const despesasEducacao = Math.min(despesasEducacaoInformada, limiteEducacao);
  const limitePrevidencia = rendimentos * 0.12;
  const previdencia = Math.min(previdenciaInformada, limitePrevidencia);

  // Simplificado
  const descontoSimplificado = Math.min(rendimentos * 0.20, LIMITE_DESCONTO_SIMPLIFICADO_ANUAL);
  const baseSimplificado = rendimentos - descontoSimplificado;
  const impostoSimplificado = calcularIRAnual(baseSimplificado);

  // Completo
  const deducoesCompletas = inssPago + (dependentes * DEDUCAO_DEPENDENTE_ANUAL_2026) + despesasSaude + despesasEducacao + previdencia;
  const baseCompleto = rendimentos - deducoesCompletas;
  const impostoCompleto = calcularIRAnual(baseCompleto);

  const usarSimplificado = impostoSimplificado <= impostoCompleto;
  const impostoFinal = usarSimplificado ? impostoSimplificado : impostoCompleto;

  animarNumero(document.getElementById("r-imposto-simples"), impostoSimplificado, formatarBRL);
  animarNumero(document.getElementById("r-imposto-completo"), impostoCompleto, formatarBRL);
  animarNumero(document.getElementById("r-base-simples"), Math.max(0, baseSimplificado), formatarBRL, 0.6);
  animarNumero(document.getElementById("r-base-completo"), Math.max(0, baseCompleto), formatarBRL, 0.6);
  document.getElementById("r-modelo-recomendado").textContent = usarSimplificado ? "Desconto simplificado" : "Deduções completas";
  animarNumero(document.getElementById("r-imposto-final"), impostoFinal, formatarBRL, 1.1);

  const saldoEl = document.getElementById("r-saldo");
  if (Number.isFinite(irRetido)) {
    const saldo = irRetido - impostoFinal;
    if (saldo >= 0) {
      saldoEl.innerHTML = `Com ${formatarBRL(irRetido)} já retidos na fonte, você tem <strong class="text-good">${formatarBRL(saldo)} a restituir</strong>.`;
    } else {
      saldoEl.innerHTML = `Com ${formatarBRL(irRetido)} já retidos na fonte, faltam <strong class="text-bad">${formatarBRL(-saldo)} a pagar</strong>.`;
    }
  } else {
    saldoEl.innerHTML = "";
  }

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});
