from flask import request, jsonify
from database import get_db
from auth import optional_token
from . import MANIFEST, BADGES
from .game import (generate_explorer_session, generate_boss_battle,
                   generate_mission_session, generate_speedrun_session,
                   generate_galaxy_cup, score_session, build_reward_event,
                   PLANET_ORDER)


def register(bp):

    @bp.route('/session/start', methods=['POST'])
    @optional_token
    def session_start(payload):
        data        = request.get_json() or {}
        mode        = data.get('mode', 'explorer')
        table       = int(data.get('table') or 2)
        session_key = data.get('session_key', 'guest')
        user_id     = payload['sub'] if payload else None

        db = get_db()

        # Get due SRS facts for logged-in users in mission mode
        due_facts = []
        if user_id and mode == 'mission':
            from .srs_db import get_due_facts
            rows      = get_due_facts(user_id, table)
            due_facts = [r['fact_key'] for r in rows]

        # Generate question set
        if mode == 'explorer':
            questions = generate_explorer_session(table)
        elif mode == 'boss_battle':
            questions = generate_boss_battle(table)
        elif mode == 'mission':
            questions = generate_mission_session(table, due_facts)
        elif mode == 'speedrun':
            questions = generate_speedrun_session(table)
        elif mode == 'galaxy_cup':
            unlocked = _get_unlocked(db, user_id, session_key)
            questions = generate_galaxy_cup(unlocked)
        else:
            return jsonify({'error': 'invalid_mode'}), 400

        # Create session row
        db.execute(
            'INSERT INTO molt_sessions (user_id, session_key, mode, table_num) VALUES (?,?,?,?)',
            (user_id, session_key, mode, table)
        )
        db.commit()
        session_id = db.execute(
            'SELECT id FROM molt_sessions WHERE session_key=? ORDER BY id DESC LIMIT 1',
            (session_key,)
        ).fetchone()['id']

        # Strip correct_ans from client payload
        client_questions = [
            {'id': i, 'multiplicand': q['multiplicand'], 'multiplier': q['multiplier']}
            for i, q in enumerate(questions)
        ]

        # Store full questions in session for server-side answer validation
        # We re-generate server-side at answer time using the same logic, or store
        # them encoded. For simplicity, store the correct answers in the DB row.
        # We encode them as a pipe-delimited string in session_key field temporarily.
        # Better: store as a temp JSON blob per session (not in schema yet, use answers table).
        # Actual answer validation: client sends multiplicand*multiplier which we compute server-side.

        return jsonify({'session_id': session_id, 'questions': client_questions})

    @bp.route('/session/answer', methods=['POST'])
    @optional_token
    def session_answer(payload):
        data         = request.get_json() or {}
        session_id   = data.get('session_id')
        multiplicand = int(data.get('multiplicand', 0))
        multiplier   = int(data.get('multiplier', 0))
        user_answer  = data.get('user_answer')
        response_ms  = int(data.get('response_ms', 0))
        user_id      = payload['sub'] if payload else None

        correct_ans = multiplicand * multiplier
        is_correct  = (int(user_answer) == correct_ans) if user_answer is not None else False

        # Stars logic
        if is_correct:
            stars = 3 if response_ms <= 5000 else 2
        else:
            stars = 1

        coins_earned = 3 if is_correct else 0
        xp_earned    = 5 if is_correct else 0

        db = get_db()
        db.execute("""
            INSERT INTO molt_answers
                (session_id, multiplicand, multiplier, correct_ans, user_ans, is_correct, response_ms)
            VALUES (?,?,?,?,?,?,?)
        """, (session_id, multiplicand, multiplier, correct_ans,
              user_answer, int(is_correct), response_ms))

        # Update session counters
        db.execute("""
            UPDATE molt_sessions
            SET total_q   = total_q + 1,
                correct_q = correct_q + ?
            WHERE id=?
        """, (int(is_correct), session_id))

        db.commit()

        # Update SRS for logged-in users
        if user_id:
            try:
                from .srs_db import record_answer
                quality = 4 if is_correct and response_ms <= 5000 else (3 if is_correct else 1)
                fact_key = f"{multiplicand}_{multiplier}"
                record_answer(user_id, fact_key, quality)
            except Exception:
                pass

        # First contact badge check
        if is_correct:
            _maybe_award_badge(db, user_id, 'moltiplicazioni:first_contact')

        return jsonify({
            'correct':      is_correct,
            'correct_ans':  correct_ans,
            'stars':        stars,
            'coins_earned': coins_earned,
            'xp_earned':    xp_earned,
        })

    @bp.route('/session/finish', methods=['POST'])
    @optional_token
    def session_finish(payload):
        data        = request.get_json() or {}
        session_id  = data.get('session_id')
        session_key = data.get('session_key', 'guest')
        user_id     = payload['sub'] if payload else None

        db = get_db()

        sess = db.execute('SELECT * FROM molt_sessions WHERE id=?', (session_id,)).fetchone()
        if not sess:
            return jsonify({'error': 'session_not_found'}), 404

        db.execute("UPDATE molt_sessions SET finished_at=datetime('now') WHERE id=?", (session_id,))
        db.commit()

        answers = db.execute(
            'SELECT is_correct, response_ms FROM molt_answers WHERE session_id=? ORDER BY id',
            (session_id,)
        ).fetchall()
        answer_list = [dict(a) for a in answers]

        score = score_session(answer_list)
        mode  = sess['mode']
        table = sess['table_num']

        # Get previously unlocked planets
        prev_unlocked = _get_unlocked(db, user_id, session_key)

        reward = build_reward_event(score, mode, table, prev_unlocked, answer_list)

        # Record boss battle result
        if mode == 'boss_battle':
            db.execute("""
                INSERT INTO molt_boss_battles (user_id, session_key, table_num, score_pct, passed)
                VALUES (?,?,?,?,?)
            """, (user_id, session_key, table, score['score_pct'], int(score['passed'])))
            db.commit()

        # Check galaxy explorer badge (all 9 tables mastered)
        all_passed = db.execute("""
            SELECT COUNT(DISTINCT table_num) as n FROM molt_boss_battles
            WHERE passed=1 AND (user_id=? OR session_key=?)
        """, (user_id, session_key)).fetchone()['n']
        if all_passed >= 9:
            reward['badges_earned'].append('moltiplicazioni:galaxy_explorer')
            reward['badges_earned'] = list(set(reward['badges_earned']))

        # Apply to server wallet for logged-in users
        if user_id:
            from routes.api import apply_reward_event
            apply_reward_event(user_id, reward)
            # Award server-side badges
            for bid in reward['badges_earned']:
                db.execute('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?,?)',
                           (user_id, bid))
            db.commit()

        started = sess['started_at'] or ''
        return jsonify({
            'score':   score,
            'reward':  reward,
            'session_summary': {
                'mode':     mode,
                'table':    table,
                'started':  started,
            },
            'badge_names': {bid: BADGES.get(bid, bid) for bid in reward['badges_earned']},
        })

    @bp.route('/manifest')
    def manifest():
        return jsonify(MANIFEST)

    @bp.route('/stats')
    @optional_token
    def stats(payload):
        data        = request.get_json() or {}
        session_key = request.args.get('session_key', 'guest')
        user_id     = payload['sub'] if payload else None

        db = get_db()
        rows = db.execute("""
            SELECT table_num,
                   SUM(total_q)   as total,
                   SUM(correct_q) as correct
            FROM molt_sessions
            WHERE (user_id=? OR session_key=?)
            GROUP BY table_num
        """, (user_id, session_key)).fetchall()

        result = {}
        for r in rows:
            t = r['table_num']
            result[t] = {
                'total':    r['total'],
                'correct':  r['correct'],
                'accuracy': round(r['correct'] / r['total'] * 100, 1) if r['total'] else 0,
            }

        return jsonify({'stats': result})

    @bp.route('/srs/queue')
    @optional_token
    def srs_queue(payload):
        if not payload:
            return jsonify({'queue': []})
        user_id = payload['sub']
        table   = request.args.get('table')
        from .srs_db import get_due_facts
        rows = get_due_facts(user_id, int(table) if table else None)
        return jsonify({'queue': rows})


def _get_unlocked(db, user_id, session_key):
    rows = db.execute("""
        SELECT DISTINCT table_num FROM molt_boss_battles
        WHERE passed=1 AND (user_id=? OR session_key=?)
    """, (user_id, session_key)).fetchall()
    return [r['table_num'] for r in rows]


def _maybe_award_badge(db, user_id, badge_id):
    if user_id:
        db.execute('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?,?)',
                   (user_id, badge_id))
        db.commit()
