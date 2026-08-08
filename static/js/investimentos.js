// IR regressivo pra renda fixa tributada (CDB/Tesouro) — Lei 11.033/2004,
// estável há muito tempo, ao contrário das taxas de referência abaixo.
function aliquotaIRPorPrazo(dias) {
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.20;
  if (dias <= 720) return 0.175;
  return 0.15;
}

function calcularComparador({ valor, prazoDias, cdiAnual, selicAnual, trMensal, percentualCDB, percentualLCI }) {
  const fatorAno = prazoDias / 365;
  const aliquotaIR = aliquotaIRPorPrazo(prazoDias);

  const cdiFrac = cdiAnual / 100;
  const selicFrac = selicAnual / 100;
  const trFrac = trMensal / 100;

  const opcoes = [];

  // CDB
  {
    const taxaAnual = cdiFrac * (percentualCDB / 100);
    const bruto = valor * Math.pow(1 + taxaAnual, fatorAno);
    const rendimentoBruto = bruto - valor;
    const ir = rendimentoBruto * aliquotaIR;
    opcoes.push({ nome: `CDB (${percentualCDB}% do CDI)`, bruto, ir, liquido: bruto - ir, isento: false });
  }

  // LCI/LCA
  {
    const taxaAnual = cdiFrac * (percentualLCI / 100);
    const bruto = valor * Math.pow(1 + taxaAnual, fatorAno);
    opcoes.push({ nome: `LCI/LCA (${percentualLCI}% do CDI)`, bruto, ir: 0, liquido: bruto, isento: true });
  }

  // Tesouro Selic
  {
    const bruto = valor * Math.pow(1 + selicFrac, fatorAno);
    const rendimentoBruto = bruto - valor;
    const ir = rendimentoBruto * aliquotaIR;
    opcoes.push({ nome: "Tesouro Selic", bruto, ir, liquido: bruto - ir, isento: false });
  }

  // Poupança — regra oficial: Selic > 8,5% a.a. => 0,5% a.m. + TR; senão
  // 70% da Selic mensalizada + TR (MP 567/2012).
  {
    const selicMensalEquiv = Math.pow(1 + selicFrac, 1 / 12) - 1;
    const taxaMensal = selicAnual > 8.5 ? (0.005 + trFrac) : (0.7 * selicMensalEquiv + trFrac);
    const bruto = valor * Math.pow(1 + taxaMensal, prazoDias / 30);
    opcoes.push({ nome: "Poupança", bruto, ir: 0, liquido: bruto, isento: true });
  }

  opcoes.forEach((o) => { o.rendimentoLiquido = o.liquido - valor; });
  opcoes.sort((a, b) => b.liquido - a.liquido);
  return opcoes;
}

document.getElementById("btn-comparar").addEventListener("click", () => {
  const valor = parseNumeroBR(document.getElementById("valor-aplicado").value);
  const prazoDias = parseInt(document.getElementById("prazo-dias").value, 10);
  const percentualCDB = parseNumeroBR(document.getElementById("percentual-cdb").value);
  const cdiAnual = parseNumeroBR(document.getElementById("cdi-anual").value);
  const selicAnual = parseNumeroBR(document.getElementById("selic-anual").value);
  const trMensal = parseNumeroBR(document.getElementById("tr-mensal").value);
  const percentualLCI = parseNumeroBR(document.getElementById("percentual-lci").value);

  if (![valor, prazoDias, percentualCDB, cdiAnual, selicAnual, trMensal, percentualLCI].every(Number.isFinite)) return;
  if (valor <= 0 || prazoDias <= 0) return;

  const opcoes = calcularComparador({ valor, prazoDias, cdiAnual, selicAnual, trMensal, percentualCDB, percentualLCI });

  const container = document.getElementById("resultado-comparador");
  container.innerHTML = opcoes.map((o, i) => `
    <div class="spotlight bg-surface border ${i === 0 ? "border-accent/40" : "border-border"} rounded-2xl p-5 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-accent text-accent-ink" : "bg-elevated text-ink-muted"}">${i + 1}º</span>
        <div>
          <p class="font-medium text-ink">${o.nome}</p>
          <p class="text-xs text-ink-faint">${o.isento ? "Isento de IR" : `IR de ${formatarPercentual(aliquotaIRPorPrazo(prazoDias) * 100, 1)} sobre o rendimento`}</p>
        </div>
      </div>
      <div class="text-right shrink-0">
        <p class="font-numeros font-semibold text-ink">${formatarBRL(o.liquido)}</p>
        <p class="font-numeros text-xs text-good">+${formatarBRL(o.rendimentoLiquido)}</p>
      </div>
    </div>
  `).join("");

  container.classList.remove("hidden");
  document.getElementById("placeholder-comparador").classList.add("hidden");
  animarEntradaEmLote(container.querySelectorAll(":scope > div"));
  ativarSpotlightCards("#resultado-comparador .spotlight");
});

document.getElementById("btn-simular-jc").addEventListener("click", () => {
  const valorInicial = parseNumeroBR(document.getElementById("jc-inicial").value) || 0;
  const aporteMensal = parseNumeroBR(document.getElementById("jc-aporte").value) || 0;
  const taxaAnual = parseNumeroBR(document.getElementById("jc-taxa").value);
  const meses = parseInt(document.getElementById("jc-meses").value, 10);

  if (!Number.isFinite(taxaAnual) || !Number.isFinite(meses) || meses <= 0) return;
  if (valorInicial <= 0 && aporteMensal <= 0) return;

  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
  let saldo = valorInicial;
  let totalInvestido = valorInicial;
  for (let i = 0; i < meses; i++) {
    saldo = saldo * (1 + taxaMensal) + aporteMensal;
    totalInvestido += aporteMensal;
  }
  const totalJuros = saldo - totalInvestido;

  animarNumero(document.getElementById("jc-r-montante"), saldo, formatarBRL, 1.1);
  animarNumero(document.getElementById("jc-r-investido"), totalInvestido, formatarBRL);
  animarNumero(document.getElementById("jc-r-juros"), totalJuros, formatarBRL);

  revelarResultado(document.getElementById("resultado-jc"), document.getElementById("placeholder-jc"));
});
