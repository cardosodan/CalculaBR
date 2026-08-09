// A tabela e a lógica de cálculo (calcularDescontoINSS) vivem em
// common.js — compartilhadas com Salário Líquido, 13º e outras.

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
  registrarNoDashboard("INSS", "inss.html", `Salário ${formatarBRL(salario)}: desconto de ${formatarBRL(desconto)}`);
});

document.getElementById("salario").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-calcular").click();
});
