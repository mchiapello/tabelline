import sqlite3
from datetime import datetime

DB_PATH = "tabelline.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS verifiche (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            modalita TEXT NOT NULL DEFAULT 'verifica',
            totale_domande INTEGER NOT NULL,
            risposte_corrette INTEGER NOT NULL,
            tempo_totale_secondi REAL,
            timer_per_domanda INTEGER
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS risposte (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            verifica_id INTEGER NOT NULL,
            moltiplicando INTEGER NOT NULL,
            moltiplicatore INTEGER NOT NULL,
            risposta_corretta INTEGER NOT NULL,
            risposta_utente INTEGER,
            tempo_secondi REAL,
            corretta INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (verifica_id) REFERENCES verifiche(id)
        )
    """)

    conn.commit()
    conn.close()


def salva_verifica(modalita, totale_domande, risposte_corrette, tempo_totale, timer_per_domanda, risposte):
    conn = get_connection()
    c = conn.cursor()

    data = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("""
        INSERT INTO verifiche (data, modalita, totale_domande, risposte_corrette, tempo_totale_secondi, timer_per_domanda)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (data, modalita, totale_domande, risposte_corrette, tempo_totale, timer_per_domanda))

    verifica_id = c.lastrowid

    for r in risposte:
        c.execute("""
            INSERT INTO risposte (verifica_id, moltiplicando, moltiplicatore, risposta_corretta, risposta_utente, tempo_secondi, corretta)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            verifica_id,
            r["moltiplicando"],
            r["moltiplicatore"],
            r["risposta_corretta"],
            r.get("risposta_utente"),
            r.get("tempo_secondi"),
            1 if r.get("corretta") else 0
        ))

    conn.commit()
    conn.close()
    return verifica_id


def get_statistiche_generali():
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        SELECT
            COUNT(*) as totale_verifiche,
            AVG(CAST(risposte_corrette AS REAL) / totale_domande * 100) as media_punteggio,
            MAX(CAST(risposte_corrette AS REAL) / totale_domande * 100) as miglior_punteggio
        FROM verifiche
        WHERE modalita = 'verifica'
    """)
    generale = dict(c.fetchone())

    c.execute("""
        SELECT
            moltiplicando,
            moltiplicatore,
            COUNT(*) as tentativi,
            SUM(corretta) as corrette,
            ROUND(AVG(corretta) * 100, 1) as percentuale_corrette
        FROM risposte r
        JOIN verifiche v ON r.verifica_id = v.id
        WHERE v.modalita = 'verifica'
        GROUP BY moltiplicando, moltiplicatore
        ORDER BY percentuale_corrette ASC
    """)
    per_coppia = [dict(row) for row in c.fetchall()]

    c.execute("""
        SELECT
            v.id,
            v.data,
            v.totale_domande,
            v.risposte_corrette,
            v.tempo_totale_secondi,
            v.timer_per_domanda,
            ROUND(CAST(v.risposte_corrette AS REAL) / v.totale_domande * 100, 1) as percentuale
        FROM verifiche v
        WHERE v.modalita = 'verifica'
        ORDER BY v.data DESC
        LIMIT 10
    """)
    ultime_verifiche = [dict(row) for row in c.fetchall()]

    conn.close()
    return {
        "generale": generale,
        "per_coppia": per_coppia,
        "ultime_verifiche": ultime_verifiche
    }


def get_dettaglio_verifica(verifica_id):
    conn = get_connection()
    c = conn.cursor()

    c.execute("SELECT * FROM verifiche WHERE id = ?", (verifica_id,))
    verifica = dict(c.fetchone())

    c.execute("SELECT * FROM risposte WHERE verifica_id = ? ORDER BY id", (verifica_id,))
    risposte = [dict(row) for row in c.fetchall()]

    conn.close()
    return {"verifica": verifica, "risposte": risposte}
