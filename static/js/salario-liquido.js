document.getElementById("btn-calcular").addEventListener("click", () => {
  const bruto = parseNumeroBR(document.getElementById("salario").value);
  const dependentes = parseInt(document.getElementById("dependentes").value, 10) || 0;
  const usaVT = document.getElementById("usa-vt").checked;
  const outrosTexto = document.getElementById("outros-descontos").value;
  const outros = outrosTexto.trim() === "" ? 0 : (parseNumeroBR(outrosTexto) || 0);

  if (!Number.isFinite(bruto) || bruto <= 0) return;

  const inss = calcularDescontoINSS(bruto).desconto;
  const irrf = calcularIRRFMensal(bruto - inss, dependentes);
  const vt = usaVT ? bruto * 0.06 : 0;
  const liquido = bruto - inss - irrf - vt - outros;

  animarNumero(document.getElementById("r-liquido"), liquido, formatarBRL, 1.1);
  animarNumero(document.getElementById("r-bruto"), bruto, formatarBRL);
  animarNumero(document.getElementById("r-inss"), inss, formatarBRL);
  animarNumero(document.getElementById("r-irrf"), irrf, formatarBRL);

  document.getElementById("linha-vt").classList.toggle("hidden", !usaVT);
  if (usaVT) animarNumero(document.getElementById("r-vt"), vt, formatarBRL);

  document.getElementById("linha-outros").classList.toggle("hidden", outros <= 0);
  if (outros > 0) animarNumero(document.getElementById("r-outros"), outros, formatarBRL);

  document.getElementById("r-aliquota-efetiva").textContent = formatarPercentual(((bruto - liquido) / bruto) * 100, 1);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
  registrarNoDashboard("Salário Líquido", "salario-liquido.html", `Bruto ${formatarBRL(bruto)} → líquido ${formatarBRL(liquido)}`);
});
