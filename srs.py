"""Pure SM-2 algorithm — no DB imports."""


def update(ef: float, reps: int, quality: int, prev_interval: int = 1) -> tuple:
    """
    SM-2 update. quality: 0–5.
    Returns (new_ef, interval_days, new_reps).
    """
    if quality < 3:
        new_reps     = 0
        interval     = 1
    else:
        if reps == 0:
            interval = 1
        elif reps == 1:
            interval = 6
        else:
            interval = round(prev_interval * ef)
        new_reps = reps + 1

    new_ef = max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = round(new_ef, 3)

    return new_ef, interval, new_reps
