const selectCidade = document.getElementById("cidade");
const campoCustom = document.getElementById("campo-aliquota-custom");

selectCidade.addEventListener("change", () => {
  campoCustom.classList.toggle("hidden", selectCidade.value !== "custom");
});

document.getElementById("btn-calcular").addEventListener("click", () => {
  const valorImovel = parseNumeroBR(document.getElementById("valor-imovel").value);
  if (!Number.isFinite(valorImovel) || valorImovel <= 0) return;

  let aliquota;
  if (selectCidade.value === "custom") {
    aliquota = parseNumeroBR(document.getElementById("aliquota-custom").value);
    if (!Number.isFinite(aliquota) || aliquota <= 0) return;
  } else {
    aliquota = Number(selectCidade.value);
  }

  const itbi = valorImovel * (aliquota / 100);

  animarNumero(document.getElementById("r-itbi"), itbi, formatarBRL);
  animarNumero(document.getElementById("r-aliquota"), aliquota, (v) => formatarPercentual(v));
  animarNumero(document.getElementById("r-total-com-itbi"), valorImovel + itbi, formatarBRL);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});
