# CalculaBR

Site estático (sem backend, sem banco de dados) com **16 calculadoras**
pro Brasil, organizadas em 4 categorias:

- **Trabalhista**: Rescisão, Férias Proporcionais, 13º Salário, Salário
  Líquido, Horas Extras, INSS.
- **Tributário**: IRPF (declaração anual), ITBI, IPVA, IPTU, MEI (DAS).
- **Crédito & Financiamento**: Financiamento Imobiliário (SAC vs Price),
  Financiamento de Veículo, Cartão de Crédito (rotativo), Empréstimo
  Consignado.
- **Investimentos**: comparador de renda fixa (CDB/LCI-LCA/Tesouro
  Selic/Poupança) + simulador de juros compostos.

Todo cálculo roda **no navegador do usuário** (JavaScript puro, sem
framework) — nenhum dado é enviado pra lugar nenhum.

## Stack

- **Sem backend**: HTML gerado a partir de templates Jinja2 (só pra não
  repetir header/nav/footer em 6 páginas na mão) — o resultado final em
  `dist/` são arquivos `.html` estáticos, sem Python/servidor rodando em
  produção.
- **CSS**: Tailwind v4 via CLI standalone (`tools/tailwindcss.exe`, não
  versionado — ver "Como rodar"), config CSS-first em `static/css/input.css`.
- **JS**: vanilla, um arquivo por calculadora em `static/js/`, mais
  `common.js` com utilidades compartilhadas (formatação de moeda,
  parsing de número em pt-BR, contagem de meses/anos proporcionais).
- **Alpine.js** (CDN) só pro menu mobile. **Lucide** (CDN) pros ícones.
- **GSAP + ScrollTrigger** (CDN, versão fixa) — anima a entrada dos
  painéis de resultado, conta os números grandes de R$/% em vez de só
  trocar o texto, e revela os cards da home em cascata. Ver "Animações"
  abaixo.

## Animações (GSAP)

Toda animação passa pelos helpers de `static/js/common.js`
(`animarNumero`, `revelarResultado`, `animarEntradaEmLote`,
`ativarSpotlightCards`) em vez de cada calculadora reimplementar a
própria — usados de forma idêntica nas 5 calculadoras.

**Achado real, corrigido**: testando com automação (Playwright), um tween
do GSAP disparado no carregamento da página às vezes travava no meio
(aba sem foco, `requestAnimationFrame` irregular) e deixava o elemento
preso numa opacidade intermediária/corrompida — em vez de só "sem
animação", ficava um **resultado errado parado na tela pra sempre**.
Corrigido com uma rede de segurança: todo `gsap.to/from/fromTo` chamado
por esses helpers tem um `setTimeout` companheiro que força o **valor/
estado final correto**, disparado um pouco depois da duração esperada da
animação — não importa o que aconteça com o tween em si, o usuário nunca
vê um número intermediário grudado na tela.

**Cuidado ao escrever esse tipo de rede de segurança**: a primeira versão
usava `gsap.set(el, {clearProps: "opacity,transform"})`, que remove o
estilo inline e deixa o elemento cair de volta pro CSS "de base" — seguro
aqui porque nenhum elemento animado tem uma regra CSS de `opacity`
própria (o estado "escondido" vem só de classe `hidden`/inline style, não
de CSS estático). Sempre usar **valores explícitos** (`{opacity: 1, y: 0}`)
em vez de `clearProps` numa rede de segurança dessas, a menos que esteja
100% confirmado que o CSS de base do elemento já é visível por natureza.

## Estrutura

```
templates/       fonte Jinja2 de cada página (base.html + 6 páginas)
static/css/      input.css (tokens do tema) + tailwind.css (compilado, versionado)
static/js/       common.js + um arquivo por calculadora
build.py         renderiza templates/ + copia static/ pra dist/
dist/            saída final estática (gerada, não versionada — ver .gitignore)
tools/           tailwindcss.exe (baixado, não versionado)
```

## Como rodar localmente

```powershell
# 1. baixe o Tailwind CLI standalone (~110MB, não versionado — ver .gitignore)
Invoke-WebRequest -Uri "https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-windows-x64.exe" -OutFile "tools\tailwindcss.exe"

# 2. compile o CSS
.\tools\tailwindcss.exe -i static\css\input.css -o static\css\tailwind.css

# 3. gere o site estático em dist/
python build.py

# 4. sirva localmente pra testar
cd dist
python -m http.server 8000
```

`build.py` só precisa do pacote `jinja2` (`pip install jinja2` se não
tiver ainda).

**Sempre que mudar algo em `templates/` que introduza uma classe Tailwind
nova**, recompile o CSS (passo 2) ANTES de rodar `build.py` — o
`tailwind.css` é gerado por varredura estática dos arquivos, uma classe
nova sem recompilar fica sem nenhuma regra CSS (mesmo bug já visto e
documentado no projeto ComparaAI desta mesma sessão).

## Deploy (Netlify/Vercel — recomendado)

Conecte o repositório e configure:
- **Build command**: `python build.py`
- **Publish directory**: `dist`

