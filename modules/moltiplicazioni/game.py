import random

PASS_THRESHOLD = 80.0
EXPLORER_Q     = 15
BOSS_BATTLE_Q  = 20
PLANET_ORDER   = [2, 5, 10, 3, 4, 6, 9, 7, 8]


def generate_explorer_session(table: int) -> list:
    base = [{'multiplicand': table, 'multiplier': m, 'correct_ans': table * m}
            for m in range(1, 11)]
    hard = [{'multiplicand': table, 'multiplier': m, 'correct_ans': table * m}
            for m in random.choices([6, 7, 8, 9], k=5)]
    all_q = base + hard
    random.shuffle(all_q)
    return all_q[:EXPLORER_Q]


def generate_boss_battle(table: int) -> list:
    pool    = list(range(1, 11))
    weights = [1, 1, 1, 1, 1, 2, 3, 3, 2, 1]
    chosen  = random.choices(pool, weights=weights, k=BOSS_BATTLE_Q)
    return [{'multiplicand': table, 'multiplier': m, 'correct_ans': table * m}
            for m in chosen]


def generate_galaxy_cup(unlocked_tables: list, n: int = 20) -> list:
    tables = unlocked_tables or PLANET_ORDER[:1]
    pool   = [{'multiplicand': t, 'multiplier': m, 'correct_ans': t * m}
              for t in tables for m in range(1, 11)]
    random.shuffle(pool)
    return pool[:n]


def generate_mission_session(table: int, due_facts: list = None) -> list:
    """20-question adaptive session. due_facts: list of fact_key strings e.g. '2_7'."""
    due_facts = due_facts or []
    questions = []

    # Priority: SRS-due facts
    for fk in due_facts[:10]:
        parts = fk.split('_')
        if len(parts) == 2:
            a, b = int(parts[0]), int(parts[1])
            questions.append({'multiplicand': a, 'multiplier': b, 'correct_ans': a * b})

    # Fill to 20 from the table
    needed = 20 - len(questions)
    if needed > 0:
        pool = [{'multiplicand': table, 'multiplier': m, 'correct_ans': table * m}
                for m in range(1, 11)]
        random.shuffle(pool)
        questions.extend(pool[:needed])

    random.shuffle(questions)
    return questions[:20]


def generate_speedrun_session(table: int) -> list:
    """Large pool; front-end will stop after 60s."""
    pool = []
    for _ in range(6):
        for m in range(1, 11):
            pool.append({'multiplicand': table, 'multiplier': m, 'correct_ans': table * m})
    random.shuffle(pool)
    return pool


def score_session(answers: list) -> dict:
    total   = len(answers)
    correct = sum(1 for a in answers if a['is_correct'])
    pct     = (correct / total * 100) if total else 0
    avg_ms  = sum(a.get('response_ms', 0) for a in answers) / total if total else 0
    return {
        'total':     total,
        'correct':   correct,
        'score_pct': round(pct, 1),
        'avg_ms':    round(avg_ms),
        'passed':    pct >= PASS_THRESHOLD,
    }


def build_reward_event(score: dict, mode: str, table: int,
                       prev_unlocked: list, session_answers: list = None) -> dict:
    correct = score['correct']
    coins   = correct * 3
    xp      = correct * 5

    badges = []

    # First contact (checked separately from answer count)
    if correct >= 1:
        badges.append('moltiplicazioni:first_contact')

    if correct == score['total'] and mode in ('explorer', 'boss_battle'):
        badges.append('moltiplicazioni:perfect_session')

    if mode == 'mission' and score['total'] == 20 and correct == 20:
        badges.append('moltiplicazioni:perfect_mission')

    if mode == 'boss_battle' and score['passed']:
        badges.append(f'moltiplicazioni:master_x{table}')

    # Speed demon: ≥15 correct in speedrun
    if mode == 'speedrun' and correct >= 15:
        badges.append('moltiplicazioni:speed_demon')

    # Comeback kid: 3 wrong followed by 3 right within a session
    if session_answers and len(session_answers) >= 6:
        for i in range(len(session_answers) - 5):
            window = session_answers[i:i+6]
            if (not any(a['is_correct'] for a in window[:3]) and
                    all(a['is_correct'] for a in window[3:])):
                badges.append('moltiplicazioni:comeback_kid')
                break

    planet_unlocked = None
    if mode == 'boss_battle' and score['passed'] and table in PLANET_ORDER:
        idx = PLANET_ORDER.index(table)
        if idx + 1 < len(PLANET_ORDER):
            next_table = PLANET_ORDER[idx + 1]
            if next_table not in prev_unlocked:
                planet_unlocked = next_table

    return {
        'correct':         correct,
        'coins':           coins,
        'xp':              xp,
        'badges_earned':   list(set(badges)),
        'streak_activity': True,
        'srs_updated':     False,
        'planet_unlocked': planet_unlocked,
        'module_data': {
            'table':     table,
            'mode':      mode,
            'score_pct': score['score_pct'],
            'passed':    score['passed'],
        }
    }
