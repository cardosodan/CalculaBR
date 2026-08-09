document.getElementById("btn-calcular").addEventListener("click", () => {
  const percentualMargem = Number(document.getElementById("tipo-consignado").value);
  const salarioLiquido = parseNumeroBR(document.getElementById("salario-liquido").value);
  const taxaMensal = parseNumeroBR(document.getElementById("taxa-consignado").value);
  const prazoMeses = parseInt(document.getElementById("prazo-consignado").value, 10);

  if (!Number.isFinite(salarioLiquido) || salarioLiquido <= 0 || !Number.isFinite(taxaMensal) || !Number.isFinite(prazoMeses) || prazoMeses <= 0) return;

  const margem = salarioLiquido * (percentualMargem / 100);
  const valorMaximo = calcularValorMaximoPrice(margem, taxaMensal / 100, prazoMeses);
  const totalPago = margem * prazoMeses;
  const totalJuros = totalPago - valorMaximo;

  animarNumero(document.getElementById("r-valor-maximo"), valorMaximo, formatarBRL, 1.1);
  animarNumero(document.getElementById("r-margem"), margem, (v) => `${formatarBRL(v)}/mês`);
  animarNumero(document.getElementById("r-juros"), totalJuros, formatarBRL);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});
