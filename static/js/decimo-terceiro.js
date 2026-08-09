document.getElementById("btn-calcular").addEventListener("click", () => {
  const salario = parseNumeroBR(document.getElementById("salario").value);
  const admissaoStr = document.getElementById("admissao").value;
  const dependentes = parseInt(document.getElementById("dependentes").value, 10) || 0;

  if (!Number.isFinite(salario) || salario <= 0 || !admissaoStr) return;

  const admissao = parseDataInput(admissaoStr);
  const hoje = new Date();
  const inicioAno = new Date(hoje.getFullYear(), 0, 1);
  const fimAno = new Date(hoje.getFullYear(), 11, 31);
  const inicioContagem = admissao > inicioAno ? admissao : inicioAno;

  const meses = mesesProporcionais(inicioContagem, fimAno);
  const bruto = (salario / 12) * meses;
  const primeira = bruto / 2;

  const inss = calcularDescontoINSS(bruto).desconto;
  const irrf = calcularIRRFMensal(bruto - inss, dependentes);
  const segunda = bruto - primeira - inss - irrf;
  const totalLiquido = primeira + segunda;

  document.getElementById("r-meses").textContent = meses;
  animarNumero(document.getElementById("r-total"), totalLiquido, formatarBRL, 1.1);
  animarNumero(document.getElementById("r-bruto"), bruto, formatarBRL);
  animarNumero(document.getElementById("r-primeira"), primeira, formatarBRL);
  animarNumero(document.getElementById("r-inss"), inss, formatarBRL);
  animarNumero(document.getElementById("r-irrf"), irrf, formatarBRL);
  animarNumero(document.getElementById("r-segunda"), segunda, formatarBRL);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});
