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

  document.getElementById("r-meses").textContent = meses;
  document.getElementById("r-dias").textContent = dias + " dias";
  document.getElementById("r-terco").textContent = formatarBRL(terco);
  document.getElementById("r-total").textContent = formatarBRL(valorFerias + terco);

  const temVencidas = document.getElementById("tem-vencidas").checked;
  document.getElementById("bloco-vencidas").classList.toggle("hidden", !temVencidas);
  if (temVencidas) {
    document.getElementById("r-vencidas").textContent = formatarBRL(salario + salario / 3);
  }

  document.getElementById("resultado").classList.remove("hidden");
  document.getElementById("placeholder-resultado").classList.add("hidden");
});
