// Utilidades compartilhadas por todas as calculadoras — formatação de
// moeda/percentual em pt-BR e parsing de input numérico (o usuário digita
// "1234,56", o <input type="number"> nativo só aceita ponto, então cada
// calculadora usa um <input type="text" inputmode="decimal"> e passa o
// valor por aqui em vez de confiar no parsing nativo do navegador).

const formatadorBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarBRL(valor) {
  if (!Number.isFinite(valor)) return "—";
  return formatadorBRL.format(valor);
}

function formatarPercentual(valor, casas = 1) {
  if (!Number.isFinite(valor)) return "—";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) + "%";
}

/* ==========================================================================
   TABELAS OFICIAIS COMPARTILHADAS (INSS e IRRF 2026) — usadas por várias
   calculadoras (INSS, Salário Líquido, 13º, Horas Extras, IRPF). Ficam num
   lugar só pra nunca desalinhar entre calculadoras diferentes quando a
   tabela mudar de ano.
   ========================================================================== */

// INSS 2026 — progressivo com dedução (salário mínimo R$ 1.621,00, teto
// R$ 8.475,55). Atualizar todo início de ano.
const FAIXAS_INSS_2026 = [
  { ate: 1621.00, aliquota: 0.075, deducao: 0 },
  { ate: 2902.84, aliquota: 0.09, deducao: 24.32 },
  { ate: 4354.27, aliquota: 0.12, deducao: 111.40 },
  { ate: 8475.55, aliquota: 0.14, deducao: 198.49 },
];
const TETO_INSS_2026 = 8475.55;

function calcularDescontoINSS(salarioBruto) {
  const baseCalculo = Math.min(salarioBruto, TETO_INSS_2026);
  const faixa = FAIXAS_INSS_2026.find((f) => baseCalculo <= f.ate) || FAIXAS_INSS_2026[FAIXAS_INSS_2026.length - 1];
  const desconto = Math.max(0, baseCalculo * faixa.aliquota - faixa.deducao);
  return { desconto, acimaDoTeto: salarioBruto > TETO_INSS_2026 };
}

