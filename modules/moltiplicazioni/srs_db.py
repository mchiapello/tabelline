from datetime import date, timedelta
from database import get_db
from srs import update as sm2_update


def get_due_facts(user_id: int, table: int = None) -> list:
    db    = get_db()
    today = date.today().isoformat()
    if table:
        rows = db.execute(
            "SELECT * FROM molt_srs WHERE user_id=? AND fact_key LIKE ? AND next_review<=?",
            (user_id, f"{table}_%", today)
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM molt_srs WHERE user_id=? AND next_review<=?",
            (user_id, today)
        ).fetchall()
    return [dict(r) for r in rows]


def record_answer(user_id: int, fact_key: str, quality: int):
    db  = get_db()
    row = db.execute(
        "SELECT ef, reps, interval_days FROM molt_srs WHERE user_id=? AND fact_key=?",
        (user_id, fact_key)
    ).fetchone()

    if row:
        ef, reps, interval = row['ef'], row['reps'], row['interval_days']
    else:
        ef, reps, interval = 2.5, 0, 1

    new_ef, new_interval, new_reps = sm2_update(ef, reps, quality, prev_interval=interval)
    next_review = (date.today() + timedelta(days=new_interval)).isoformat()

    db.execute("""
        INSERT INTO molt_srs (user_id, fact_key, ef, interval_days, reps, next_review, last_quality)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, fact_key) DO UPDATE SET
            ef=excluded.ef, interval_days=excluded.interval_days,
            reps=excluded.reps, next_review=excluded.next_review,
            last_quality=excluded.last_quality
    """, (user_id, fact_key, new_ef, new_interval, new_reps, next_review, quality))
    db.commit()
