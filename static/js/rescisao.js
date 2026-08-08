const selectTipo = document.getElementById("tipo");
const campoAviso = document.getElementById("campo-aviso");

function atualizarVisibilidadeAviso() {
  // Aviso prévio só é escolhido pelo usuário em "sem justa causa" — em
  // "acordo mútuo" a lei já define indenizado pela metade automaticamente,
  // e em "pedido de demissão"/"justa causa" não há aviso a receber.
  campoAviso.classList.toggle("hidden", selectTipo.value !== "sem_justa_causa");
}
selectTipo.addEventListener("change", atualizarVisibilidadeAviso);
atualizarVisibilidadeAviso();

function inicioDoPeriodoAquisitivoAtual(admissao, referencia) {
  const anos = anosCompletos(admissao, referencia);
  return new Date(admissao.getFullYear() + anos, admissao.getMonth(), admissao.getDate());
}

function calcularVerbas({ tipo, admissao, desligamento, salario, avisoTipo, temFeriasVencidas, fgtsSaldoInformado }) {
  const anos = anosCompletos(admissao, desligamento);
  const diasAvisoIntegral = Math.min(30 + 3 * anos, 90);

  let diasAviso = 0;
  let avisoIndenizado = false;
  if (tipo === "sem_justa_causa" && avisoTipo === "indenizado") {
    diasAviso = diasAvisoIntegral;
    avisoIndenizado = true;
  } else if (tipo === "acordo_mutuo") {
    diasAviso = Math.round(diasAvisoIntegral / 2);
    avisoIndenizado = true;
  }

  // Projeção do aviso indenizado: por lei, os dias de aviso indenizado
  // contam como tempo de contrato pra 13º/férias/FGTS, mesmo sem o
  // empregado trabalhar de fato esses dias.
  const dataCalculo = avisoIndenizado ? somarDias(desligamento, diasAviso) : desligamento;

  // Saldo de salário: dias trabalhados no mês do desligamento efetivo
  // (nunca projetado — é sempre sobre dias realmente trabalhados).
  const mesmoMesDaAdmissao = desligamento.getFullYear() === admissao.getFullYear()
    && desligamento.getMonth() === admissao.getMonth();
  const diaInicioMes = mesmoMesDaAdmissao ? admissao.getDate() : 1;
  const diasTrabalhadosNoMes = Math.max(0, desligamento.getDate() - diaInicioMes + 1);
  const saldoSalario = (salario / 30) * diasTrabalhadosNoMes;

  const perdeProporcionais = tipo === "justa_causa";

  let feriasProporcionais = 0;
  let mesesFerias = 0;
  if (!perdeProporcionais) {
    const inicioPeriodo = inicioDoPeriodoAquisitivoAtual(admissao, dataCalculo);
    mesesFerias = mesesProporcionais(inicioPeriodo, dataCalculo);
    const valorBase = (salario / 12) * mesesFerias;
    feriasProporcionais = valorBase + valorBase / 3;
  }

  const feriasVencidas = temFeriasVencidas ? salario + salario / 3 : 0;

  let decimoTerceiro = 0;
  let mesesDecimo = 0;
  if (!perdeProporcionais) {
    const inicioAno = new Date(dataCalculo.getFullYear(), 0, 1);
    const inicioContagem13 = admissao > inicioAno ? admissao : inicioAno;
    mesesDecimo = mesesProporcionais(inicioContagem13, dataCalculo);
    decimoTerceiro = (salario / 12) * mesesDecimo;
  }

  const avisoValor = avisoIndenizado ? (salario / 30) * diasAviso : 0;

  const totalMesesContrato = mesesTotalContrato(admissao, dataCalculo);
  const fgtsEstimado = totalMesesContrato * salario * 0.08;
  const saldoFgts = Number.isFinite(fgtsSaldoInformado) ? fgtsSaldoInformado : fgtsEstimado;

  let percentualMulta = 0;
  if (tipo === "sem_justa_causa") percentualMulta = 0.40;
  else if (tipo === "acordo_mutuo") percentualMulta = 0.20;
  const multaFgts = saldoFgts * percentualMulta;

  const linhas = [
    { label: "Saldo de salário", valor: saldoSalario, sempre: true },
    { label: "Férias vencidas + 1/3", valor: feriasVencidas, aplicavel: temFeriasVencidas },
    { label: `Férias proporcionais (${mesesFerias}/12) + 1/3`, valor: feriasProporcionais, aplicavel: !perdeProporcionais },
    { label: `13º salário proporcional (${mesesDecimo}/12)`, valor: decimoTerceiro, aplicavel: !perdeProporcionais },
    { label: avisoIndenizado ? `Aviso prévio indenizado (${diasAviso} dias)` : "Aviso prévio", valor: avisoValor, aplicavel: diasAviso > 0 },
    { label: `Multa do FGTS (${Math.round(percentualMulta * 100)}%)`, valor: multaFgts, aplicavel: percentualMulta > 0 },
  ];

  const total = linhas.reduce((soma, l) => soma + (l.aplicavel === false ? 0 : l.valor), 0);

  return { linhas, total, dataCalculo, avisoIndenizado, saldoFgts, tipo };
}