// IRRF 2026 — reforma da Lei 15.270/2025: isenção total até R$5.000/mês,
// redução parcial decrescente de R$5.000,01 a R$7.350,00 (fórmula oficial:
// 978,62 − 0,133145 × renda), tabela progressiva tradicional acima disso.
// Verificado cruzando 2 fontes independentes antes de usar (tabela mensal
// e sua equivalente anual batendo exatamente ×12).
const TABELA_IRRF_2026 = [
  { ate: 2428.80, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
  { ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
  { ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
  { ate: Infinity, aliquota: 0.275, deducao: 908.73 },
];
const DEDUCAO_DEPENDENTE_MENSAL_2026 = 189.59;
const DEDUCAO_DEPENDENTE_ANUAL_2026 = 2275.08;
const LIMITE_ISENCAO_TOTAL_2026 = 5000;
const LIMITE_REDUCAO_PARCIAL_2026 = 7350;

// baseTributavel = renda menos INSS (a base do IRRF já é líquida de INSS).
// `dependentes` é opcional — cada um reduz a base pela dedução mensal.
function calcularIRRFMensal(baseTributavel, dependentes = 0) {
  const base = Math.max(0, baseTributavel - dependentes * DEDUCAO_DEPENDENTE_MENSAL_2026);
  if (base <= LIMITE_ISENCAO_TOTAL_2026) return 0;

  const faixa = TABELA_IRRF_2026.find((f) => base <= f.ate);
  const irBase = Math.max(0, base * faixa.aliquota - faixa.deducao);

  if (base <= LIMITE_REDUCAO_PARCIAL_2026) {
    const redutor = Math.max(0, 978.62 - 0.133145 * base);
    return Math.max(0, irBase - redutor);
  }
  return irBase;
}

// "1.234,56" ou "1234,56" ou "1234.56" -> 1234.56 (number). Vazio/inválido -> NaN.
function parseNumeroBR(texto) {
  if (typeof texto !== "string") return NaN;
  const limpo = texto.trim().replace(/\./g, "").replace(",", ".");
  return limpo === "" ? NaN : Number(limpo);
}

// Conta meses "cheios" entre duas datas pra fins de proporcionalidade
// (férias/13º): a CLT considera mês completo quando trabalhado 15 dias ou
// mais dele — por isso não é uma divisão de dias corrida, é contagem de
// meses calendário com a regra do dia 15.
function mesesProporcionais(dataInicio, dataFim) {
  if (dataFim <= dataInicio) return 0;
  let meses = (dataFim.getFullYear() - dataInicio.getFullYear()) * 12
    + (dataFim.getMonth() - dataInicio.getMonth());
  if (dataFim.getDate() >= 15) meses += 1;
  return Math.max(0, Math.min(12, meses));
}

function anosCompletos(dataInicio, dataFim) {
  let anos = dataFim.getFullYear() - dataInicio.getFullYear();
  const aniversarioAinda = (dataFim.getMonth() < dataInicio.getMonth()) ||
    (dataFim.getMonth() === dataInicio.getMonth() && dataFim.getDate() < dataInicio.getDate());
  if (aniversarioAinda) anos -= 1;
  return Math.max(0, anos);
}

// Igual a mesesProporcionais, mas sem o teto de 12 — usada pra medir o
// tempo TOTAL de contrato (ex: pra estimar depósito de FGTS acumulado),
// não uma proporcionalidade dentro de um único período aquisitivo.
function mesesTotalContrato(dataInicio, dataFim) {
  if (dataFim <= dataInicio) return 0;
  let meses = (dataFim.getFullYear() - dataInicio.getFullYear()) * 12
    + (dataFim.getMonth() - dataInicio.getMonth());
  if (dataFim.getDate() >= 15) meses += 1;
  return Math.max(0, meses);
}

function somarDias(data, dias) {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function parseDataInput(iso) {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR");
}

/* ==========================================================================
   ANIMAÇÕES (GSAP, carregado globalmente em base.html) — todas as funções
   aqui degradam graciosamente se por algum motivo o GSAP não tiver
   carregado (CDN bloqueado etc.): aplicam o valor/estado final direto, sem
   quebrar nenhuma calculadora.
   ========================================================================== */
const prefereMenosMovimentoCalc = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Conta de 0 (ou do valor atual, se já havia um) até valorFinal, chamando
// `formatador` a cada quadro — usado nos números grandes de resultado
// (evita o "pisca e já era" de só trocar o textContent na hora).
//
// REDE DE SEGURANÇA: testado e confirmado que o tween do GSAP pode travar
// no meio (aba em segundo plano, rAF irregular) e deixar um valor
// INTERMEDIÁRIO/ERRADO parado pra sempre na tela — pior que não animar
// nada, porque parece o resultado real. Por isso todo `onUpdate` é
// acompanhado de um `setTimeout` que força o valor final certo,
// independente do que aconteceu com a animação.
function animarNumero(elemento, valorFinal, formatador, duracao = 0.9) {
  if (typeof gsap === "undefined" || prefereMenosMovimentoCalc) {
    elemento.textContent = formatador(valorFinal);
    return;
  }
  const estado = { valor: 0 };
  let finalizado = false;
  const finalizar = () => {
    if (finalizado) return;
    finalizado = true;
    elemento.textContent = formatador(valorFinal);
  };
  gsap.to(estado, {
    valor: valorFinal,
    duration: duracao,
    ease: "power3.out",
    onUpdate: () => { if (!finalizado) elemento.textContent = formatador(estado.valor); },
    onComplete: finalizar,
  });
  setTimeout(finalizar, duracao * 1000 + 1200);
}

// Mostra o painel de resultado com uma entrada suave (fade + leve subida)
// na primeira vez, e só um pulso rápido nas vezes seguintes (usuário
// clicou em "calcular" de novo) — repetir a entrada inteira a cada clique
// ficaria cansativo.
function revelarResultado(painelResultado, painelPlaceholder) {
  if (painelPlaceholder) painelPlaceholder.classList.add("hidden");
  const jaEstavaVisivel = !painelResultado.classList.contains("hidden");
  painelResultado.classList.remove("hidden"); // sempre síncrono — nunca depende do GSAP pra isso
  adicionarBotaoExportar(painelResultado);

  if (typeof gsap === "undefined" || prefereMenosMovimentoCalc) return;

  // Rede de segurança: se o tween travar no meio por qualquer motivo, o
  // painel de resultado pode ficar tecnicamente "visível" (sem .hidden)
  // mas preso em opacity:0 — invisível na prática. Valores EXPLÍCITOS
  // (não clearProps) — clearProps reverteria pro CSS base, e não dá pra
  // garantir que todo elemento que usa isso tem CSS base opaco.
  let finalizado = false;
  const finalizar = () => {
    if (finalizado) return;
    finalizado = true;
    gsap.set(painelResultado, { opacity: 1, y: 0, scale: 1 });
  };

  if (jaEstavaVisivel) {
    gsap.fromTo(painelResultado, { scale: 0.99 }, { scale: 1, duration: 0.25, ease: "power2.out", onComplete: finalizar });
    setTimeout(finalizar, 900);
    return;
  }
  gsap.fromTo(
    painelResultado,
    { opacity: 0, y: 16, scale: 0.98 },
    { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out", onComplete: finalizar }
  );
  setTimeout(finalizar, 1600);
}

// Stagger fade-in simples pra um grupo de elementos (linhas de tabela,
// cartões do comparador de investimentos etc.) — chamado logo depois de
// montar o innerHTML novo.
function animarEntradaEmLote(elementos, opcoes = {}) {
  if (typeof gsap === "undefined" || prefereMenosMovimentoCalc || !elementos || !elementos.length) return;
  gsap.from(elementos, {
    opacity: 0,
    y: 10,
    duration: 0.4,
    stagger: 0.06,
    ease: "power2.out",
    ...opcoes,
  });
  // Rede de segurança (mesmo motivo de animarNumero/revelarResultado, e
  // valores EXPLÍCITOS pelo mesmo motivo — nunca clearProps): garante que
  // a lista inteira acaba visível mesmo se o stagger travar no meio pra
  // algum item.
  const atrasoTotal = (opcoes.delay || 0) * 1000 + elementos.length * 80 + 1500;
  setTimeout(() => gsap.set(elementos, { opacity: 1, y: 0 }), atrasoTotal);
}

// "Spotlight card": glow que segue o cursor, mesma técnica usada no site
// da DCodes — só em telas com mouse de verdade. O CSS correspondente (as
// variáveis --spot-x/--spot-y) vive em input.css, classe utilitária
// `.spotlight`.
// Botão "Baixar em PDF" — chama window.print(), o navegador já oferece
// "Salvar como PDF" no próprio diálogo (sem lib nenhuma). O CSS de
// impressão (input.css, @media print) esconde nav/formulário/placeholder
// e força tema claro, sobrando só o painel de resultado na folha. Idempotente
// (não duplica se o painel já tiver o botão — acontece quando o usuário
// clica "calcular" de novo).
function adicionarBotaoExportar(painel) {
  if (painel.querySelector(".botao-exportar-pdf")) return;
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-exportar-pdf no-print mt-5 pt-4 border-t border-border w-full flex items-center justify-center gap-2 text-xs font-medium text-ink-faint hover:text-accent transition-colors";
  botao.innerHTML = '<i data-lucide="download" class="w-3.5 h-3.5"></i> Baixar este resultado em PDF';
  botao.addEventListener("click", () => window.print());
  painel.appendChild(botao);
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function ativarSpotlightCards(seletor) {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll(seletor).forEach((cartao) => {
    cartao.addEventListener("pointermove", (evento) => {
      const caixa = cartao.getBoundingClientRect();
      cartao.style.setProperty("--spot-x", `${evento.clientX - caixa.left}px`);
      cartao.style.setProperty("--spot-y", `${evento.clientY - caixa.top}px`);
    });
  });
}

// Roda em toda página (common.js é sempre incluído) — nenhuma página
// precisa lembrar de chamar isso na mão.
document.addEventListener("DOMContentLoaded", () => {
  ativarSpotlightCards(".spotlight");
});

/* ==========================================================================
   AMORTIZAÇÃO (SAC/Price) — fórmulas padrão de matemática financeira,
   compartilhadas entre Financiamento Imobiliário, Financiamento de
   Veículo e Empréstimo Consignado (esse último usa a Price "invertida"
   pra achar o valor máximo a partir da parcela/margem disponível).
   ========================================================================== */

// SAC: amortização constante, juros (e por isso a parcela) decrescem mês
// a mês porque incidem sobre um saldo devedor cada vez menor.
function calcularSAC(valor, taxaMensal, prazoMeses) {
  const amortizacao = valor / prazoMeses;
  let saldoDevedor = valor;
  let totalPago = 0;
  let primeiraParcela = null;
  let ultimaParcela = null;
  for (let i = 0; i < prazoMeses; i++) {
    const juros = saldoDevedor * taxaMensal;
    const parcela = amortizacao + juros;
    if (i === 0) primeiraParcela = parcela;
    if (i === prazoMeses - 1) ultimaParcela = parcela;
    totalPago += parcela;
    saldoDevedor -= amortizacao;
  }
  return { primeiraParcela, ultimaParcela, totalPago, totalJuros: totalPago - valor };
}

// Price (Sistema Francês): parcela FIXA do início ao fim.
function calcularParcelaPrice(valor, taxaMensal, prazoMeses) {
  if (taxaMensal <= 0) return valor / prazoMeses;
  const fator = Math.pow(1 + taxaMensal, prazoMeses);
  return valor * (taxaMensal * fator) / (fator - 1);
}

function calcularPrice(valor, taxaMensal, prazoMeses) {
  const parcela = calcularParcelaPrice(valor, taxaMensal, prazoMeses);
  const totalPago = parcela * prazoMeses;
  return { parcela, totalPago, totalJuros: totalPago - valor };
}

// Inverso da Price: dada a PARCELA máxima que cabe no bolso (ex: margem
// consignável), acha o valor máximo que dá pra tomar emprestado.
function calcularValorMaximoPrice(parcela, taxaMensal, prazoMeses) {
  if (taxaMensal <= 0) return parcela * prazoMeses;
  const fator = Math.pow(1 + taxaMensal, prazoMeses);
  return parcela * (fator - 1) / (taxaMensal * fator);
}
