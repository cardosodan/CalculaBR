document.getElementById("btn-calcular").addEventListener("click", () => {
  const valor = parseNumeroBR(document.getElementById("valor-veiculo").value);
  const taxaMensalPct = parseNumeroBR(document.getElementById("taxa-mensal").value);
  const prazoMeses = parseInt(document.getElementById("prazo-meses").value, 10);

  if (!Number.isFinite(valor) || valor <= 0 || !Number.isFinite(taxaMensalPct) || !Number.isFinite(prazoMeses) || prazoMeses <= 0) return;

  const { parcela, totalPago, totalJuros } = calcularPrice(valor, taxaMensalPct / 100, prazoMeses);

  animarNumero(document.getElementById("r-parcela"), parcela, formatarBRL, 1.1);
  animarNumero(document.getElementById("r-juros"), totalJuros, formatarBRL);
  animarNumero(document.getElementById("r-total"), totalPago, formatarBRL);
  document.getElementById("r-percentual-a-mais").textContent = formatarPercentual((totalJuros / valor) * 100, 0);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
  registrarNoDashboard("Financiamento de Veículo", "financiamento-veiculo.html", `Parcela de ${formatarBRL(parcela)}/mês`);
});
