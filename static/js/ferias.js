// Data de referência default = hoje (input type=date usa formato ISO).
document.getElementById("referencia").valueAsDate = new Date();

function inicioDoPeriodoAquisitivoAtual(admissao, referencia) {
  const anos = anosCompletos(admissao, referencia);
  return new Date(admissao.getFullYear() + anos, admissao.getMonth(), admissao.getDate());
}

document.getElementById("btn-calcular").addEventListener("click", () => {
  const admissaoStr = document.getElementById("admissao").value;
  const referenciaStr = document.getElementById("referencia").value;
  const salario = parseNumeroBR(document.getElementById("salario").value);

  if (!admissaoStr || !referenciaStr || !Number.isFinite(salario) || salario <= 0) return;

  const admissao = parseDataInput(admissaoStr);
  const referencia = parseDataInput(referenciaStr);

  if (referencia < admissao) return;

  const inicioPeriodo = inicioDoPeriodoAquisitivoAtual(admissao, referencia);
  const meses = mesesProporcionais(inicioPeriodo, referencia);
  const valorFerias = (salario / 12) * meses;
  const terco = valorFerias / 3;
  const dias = Math.round((30 / 12) * meses);

  animarNumero(document.getElementById("r-meses"), meses, (v) => Math.round(v), 0.6);
  animarNumero(document.getElementById("r-dias"), dias, (v) => Math.round(v) + " dias", 0.6);
  animarNumero(document.getElementById("r-terco"), terco, formatarBRL);
  animarNumero(document.getElementById("r-total"), valorFerias + terco, formatarBRL);

  const temVencidas = document.getElementById("tem-vencidas").checked;
  document.getElementById("bloco-vencidas").classList.toggle("hidden", !temVencidas);
  if (temVencidas) {
    animarNumero(document.getElementById("r-vencidas"), salario + salario / 3, formatarBRL);
  }

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});
