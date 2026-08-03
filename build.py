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

NAV_ITEMS = [
    {"slug": "rescisao", "label": "Rescisão", "href": "rescisao.html"},
    {"slug": "ferias", "label": "Férias", "href": "ferias.html"},
    {"slug": "inss", "label": "INSS", "href": "inss.html"},
    {"slug": "itbi", "label": "ITBI", "href": "itbi.html"},
    {"slug": "investimentos", "label": "Investimentos", "href": "investimentos.html"},
]

# Uma entrada por página final em dist/ — "template" é o arquivo em
# templates/, "saida" é o nome do arquivo gerado em dist/, "active" liga
# o item certo do nav.
PAGINAS = [
    {"template": "index.html", "saida": "index.html", "active": None},
    {"template": "rescisao.html", "saida": "rescisao.html", "active": "rescisao"},
    {"template": "ferias.html", "saida": "ferias.html", "active": "ferias"},
    {"template": "inss.html", "saida": "inss.html", "active": "inss"},
    {"template": "itbi.html", "saida": "itbi.html", "active": "itbi"},
    {"template": "investimentos.html", "saida": "investimentos.html", "active": "investimentos"},
]


def build():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    env = Environment(loader=FileSystemLoader(str(TEMPLATES)), autoescape=True)
    contexto_base = {
        "nav_items": NAV_ITEMS,
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
