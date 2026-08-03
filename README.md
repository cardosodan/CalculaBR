# CalculaBR

Site estático (sem backend, sem banco de dados) com calculadoras
trabalhistas, tributárias e de investimento pro Brasil — rescisão
trabalhista, férias proporcionais, INSS, ITBI e um comparador de renda
fixa (CDB/LCI-LCA/Tesouro Selic/Poupança) + simulador de juros compostos.

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

- **INSS 2026**: tabela progressiva com dedução, salário mínimo
  R$ 1.621,00, teto R$ 8.475,55 (alíquotas 7,5% / 9% / 12% / 14%).
  Muda todo início de ano — atualizar `static/js/inss.js`
  (`FAIXAS_INSS_2026`) e a tabela em `templates/inss.html` quando sair a
  tabela nova.
- **ITBI Manaus**: 2% sobre o valor venal/de transação (o maior). Lei
  municipal pode mudar — a calculadora permite trocar pra "outra cidade"
  com alíquota customizada.
- **IR regressivo (renda fixa)**: 22,5% / 20% / 17,5% / 15% conforme
  prazo — regra estável desde 2004 (Lei 11.033), baixo risco de mudar.
- **CDI/Selic/TR**: valores de referência editáveis na própria
  calculadora (CDI 14,15% a.a., Selic 14,25% a.a., TR 0,17% a.m.) — mudam
  a cada reunião do Copom, por isso são só um "chute inicial" no formulário,
  não uma constante fixa no código.
- **Aviso prévio (30 + 3 dias por ano, até 90)**: Lei 12.506/2011, estável.
- **FGTS**: 8% mensal, multa de 40% (sem justa causa) / 20% (acordo mútuo,
  Art. 484-A CLT) — regras estáveis.

## Escopo consciente (o que NÃO está incluído)

- IRRF sobre saldo de salário/13º na rescisão (mostrado bruto, com nota).
- IOF regressivo em resgates de CDB/Tesouro antes de 30 dias.
- Taxa de custódia da B3 no Tesouro Selic (0,20% a.a. acima de R$ 10 mil).
- Cálculo de seguro-desemprego (regras e parcelas próprias, só mencionado
  como direito na rescisão sem justa causa).

Todos esses pontos estão anotados como nota de rodapé na própria página
onde se aplicam — a ideia é nunca fingir precisão que a ferramenta não tem.
