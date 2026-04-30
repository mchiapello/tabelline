"""Italian verbs SRS — DB layer that wraps the pure srs.update() algorithm."""

import math
from datetime import date, timedelta
from database import get_connection
from srs import update as sm2_update

DEFAULT_EF      = 2.5
MIN_EF          = 1.3
APPRESO_REPS    = 3
APPRESO_QUALITY = 4


def calcola_qualita(corretta: bool, tempo_secondi, con_suggerimento: bool) -> int:
    if not corretta:
        return 0 if tempo_secondi is None else 1
    if con_suggerimento:
        return 3
    return 5 if (tempo_secondi or 99) < 4 else 4


def get_or_create_srs(conn, utente_id, infinito, modo, tempo, persona):
    c = conn.cursor()
    c.execute("""
        SELECT id, ef, interval_giorni, reps, next_review, last_quality
        FROM srs_verbi
        WHERE utente_id=? AND infinito=? AND modo=? AND tempo=? AND persona=?
    """, (utente_id, infinito, modo, tempo, persona))
    row = c.fetchone()
    if row:
        return dict(row)
    c.execute("""
        INSERT INTO srs_verbi (utente_id, infinito, modo, tempo, persona,
                               ef, interval_giorni, reps, next_review, last_quality)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, NULL)
    """, (utente_id, infinito, modo, tempo, persona, DEFAULT_EF, date.today().isoformat()))
    conn.commit()
    return get_or_create_srs(conn, utente_id, infinito, modo, tempo, persona)


def aggiorna_srs(utente_id, infinito, modo, tempo, persona,
                 corretta, tempo_secondi, con_suggerimento=False):
    conn = get_connection()
    rec  = get_or_create_srs(conn, utente_id, infinito, modo, tempo, persona)

    quality = calcola_qualita(corretta, tempo_secondi, con_suggerimento)
    new_ef, new_interval, new_reps = sm2_update(
        rec['ef'], rec['reps'], quality, prev_interval=rec['interval_giorni']
    )
    next_review = (date.today() + timedelta(days=new_interval)).isoformat()
    appreso     = int(new_reps >= APPRESO_REPS and quality >= APPRESO_QUALITY)

    conn.execute("""
        UPDATE srs_verbi
        SET ef=?, interval_giorni=?, reps=?, next_review=?, last_quality=?, appreso=?
        WHERE id=?
    """, (new_ef, new_interval, new_reps, next_review, quality, appreso, rec['id']))
    conn.commit()
    conn.close()

    return {
        'infinito': infinito, 'modo': modo, 'tempo': tempo, 'persona': persona,
        'quality': quality, 'ef': new_ef, 'interval': new_interval,
        'reps': new_reps, 'next_review': next_review, 'appreso': bool(appreso),
    }


def get_verbi_da_ripassare(utente_id, livello, limite=20):
    conn = get_connection()
    oggi = date.today().isoformat()
    c    = conn.cursor()
    c.execute("""
        SELECT s.infinito, s.modo, s.tempo, s.persona,
               s.ef, s.interval_giorni, s.reps, s.next_review, s.appreso
        FROM srs_verbi s
        WHERE s.utente_id = ?
          AND (s.next_review <= ? OR s.reps = 0)
          AND s.appreso = 0
        ORDER BY s.reps ASC, s.next_review ASC, s.ef ASC
        LIMIT ?
    """, (utente_id, oggi, limite))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


class ErrorManager:
    def __init__(self, utente_id):
        self.utente_id = utente_id

    def registra_errore(self, infinito, modo, tempo, persona,
                        risposta_data, risposta_corretta):
        conn = get_connection()
        conn.execute("""
            INSERT INTO errori_verbi
                (utente_id, infinito, modo, tempo, persona,
                 risposta_data, risposta_corretta, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, date('now'))
        """, (self.utente_id, infinito, modo, tempo, persona,
              risposta_data, risposta_corretta))
        conn.commit()
        conn.close()

    def get_mostriciattoli(self, limite=10):
        conn = get_connection()
        c    = conn.cursor()
        c.execute("""
            SELECT infinito, modo, tempo, persona,
                   COUNT(*) as n_errori,
                   MAX(data) as ultimo_errore,
                   MAX(risposta_corretta) as risposta_corretta
            FROM errori_verbi
            WHERE utente_id = ?
              AND data >= date('now', '-30 days')
            GROUP BY infinito, modo, tempo, persona
            ORDER BY n_errori DESC, ultimo_errore DESC
            LIMIT ?
        """, (self.utente_id, limite))
        rows = [dict(r) for r in c.fetchall()]
        conn.close()
        return rows

    def genera_spiegazione_errore(self, soggetto, forma_errata,
                                  forma_corretta, infinito):
        plurali   = {'noi', 'voi', 'loro'}
        singolari = {'io', 'tu', 'lui/lei'}
        sog = soggetto.lower()
        forma_sembra_plurale = forma_errata.endswith('no') or forma_errata.endswith('ano')

        if sog in plurali and not forma_sembra_plurale:
            return {
                'tipo': 'accordo_numero',
                'messaggio': f"⚠️ '{soggetto}' è plurale, ma '{forma_errata}' è singolare!",
                'suggerimento': f"Con '{soggetto}' usa '{forma_corretta}'.",
                'emoji': '👥',
            }
        if sog in singolari and forma_sembra_plurale:
            return {
                'tipo': 'accordo_numero',
                'messaggio': f"⚠️ '{soggetto}' è singolare, ma '{forma_errata}' è plurale!",
                'suggerimento': f"Con '{soggetto}' usa '{forma_corretta}'.",
                'emoji': '👤',
            }
        return {
            'tipo': 'forma_errata',
            'messaggio': f"'{forma_errata}' non è la forma giusta di '{infinito}'.",
            'suggerimento': f"La forma corretta è '{forma_corretta}'. Riprova!",
            'emoji': '🤔',
        }
