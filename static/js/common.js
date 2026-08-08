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
