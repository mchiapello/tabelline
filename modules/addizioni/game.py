import random

PASS_THRESHOLD = 80.0
EXPLORER_Q     = 15
BOSS_BATTLE_Q  = 20
LEVEL_ORDER    = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Numbers used as the first operand (a + level = ?)
OPERAND_POOL = list(range(1, 21))


def _make_q(level: int, a: int) -> dict:
    return {"addend_a": a, "addend_b": level, "correct_ans": a + level}


def generate_explorer_session(level: int) -> list:
    """15 questions: all 20 operands shuffled, 5 extra weighted to harder ones (11-20)."""
    base  = [_make_q(level, a) for a in random.sample(OPERAND_POOL, 10)]
    hard  = [_make_q(level, a) for a in random.choices(range(11, 21), k=5)]
    pool  = base + hard
    random.shuffle(pool)
    return pool[:EXPLORER_Q]


def generate_boss_battle(level: int) -> list:
    weights = [1]*10 + [2]*10   # operands 11-20 weighted higher
    chosen  = random.choices(OPERAND_POOL, weights=weights, k=BOSS_BATTLE_Q)
    return [_make_q(level, a) for a in chosen]


def generate_galaxy_cup(unlocked_levels: list, n: int = 20) -> list:
    levels = unlocked_levels or [1]
    pool   = [_make_q(lvl, a) for lvl in levels for a in OPERAND_POOL]
    random.shuffle(pool)
    return pool[:n]


def generate_mission_session(level: int, due_facts: list = None) -> list:
    due_facts = due_facts or []
    questions = []
    for fk in due_facts[:10]:
        parts = fk.split('_')
        if len(parts) == 2:
            a, b = int(parts[0]), int(parts[1])
            questions.append(_make_q(b, a))

    needed = 20 - len(questions)
    if needed > 0:
        pool = [_make_q(level, a) for a in OPERAND_POOL]
        random.shuffle(pool)
        questions.extend(pool[:needed])

    random.shuffle(questions)
    return questions[:20]


def generate_speedrun_session(level: int) -> list:
    pool = []
    for _ in range(6):
        pool.extend([_make_q(level, a) for a in OPERAND_POOL])
    random.shuffle(pool)
    return pool


def score_session(answers: list) -> dict:
    total   = len(answers)
    correct = sum(1 for a in answers if a["is_correct"])
    pct     = (correct / total * 100) if total else 0
    avg_ms  = sum(a.get("response_ms", 0) for a in answers) / total if total else 0
    return {
        "total":     total,
        "correct":   correct,
        "score_pct": round(pct, 1),
        "avg_ms":    round(avg_ms),
        "passed":    pct >= PASS_THRESHOLD,
    }


def build_reward_event(score: dict, mode: str, level: int,
                       prev_unlocked: list, session_answers: list = None) -> dict:
    correct = score["correct"]
    coins   = correct * 2
    xp      = correct * 4

    badges = []
    if correct >= 1:
        badges.append("addizioni:first_contact")
    if correct == score["total"] and mode in ("explorer", "boss_battle"):
        badges.append("addizioni:perfect_session")
    if mode == "mission" and score["total"] == 20 and correct == 20:
        badges.append("addizioni:perfect_mission")
    if mode == "boss_battle" and score["passed"]:
        badges.append(f"addizioni:master_p{level}")
    if mode == "speedrun" and correct >= 15:
        badges.append("addizioni:speed_demon")

    level_unlocked = None
    if mode == "boss_battle" and score["passed"] and level in LEVEL_ORDER:
        idx = LEVEL_ORDER.index(level)
        if idx + 1 < len(LEVEL_ORDER):
            next_level = LEVEL_ORDER[idx + 1]
            if next_level not in prev_unlocked:
                level_unlocked = next_level

    return {
        "correct":          correct,
        "coins":            coins,
        "xp":               xp,
        "badges_earned":    list(set(badges)),
        "streak_activity":  True,
        "srs_updated":      False,
        "level_unlocked":   level_unlocked,   # addizioni uses "level" not "planet"
        "planet_unlocked":  None,
        "module_data": {
            "level":     level,
            "mode":      mode,
            "score_pct": score["score_pct"],
            "passed":    score["passed"],
        }
    }
