const selectCategoria = document.getElementById("categoria");
const campoCustomIpva = document.getElementById("campo-aliquota-custom");

selectCategoria.addEventListener("change", () => {
  campoCustomIpva.classList.toggle("hidden", selectCategoria.value !== "custom");
});

document.getElementById("btn-calcular").addEventListener("click", () => {
  const valorVeiculo = parseNumeroBR(document.getElementById("valor-veiculo").value);
  if (!Number.isFinite(valorVeiculo) || valorVeiculo <= 0) return;

  let aliquota;
  let ehAmazonas = selectCategoria.value !== "custom";
  if (selectCategoria.value === "custom") {
    aliquota = parseNumeroBR(document.getElementById("aliquota-custom").value);
    if (!Number.isFinite(aliquota) || aliquota <= 0) return;
  } else {
    aliquota = Number(selectCategoria.value);
  }

  let ipva = valorVeiculo * (aliquota / 100);
  const isento = ehAmazonas && ipva <= 420;
  if (isento) ipva = 0;

  animarNumero(document.getElementById("r-ipva"), ipva, formatarBRL);
  animarNumero(document.getElementById("r-com-desconto"), ipva * 0.9, formatarBRL);
  animarNumero(document.getElementById("r-parcelado"), ipva / 3, (v) => `${formatarBRL(v)}/mês`);
  document.getElementById("r-isento-aviso").classList.toggle("hidden", !isento);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
});