document.getElementById("btn-calcular").addEventListener("click", () => {
  const admissaoStr = document.getElementById("admissao").value;
  const desligamentoStr = document.getElementById("desligamento").value;
  const salario = parseNumeroBR(document.getElementById("salario").value);
  const tipo = selectTipo.value;
  const avisoTipo = document.querySelector('input[name="aviso-tipo"]:checked').value;
  const temFeriasVencidas = document.getElementById("tem-vencidas").checked;
  const fgtsSaldoInformadoTexto = document.getElementById("fgts-saldo").value;
  const fgtsSaldoInformado = fgtsSaldoInformadoTexto.trim() === "" ? NaN : parseNumeroBR(fgtsSaldoInformadoTexto);

  if (!admissaoStr || !desligamentoStr || !Number.isFinite(salario) || salario <= 0) return;

  const admissao = parseDataInput(admissaoStr);
  const desligamento = parseDataInput(desligamentoStr);
  if (desligamento < admissao) return;

  const resultado = calcularVerbas({ tipo, admissao, desligamento, salario, avisoTipo, temFeriasVencidas, fgtsSaldoInformado });

  animarNumero(document.getElementById("r-total"), resultado.total, formatarBRL, 1.1);

  const tabela = document.getElementById("r-tabela-verbas");
  tabela.innerHTML = "";
  resultado.linhas.forEach((linha) => {
    const tr = document.createElement("tr");
    const aplicavel = linha.aplicavel !== false;
    tr.innerHTML = aplicavel
      ? `<td class="py-2.5 text-ink-muted">${linha.label}</td><td class="py-2.5 text-right text-ink font-medium">${formatarBRL(linha.valor)}</td>`
      : `<td class="py-2.5 text-ink-faint">${linha.label}</td><td class="py-2.5 text-right text-ink-faint">não aplicável</td>`;
    tabela.appendChild(tr);
  });
  animarEntradaEmLote(tabela.querySelectorAll("tr"), { delay: 0.15 });

  const notas = [];
  if (resultado.avisoIndenizado) {
    notas.push(`Data projetada de saída (aviso prévio indenizado projeta o contrato): <strong>${formatarData(resultado.dataCalculo)}</strong> — usada pra calcular férias, 13º e FGTS.`);
  }
  if (!Number.isFinite(fgtsSaldoInformado)) {
    notas.push(`Saldo do FGTS estimado em ${formatarBRL(resultado.saldoFgts)} (8% × salário × meses de contrato) — informe o saldo real acima pra um valor mais preciso.`);
  }
  if (resultado.tipo === "sem_justa_causa") {
    notas.push("Também dá direito a movimentar 100% do FGTS e, se preenchidos os requisitos, sacar seguro-desemprego (não calculado aqui — regras e parcelas próprias).");
  }
  if (resultado.tipo === "acordo_mutuo") {
    notas.push("No acordo mútuo (Art. 484-A CLT) também é possível sacar 80% do saldo do FGTS, mas sem direito a seguro-desemprego.");
  }
  if (resultado.tipo === "justa_causa") {
    notas.push("Na justa causa, o período aquisitivo em curso e o 13º proporcional são perdidos por lei — só ficam garantidos saldo de salário e férias já vencidas.");
  }
  document.getElementById("r-notas").innerHTML = notas.map((n) => `<p>• ${n}</p>`).join("");

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});
