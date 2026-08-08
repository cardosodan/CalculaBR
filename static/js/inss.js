// Tabela do INSS vigente a partir de janeiro/2026 (reajuste de 3,90% sobre
// 2025, salário mínimo R$ 1.621,00). Método "progressivo com dedução" —
// mesmo usado pelas folhas de pagamento reais desde a reforma de 2020:
// desconto = salário_na_faixa * alíquota_da_faixa - dedução_da_faixa.
// Precisa ser atualizada quando o governo publicar a tabela do próximo ano.
const FAIXAS_INSS_2026 = [
  { ate: 1621.00, aliquota: 0.075, deducao: 0 },
  { ate: 2902.84, aliquota: 0.09, deducao: 24.32 },
  { ate: 4354.27, aliquota: 0.12, deducao: 111.40 },
  { ate: 8475.55, aliquota: 0.14, deducao: 198.49 },
];
const TETO_INSS_2026 = 8475.55;

function calcularDescontoINSS(salarioBruto) {
  const baseCalculo = Math.min(salarioBruto, TETO_INSS_2026);
  const faixa = FAIXAS_INSS_2026.find((f) => baseCalculo <= f.ate) || FAIXAS_INSS_2026[FAIXAS_INSS_2026.length - 1];
  const desconto = Math.max(0, baseCalculo * faixa.aliquota - faixa.deducao);
  return { desconto, acimaDoTeto: salarioBruto > TETO_INSS_2026 };
}

document.getElementById("btn-calcular").addEventListener("click", () => {
  const salario = parseNumeroBR(document.getElementById("salario").value);
  if (!Number.isFinite(salario) || salario <= 0) {
    document.getElementById("salario").focus();
    return;
  }

  const { desconto, acimaDoTeto } = calcularDescontoINSS(salario);
  const liquido = salario - desconto;

  animarNumero(document.getElementById("r-desconto"), desconto, formatarBRL);
  animarNumero(document.getElementById("r-liquido"), liquido, formatarBRL);
  animarNumero(document.getElementById("r-aliquota-efetiva"), (desconto / salario) * 100, (v) => formatarPercentual(v, 2));
  document.getElementById("r-teto-aviso").classList.toggle("hidden", !acimaDoTeto);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});

document.getElementById("salario").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-calcular").click();
});
