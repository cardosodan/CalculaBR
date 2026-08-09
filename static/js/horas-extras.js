document.getElementById("btn-calcular").addEventListener("click", () => {
  const salario = parseNumeroBR(document.getElementById("salario").value);
  const horasMensais = parseNumeroBR(document.getElementById("horas-mensais").value);
  const horas50 = parseNumeroBR(document.getElementById("horas-50").value) || 0;
  const horas100 = parseNumeroBR(document.getElementById("horas-100").value) || 0;
  const horasNoturnas = parseNumeroBR(document.getElementById("horas-noturnas").value) || 0;
  const usaDSR = document.getElementById("usa-dsr").checked;

  if (!Number.isFinite(salario) || salario <= 0 || !Number.isFinite(horasMensais) || horasMensais <= 0) return;

  const valorHora = salario / horasMensais;
  const valorHE50 = valorHora * 1.5 * horas50;
  const valorHE100 = valorHora * 2.0 * horas100;
  const valorNoturno = valorHora * 0.2 * horasNoturnas;
  const subtotal = valorHE50 + valorHE100 + valorNoturno;
  const dsr = usaDSR ? subtotal * 0.18 : 0;
  const total = subtotal + dsr;

  animarNumero(document.getElementById("r-total"), total, formatarBRL, 1.1);
  animarNumero(document.getElementById("r-valor-hora"), valorHora, formatarBRL);
  animarNumero(document.getElementById("r-he50"), valorHE50, formatarBRL);
  animarNumero(document.getElementById("r-he100"), valorHE100, formatarBRL);
  animarNumero(document.getElementById("r-noturno"), valorNoturno, formatarBRL);
  document.getElementById("linha-dsr").classList.toggle("hidden", !usaDSR);
  if (usaDSR) animarNumero(document.getElementById("r-dsr"), dsr, formatarBRL);

  revelarResultado(document.getElementById("resultado"), document.getElementById("placeholder-resultado"));
  registrarNoDashboard("Horas Extras", "horas-extras.html", `Total a receber: ${formatarBRL(total)}`);
});
