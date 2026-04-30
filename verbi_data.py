"""
Dataset dei verbi italiani.

Struttura di ogni verbo:
  infinito       – forma base
  isIrregular    – flag per animazione/color-coding speciale
  difficolta     – 'base' (6-8 anni) | 'avanzato' (9-11 anni)
  categoria      – concetto didattico (azione, stato, movimento…)
  radice         – parte che non cambia (per color-coding morfologico)
  coniugazioni   – dizionario modo → tempo → persona → {forma, radice, desinenza}
"""

SOGGETTI = ["io", "tu", "lui/lei", "noi", "voi", "loro"]

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: genera forma con suddivisione morfologica
# ─────────────────────────────────────────────────────────────────────────────
def _f(forma: str, radice: str) -> dict:
    """Ritorna {forma, radice, desinenza} dato la forma completa e la radice."""
    if forma.startswith(radice):
        return {"forma": forma, "radice": radice, "desinenza": forma[len(radice):]}
    # Verbi irregolari con radice sopletiva (es. essere: sono ≠ ess-)
    return {"forma": forma, "radice": "", "desinenza": forma}


# ─────────────────────────────────────────────────────────────────────────────
# VERBI
# ─────────────────────────────────────────────────────────────────────────────
VERBI: list[dict] = [

    # ── REGOLARI -ARE ────────────────────────────────────────────────────────
    {
        "infinito": "parlare",
        "isIrregular": False,
        "difficolta": "base",
        "categoria": "comunicazione",
        "radice": "parl",
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("parlo",     "parl"),
                    "tu":      _f("parli",     "parl"),
                    "lui/lei": _f("parla",     "parl"),
                    "noi":     _f("parliamo",  "parl"),
                    "voi":     _f("parlate",   "parl"),
                    "loro":    _f("parlano",   "parl"),
                },
                "futuro_semplice": {
                    "io":      _f("parlerò",    "parler"),
                    "tu":      _f("parlerai",   "parler"),
                    "lui/lei": _f("parlerà",    "parler"),
                    "noi":     _f("parleremo",  "parler"),
                    "voi":     _f("parlerete",  "parler"),
                    "loro":    _f("parleranno", "parler"),
                },
            },
            "passato_prossimo": {
                "io":      "ho parlato",
                "tu":      "hai parlato",
                "lui/lei": "ha parlato",
                "noi":     "abbiamo parlato",
                "voi":     "avete parlato",
                "loro":    "hanno parlato",
            },
        },
    },

    {
        "infinito": "mangiare",
        "isIrregular": False,
        "difficolta": "base",
        "categoria": "azione_quotidiana",
        "radice": "mangi",
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("mangio",    "mang"),
                    "tu":      _f("mangi",     "mang"),
                    "lui/lei": _f("mangia",    "mang"),
                    "noi":     _f("mangiamo",  "mang"),
                    "voi":     _f("mangiate",  "mang"),
                    "loro":    _f("mangiano",  "mang"),
                },
                "futuro_semplice": {
                    "io":      _f("mangerò",    "manger"),
                    "tu":      _f("mangerai",   "manger"),
                    "lui/lei": _f("mangerà",    "manger"),
                    "noi":     _f("mangeremo",  "manger"),
                    "voi":     _f("mangerete",  "manger"),
                    "loro":    _f("mangeranno", "manger"),
                },
            },
            "passato_prossimo": {
                "io":      "ho mangiato",
                "tu":      "hai mangiato",
                "lui/lei": "ha mangiato",
                "noi":     "abbiamo mangiato",
                "voi":     "avete mangiato",
                "loro":    "hanno mangiato",
            },
        },
    },

    {
        "infinito": "giocare",
        "isIrregular": False,
        "difficolta": "base",
        "categoria": "azione_quotidiana",
        "radice": "gioc",
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("gioco",    "gioc"),
                    "tu":      _f("giochi",   "gioc"),
                    "lui/lei": _f("gioca",    "gioc"),
                    "noi":     _f("giochiamo","gioc"),
                    "voi":     _f("giocate",  "gioc"),
                    "loro":    _f("giocano",  "gioc"),
                },
                "futuro_semplice": {
                    "io":      _f("giocherò",    "giocher"),
                    "tu":      _f("giocherai",   "giocher"),
                    "lui/lei": _f("giocherà",    "giocher"),
                    "noi":     _f("giocheremo",  "giocher"),
                    "voi":     _f("giocherete",  "giocher"),
                    "loro":    _f("giocheranno", "giocher"),
                },
            },
            "passato_prossimo": {
                "io":      "ho giocato",
                "tu":      "hai giocato",
                "lui/lei": "ha giocato",
                "noi":     "abbiamo giocato",
                "voi":     "avete giocato",
                "loro":    "hanno giocato",
            },
        },
    },

    # ── REGOLARI -ERE / -IRE ─────────────────────────────────────────────────
    {
        "infinito": "leggere",
        "isIrregular": False,
        "difficolta": "base",
        "categoria": "comunicazione",
        "radice": "legg",
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("leggo",    "legg"),
                    "tu":      _f("leggi",    "legg"),
                    "lui/lei": _f("legge",    "legg"),
                    "noi":     _f("leggiamo", "legg"),
                    "voi":     _f("leggete",  "legg"),
                    "loro":    _f("leggono",  "legg"),
                },
                "futuro_semplice": {
                    "io":      _f("leggerò",    "legger"),
                    "tu":      _f("leggerai",   "legger"),
                    "lui/lei": _f("leggerà",    "legger"),
                    "noi":     _f("leggeremo",  "legger"),
                    "voi":     _f("leggerete",  "legger"),
                    "loro":    _f("leggeranno", "legger"),
                },
            },
            "passato_prossimo": {
                "io":      "ho letto",
                "tu":      "hai letto",
                "lui/lei": "ha letto",
                "noi":     "abbiamo letto",
                "voi":     "avete letto",
                "loro":    "hanno letto",
            },
        },
    },

    {
        "infinito": "dormire",
        "isIrregular": False,
        "difficolta": "base",
        "categoria": "azione_quotidiana",
        "radice": "dorm",
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("dormo",    "dorm"),
                    "tu":      _f("dormi",    "dorm"),
                    "lui/lei": _f("dorme",    "dorm"),
                    "noi":     _f("dormiamo", "dorm"),
                    "voi":     _f("dormite",  "dorm"),
                    "loro":    _f("dormono",  "dorm"),
                },
                "futuro_semplice": {
                    "io":      _f("dormirò",    "dormir"),
                    "tu":      _f("dormirai",   "dormir"),
                    "lui/lei": _f("dormirà",    "dormir"),
                    "noi":     _f("dormiremo",  "dormir"),
                    "voi":     _f("dormirete",  "dormir"),
                    "loro":    _f("dormiranno", "dormir"),
                },
            },
            "passato_prossimo": {
                "io":      "ho dormito",
                "tu":      "hai dormito",
                "lui/lei": "ha dormito",
                "noi":     "abbiamo dormito",
                "voi":     "avete dormito",
                "loro":    "hanno dormito",
            },
        },
    },

    # ── IRREGOLARI ───────────────────────────────────────────────────────────
    {
        "infinito": "essere",
        "isIrregular": True,
        "difficolta": "base",
        "categoria": "stato",
        "radice": "ess",   # sopletivo: molte forme non derivano da questa radice
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("sono",  ""),
                    "tu":      _f("sei",   ""),
                    "lui/lei": _f("è",     ""),
                    "noi":     _f("siamo", ""),
                    "voi":     _f("siete", ""),
                    "loro":    _f("sono",  ""),
                },
                "imperfetto": {
                    "io":      _f("ero",     "er"),
                    "tu":      _f("eri",     "er"),
                    "lui/lei": _f("era",     "er"),
                    "noi":     _f("eravamo", "er"),
                    "voi":     _f("eravate", "er"),
                    "loro":    _f("erano",   "er"),
                },
                "futuro_semplice": {
                    "io":      _f("sarò",    "sar"),
                    "tu":      _f("sarai",   "sar"),
                    "lui/lei": _f("sarà",    "sar"),
                    "noi":     _f("saremo",  "sar"),
                    "voi":     _f("sarete",  "sar"),
                    "loro":    _f("saranno", "sar"),
                },
            },
            "congiuntivo": {
                "presente": {
                    "io":      "sia",
                    "tu":      "sia",
                    "lui/lei": "sia",
                    "noi":     "siamo",
                    "voi":     "siate",
                    "loro":    "siano",
                },
            },
            "condizionale": {
                "presente": {
                    "io":      "sarei",
                    "tu":      "saresti",
                    "lui/lei": "sarebbe",
                    "noi":     "saremmo",
                    "voi":     "sareste",
                    "loro":    "sarebbero",
                },
            },
            "passato_prossimo": {
                "io":      "sono stato/a",
                "tu":      "sei stato/a",
                "lui/lei": "è stato/a",
                "noi":     "siamo stati/e",
                "voi":     "siete stati/e",
                "loro":    "sono stati/e",
            },
        },
    },

    {
        "infinito": "avere",
        "isIrregular": True,
        "difficolta": "base",
        "categoria": "stato",
        "radice": "av",
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("ho",      ""),
                    "tu":      _f("hai",     ""),
                    "lui/lei": _f("ha",      ""),
                    "noi":     _f("abbiamo", ""),
                    "voi":     _f("avete",   "av"),
                    "loro":    _f("hanno",   ""),
                },
                "imperfetto": {
                    "io":      _f("avevo",    "av"),
                    "tu":      _f("avevi",    "av"),
                    "lui/lei": _f("aveva",    "av"),
                    "noi":     _f("avevamo",  "av"),
                    "voi":     _f("avevate",  "av"),
                    "loro":    _f("avevano",  "av"),
                },
                "futuro_semplice": {
                    "io":      _f("avrò",    "avr"),
                    "tu":      _f("avrai",   "avr"),
                    "lui/lei": _f("avrà",    "avr"),
                    "noi":     _f("avremo",  "avr"),
                    "voi":     _f("avrete",  "avr"),
                    "loro":    _f("avranno", "avr"),
                },
            },
            "condizionale": {
                "presente": {
                    "io":      "avrei",
                    "tu":      "avresti",
                    "lui/lei": "avrebbe",
                    "noi":     "avremmo",
                    "voi":     "avreste",
                    "loro":    "avrebbero",
                },
            },
            "passato_prossimo": {
                "io":      "ho avuto",
                "tu":      "hai avuto",
                "lui/lei": "ha avuto",
                "noi":     "abbiamo avuto",
                "voi":     "avete avuto",
                "loro":    "hanno avuto",
            },
        },
    },

    {
        "infinito": "andare",
        "isIrregular": True,
        "difficolta": "base",
        "categoria": "movimento",
        "radice": "and",
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("vado",    ""),
                    "tu":      _f("vai",     ""),
                    "lui/lei": _f("va",      ""),
                    "noi":     _f("andiamo", "and"),
                    "voi":     _f("andate",  "and"),
                    "loro":    _f("vanno",   ""),
                },
                "futuro_semplice": {
                    "io":      _f("andrò",    "andr"),
                    "tu":      _f("andrai",   "andr"),
                    "lui/lei": _f("andrà",    "andr"),
                    "noi":     _f("andremo",  "andr"),
                    "voi":     _f("andrete",  "andr"),
                    "loro":    _f("andranno", "andr"),
                },
            },
            "congiuntivo": {
                "presente": {
                    "io":      "vada",
                    "tu":      "vada",
                    "lui/lei": "vada",
                    "noi":     "andiamo",
                    "voi":     "andiate",
                    "loro":    "vadano",
                },
            },
            "passato_prossimo": {
                "io":      "sono andato/a",
                "tu":      "sei andato/a",
                "lui/lei": "è andato/a",
                "noi":     "siamo andati/e",
                "voi":     "siete andati/e",
                "loro":    "sono andati/e",
            },
        },
    },

    {
        "infinito": "fare",
        "isIrregular": True,
        "difficolta": "avanzato",
        "categoria": "azione",
        "radice": "fac",
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("faccio",  "facc"),
                    "tu":      _f("fai",     ""),
                    "lui/lei": _f("fa",      ""),
                    "noi":     _f("facciamo","facc"),
                    "voi":     _f("fate",    ""),
                    "loro":    _f("fanno",   ""),
                },
                "imperfetto": {
                    "io":      _f("facevo",    "fac"),
                    "tu":      _f("facevi",    "fac"),
                    "lui/lei": _f("faceva",    "fac"),
                    "noi":     _f("facevamo",  "fac"),
                    "voi":     _f("facevate",  "fac"),
                    "loro":    _f("facevano",  "fac"),
                },
                "futuro_semplice": {
                    "io":      _f("farò",    "far"),
                    "tu":      _f("farai",   "far"),
                    "lui/lei": _f("farà",    "far"),
                    "noi":     _f("faremo",  "far"),
                    "voi":     _f("farete",  "far"),
                    "loro":    _f("faranno", "far"),
                },
            },
            "congiuntivo": {
                "presente": {
                    "io":      "faccia",
                    "tu":      "faccia",
                    "lui/lei": "faccia",
                    "noi":     "facciamo",
                    "voi":     "facciate",
                    "loro":    "facciano",
                },
            },
            "condizionale": {
                "presente": {
                    "io":      "farei",
                    "tu":      "faresti",
                    "lui/lei": "farebbe",
                    "noi":     "faremmo",
                    "voi":     "fareste",
                    "loro":    "farebbero",
                },
            },
            "passato_prossimo": {
                "io":      "ho fatto",
                "tu":      "hai fatto",
                "lui/lei": "ha fatto",
                "noi":     "abbiamo fatto",
                "voi":     "avete fatto",
                "loro":    "hanno fatto",
            },
        },
    },

    {
        "infinito": "venire",
        "isIrregular": True,
        "difficolta": "avanzato",
        "categoria": "movimento",
        "radice": "ven",
        "coniugazioni": {
            "indicativo": {
                "presente": {
                    "io":      _f("vengo",   "veng"),
                    "tu":      _f("vieni",   "vien"),
                    "lui/lei": _f("viene",   "vien"),
                    "noi":     _f("veniamo", "ven"),
                    "voi":     _f("venite",  "ven"),
                    "loro":    _f("vengono", "veng"),
                },
                "futuro_semplice": {
                    "io":      _f("verrò",    "verr"),
                    "tu":      _f("verrai",   "verr"),
                    "lui/lei": _f("verrà",    "verr"),
                    "noi":     _f("verremo",  "verr"),
                    "voi":     _f("verrete",  "verr"),
                    "loro":    _f("verranno", "verr"),
                },
            },
            "congiuntivo": {
                "presente": {
                    "io":      "venga",
                    "tu":      "venga",
                    "lui/lei": "venga",
                    "noi":     "veniamo",
                    "voi":     "veniate",
                    "loro":    "vengano",
                },
            },
            "passato_prossimo": {
                "io":      "sono venuto/a",
                "tu":      "sei venuto/a",
                "lui/lei": "è venuto/a",
                "noi":     "siamo venuti/e",
                "voi":     "siete venuti/e",
                "loro":    "sono venuti/e",
            },
        },
    },
]

# Indice rapido per infinito
VERBI_INDEX: dict = {v["infinito"]: v for v in VERBI}


def get_verbo(infinito: str) -> dict | None:
    return VERBI_INDEX.get(infinito)


def get_verbi_per_livello(difficolta: str) -> list[dict]:
    return [v for v in VERBI if v["difficolta"] == difficolta]


def get_forma(verbo: dict, modo: str, tempo: str, persona: str) -> dict | str | None:
    """Ritorna la forma coniugata (con radice/desinenza se disponibile)."""
    try:
        return verbo["coniugazioni"][modo][tempo][persona]
    except KeyError:
        return None
