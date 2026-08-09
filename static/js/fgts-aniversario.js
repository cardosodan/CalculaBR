// Tabela oficial do saque-aniversário (Lei 8.036/90, alíquota + parcela
// adicional fixa por faixa de saldo) — verificado (continuidade exata nas
// bordas de cada faixa) antes de usar.
const FAIXAS_SAQUE_ANIVERSARIO = [
  { ate: 500.00, aliquota: 0.50, adicional: 0 },
  { ate: 1000.00, aliquota: 0.40, adicional: 50.00 },
  { ate: 5000.00, aliquota: 0.30, adicional: 150.00 },
  { ate: 10000.00, aliquota: 0.20, adicional: 650.00 },
  { ate: 15000.00, aliquota: 0.15, adicional: 1150.00 },
  { ate: 20000.00, aliquota: 0.10, adicional: 1900.00 },
  { ate: Infinity, aliquota: 0.05, adicional: 2900.00 },
];

function calcularSaqueAniversario(saldo) {
  const faixa = FAIXAS_SAQUE_ANIVERSARIO.find((f) => saldo <= f.ate);
  return { valor: saldo * faixa.aliquota + faixa.adicional, aliquota: faixa.aliquota };
}

document.getElementById("btn-calcular").addEventListener("click", () => {
  const saldo = parseNumeroBR(document.getElementById("saldo-fgts").value);
  if (!Number.isFinite(saldo) || saldo <= 0) return;

  const { valor: saqueAniversario, aliquota } = calcularSaqueAniversario(saldo);
  const multa40 = saldo * 0.40;
  const rescisaoTotal = saldo + multa40;

  animarNumero(document.getElementById("r-saque-aniversario"), saqueAniversario, formatarBRL);
  document.getElementById("r-aliquota").textContent = formatarPercentual(aliquota * 100, 0);
  animarNumero(document.getElementById("r-rescisao-total"), rescisaoTotal, formatarBRL);
  animarNumero(document.getElementById("r-aniversario-rescisao"), multa40, formatarBRL);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
  registrarNoDashboard("FGTS: Saque-Aniversário", "fgts-aniversario.html", `Saldo ${formatarBRL(saldo)}: saque de ${formatarBRL(saqueAniversario)} este ano`);
});
