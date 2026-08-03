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

  document.getElementById("r-itbi").textContent = formatarBRL(itbi);
  document.getElementById("r-aliquota").textContent = formatarPercentual(aliquota);
  document.getElementById("r-total-com-itbi").textContent = formatarBRL(valorImovel + itbi);

  document.getElementById("resultado").classList.remove("hidden");
  document.getElementById("placeholder-resultado").classList.add("hidden");
});
