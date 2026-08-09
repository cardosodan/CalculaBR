const DAS_MEI_PADRAO = 87.05;

const selectRegimePj = document.getElementById("regime-pj");
const campoCustoPj = document.getElementById("campo-custo-pj");
selectRegimePj.addEventListener("change", () => {
  campoCustoPj.classList.toggle("hidden", selectRegimePj.value !== "outro");
});

document.getElementById("btn-calcular").addEventListener("click", () => {
  const salarioClt = parseNumeroBR(document.getElementById("salario-clt").value);
  const dependentes = parseInt(document.getElementById("dependentes").value, 10) || 0;
  const beneficios = parseNumeroBR(document.getElementById("beneficios-clt").value) || 0;
  const valorPj = parseNumeroBR(document.getElementById("valor-pj").value);
  const regimePj = selectRegimePj.value;
  const custoPjInformado = parseNumeroBR(document.getElementById("custo-pj").value) || 0;

  if (!Number.isFinite(salarioClt) || salarioClt <= 0 || !Number.isFinite(valorPj) || valorPj <= 0) return;

  // CLT: salário líquido + benefícios + FGTS (8%, direito acumulado mesmo
  // não aparecendo na conta agora) + 13º e férias+1/3 "diluídos" (cada um
  // vale 1/12 do salário por mês, é assim que a CLT acumula esses direitos).
  const inss = calcularDescontoINSS(salarioClt).desconto;
  const irrf = calcularIRRFMensal(salarioClt - inss, dependentes);
  const liquidoClt = salarioClt - inss - irrf;
  const fgts = salarioClt * 0.08;
  const decimoDiluido = salarioClt / 12;
  const feriasDiluida = (salarioClt / 12) + (salarioClt / 12 / 3);
  const totalClt = liquidoClt + beneficios + fgts + decimoDiluido + feriasDiluida;

  // PJ: bruto menos custo de manter o CNPJ (DAS fixo do MEI, ou estimativa
  // informada pra Simples/ME — não recalculamos o Simples Nacional
  // completo aqui, ver nota na página).
  const custoPj = regimePj === "mei" ? DAS_MEI_PADRAO : custoPjInformado;
  const totalPj = valorPj - custoPj;

  animarNumero(document.getElementById("clt-total"), totalClt, formatarBRL, 1.1);
  animarNumero(document.getElementById("clt-liquido"), liquidoClt, formatarBRL);
  animarNumero(document.getElementById("clt-beneficios"), beneficios, formatarBRL);
  animarNumero(document.getElementById("clt-fgts"), fgts, formatarBRL);
  animarNumero(document.getElementById("clt-decimo"), decimoDiluido, formatarBRL);
  animarNumero(document.getElementById("clt-ferias"), feriasDiluida, formatarBRL);

  animarNumero(document.getElementById("pj-total"), totalPj, formatarBRL, 1.1);
  animarNumero(document.getElementById("pj-bruto"), valorPj, formatarBRL);
  animarNumero(document.getElementById("pj-custo"), custoPj, formatarBRL);

  const diferenca = Math.abs(totalClt - totalPj);
  const veredito = document.getElementById("r-veredito");
  if (totalClt > totalPj) {
    veredito.innerHTML = `A proposta <strong class="text-ink">CLT</strong> vale ${formatarBRL(diferenca)} a mais por mês (considerando FGTS/13º/férias diluídos) — mesmo o bruto podendo parecer menor à primeira vista.`;
  } else {
    veredito.innerHTML = `A proposta <strong class="text-ink">PJ</strong> vale ${formatarBRL(diferenca)} a mais por mês, mesmo depois de tirar os custos — mas sem FGTS/13º/férias/estabilidade.`;
  }

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
  registrarNoDashboard("CLT vs PJ", "clt-vs-pj.html", `CLT ${formatarBRL(totalClt)} vs PJ ${formatarBRL(totalPj)}`);
});
