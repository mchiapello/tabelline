import sqlite3
import os
from flask import g, current_app


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(current_app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


def get_connection():
    """Legacy helper for non-request contexts (e.g. srs_verbi.py)."""
    path = os.environ.get('DATABASE', 'mathquest.db')
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    path = os.environ.get('DATABASE', 'mathquest.db')
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    c = conn.cursor()

    # ── Core user tables ──────────────────────────────────────────────────────

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    NOT NULL UNIQUE,
            email         TEXT    NOT NULL UNIQUE DEFAULT '',
            password_hash TEXT    NOT NULL,
            role          TEXT    NOT NULL DEFAULT 'student',
            created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
            last_login    TEXT
        )
    """)

    # Migrate legacy users table (add email/role columns if missing)
    for col, defn in [('email', "TEXT NOT NULL DEFAULT ''"),
                      ('role',  "TEXT NOT NULL DEFAULT 'student'")]:
        try:
            c.execute(f"ALTER TABLE users ADD COLUMN {col} {defn}")
        except sqlite3.OperationalError:
            pass

    c.execute("""
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT    NOT NULL UNIQUE,
            expires_at TEXT    NOT NULL,
            created_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS module_tokens (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id       TEXT    NOT NULL UNIQUE,
            token_hash      TEXT    NOT NULL UNIQUE,
            active          INTEGER NOT NULL DEFAULT 0,
            pending_restart INTEGER NOT NULL DEFAULT 0,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # ── Reward tables ─────────────────────────────────────────────────────────

    c.execute("""
        CREATE TABLE IF NOT EXISTS user_wallet (
            user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            coins      INTEGER NOT NULL DEFAULT 0,
            xp         INTEGER NOT NULL DEFAULT 0,
            level      INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS user_streaks (
            user_id             INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            current_streak      INTEGER NOT NULL DEFAULT 0,
            longest_streak      INTEGER NOT NULL DEFAULT 0,
            last_practice_date  TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS user_badges (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            badge_id  TEXT    NOT NULL,
            earned_at TEXT    NOT NULL DEFAULT (datetime('now')),
            UNIQUE(user_id, badge_id)
        )
    """)

    # ── Moltiplicazioni module tables ─────────────────────────────────────────

    c.execute("""
        CREATE TABLE IF NOT EXISTS molt_sessions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER,
            session_key TEXT    NOT NULL,
            mode        TEXT    NOT NULL,
            table_num   INTEGER NOT NULL,
            started_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            finished_at TEXT,
            total_q     INTEGER NOT NULL DEFAULT 0,
            correct_q   INTEGER NOT NULL DEFAULT 0
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS molt_answers (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id   INTEGER NOT NULL REFERENCES molt_sessions(id) ON DELETE CASCADE,
            multiplicand INTEGER NOT NULL,
            multiplier   INTEGER NOT NULL,
            correct_ans  INTEGER NOT NULL,
            user_ans     INTEGER,
            is_correct   INTEGER NOT NULL DEFAULT 0,
            response_ms  INTEGER,
            answered_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS molt_srs (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            fact_key      TEXT    NOT NULL,
            ef            REAL    NOT NULL DEFAULT 2.5,
            interval_days INTEGER NOT NULL DEFAULT 1,
            reps          INTEGER NOT NULL DEFAULT 0,
            next_review   TEXT    NOT NULL DEFAULT (date('now')),
            last_quality  INTEGER,
            UNIQUE(user_id, fact_key)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS molt_boss_battles (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER,
            session_key TEXT    NOT NULL,
            table_num   INTEGER NOT NULL,
            score_pct   REAL    NOT NULL,
            passed      INTEGER NOT NULL DEFAULT 0,
            played_at   TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # ── Legacy italiano / verbi tables (preserved) ────────────────────────────

    c.execute("""
        CREATE TABLE IF NOT EXISTS srs_verbi (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            utente_id       INTEGER NOT NULL,
            infinito        TEXT    NOT NULL,
            modo            TEXT    NOT NULL,
            tempo           TEXT    NOT NULL,
            persona         TEXT    NOT NULL,
            ef              REAL    NOT NULL DEFAULT 2.5,
            interval_giorni INTEGER NOT NULL DEFAULT 0,
            reps            INTEGER NOT NULL DEFAULT 0,
            next_review     TEXT    NOT NULL,
            last_quality    INTEGER,
            appreso         INTEGER NOT NULL DEFAULT 0,
            UNIQUE(utente_id, infinito, modo, tempo, persona)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS errori_verbi (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            utente_id         INTEGER NOT NULL,
            infinito          TEXT    NOT NULL,
            modo              TEXT    NOT NULL,
            tempo             TEXT    NOT NULL,
            persona           TEXT    NOT NULL,
            risposta_data     TEXT,
            risposta_corretta TEXT    NOT NULL,
            data              TEXT    NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS badge (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            utente_id INTEGER NOT NULL,
            badge_id  TEXT    NOT NULL,
            data      TEXT    NOT NULL,
            UNIQUE(utente_id, badge_id)
        )
    """)

    # Legacy verifiche / risposte tables
    c.execute("""
        CREATE TABLE IF NOT EXISTS verifiche (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            data                  TEXT    NOT NULL,
            modalita              TEXT    NOT NULL DEFAULT 'verifica',
            materia               TEXT    NOT NULL DEFAULT 'tabelline',
            totale_domande        INTEGER NOT NULL,
            risposte_corrette     INTEGER NOT NULL,
            tempo_totale_secondi  REAL,
            timer_per_domanda     INTEGER,
            livello_max           INTEGER,
            utente_id             INTEGER
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS risposte (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            verifica_id       INTEGER NOT NULL,
            moltiplicando     INTEGER NOT NULL,
            moltiplicatore    INTEGER NOT NULL,
            risposta_corretta INTEGER NOT NULL,
            risposta_utente   INTEGER,
            tempo_secondi     REAL,
            corretta          INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (verifica_id) REFERENCES verifiche(id)
        )
    """)

    conn.commit()
    conn.close()
