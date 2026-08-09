document.getElementById("btn-calcular").addEventListener("click", () => {
  const valor = parseNumeroBR(document.getElementById("valor-financiado").value);
  const taxaAnual = parseNumeroBR(document.getElementById("taxa-anual").value);
  const prazoMeses = parseInt(document.getElementById("prazo-meses").value, 10);

  if (!Number.isFinite(valor) || valor <= 0 || !Number.isFinite(taxaAnual) || !Number.isFinite(prazoMeses) || prazoMeses <= 0) return;

  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
  const sac = calcularSAC(valor, taxaMensal, prazoMeses);
  const price = calcularPrice(valor, taxaMensal, prazoMeses);

  animarNumero(document.getElementById("sac-primeira"), sac.primeiraParcela, formatarBRL);
  animarNumero(document.getElementById("sac-ultima"), sac.ultimaParcela, formatarBRL);
  animarNumero(document.getElementById("sac-juros"), sac.totalJuros, formatarBRL);
  animarNumero(document.getElementById("sac-total"), sac.totalPago, formatarBRL);

  animarNumero(document.getElementById("price-parcela"), price.parcela, formatarBRL);
  animarNumero(document.getElementById("price-juros"), price.totalJuros, formatarBRL);
  animarNumero(document.getElementById("price-total"), price.totalPago, formatarBRL);

  const diferenca = price.totalPago - sac.totalPago;
  document.getElementById("r-diferenca").innerHTML = diferenca > 0
    ? `A Price sai <strong class="text-ink">${formatarBRL(diferenca)} mais cara</strong> no total — mas a 1ª parcela dela (${formatarBRL(price.parcela)}) é bem menor que a 1ª da SAC (${formatarBRL(sac.primeiraParcela)}), o que pode facilitar aprovar o crédito.`
    : `As duas ficaram próximas no total pago nessas condições.`;

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
  registrarNoDashboard("Financiamento Imobiliário", "financiamento-imobiliario.html", `SAC ${formatarBRL(sac.totalPago)} vs Price ${formatarBRL(price.totalPago)} no total`);
});
