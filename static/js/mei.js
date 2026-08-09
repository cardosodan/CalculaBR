const LIMITE_FATURAMENTO_MEI_2026 = 81000.00;

document.getElementById("btn-calcular").addEventListener("click", () => {
  const dasMensal = Number(document.getElementById("categoria-mei").value);
  const faturamentoTexto = document.getElementById("faturamento-ano").value;
  const faturamento = faturamentoTexto.trim() === "" ? NaN : parseNumeroBR(faturamentoTexto);

  animarNumero(document.getElementById("r-das-mensal"), dasMensal, formatarBRL);
  animarNumero(document.getElementById("r-das-anual"), dasMensal * 12, formatarBRL);

  const blocoFaturamento = document.getElementById("bloco-faturamento");
  if (Number.isFinite(faturamento) && faturamento >= 0) {
    blocoFaturamento.classList.remove("hidden");
    const percentual = Math.min(100, (faturamento / LIMITE_FATURAMENTO_MEI_2026) * 100);
    document.getElementById("r-barra-faturamento").style.width = percentual + "%";

    const status = document.getElementById("r-status-faturamento");
    if (faturamento > LIMITE_FATURAMENTO_MEI_2026) {
      const excedente = faturamento - LIMITE_FATURAMENTO_MEI_2026;
      status.innerHTML = `Faturamento já <strong class="text-bad">passou o limite em ${formatarBRL(excedente)}</strong> — risco de desenquadramento do MEI.`;
    } else {
      const restante = LIMITE_FATURAMENTO_MEI_2026 - faturamento;
      status.innerHTML = `Ainda pode faturar <strong class="text-good">${formatarBRL(restante)}</strong> neste ano dentro do limite do MEI.`;
    }
  } else {
    blocoFaturamento.classList.add("hidden");
  }

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});
