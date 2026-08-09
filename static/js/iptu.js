document.getElementById("btn-calcular").addEventListener("click", () => {
  const valorVenal = parseNumeroBR(document.getElementById("valor-venal").value);
  const aliquota = parseNumeroBR(document.getElementById("aliquota").value);
  if (!Number.isFinite(valorVenal) || valorVenal <= 0 || !Number.isFinite(aliquota) || aliquota <= 0) return;

  const anual = valorVenal * (aliquota / 100);

  animarNumero(document.getElementById("r-anual"), anual, formatarBRL);
  animarNumero(document.getElementById("r-parcelado"), anual / 10, (v) => `${formatarBRL(v)}/mês`);
  animarNumero(document.getElementById("r-desconto"), anual * 0.9, formatarBRL);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});
