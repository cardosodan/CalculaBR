document.getElementById("btn-calcular").addEventListener("click", () => {
  const fatura = parseNumeroBR(document.getElementById("valor-fatura").value);
  const pago = parseNumeroBR(document.getElementById("valor-pago").value) || 0;
  const taxaMensal = parseNumeroBR(document.getElementById("taxa-rotativo").value);
  const meses = parseInt(document.getElementById("meses-para-quitar").value, 10) || 1;

  if (!Number.isFinite(fatura) || fatura <= 0 || !Number.isFinite(taxaMensal)) return;

  const naoPago = Math.max(0, fatura - pago);
  let saldo = naoPago;
  for (let i = 0; i < meses; i++) {
    saldo *= 1 + taxaMensal / 100;
  }
  const jurosTotal = saldo - naoPago;

  animarNumero(document.getElementById("r-valor-final"), saldo, formatarBRL, 1.1);
  animarNumero(document.getElementById("r-nao-pago"), naoPago, formatarBRL);
  animarNumero(document.getElementById("r-juros-total"), jurosTotal, formatarBRL);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
  registrarNoDashboard("Cartão de Crédito", "cartao-credito.html", `Rotativo: ${formatarBRL(naoPago)} viraria ${formatarBRL(saldo)}`);
});