Como `static/css/tailwind.css` já vem compilado e versionado no repo, o
build command não precisa baixar nem rodar o Tailwind CLI — só o Jinja2
(`pip install jinja2` antes, se a plataforma não instalar automaticamente
a partir de um `requirements.txt`... adicione um `requirements.txt` com
`jinja2` se o Netlify/Vercel não conseguir rodar `python build.py` sem
ele).

GitHub Pages também funciona, mas exige rodar `python build.py` localmente
e commitar o conteúdo de `dist/` numa branch própria (`gh-pages`) — mais
manual, por isso Netlify/Vercel é o caminho recomendado.

## Fontes dos dados usados (revisão de agosto/2026 — conferir se mudou)

Tabelas compartilhadas (INSS, IRRF) ficam centralizadas em
`static/js/common.js` — nunca duplicadas por calculadora, pra nunca
desalinhar quando a tabela do ano mudar.

- **INSS 2026**: tabela progressiva com dedução, salário mínimo
  R$ 1.621,00, teto R$ 8.475,55 (7,5% / 9% / 12% / 14%). Muda todo início
  de ano — atualizar `FAIXAS_INSS_2026`/`TETO_INSS_2026` em `common.js`.
- **IRRF 2026 (reforma da Lei 15.270/2025)**: isenção total até
  R$ 5.000/mês (R$ 60.000/ano), redução parcial decrescente de
  R$ 5.000,01 a R$ 7.350,00 (fórmula oficial: 978,62 − 0,133145 × renda),
  tabela progressiva tradicional acima disso — verificado cruzando 2
  fontes independentes (mensal e sua equivalente anual batendo ×12 exato)
  antes de implementar. `TABELA_IRRF_2026` em `common.js`.
- **ITBI Manaus**: 2% sobre o valor venal/de transação (o maior).
- **IPVA Amazonas 2026**: 1,5% (até 1.0/elétrico/híbrido) ou 2% (acima de
  1.0) — reduzidas pela metade em relação a 2025, isenção automática até
  R$ 420,00 (IPVA Social).
- **MEI 2026**: DAS R$ 82,05 (comércio/indústria) / R$ 86,05 (serviços) /
  R$ 87,05 (ambos) — 5% do salário mínimo (INSS) + R$ 1/R$ 5 fixos
  (ICMS/ISS). Limite de faturamento R$ 81.000/ano, inalterado desde 2019.
- **Margem consignável 2026**: CLT 35% (Lei 10.820/2003, estável); INSS/
  aposentados 40% (reduzida de 45% pela MP 1.355/2026, caindo 2 pontos
  por ano até 30% em 2031) — teto de juros do consignado INSS 1,85% a.m.
- **Rotativo do cartão**: ~36% ao mês (428-436% a.a., dado do Banco
  Central em 2026) — deliberadamente alto de propósito, é a modalidade de
  crédito mais cara do país.
- **IR regressivo (renda fixa)**: 22,5% / 20% / 17,5% / 15% conforme
  prazo — regra estável desde 2004 (Lei 11.033).
- **CDI/Selic/TR**: valores de referência editáveis na própria
  calculadora — mudam a cada reunião do Copom.
- **Aviso prévio (30 + 3 dias por ano, até 90)**: Lei 12.506/2011, estável.
- **FGTS**: 8% mensal, multa de 40% (sem justa causa) / 20% (acordo mútuo,
  Art. 484-A CLT).
- **SAC/Price**: fórmulas padrão de matemática financeira (não são "dado"
  que muda, são matemática) — `calcularSAC`/`calcularPrice`/
  `calcularValorMaximoPrice` em `common.js`, compartilhadas entre
  Financiamento Imobiliário, Financiamento de Veículo e Consignado.

## Escopo consciente (o que NÃO está incluído)

- IRRF sobre saldo de salário/13º proporcional **dentro da rescisão**
  (mostrado bruto, com nota) — o 13º Salário *standalone* já calcula IRRF
  corretamente, só a rescisão não.
- Aposentadoria (INSS) — **deliberadamente fora desta rodada**: as regras
  de transição (idade mínima progressiva, pontos, pedágio 50%/100%) são
  complexas demais pra arriscar errar sem uma rodada de pesquisa dedicada
  só pra isso.
- Simples Nacional completo (só o MEI está implementado) — o Simples de
  verdade tem 5 anexos com faixas próprias, escopo bem maior que um DAS.
- IOF regressivo em resgates de CDB/Tesouro antes de 30 dias, e em
  financiamentos/consignado.
- Taxa de custódia da B3 no Tesouro Selic (0,20% a.a. acima de R$ 10 mil).
- CET real de financiamentos (usa só a taxa de juros nominal — CET
  inclui seguro, tarifas, IOF, que os bancos cobram por fora).
- Cálculo de seguro-desemprego (regras e parcelas próprias, só mencionado
  como direito na rescisão sem justa causa).

Todos esses pontos estão anotados como nota de rodapé na própria página
onde se aplicam — a ideia é nunca fingir precisão que a ferramenta não tem.
