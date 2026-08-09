"""Gerador estático do CalculaBR.

Site 100% estático (sem backend/banco) — o Jinja2 aqui só existe pra não
repetir header/nav/footer em cada página HTML na mão, igual um template
engine de verdade faria, mas o resultado final em `dist/` são arquivos
.html puros, sem nenhum servidor Python rodando em produção.

Uso: `python build.py` (regenera `dist/` inteiro do zero).
"""
import datetime
import shutil
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

RAIZ = Path(__file__).parent
TEMPLATES = RAIZ / "templates"
STATIC = RAIZ / "static"
DIST = RAIZ / "dist"

# Agrupado por categoria — com 16 calculadoras um menu "flat" não cabe
# mais (rodada anterior tinha só 5). O nav (base.html) renderiza isso como
# um dropdown por categoria no desktop e uma lista com cabeçalhos no
# mobile; a home (index.html) usa a mesma estrutura pras seções.
CATEGORIAS_NAV = [
    {
        "nome": "Trabalhista",
        "icone": "briefcase",
        "itens": [
            {"slug": "rescisao", "label": "Rescisão Trabalhista", "href": "rescisao.html", "icone": "briefcase",
             "desc": "Aviso prévio, saldo, férias, 13º e FGTS + multa nos 4 tipos de desligamento."},
            {"slug": "ferias", "label": "Férias Proporcionais", "href": "ferias.html", "icone": "palmtree",
             "desc": "Dias e valor (+1/3) proporcionais ao tempo trabalhado."},
            {"slug": "decimo-terceiro", "label": "13º Salário", "href": "decimo-terceiro.html", "icone": "gift",
             "desc": "1ª e 2ª parcela, com desconto de INSS/IRRF na segunda."},
            {"slug": "salario-liquido", "label": "Salário Líquido", "href": "salario-liquido.html", "icone": "wallet",
             "desc": "Bruto até líquido: INSS + IRRF + vale-transporte/refeição."},
            {"slug": "horas-extras", "label": "Horas Extras", "href": "horas-extras.html", "icone": "clock",
             "desc": "50%/100% sobre a hora normal, DSR e adicional noturno."},
            {"slug": "inss", "label": "INSS", "href": "inss.html", "icone": "landmark",
             "desc": "Desconto mensal com a tabela progressiva vigente."},
        ],
    },
    {
        "nome": "Tributário",
        "icone": "receipt",
        "itens": [
            {"slug": "irpf", "label": "IRPF (Imposto de Renda)", "href": "irpf.html", "icone": "file-text",
             "desc": "Declaração anual: simplificado vs. completo, já com a reforma 2026."},
            {"slug": "itbi", "label": "ITBI", "href": "itbi.html", "icone": "home",
             "desc": "Imposto de transmissão na compra de imóvel, por cidade."},
            {"slug": "ipva", "label": "IPVA", "href": "ipva.html", "icone": "car",
             "desc": "Por estado e tipo de veículo — Amazonas já configurado."},
            {"slug": "iptu", "label": "IPTU", "href": "iptu.html", "icone": "building-2",
             "desc": "A partir do valor venal do imóvel, alíquota configurável."},
            {"slug": "mei", "label": "MEI (DAS)", "href": "mei.html", "icone": "store",
             "desc": "Valor mensal do DAS por categoria + limite de faturamento."},
        ],
    },
    {
        "nome": "Crédito & Financiamento",
        "icone": "credit-card",
        "itens": [
            {"slug": "financiamento-imobiliario", "label": "Financiamento Imobiliário", "href": "financiamento-imobiliario.html", "icone": "building",
             "desc": "SAC vs. Price lado a lado — total pago, parcela inicial e final."},
            {"slug": "financiamento-veiculo", "label": "Financiamento de Veículo", "href": "financiamento-veiculo.html", "icone": "car-front",
             "desc": "Parcela fixa (Tabela Price), juros totais e CET aproximado."},
            {"slug": "cartao-credito", "label": "Cartão de Crédito", "href": "cartao-credito.html", "icone": "credit-card",
             "desc": "Quanto custa não pagar a fatura inteira — juros do rotativo."},
            {"slug": "consignado", "label": "Empréstimo Consignado", "href": "consignado.html", "icone": "hand-coins",
             "desc": "Margem consignável (CLT/INSS) e simulação de parcelas."},
        ],
    },
    {
        "nome": "Investimentos",
        "icone": "trending-up",
        "itens": [
            {"slug": "investimentos", "label": "Renda Fixa + Juros Compostos", "href": "investimentos.html", "icone": "trending-up",
             "desc": "CDB, LCI/LCA, Tesouro Selic, Poupança e simulador de aportes."},
        ],
    },
]

# Lista achatada — usada pelo footer e por qualquer lugar que precise de
# "todas as calculadoras" sem se importar com categoria.
NAV_ITEMS = [item for cat in CATEGORIAS_NAV for item in cat["itens"]]

# Uma entrada por página final em dist/ — "template" é o arquivo em
# templates/, "saida" é o nome do arquivo gerado em dist/, "active" liga
# o item certo do nav (mesmo slug usado em CATEGORIAS_NAV).
PAGINAS = [
    {"template": "index.html", "saida": "index.html", "active": None},
] + [
    {"template": item["href"], "saida": item["href"], "active": item["slug"]}
    for item in NAV_ITEMS
]


def build():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    env = Environment(loader=FileSystemLoader(str(TEMPLATES)), autoescape=True)
    contexto_base = {
        "nav_items": NAV_ITEMS,
        "categorias_nav": CATEGORIAS_NAV,
        "ano_atual": datetime.date.today().year,
    }

    for pagina in PAGINAS:
        template = env.get_template(pagina["template"])
        html = template.render(active=pagina["active"], **contexto_base)
        (DIST / pagina["saida"]).write_text(html, encoding="utf-8")
        print(f"  gerado: dist/{pagina['saida']}")

    shutil.copytree(STATIC, DIST / "static")
    print(f"OK: {len(PAGINAS)} páginas + static/ copiado pra dist/")


if __name__ == "__main__":
    build()
